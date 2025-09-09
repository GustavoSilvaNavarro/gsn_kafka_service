import { logger } from '@adapters';
import { ENVIRONMENT, PORT } from '@config';
import { swaggerDefinition } from '@docs';
import compress from '@fastify/compress';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { customHeadersPlugin } from '@middlewares';
import Fastify, { type FastifyBaseLogger } from 'fastify';

import { registerRoutes } from './routers';

const fastify = Fastify({
  loggerInstance: logger as FastifyBaseLogger,
  disableRequestLogging: !['local', 'test'].includes(ENVIRONMENT),
});

export const serverSetup = async () => {
  fastify.register(compress);
  fastify.register(swagger, { mode: 'static', specification: { document: swaggerDefinition } });
  fastify.register(swaggerUI, {
    routePrefix: '/docs',
  });

  // custom plugins
  fastify.register(customHeadersPlugin);

  // Register graphql and routes
  await fastify.register(registerRoutes);

  return fastify;
};

export const startServer = async () => {
  try {
    const fastify = await serverSetup();

    await fastify.listen({ port: PORT });
    fastify.log.info(`🚀 Push Service is running, listening on ${PORT}`);
  } catch (err) {
    fastify.log.error(err, 'Error starting fastify server');
    process.exit(1);
  }
};
