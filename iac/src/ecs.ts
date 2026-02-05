// src/ecs.ts
import { Construct } from "constructs";
import {
  EcrRepository,
  EcsCluster,
  EcsTaskDefinition,
  EcsService
} from "@cdktf/provider-aws";

export class EcsStack {
  constructor(
    scope: Construct,
    cfg: any,
    network: any,
    iam: any
  ) {
    const repo = new EcrRepository(scope, "repo", {
      name: `${cfg.project}-${cfg.env}`
    });

    const cluster = new EcsCluster(scope, "cluster", {
      name: `${cfg.env}-cluster`
    });

    const task = new EcsTaskDefinition(scope, "task", {
      family: `${cfg.env}-task`,
      cpu: `${cfg.cpu}`,
      memory: `${cfg.memory}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: iam.executionRole.arn,
      taskRoleArn: iam.taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: "app",
          image: `${repo.repositoryUrl}:latest`,
          portMappings: [
            { containerPort: cfg.containerPort }
          ]
        }
      ])
    });

    new EcsService(scope, "service", {
      name: `${cfg.env}-service`,
      cluster: cluster.id,
      taskDefinition: task.arn,
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
