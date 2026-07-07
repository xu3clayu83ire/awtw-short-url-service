import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

/**
 * ApiStack：短網址 API（Lambda + API Gateway + DynamoDB）
 * 實際資源定義由 DevOps T03 補上（走 ASUS Jira 開票流程）。
 */
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
