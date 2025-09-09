import { logger } from '@adapters';
import { ENVIRONMENT, KAFKA_GROUP_ID, KAFKA_RETRY_TOPIC, KAFKA_TOPIC } from '@config';
import type { OcppMessagesEvent, RetryableMessage } from '@interfaces';
import { insertNewMsg } from '@services';
import { sleep } from '@utils';
import type { Consumer, EachMessagePayload, Kafka } from 'kafkajs';

import type { DLQService } from './dlq';

const MAX_RETRIES = 3;

export class EvseKafkaListener {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly groupId: string;
  private dlq: DLQService;
  private retryConsumer: Consumer;

  constructor(kafkaConn: Kafka, dlqService: DLQService) {
    this.kafka = kafkaConn;
    this.groupId = KAFKA_GROUP_ID;
    this.dlq = dlqService;

    // Create consumer
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    // Retry consumer
    this.retryConsumer = this.kafka.consumer({
      groupId: `${this.groupId}-retry`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async listen(): Promise<void> {
    try {
      logger.info('🚀 Starting Kafka consumer...');
      // Connect DLQ service
      await this.dlq.connect();

      // Connect consumers
      await this.consumer.connect();
      await this.retryConsumer.connect();

      // Subscribe to topics
      await this.consumer.subscribe({
        topic: KAFKA_TOPIC,
        fromBeginning: !['prd', 'stg', 'dev'].includes(ENVIRONMENT), // Set to false to only get new messages
      });

      await this.retryConsumer.subscribe({ topic: KAFKA_RETRY_TOPIC, fromBeginning: false });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload) => {
          await this.handleMessage(payload);
        },
      });

      await this.retryConsumer.run({
        eachMessage: async (payload) => {
          await this.handleRetryMessage(payload);
        },
      });
    } catch (err) {
      logger.error(err, '❌ Error starting consumer');
    }
  }

  private async handleMessage({ topic, message, partition }: EachMessagePayload) {
    const stringifiedMsg = message.value?.toString();
    if (!stringifiedMsg) return;

    try {
      const msg = JSON.parse(stringifiedMsg) as OcppMessagesEvent;
      const newMsg = await insertNewMsg(msg, topic);
      logger.debug(newMsg);
    } catch (err) {
      const error = (err as Error)?.message ?? 'Unexpected error';
      logger.error(err, '⚠️ Failed to process message, sending to retry!');

      await this.dlq.sendToRetry(JSON.parse(stringifiedMsg), topic, partition, message.offset, 0, error);
    }
  }

  private async handleRetryMessage({ topic, message }: EachMessagePayload): Promise<void> {
    const stringifiedMsg = message.value?.toString();
    const offset = message.offset;
    if (!stringifiedMsg) return;

    try {
      const retryMessage = JSON.parse(stringifiedMsg) as RetryableMessage;
      await sleep(500);

      // Try to process the original message
      const newMsg = await insertNewMsg(retryMessage.originalMessage as OcppMessagesEvent, topic);
      logger.debug(newMsg);

      logger.info(`✅ Successfully processed message on retry ${retryMessage.retryCount}`);
    } catch (err) {
      const errorMsg = (err as Error)?.message ?? 'Unexpected error';
      const retryMessage = JSON.parse(stringifiedMsg) as RetryableMessage;

      if (retryMessage.retryCount >= MAX_RETRIES) {
        logger.warn(`💀 Max retries exceeded, sending to DLQ`);
        await this.dlq.sendToDLQ(retryMessage, errorMsg);
      } else {
        // Retry again
        logger.warn(`🔄 Retrying message (attempt ${retryMessage.retryCount + 1})`);

        await this.dlq.sendToRetry(
          retryMessage.originalMessage,
          retryMessage.topic,
          retryMessage.partition,
          offset,
          retryMessage.retryCount,
          errorMsg,
        );
      }
    }
  }
}
