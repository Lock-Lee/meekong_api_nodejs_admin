# Meekong API - Terraform Infrastructure

This directory contains Terraform configuration to automatically provision AWS infrastructure for the Meekong API.

## 🏗️ What This Creates

- **EC2 Instance** - Amazon Linux 2 with Docker pre-installed
- **Elastic IP** - Consistent public IP address
- **Security Group** - Firewall rules for HTTP/HTTPS/SSH
- **ECR Repository** - Docker image storage
- **S3 Bucket** - Deployment artifacts storage
- **IAM User** - GitHub Actions permissions
- **Key Pair** - SSH access to EC2

## 🚀 Quick Start

### 1. Install Terraform
```bash
# Download from: https://www.terraform.io/downloads
# Or use package manager:
# Windows (Chocolatey): choco install terraform
# macOS (Homebrew): brew install terraform
# Linux: wget and install
```

### 2. Generate SSH Key (if you don't have one)
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/meekong-api-key
```

### 3. Configure Variables
```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit variables
vim terraform.tfvars
```

### 4. Deploy Infrastructure
```bash
# Initialize Terraform
terraform init

# Plan deployment (review changes)
terraform plan

# Apply deployment
terraform apply
```

### 5. Get Outputs
```bash
# View all outputs
terraform output

# Get specific values
terraform output instance_public_ip
terraform output github_secrets_summary
```

## 📋 Required Variables

Edit `terraform.tfvars`:

```hcl
# Required
project_name    = "meekong-api"
environment     = "prod"
aws_region      = "ap-southeast-1"
public_key_path = "~/.ssh/id_rsa.pub"

# Optional (with sensible defaults)
instance_type   = "t2.micro"     # or "t3.small"
volume_size     = 20             # GB
```

## 🔑 SSH Key Setup

### Option 1: Use Existing Key
```bash
# If you have existing SSH key
public_key_path = "~/.ssh/id_rsa.pub"
```

### Option 2: Create New Key
```bash
# Generate new key specifically for this project
ssh-keygen -t rsa -b 4096 -f ~/.ssh/meekong-api-key

# Update terraform.tfvars
public_key_path = "~/.ssh/meekong-api-key.pub"
```

## 📊 Outputs

After successful deployment, Terraform will output:

```bash
# Connection Info
instance_public_ip = "1.2.3.4"
ssh_connection     = "ssh -i ~/.ssh/key ec2-user@1.2.3.4"

# GitHub Secrets
github_secrets_summary = {
  "AWS_ACCESS_KEY_ID"   = "AKIA..."
  "AWS_ACCOUNT_ID"      = "123456789012"
  "EC2_HOST"            = "1.2.3.4"
  "EC2_USER"            = "ec2-user"
  "DEPLOYMENT_BUCKET"   = "meekong-api-deployment-abc123"
  "PRODUCTION_URL"      = "http://1.2.3.4"
}

# Access the secret key (sensitive)
terraform output github_actions_secret_access_key
```

## 🔧 Advanced Configuration

### Different Instance Types
```hcl
# Free tier
instance_type = "t2.micro"

# Production
instance_type = "t3.small"

# High performance
instance_type = "t3.medium"
```

### Security Hardening
```hcl
# Restrict SSH access to your IP only
allowed_cidr_blocks = ["203.0.113.0/32"]  # Your public IP
```

### Multi-Environment
```bash
# Development
terraform workspace new dev
terraform apply -var="environment=dev" -var="instance_type=t2.micro"

# Production
terraform workspace new prod
terraform apply -var="environment=prod" -var="instance_type=t3.small"
```

## 🗑️ Cleanup

```bash
# Destroy all resources
terraform destroy

# Or destroy specific resources
terraform destroy -target=aws_instance.meekong_api
```

## 🔄 Updates

```bash
# Update infrastructure
terraform plan
terraform apply

# Update just the user data script
terraform apply -replace=aws_instance.meekong_api
```

## 🚨 Troubleshooting

### Common Issues

1. **SSH Key Error**
   ```bash
   # Make sure public key exists
   ls -la ~/.ssh/
   
   # Generate if missing
   ssh-keygen -t rsa -b 4096
   ```

2. **AWS Credentials**
   ```bash
   # Configure AWS CLI
   aws configure
   
   # Or set environment variables
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"
   ```

3. **Region Availability**
   ```bash
   # Check if instance type is available in region
   aws ec2 describe-instance-types --instance-types t2.micro --region ap-southeast-1
   ```

4. **Permission Denied**
   ```bash
   # Fix SSH key permissions
   chmod 600 ~/.ssh/your-private-key
   ```

## 💰 Cost Estimation

- **t2.micro**: ~$0-8/month (free tier eligible)
- **t3.small**: ~$15-20/month
- **ECR**: ~$1/month (with lifecycle policy)
- **S3**: ~$1/month
- **EIP**: $0 (while attached to running instance)

**Total**: $0-25/month depending on instance type

## 🔗 Next Steps

After Terraform completes:

1. **Add GitHub Secrets** - Use values from `terraform output github_secrets_summary`
2. **Connect to EC2** - Use the SSH command from output
3. **Set up Database** - Add `DATABASE_URL` to GitHub Secrets
4. **Generate JWT Secret** - `openssl rand -base64 32`
5. **Test Deployment** - Push to main branch

---

**Need help?** Check the main [deployment guide](../docs/deployment-guide.md) for complete setup instructions.
