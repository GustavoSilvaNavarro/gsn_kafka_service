import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const monitoringRoutes = (fastify: FastifyInstance) => {
  fastify.get('/healthz', (_req: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Length', 0).status(204).send();
  });
};

export default monitoringRoutes;
