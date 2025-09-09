import { logger } from '@adapters';
import { type Kafka } from 'kafkajs';

import { DLQService } from './dlq';
import { EvseKafkaListener } from './evseListener';

export const startKafkaConnection = async (kafkaCon: Kafka) => {
  const dlq = new DLQService(kafkaCon);
  const evseListener = new EvseKafkaListener(kafkaCon, dlq);
  await evseListener.listen();

  logger.info('👻 Kafka listener has started.');
  return evseListener;
};
