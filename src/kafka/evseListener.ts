import { logger } from '@adapters';
import { ENVIRONMENT, KAFKA_GROUP_ID, KAFKA_TOPIC } from '@config';
import type { OcppMessagesEvent } from '@interfaces';
import { insertNewMsg } from '@services';
import type { Consumer, EachMessagePayload, Kafka } from 'kafkajs';

export class EvseKafkaListener {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly groupId: string;

  constructor(kafkaConn: Kafka) {
    this.kafka = kafkaConn;
    this.groupId = KAFKA_GROUP_ID;

    // Create consumer
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async listen(): Promise<void> {
    try {
      logger.info('🚀 Starting Kafka consumer...');
      await this.consumer.connect();

      // Subscribe to topics
      await this.consumer.subscribe({
        topic: KAFKA_TOPIC,
        fromBeginning: !['prd', 'stg', 'dev'].includes(ENVIRONMENT), // Set to false to only get new messages
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (err) {
      logger.error(`❌ Error starting consumer: Error => ${(err as Error)?.message ?? 'Error'}`);
    }
  }

  private async handleMessage({ topic, message }: EachMessagePayload) {
    const stringifiedMsg = message.value?.toString();
    if (!stringifiedMsg) return;

    const msg = JSON.parse(stringifiedMsg) as OcppMessagesEvent;
    const newMsg = await insertNewMsg(msg, topic);
    console.log(newMsg);
  }
}
