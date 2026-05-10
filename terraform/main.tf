locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# ── VPC ───────────────────────────────────────────────────────
module "vpc" {
  source             = "./modules/vpc"
  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# ── IAM Roles ────────────────────────────────────────────────
module "iam" {
  source           = "./modules/iam"
  name_prefix      = local.name_prefix
  aws_region       = var.aws_region
  account_id       = data.aws_caller_identity.current.account_id
  bedrock_model_id = var.bedrock_model_id
}

# ── Secrets Manager ──────────────────────────────────────────
module "secrets" {
  source      = "./modules/secrets-manager"
  name_prefix = local.name_prefix
  db_username = var.db_username
  db_name     = var.db_name
}

# ── ECR ───────────────────────────────────────────────────────
module "ecr" {
  source      = "./modules/ecr"
  name_prefix = local.name_prefix
}

# ── RDS PostgreSQL ────────────────────────────────────────────
module "rds" {
  source            = "./modules/rds"
  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_instance_class = var.db_instance_class
  db_name           = var.db_name
  db_username       = var.db_username
  db_password_secret_arn = module.secrets.db_secret_arn
  ecs_security_group_id  = module.ecs.ecs_security_group_id
}

# ── DynamoDB (chat + live location) ──────────────────────────
module "dynamodb" {
  source      = "./modules/dynamodb"
  name_prefix = local.name_prefix
}

# ── ALB ───────────────────────────────────────────────────────
module "alb" {
  source            = "./modules/alb"
  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

# ── ECS Fargate ───────────────────────────────────────────────
module "ecs" {
  source                 = "./modules/ecs"
  name_prefix            = local.name_prefix
  aws_region             = var.aws_region
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  alb_target_group_arn   = module.alb.target_group_arn
  alb_security_group_id  = module.alb.alb_security_group_id
  ecs_task_role_arn      = module.iam.ecs_task_role_arn
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  ecr_repository_url     = module.ecr.repository_url
  backend_image_tag      = var.backend_image_tag
  ecs_cpu                = var.ecs_cpu
  ecs_memory             = var.ecs_memory
  ecs_desired_count      = var.ecs_desired_count
  db_secret_arn          = module.secrets.db_secret_arn
  app_secret_arn         = module.secrets.app_secret_arn
  ssm_prefix             = "/${var.project_name}"
  app_name               = var.project_name
  cloudwatch_log_group   = module.cloudwatch.log_group_name
}

# ── S3 + CloudFront (Frontend) ────────────────────────────────
module "s3_cloudfront" {
  source      = "./modules/s3-cloudfront"
  name_prefix = local.name_prefix
  project_name = var.project_name
}

# ── Cognito ───────────────────────────────────────────────────
module "cognito" {
  source      = "./modules/cognito"
  name_prefix = local.name_prefix
}

# ── WAF ───────────────────────────────────────────────────────
module "waf" {
  source      = "./modules/waf"
  name_prefix = local.name_prefix
  alb_arn     = module.alb.alb_arn
}

# ── CloudWatch ────────────────────────────────────────────────
module "cloudwatch" {
  source       = "./modules/cloudwatch"
  name_prefix  = local.name_prefix
  alert_email  = var.alert_email
  ecs_cluster_name = "${local.name_prefix}-cluster"
  ecs_service_name = "${local.name_prefix}-service"
  alb_arn_suffix   = module.alb.alb_arn_suffix
}

# ── SSM Parameters (populated after resources created) ───────
resource "aws_ssm_parameter" "db_host" {
  name  = "/${var.project_name}/db-host"
  type  = "String"
  value = module.rds.db_endpoint
}

resource "aws_ssm_parameter" "db_port" {
  name  = "/${var.project_name}/db-port"
  type  = "String"
  value = "5432"
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.project_name}/db-name"
  type  = "String"
  value = var.db_name
}

resource "aws_ssm_parameter" "frontend_url" {
  name  = "/${var.project_name}/frontend-url"
  type  = "String"
  value = "https://${module.s3_cloudfront.cloudfront_domain}"
}

resource "aws_ssm_parameter" "bedrock_model_id" {
  name  = "/${var.project_name}/bedrock-model-id"
  type  = "String"
  value = var.bedrock_model_id
}

resource "aws_ssm_parameter" "bedrock_region" {
  name  = "/${var.project_name}/bedrock-region"
  type  = "String"
  value = "us-east-1"
}

resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name  = "/${var.project_name}/cognito-user-pool-id"
  type  = "String"
  value = module.cognito.user_pool_id
}

resource "aws_ssm_parameter" "cognito_client_id" {
  name  = "/${var.project_name}/cognito-client-id"
  type  = "String"
  value = module.cognito.client_id
}

resource "aws_ssm_parameter" "dynamodb_chat_table" {
  name  = "/${var.project_name}/dynamodb-chat-table"
  type  = "String"
  value = module.dynamodb.chat_table_name
}

resource "aws_ssm_parameter" "dynamodb_location_table" {
  name  = "/${var.project_name}/dynamodb-location-table"
  type  = "String"
  value = module.dynamodb.location_table_name
}

# ── Data Sources ──────────────────────────────────────────────
data "aws_caller_identity" "current" {}
