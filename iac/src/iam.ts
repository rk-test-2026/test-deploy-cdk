// src/iam.ts
import { Construct } from "constructs";
import { IamRole } from "../.gen/providers/aws/iam-role";
import { IamRolePolicyAttachment } from "../.gen/providers/aws/iam-role-policy-attachment";
import { IamServiceLinkedRole } from "./.gen/providers/aws/iam-service-linked-role";

export class IamStack {
  executionRole: IamRole;
  taskRole: IamRole;

  constructor(scope: Construct, cfg: any) {
    this.executionRole = new IamRole(scope, "execution-role", {
      name: `${cfg.env}-ecs-exec`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole"
        }]
      })
    });

    new IamRolePolicyAttachment(scope, "exec-policy", {
      role: this.executionRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    });


    new IamServiceLinkedRole(scope, "ecs_service_linked_role", {
      awsServiceName: "ecs.amazonaws.com",
    });

    this.taskRole = new IamRole(scope, "task-role", {
      name: `${cfg.env}-ecs-task`,
      assumeRolePolicy: this.executionRole.assumeRolePolicy
    });
  }
}