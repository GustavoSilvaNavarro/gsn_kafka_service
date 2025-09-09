import '@dotenvx/dotenvx/config';

import { logger } from '@adapters';
import { NAME } from '@config';
import { startServer } from '@server';
import { onExit } from 'signal-exit';

import { closeConnections, createConnections } from './connections';

// Handle process errors
process.on('uncaughtException', (err) => {
  logger.error(err, 'uncaughtException');
  throw err;
});
process.on('unhandledRejection', (err) => logger.error(err, 'unhandledRejection'));

void (async () => {
  const { db, kafkaConn } = await createConnections();
  await startServer();

  logger.info(`${NAME} Service started and running`);

  // rbtmqc.on('error', (err) => {
  //   console.log('RabbitMQ connection error', err);
  // });

  // rbtmqc.on('connection', () => {
  //   console.log('🔥 Connection successfully (re)established');
  // });

  onExit(() => {
    logger.error(`${NAME} Service is shutting down, closing connections...`);
    closeConnections({ db, kafkaConn })
      .then(() => process.exit(1))
      .catch((err) => {
        logger.error(`😭 Error closing connections => ${err}`);
        process.exit(1);
      });
  });
})();
