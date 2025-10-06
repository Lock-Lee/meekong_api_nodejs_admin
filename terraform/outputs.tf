# Terraform Outputs for Meekong API Infrastructure

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.meekong_api.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.meekong_api.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.meekong_api.private_ip
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.meekong_api.id
}

output "key_pair_name" {
  description = "Name of the key pair"
  value       = aws_key_pair.meekong_api.key_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.meekong_api.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.meekong_api.name
}

output "s3_bucket_name" {
  description = "Name of the S3 deployment bucket"
  value       = aws_s3_bucket.deployment.bucket
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "github_actions_access_key_id" {
  description = "Access Key ID for GitHub Actions"
  value       = aws_iam_access_key.github_actions.id
}

output "github_actions_secret_access_key" {
  description = "Secret Access Key for GitHub Actions"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
}

# Connection information
output "ssh_connection" {
  description = "SSH connection command"
  value       = "ssh -i ~/.ssh/${aws_key_pair.meekong_api.key_name} ec2-user@${aws_eip.meekong_api.public_ip}"
}

output "api_url" {
  description = "API URL"
  value       = "http://${aws_eip.meekong_api.public_ip}"
}

output "health_check_url" {
  description = "Health check URL"
  value       = "http://${aws_eip.meekong_api.public_ip}/health"
}

# GitHub Secrets summary
output "github_secrets_summary" {
  description = "Summary of values needed for GitHub Secrets"
  value = {
    AWS_ACCESS_KEY_ID       = aws_iam_access_key.github_actions.id
    AWS_ACCOUNT_ID         = data.aws_caller_identity.current.account_id
    EC2_HOST               = aws_eip.meekong_api.public_ip
    EC2_USER               = "ec2-user"
    DEPLOYMENT_BUCKET      = aws_s3_bucket.deployment.bucket
    PRODUCTION_URL         = "http://${aws_eip.meekong_api.public_ip}"
  }
}

output "next_steps" {
  description = "Next steps to complete setup"
  value = <<-EOT
    
    🎉 Infrastructure created successfully!
    
    Next Steps:
    1. Add GitHub Secrets (see github_secrets_summary output)
    2. Connect to EC2: ${aws_eip.meekong_api.public_ip}
    3. Set up your database and add DATABASE_URL to GitHub Secrets
    4. Generate JWT_SECRET: openssl rand -base64 32
    5. Test deployment by pushing to main branch
    
    SSH Command: ssh -i ~/.ssh/${aws_key_pair.meekong_api.key_name} ec2-user@${aws_eip.meekong_api.public_ip}
    
  EOT
}
