variable "name_prefix"      { type = string }
variable "aws_region"       { type = string }
variable "account_id"       { type = string }
variable "bedrock_model_id" { type = string }

# ── ECS Execution Role (pull ECR, read Secrets) ───────────────
resource "aws_iam_role" "ecs_execution" {
  name = "${var.name_prefix}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.name_prefix}-secrets-access"
  role = aws_iam_role.ecs_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.account_id}:secret:${var.name_prefix}/*" },
      { Effect = "Allow", Action = ["ssm:GetParameter", "ssm:GetParameters"], Resource = "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/serviconnect/*" },
    ]
  })
}

# ── ECS Task Role (runtime AWS SDK calls) ─────────────────────
resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "ecs_task_permissions" {
  name = "${var.name_prefix}-task-permissions"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Bedrock — invoke AI models
      { Effect = "Allow", Action = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
        Resource = "arn:aws:bedrock:us-east-1::foundation-model/*" },
      # Comprehend — sentiment analysis
      { Effect = "Allow", Action = ["comprehend:DetectSentiment", "comprehend:BatchDetectSentiment"], Resource = "*" },
      # SES — send emails
      { Effect = "Allow", Action = ["ses:SendEmail", "ses:SendRawEmail"], Resource = "*" },
      # Secrets Manager — read at runtime
      { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"],
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.account_id}:secret:serviconnect/*" },
      # SSM — read config
      { Effect = "Allow", Action = ["ssm:GetParameter", "ssm:GetParameters"],
        Resource = "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/serviconnect/*" },
      # DynamoDB — persist chat messages and worker locations
      { Effect = "Allow", Action = [
          "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem", "dynamodb:DeleteItem",
          "dynamodb:DescribeTable", "dynamodb:GetItem", "dynamodb:PutItem",
          "dynamodb:Query", "dynamodb:Scan", "dynamodb:UpdateItem"
        ],
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/${var.name_prefix}-chat-messages",
          "arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/${var.name_prefix}-chat-messages/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/${var.name_prefix}-location-updates",
          "arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/${var.name_prefix}-location-updates/index/*"
        ] },
      # CloudWatch — write logs
      { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "*" },
    ]
  })
}

output "ecs_task_role_arn"      { value = aws_iam_role.ecs_task.arn }
output "ecs_execution_role_arn" { value = aws_iam_role.ecs_execution.arn }
