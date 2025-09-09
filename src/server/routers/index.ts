// import { URL_PREFIX } from '@config';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

// import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import monitoringRoutes from './monitoring';

export const registerRoutes = async (fastify: FastifyInstance) => {
  fastify.register(helmet);
  await fastify.register(monitoringRoutes);
};
