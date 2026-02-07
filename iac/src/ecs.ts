// src/ecs.ts
import { Construct } from "constructs";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
import { EcsCluster } from "../.gen/providers/aws/ecs-cluster";
import { EcsService } from "../.gen/providers/aws/ecs-service";
import { EcsTaskDefinition } from "../.gen/providers/aws/ecs-task-definition";
import { TimeProvider } from "../.gen/providers/time/provider";
import { Sleep } from "../.gen/providers/time/sleep";

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

    new TimeProvider(scope, "time_provider");

    const taskDefinition = new EcsTaskDefinition(scope, "task", {
      family: `${cfg.project}-${cfg.env}-task`,
      cpu: `${cfg.cpu}`,
      memory: `${cfg.memory}`,
      networkMode: "bridge",
      trackLatest: true,
      requiresCompatibilities: ["EC2"],
      executionRoleArn: iam.executionRole.arn,
      taskRoleArn: iam.taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: `${cfg.project}-${cfg.env}`,
          image: `${accountId}.dkr.ecr.${cfg.region}.amazonaws.com/${cfg.project}-${cfg.env}:latest`,
          portMappings: [
            {
              containerPort: cfg.containerPort,
              hostPort: cfg.hostPort || 0
            }
          ]
        }
      ])
    });


    const waitStep = new Sleep(scope, "wait_for_task", {
        createDuration: "30s",
        dependsOn: [taskDefinition]
    });

    new EcsService(scope, "service", {
      name: `${cfg.project}-${cfg.env}-service`,
      cluster: cluster.id,
      taskDefinition: taskDefinition.arn,
      dependsOn: [waitStep],
      desiredCount: cfg.desiredCount,
      launchType: "EC2",
    });
  }
}