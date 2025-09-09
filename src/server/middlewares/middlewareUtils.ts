import type { DoneFuncWithErrOrRes, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export const customHeadersPlugin = fp((fastify: FastifyInstance) => {
  fastify.addHook('onSend', (_req: FastifyRequest, reply: FastifyReply, _, done: DoneFuncWithErrOrRes) => {
    reply.header('x-api-provider', 'Powered by GSN');
    done();
  });
});
