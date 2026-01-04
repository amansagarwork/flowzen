#!/bin/bash

# AWS EC2 Jenkins Setup Script
echo "🚀 Setting up Jenkins on AWS EC2 (Free Tier)..."

# Variables
INSTANCE_TYPE="t3.micro"
AMI_ID="ami-0c02fb55956c7d316" # Amazon Linux 2
KEY_NAME="jenkins-key"
SECURITY_GROUP_NAME="jenkins-sg"
REGION="us-east-1"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed. Please install AWS CLI first."
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Create key pair
echo "🔑 Creating EC2 key pair..."
aws ec2 create-key-pair \
    --key-name $KEY_NAME \
    --region $REGION \
    --query 'KeyMaterial' \
    --output text > ${KEY_NAME}.pem

chmod 400 ${KEY_NAME}.pem

# Create security group
echo "🛡️ Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Security group for Jenkins" \
    --region $REGION \
    --query 'GroupId' \
    --output text)

# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow HTTP
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow Jenkins
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 8080 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow Docker registry
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Launch EC2 instance
echo "🖥️ Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --user-data file://aws-setup/user-data.sh \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo ""
echo "🎉 Jenkins setup complete!"
echo "📋 Instance Details:"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Key Pair: ${KEY_NAME}.pem"
echo "Security Group: $SECURITY_GROUP_NAME"
echo ""
echo "🌐 Access URLs:"
echo "Jenkins: http://$PUBLIC_IP:8080"
echo "Docker Registry: http://$PUBLIC_IP:5000"
echo ""
echo "🔑 SSH Command:"
echo "ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "⏳ Wait 2-3 minutes for Jenkins to start, then access the URL above."
