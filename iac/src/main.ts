import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { loadConfig } from "./config";
import { NetworkStack } from "./network";
import { IamStack } from "./iam";
import { EcsStack } from "./ecs";

const app = new App();
const cfg = loadConfig();

class Stack extends TerraformStack {
  constructor() {
    super(app, `${cfg.project}-${cfg.env}`);

    new AwsProvider(this, "aws", {
      region: cfg.region
    });

    const network = new NetworkStack(this, cfg);
    const iam = new IamStack(this, cfg);
    new EcsStack(this, cfg, network, iam);
  }
}

new Stack();
new S3Backend(stack, {
  bucket: "`${cfg.project}-${cfg.env}`",
  key: "cdktf/`${cfg.project}-${cfg.env}`.tfstate",
  region: "`${cfg.region}`",
  dynamodbTable: "`${cfg.project}-${cfg.env}`-terraform-locks",
  encrypt: true,
});
app.synth();
