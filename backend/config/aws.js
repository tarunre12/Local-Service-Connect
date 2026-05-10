/**
 * AWS Configuration Loader
 * Loads all secrets from AWS Secrets Manager and Parameter Store.
 * In development (NODE_ENV=development), falls back to .env file values.
 * ZERO hardcoded values — everything comes from environment or AWS.
 */
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const APP_NAME   = process.env.APP_NAME   || 'serviconnect';
const IS_PROD    = process.env.NODE_ENV === 'production';

const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const ssmClient     = new SSMClient({ region: AWS_REGION });

// ── Helper: Get a single AWS Secret ────────────────────────────
async function getSecret(secretId) {
  try {
    const res = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretId }));
    return res.SecretString ? JSON.parse(res.SecretString) : {};
  } catch (err) {
    console.warn(`[AWS] Could not fetch secret "${secretId}": ${err.message}`);
    return {};
  }
}

// ── Helper: Get a single SSM Parameter ─────────────────────────
async function getParameter(name) {
  try {
    const res = await ssmClient.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
    return res.Parameter?.Value || null;
  } catch (err) {
    console.warn(`[AWS] Could not fetch parameter "${name}": ${err.message}`);
    return null;
  }
}

// ── Main Config Loader ──────────────────────────────────────────
async function loadConfig() {
  if (!IS_PROD) {
    // Development: use .env file — no AWS calls needed
    console.log('[Config] Running in development mode — using .env values');
    return {
      port:             parseInt(process.env.PORT) || 5000,
      jwtSecret:        process.env.JWT_SECRET,
      jwtExpire:        process.env.JWT_EXPIRE || '7d',
      dbHost:           process.env.DB_HOST     || 'localhost',
      dbPort:           parseInt(process.env.DB_PORT) || 5432,
      dbName:           process.env.DB_NAME     || 'serviconnect',
      dbUser:           process.env.DB_USER     || 'postgres',
      dbPass:           process.env.DB_PASS,
      frontendUrl:      process.env.FRONTEND_URL || 'http://localhost:5000',
      awsRegion:        AWS_REGION,
      bedrockRegion:    process.env.BEDROCK_REGION  || 'us-east-1',
      bedrockModelId:   process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
      sesFromEmail:     process.env.SES_FROM_EMAIL,
      cognitoUserPoolId:process.env.COGNITO_USER_POOL_ID,
      cognitoClientId:  process.env.COGNITO_CLIENT_ID,
      dynamoChatTable:  process.env.DYNAMODB_CHAT_TABLE || '',
      dynamoLocationTable: process.env.DYNAMODB_LOCATION_TABLE || '',
    };
  }

  // Production: fetch from AWS Secrets Manager + Parameter Store
  console.log('[Config] Running in production mode — loading from AWS');
  const [dbSecret, appSecret] = await Promise.all([
    getSecret(`${APP_NAME}/db-credentials`),
    getSecret(`${APP_NAME}/app-secrets`),
  ]);

  const [
    dbHost, dbPort, dbName, frontendUrl,
    bedrockModelId, bedrockRegion, sesFromEmail,
    cognitoUserPoolId, cognitoClientId,
    dynamoChatTable, dynamoLocationTable
  ] = await Promise.all([
    getParameter(`/${APP_NAME}/db-host`),
    getParameter(`/${APP_NAME}/db-port`),
    getParameter(`/${APP_NAME}/db-name`),
    getParameter(`/${APP_NAME}/frontend-url`),
    getParameter(`/${APP_NAME}/bedrock-model-id`),
    getParameter(`/${APP_NAME}/bedrock-region`),
    getParameter(`/${APP_NAME}/ses-from-email`),
    getParameter(`/${APP_NAME}/cognito-user-pool-id`),
    getParameter(`/${APP_NAME}/cognito-client-id`),
    getParameter(`/${APP_NAME}/dynamodb-chat-table`),
    getParameter(`/${APP_NAME}/dynamodb-location-table`),
  ]);

  return {
    port:             parseInt(process.env.PORT) || 5000,
    jwtSecret:        process.env.JWT_SECRET || (appSecret && appSecret.jwt_secret),
    jwtExpire:        process.env.JWT_EXPIRE || (appSecret && appSecret.jwt_expire) || '7d',
    dbHost:           process.env.DB_HOST || dbHost,
    dbPort:           parseInt(process.env.DB_PORT || dbPort) || 5432,
    dbName:           process.env.DB_NAME || dbName,
    dbUser:           process.env.DB_USER || (dbSecret && dbSecret.username),
    dbPass:           process.env.DB_PASS || (dbSecret && dbSecret.password),
    frontendUrl:      process.env.FRONTEND_URL || frontendUrl,
    awsRegion:        AWS_REGION,
    bedrockRegion:    process.env.BEDROCK_REGION || bedrockRegion  || 'us-east-1',
    bedrockModelId:   process.env.BEDROCK_MODEL_ID || bedrockModelId || 'anthropic.claude-3-haiku-20240307-v1:0',
    sesFromEmail:     process.env.SES_FROM_EMAIL || sesFromEmail,
    cognitoUserPoolId:process.env.COGNITO_USER_POOL_ID || cognitoUserPoolId,
    cognitoClientId:  process.env.COGNITO_CLIENT_ID || cognitoClientId,
    dynamoChatTable:  process.env.DYNAMODB_CHAT_TABLE || dynamoChatTable,
    dynamoLocationTable: process.env.DYNAMODB_LOCATION_TABLE || dynamoLocationTable,
  };
}

module.exports = { loadConfig, getSecret, getParameter };
