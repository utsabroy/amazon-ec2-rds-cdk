import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export class Ec2RdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'SSH access from VPC'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'HTTP access from VPC'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS MySQL',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // Create EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd mysql',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from EC2 Instance</h1>" > /var/www/html/index.html'
    );

    for (let i = 1; i <= 2; i++) {
      new ec2.Instance(this, `EC2Instance${i}`, {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        userData,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });
    }

    // Create RDS MySQL instance with cost optimizations
    new rds.DatabaseInstance(this, 'MySQLDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      // Downsize from db.m5.large to db.t3.medium for cost savings
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      multiAz: false,
      allocatedStorage: 20,
      // Migrate from gp2 to gp3 storage for better performance and cost efficiency
      storageType: rds.StorageType.GP3,
      deletionProtection: false,
      databaseName: 'myapp',
      securityGroups: [rdsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Enable Performance Insights for better monitoring
      performanceInsightRetention: cdk.Duration.days(7),
      // Set backup retention period to 7 days for better data protection
      backupRetention: cdk.Duration.days(7),
      // Enable auto minor version upgrades for better security
      autoMinorVersionUpgrade: true,
      // Enable deletion protection in production (commented out for development)
      // deletionProtection: true,
    });
  }
}