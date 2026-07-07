#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ApiStack } from '../lib/api-stack';
import { DocsStack } from '../lib/docs-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

new ApiStack(app, 'ApiStack', { env });
new DocsStack(app, 'DocsStack', { env });
