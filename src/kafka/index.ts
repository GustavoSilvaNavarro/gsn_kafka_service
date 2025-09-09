import { logger } from '@adapters';
import { type Kafka } from 'kafkajs';

import { EvseKafkaListener } from './evseListener';

export const startKafkaConnection = async (kafkaCon: Kafka) => {
  const evseListener = new EvseKafkaListener(kafkaCon);
  await evseListener.listen();

  logger.info('👻 Kafka listener has started.');
  return evseListener;
};
