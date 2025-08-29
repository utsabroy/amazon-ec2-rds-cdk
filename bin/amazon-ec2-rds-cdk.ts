#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Ec2RdsStack } from '../lib/ec2-rds-stack';

const app = new cdk.App();
new Ec2RdsStack(app, 'Ec2RdsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});