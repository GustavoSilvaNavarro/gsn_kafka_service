import { logger } from '@adapters';
import { connectDb } from '@adapters/db';
import type { PrismaClient } from '@prisma/client';
import { Kafka } from 'kafkajs';

import { KAFKA_CLIENT_ID, KAFKA_URL } from './config';
import { startKafkaConnection } from './kafka';

type Connections = {
  kafkaConn: Kafka;
  db: PrismaClient;
};

let kafka: Kafka;

// TODO: try a migration to confluent library
export const connectToKafka = () => {
  kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: [KAFKA_URL], // Your Kafka broker
    connectionTimeout: 30000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 100,
      retries: 8,
      maxRetryTime: 30000,
      multiplier: 2,
      factor: 0.2,
    },
  });

  return kafka;
};

export const createConnections = async (): Promise<Connections> => {
  connectToKafka();
  await startKafkaConnection(kafka);

  const db = await connectDb();
  return { db, kafkaConn: kafka };
};

export const closeConnections = async ({ db }: Connections) => {
  logger.warn('😩 Closing Kafka and DB connection');
  await db.$disconnect();
};
