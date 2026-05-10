resource "aws_dynamodb_table" "chat_messages" {
  name         = "${var.name_prefix}-chat-messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bookingId"
  range_key    = "messageTimestamp"

  attribute {
    name = "bookingId"
    type = "S"
  }

  attribute {
    name = "messageTimestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.name_prefix}-chat-messages"
  }
}

resource "aws_dynamodb_table" "location_updates" {
  name         = "${var.name_prefix}-location-updates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bookingId"
  range_key    = "locationTimestamp"

  attribute {
    name = "bookingId"
    type = "S"
  }

  attribute {
    name = "locationTimestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.name_prefix}-location-updates"
  }
}
