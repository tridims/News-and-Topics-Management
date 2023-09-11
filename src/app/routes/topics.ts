import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance) {
  /**
   * GET All Topics
   */
  fastify.get(
    '/topics',
    async function (requet: FastifyRequest, reply: FastifyReply) {
      const topics = await fastify.prisma.topic.findMany();
      reply.send(topics);
    }
  );

  /**
   * GET Topic by ID
   */
  fastify.get(
    '/topics/:id',
    async function (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) {
      const { id } = request.params;
      const topic = await fastify.prisma.topic.findUnique({
        where: { id: Number(id) }
      });

      if (!topic) {
        return this.httpErrors.notFound();
      }

      reply.send(topic);
    }
  );

  /**
   * POST Create Topic
   */
  fastify.post(
    '/topics',
    async function (
      request: FastifyRequest<{
        Body: { name: string };
      }>,
      reply: FastifyReply
    ) {
      const { name } = request.body;

      // check if topic already exists
      const existingTopic = await fastify.prisma.topic.findUnique({
        where: { name }
      });

      if (existingTopic) {
        return this.httpErrors.conflict('Topic already exists');
      }

      const topic = await fastify.prisma.topic.create({
        data: { name }
      });

      reply.send(topic);
    }
  );

  /**
   * PUT Update Topic
   */
  fastify.put(
    '/topics/:id',
    async function (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { name: string };
      }>,
      reply: FastifyReply
    ) {
      const { id } = request.params;
      const { name } = request.body;

      const topic = await fastify.prisma.topic.update({
        where: { id: Number(id) },
        data: { name }
      });

      reply.send(topic);
    }
  );

  /**
   * DELETE Topic
   */
  fastify.delete(
    '/topics/:id',
    async function (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) {
      const { id } = request.params;

      await fastify.prisma.topic.delete({
        where: { id: Number(id) }
      });

      reply.send({ deleted: true });
    }
  );
}
