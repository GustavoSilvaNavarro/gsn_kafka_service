type ENVIRONMENT = 'dev' | 'stg' | 'prd' | 'local' | 'test';
type LOG_LEVELS = 'info' | 'trace' | 'debug' | 'warn' | 'error' | 'fatal';

export const NAME = process.env.NAME ?? 'gsn_expenses_tracker';
export const ENVIRONMENT: ENVIRONMENT = (process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'dev') as ENVIRONMENT;

// Adapters
export const LOG_LEVEL: LOG_LEVELS = (process.env.LOG_LEVEL as LOG_LEVELS) || ENVIRONMENT === 'test' ? 'fatal' : 'info';

// Entrypoints
export const PORT = +(process.env.PORT ?? 8080);
export const URL_PREFIX = ENVIRONMENT === 'local' || ENVIRONMENT === 'test' ? 'api' : 'gsn_push_service';
export const API_URL = process.env.API_URL ?? 'http://localhost:8080';

// ! Kafka
export const KAFKA_URL = process.env.KAFKA_URL ?? 'localhost:9092';
export const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID ?? 'push-events';
export const KAFKA_TOPIC = process.env.KAFKA_TOPIC ?? 'evses';
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'gsn-kafka-consumer_service';
export const KAFKA_DLQ_TOPIC = process.env.KAFKA_DLQ_TOPIC ?? 'evse-messages-dlq';
export const KAFKA_RETRY_TOPIC = process.env.KAFKA_RETRY_TOPIC ?? 'evse-messages-retry';
