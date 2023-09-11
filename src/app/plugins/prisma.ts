import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import prismaPlugin from '@news-and-topics-management/modules/prisma';

/**
 * This plugins adds some utilities for prisma client
 */
export default fp(async function (fastify: FastifyInstance) {
  fastify.register(prismaPlugin);
});
