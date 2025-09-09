import { logger } from '@adapters';
import { KAFKA_DLQ_TOPIC, KAFKA_RETRY_TOPIC } from '@config';
import type { DLQMessage, RetryableMessage } from '@interfaces';
import type { Kafka, Producer } from 'kafkajs';

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

      logger.debug(
        { originalTopic: topic, partition, offset },
        `📤 Message sent to retry topic. Retry count: ${retryCount + 1}`,
      );
    } catch (err) {
      logger.error({ err, originalTopic: topic, partition, offset }, `❌ Failed to send message to retry topic`);
    }
  }

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

      logger.debug(
        {
          originalTopic: retryableMessage.topic,
          partition: retryableMessage.partition,
          offset: retryableMessage.offset,
          finalError,
        },
        `💀 Message sent to DLQ after ${retryableMessage.retryCount} retries`,
      );
    } catch (err) {
      logger.error(err, '❌ Failed to send message to DLQ');
    }
  }
}
