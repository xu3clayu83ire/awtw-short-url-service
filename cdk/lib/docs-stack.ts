import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

/**
 * DocsStack：Hugo Book 文件站（S3 + CloudFront）
 * 實際資源定義由 DevOps T04 補上（走 ASUS Jira 開票流程）。
 */
export class DocsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
