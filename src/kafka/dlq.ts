import { logger } from '@adapters';
import { KAFKA_DLQ_TOPIC, KAFKA_RETRY_TOPIC } from '@config';
import type { Kafka, Producer } from 'kafkajs';

export interface RetryableMessage {
  originalMessage: any;
  topic: string;
  partition: number;
  offset: string;
  retryCount: number;
  firstAttemptTimestamp: number;
  lastAttemptTimestamp: number;
  error?: string;
}

export interface DLQMessage extends RetryableMessage {
  finalError: string;
  dlqTimestamp: number;
}

export class DLQService {
  private readonly producer: Producer;

  constructor(kafkaConn: Kafka) {
    this.producer = kafkaConn.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    logger.info('🔗 DLQ Service connected');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    logger.info('🔌 DLQ Service disconnected');
  }

  /**
   * Send message to retry topic with incremented retry count
   */
  async sendToRetry(
    originalMessage: unknown,
    topic: string,
    partition: number,
    offset: string,
    retryCount: number,
    error: string,
  ): Promise<void> {
    const retryMessage: RetryableMessage = {
      originalMessage,
      topic,
      partition,
      offset,
      retryCount: retryCount + 1,
      firstAttemptTimestamp: Date.now(),
      lastAttemptTimestamp: Date.now(),
      error,
    };

    try {
      await this.producer.send({
        topic: KAFKA_RETRY_TOPIC,
        messages: [
          {
            key: `retry-${topic}-${partition}-${offset}`,
            value: JSON.stringify(retryMessage),
            headers: {
              'retry-count': retryCount.toString(),
              'original-topic': topic,
              'retry-timestamp': new Date().toISOString(),
            },
          },
        ],
      });

      console.log(`📤 Message sent to retry topic. Retry count: ${retryCount + 1}`, {
        originalTopic: topic,
        partition,
        offset,
      });
    } catch (err) {
      console.log(`❌ Failed to send message to retry topic: ${(err as Error).message}`, {
        originalTopic: topic,
        partition,
        offset,
      });
    }
  }

  /**
   * Send message to Dead Letter Queue
   */
  async sendToDLQ(retryableMessage: RetryableMessage, finalError: string): Promise<void> {
    const dlqMessage: DLQMessage = {
      ...retryableMessage,
      finalError,
      dlqTimestamp: Date.now(),
    };

    try {
      await this.producer.send({
        topic: KAFKA_DLQ_TOPIC,
        messages: [
          {
            key: `dlq-${retryableMessage.topic}-${retryableMessage.partition}-${retryableMessage.offset}`,
            value: JSON.stringify(dlqMessage),
            headers: {
              'final-retry-count': retryableMessage.retryCount.toString(),
              'original-topic': retryableMessage.topic,
              'dlq-timestamp': Date.now().toString(),
              'processing-duration': (Date.now() - retryableMessage.firstAttemptTimestamp).toString(),
            },
          },
        ],
      });

      console.log(`💀 Message sent to DLQ after ${retryableMessage.retryCount} retries`, {
        originalTopic: retryableMessage.topic,
        partition: retryableMessage.partition,
        offset: retryableMessage.offset,
        finalError,
      });
    } catch (err) {
      console.log(`❌ Failed to send message to DLQ: ${(err as Error).message}`, {
        originalTopic: retryableMessage.topic,
        partition: retryableMessage.partition,
        offset: retryableMessage.offset,
      });
    }
  }
}
