import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs"; // Don't forget this import
import { AwsProvider } from "../.gen/providers/aws/provider";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
import { S3Backend } from "cdktf";
import { loadConfig } from "./config";

const app = new App();
const cfg = loadConfig();

export class EcrStack extends TerraformStack {
    constructor(scope: Construct, id: string, cfg: any)  {
        super(scope, id); // 'id' will be "ecr"

        new AwsProvider(this, "aws", {
          region: cfg.region
        });

        new EcrRepository(this, "repo", {
          name: `${cfg.project}-${cfg.env}`,
          lifecycleRules: JSON.stringify([{
              rulePriority: 1,
              description: 'Keep only the 10 most recent images',
              selection: {
                tagStatus: "any",
                countType: "imageCountMoreThan",
                countNumber: 10
              },
              action: { type: "expire" }
          }]),
        });
    }
}

