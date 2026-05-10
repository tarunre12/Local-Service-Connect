output "chat_table_name" {
  value = aws_dynamodb_table.chat_messages.name
}

output "chat_table_arn" {
  value = aws_dynamodb_table.chat_messages.arn
}

output "location_table_name" {
  value = aws_dynamodb_table.location_updates.name
}

output "location_table_arn" {
  value = aws_dynamodb_table.location_updates.arn
}
