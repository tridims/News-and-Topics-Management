import { PrismaClient } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const prisma = new PrismaClient();

const PrismaPlugin: FastifyPluginAsync<PrismaPluginOptions> = async (
  fastify,
  options
) => {
  fastify
    .decorate('prisma', prisma)
    .addHook('onClose', async (fastifyInstance, done) => {
      await fastifyInstance.prisma.$disconnect();
      done();
    });

  // fastify
  //   .decorateRequest('prisma', prisma)
  //   .addHook('onClose', async (request, done) => {
  //     await request.prisma.$disconnect();
  //     done();
  //   });
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  // interface FastifyRequest {
  //   prisma: PrismaClient;
  // }
}

export interface PrismaPluginOptions {
  datasourceUrl?: string;
}

export default fp(PrismaPlugin, {
  name: 'fastify-prisma'
});
