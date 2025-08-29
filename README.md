# EC2 and RDS CDK Project

This CDK project creates:
- 2 EC2 instances (t3.micro) with Apache web server
- 1 MySQL RDS instance (t3.micro)
- VPC with public and private subnets
- Security groups with proper access controls

## Setup

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (first time only):
```bash
npx cdk bootstrap
```

3. Deploy the stack:
```bash
npx cdk deploy
```

## Architecture

- **VPC**: Multi-AZ setup with public and private subnets
- **EC2 Instances**: Located in public subnets with HTTP/SSH access
- **RDS MySQL**: Located in private subnets, accessible only from EC2 instances
- **Security Groups**: Properly configured for web traffic and database access

## Cleanup

To destroy the stack:
```bash
npx cdk destroy
```