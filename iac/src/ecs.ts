// src/ecs.ts
import { Construct } from "constructs";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
import { EcsCluster } from "../.gen/providers/aws/ecs-cluster";
import { EcsService } from "../.gen/providers/aws/ecs-service";
import { EcsTaskDefinition } from "../.gen/providers/aws/ecs-task-definition";
import { CodedeployApp } from "../.gen/providers/aws/codedeploy-app";
import { CodedeployDeploymentGroup } from "../.gen/providers/aws/codedeploy-deployment-group";

export class EcsStack {
  constructor(
    scope: Construct,
    cfg: any,
    network: any,
    iam: any,
    accountId: any
  ) {
    const repo = new EcrRepository(scope, "repo", {
      name: `${cfg.project}-${cfg.env}`
    });

    const cluster = new EcsCluster(scope, "cluster", {
      name: `${cfg.env}-cluster`
    });

//     new TimeProvider(scope, "time_provider");

    const taskDef = new EcsTaskDefinition(scope, "task", {
      family: `${cfg.project}-${cfg.env}-task`,
      cpu: `${cfg.cpu}`,
      memory: `${cfg.memory}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: iam.executionRole.arn,
      taskRoleArn: iam.taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: `${cfg.project}-${cfg.env}`,
          image: `${accountId}.dkr.ecr.${cfg.region}.amazonaws.com/${cfg.project}-${cfg.env}:latest`,
          portMappings: [
            { containerPort: cfg.containerPort }
          ]
        }
      ])
    });



    const ecsService = new EcsService(scope, "service", {
      name: `${cfg.project}-${cfg.env}-service`,
      cluster: cluster.id,
      taskDefinition: taskDef.arn,
      dependsOn: [taskDef],
      desiredCount: cfg.desiredCount,
      launchType: "FARGATE",
            networkConfiguration: {
              subnets: network.subnets.map((s: any) => s.id),
              securityGroups: [network.sg.id],
              assignPublicIp: true
            }
        deploymentController: {
            type: "CODE_DEPLOY"
          }
    });

    const app = new CodedeployApp(scope, "codedeploy_app", {
      computePlatform: "ECS",
      name: `${cfg.project}-${cfg.env}-deploy`
    });

    // Create the Deployment Group
    new CodedeployDeploymentGroup(scope, "deploy_group", {
      appName: app.name,
      deploymentGroupName: "DgpBlueGreen",
      serviceRoleArn: iam.codeDeployRole.arn, // Requires a new IAM role
      deploymentConfigName: "CodeDeployDefault.ECSAllAtOnce",
      ecsService: {
        clusterName: cluster.name,
        serviceName: ecsService.name
      },
      blueGreenDeploymentConfiguration: {
        deploymentReadyOption: {
          actionOnTimeout: "CONTINUE_DEPLOYMENT"
        },
        terminateBlueInstancesOnDeploymentSuccess: {
          terminationWaitTimeInMinutes: 5
        }
      },
      loadBalancerInfo: {
        targetGroupPairInfo: {
          prodTrafficRoute: { listenerArns: [network.listener.arn] },
          targetGroup: [
            { name: network.blueTargetGroup.name },
            { name: network.greenTargetGroup.name }
          ]
        }
      }
    });


  }
}