#!/bin/bash

# Meekong API - EC2 User Data Script
# Automatically sets up EC2 instance on first boot

set -euo pipefail

# Logging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting Meekong API EC2 setup..."
echo "Project: ${project_name}"
echo "Region: ${aws_region}"
echo "Started at: $(date)"

# Update system
echo "Updating system packages..."
yum update -y

# Install essential packages
echo "Installing essential packages..."
yum install -y \
    curl \
    wget \
    unzip \
    vim \
    htop \
    git \
    jq \
    logrotate \
    ca-certificates \
    cronie

# Install Docker
echo "Installing Docker..."
yum install -y docker

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install AWS CLI v2 (if not already installed)
echo "Installing AWS CLI v2..."
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf awscliv2.zip aws/
fi

# Create application directories
echo "Creating application directories..."
mkdir -p /home/ec2-user/deployment/{logs,scripts,data/{uploads,redis},ssl,backups}

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/deployment
chown -R ec2-user:ec2-user /home/ec2-user/backups

# Set permissions
chmod 755 /home/ec2-user/deployment
chmod 755 /home/ec2-user/backups
chmod 700 /home/ec2-user/deployment/ssl

# Configure automatic security updates
echo "Configuring automatic security updates..."
yum install -y yum-cron

# Configure yum-cron for security updates only
cat > /etc/yum/yum-cron.conf << 'EOF'
[commands]
update_cmd = security
update_messages = yes
download_updates = yes
apply_updates = yes
random_sleep = 360

[emitters]
system_name = None
emit_via = stdio
output_width = 80

[email]
email_from = root@localhost
email_to = root
email_host = localhost

[groups]
group_list = None
group_package_types = mandatory, default

[base]
debuglevel = -2
mdpolicy = group:main
EOF

# Enable and start yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Configure log rotation for Docker
echo "Configuring log rotation..."
cat > /etc/logrotate.d/docker << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Application logs rotation
cat > /etc/logrotate.d/meekong-api << 'EOF'
/home/ec2-user/deployment/logs/*.log {
    rotate 30
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
    create 644 ec2-user ec2-user
}
EOF

# Install and configure fail2ban (optional)
echo "Installing fail2ban..."
yum install -y epel-release
yum install -y fail2ban

# Configure basic fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/secure
maxretry = 3
bantime = 3600
EOF

# Start and enable fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Configure system limits
echo "Configuring system limits..."
cat > /etc/security/limits.d/99-meekong.conf << 'EOF'
# Meekong API system limits
*               soft    nofile          65536
*               hard    nofile          65536
ec2-user        soft    nofile          65536
ec2-user        hard    nofile          65536
root            soft    nofile          65536
root            hard    nofile          65536
EOF

# Configure kernel parameters
cat > /etc/sysctl.d/99-meekong.conf << 'EOF'
# Meekong API kernel parameters
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 3
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

# Apply kernel parameters
sysctl -p /etc/sysctl.d/99-meekong.conf

# Create a simple status file
echo "Setup completed at $(date)" > /home/ec2-user/deployment/setup-complete.txt
chown ec2-user:ec2-user /home/ec2-user/deployment/setup-complete.txt

# Verify installations
echo "Verifying installations..."
docker --version
docker-compose --version
aws --version

echo "✅ Meekong API EC2 setup completed successfully!"
echo "Completed at: $(date)"
echo "Instance is ready for deployment."

# Signal completion
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${aws_region} || true
