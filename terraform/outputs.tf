output "alb_dns_name" {
  description = "Backend API URL (ALB)"
  value       = "http://${module.alb.alb_dns_name}"
}

output "cloudfront_url" {
  description = "Frontend URL (CloudFront)"
  value       = "https://${module.s3_cloudfront.cloudfront_domain}"
}

output "ecr_repository_url" {
  description = "ECR repository URL for Docker pushes"
  value       = module.ecr.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "s3_bucket_name" {
  description = "S3 bucket for frontend static files"
  value       = module.s3_cloudfront.bucket_name
}

output "chat_dynamodb_table_name" {
  description = "DynamoDB table name for chat messages"
  value       = module.dynamodb.chat_table_name
}

output "location_dynamodb_table_name" {
  description = "DynamoDB table name for live worker location updates"
  value       = module.dynamodb.location_table_name
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}
