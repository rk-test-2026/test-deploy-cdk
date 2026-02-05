import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

export function loadConfig() {
  const env = process.env.ENV ?? "dev";
  const fileConfig = JSON.parse(
    fs.readFileSync(`config/${env}.json`, "utf8")
  );

  return {
    env,
    region: process.env.AWS_REGION!,
    accountId: process.env.AWS_ACCOUNT_ID!,
    project: "tv-assessment-app",
    ...fileConfig
  };
}
