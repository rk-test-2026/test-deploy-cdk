import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "../.gen/providers/aws/provider";
import { loadConfig } from "./config";
import { NetworkStack } from "./network";
import { IamStack } from "./iam";
import { EcsStack } from "./ecs";
import { EcsStack } from "./ecr";
import { S3Backend} from "cdktf/lib/backends"
import { DataAwsCallerIdentity } from "../.gen/providers/aws/data-aws-caller-identity"

const app = new App();
const cfg = loadConfig();

class Stack extends TerraformStack {
  constructor() {
    super(app, `${cfg.project}-${cfg.env}`);

    new AwsProvider(this, "aws", {
      region: cfg.region
    });
    const current = new DataAwsCallerIdentity(this, "current_user");

    const network = new NetworkStack(this, cfg);
    const iam = new IamStack(this, cfg);
    new EcsStack(this, cfg, network, iam, current.accountId);
    new EcrStack(this, "ecr", cfg)
  }
}

const stack = new Stack();
new S3Backend(stack, {
  bucket: `${cfg.project}-${cfg.env}`,
  key: `cdktf/${cfg.project}-${cfg.env}.tfstate`,
  region: `${cfg.region}`,
  dynamodbTable: `${cfg.project}-${cfg.env}-terraform-locks`,
  encrypt: true,
});
app.synth();
