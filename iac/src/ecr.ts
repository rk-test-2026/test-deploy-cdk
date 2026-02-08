import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "../.gen/providers/aws/provider";
import { loadConfig } from "./config";

const app = new App();
const cfg = loadConfig();

class EcrStack extends TerraformStack {
    constructor() {
        super(app, `${cfg.project}-${cfg.env}`);

            new AwsProvider(this, "aws", {
              region: cfg.region
            });
            const repo = new EcrRepository(scope, "repo", {
                  name: `${cfg.project}-${cfg.env}`,
                  lifecycleRules: [{
                          maxImageCount: 10,
                          description: 'Keep only the 10 most recent images',
                        }],
                });
    }
}
const ecrStack = new EcrStack();
new S3Backend(ecrStack, {
  bucket: `${cfg.project}-${cfg.env}`,
  key: `cdktf/ecr-${cfg.project}-${cfg.env}.tfstate`,
  region: `${cfg.region}`,
  dynamodbTable: `${cfg.project}-${cfg.env}-ecr-terraform-locks`,
  encrypt: true,
});
app.synth();
