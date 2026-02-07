// src/ecs.ts
import { Construct } from "constructs";
import { EcrRepository } from "@cdktf/provider-aws/lib/ecr-repository";
import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";
import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";

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

    const taskDefinition = new EcsTaskDefinition(scope, "task", {
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
          image: `${accountId}.dkr.ecr.${cfg.region}.amazonaws.com/${cfg.project}-${cfg.env}:latest`,
          portMappings: [
            { containerPort: cfg.containerPort }
          ]
        }
      ])
    });

    new EcsService(scope, "service", {
      name: `${cfg.env}-service`,
      cluster: cluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: cfg.desiredCount,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: network.subnets.map((s: any) => s.id),
        securityGroups: [network.sg.id],
        assignPublicIp: true
      },
      dependsOn: [taskDefinition]
    });
  }
}
