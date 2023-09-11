import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance) {
  /**
   * GET Server Status
   */
  fastify.get(
    '/',
    async function (request: FastifyRequest, reply: FastifyReply) {
      reply.send({ status: 'ok' });
    }
  );
}
