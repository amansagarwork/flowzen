#!/bin/bash
# User data script for EC2 instance setup

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Java (required for Jenkins)
yum install -y java-1.8.0-openjdk-devel

# Install Jenkins
wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key
yum install -y jenkins

# Configure Jenkins to run on port 8080
sed -i 's/JENKINS_PORT="8080"/JENKINS_PORT="8080"/' /etc/sysconfig/jenkins

# Start Jenkins
systemctl start jenkins
systemctl enable jenkins

# Create Jenkins network
docker network create jenkins

# Create Jenkins volume
docker volume create jenkins-data

# Pull Jenkins Docker image
docker pull jenkins/jenkins:lts

# Run Jenkins in Docker
docker run \
  --name jenkins-docker \
  --rm \
  -d \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --network jenkins \
  jenkins/jenkins:lts

# Create simple Docker registry
docker run -d \
  --name registry \
  --restart=always \
  -p 5000:5000 \
  --network jenkins \
  registry:2

# Install additional tools
yum install -y git curl wget

# Create deployment directory
mkdir -p /home/ec2-user/flowzen
chown ec2-user:ec2-user /home/ec2-user/flowzen

# Log setup completion
echo "Jenkins and Docker setup completed at $(date)" >> /var/log/setup.log
