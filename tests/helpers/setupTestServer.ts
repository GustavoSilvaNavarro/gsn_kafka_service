import { logger } from '@adapters';
import { customHeadersPlugin } from '@middlewares';
import registerRoutes from '@server/routers';
import Fastify, { type FastifyBaseLogger } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';

export const testServerSetup = async (skipDatabase = false) => {
  const fastify = Fastify({
    loggerInstance: logger as FastifyBaseLogger,
    disableRequestLogging: true,
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Only register Prisma plugin if database is needed
  if (!skipDatabase) {
    const { prismaPlugin } = await import('@plugins');
    fastify.register(prismaPlugin);
  }

  fastify.register(customHeadersPlugin);

  await registerRoutes(fastify);
  await fastify.ready();

  return fastify;
};
