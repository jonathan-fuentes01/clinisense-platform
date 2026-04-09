import { Amplify } from "aws-amplify";
import { Hub } from "aws-amplify/utils";
import awsconfig from "./aws-exports";

Amplify.configure(awsconfig);

Hub.listen("auth", ({ payload }) => {
  console.log("[Hub:auth] event:", payload.event, "data:", JSON.stringify(payload ?? {}));
});
