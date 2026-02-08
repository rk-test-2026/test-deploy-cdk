// src/ecs.ts
import { Construct } from "constructs";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
import { EcsCluster } from "../.gen/providers/aws/ecs-cluster";
import { EcsService } from "../.gen/providers/aws/ecs-service";
import { EcsTaskDefinition } from "../.gen/providers/aws/ecs-task-definition";

export class EcsStack {
  constructor(
    scope: Construct,
    cfg: any,
    network: any,
    iam: any,
    accountId: any
  ) {

    const cluster = new EcsCluster(scope, "cluster", {
      name: `${cfg.env}-cluster`
    });

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
      name: `${cfg.project}-${cfg.env}-fargate-service`,
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
    });
  }
}