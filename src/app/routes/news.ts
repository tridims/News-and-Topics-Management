import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance) {
  /**
   * GET All News
   * filter by status and topics
   */
  fastify.get(
    '/news',
    async function (
      request: FastifyRequest<{
        Querystring: {
          status?: 'draft' | 'published' | 'deleted';
          topics?: string;
        };
      }>,
      reply: FastifyReply
    ) {
      const status: NewsStatus[] = (request.query.status
        ?.split(',')
        ?.map((status) => status.toUpperCase()) as NewsStatus[]) || [
        'PUBLISHED' as NewsStatus
      ];

      const topics = request.query.topics?.split(',') || [];

      const news = await fastify.prisma.news
        .findMany({
          where: {
            AND: [
              {
                status: {
                  in: status
                }
              },
              {
                topics: {
                  every: {
                    topic: {
                      name: {
                        in: topics
                      }
                    }
                  }
                }
              }
            ]
          },
          include: {
            topics: true
          }
        })
        .catch((err) => {
          return this.httpErrors.badRequest('Check your query');
        });

      reply.send(news);
    }
  );

  enum NewsStatus {
    PUBLISHED = 'PUBLISHED',
    DRAFT = 'DRAFT',
    DELETED = 'DELETED'
  }

  /**
   * GET News by ID
   */
  fastify.get(
    '/news/:slug',
    async function (
      request: FastifyRequest<{
        Params: { slug: string };
      }>,
      reply: FastifyReply
    ) {
      const { slug } = request.params;
      const news = await fastify.prisma.news.findUnique({
        where: { slug: slug, status: 'PUBLISHED' }
      });

      if (!news) {
        return this.httpErrors.notFound();
      }

      reply.send(news);
    }
  );

  /**
   * POST Create News
   */
  fastify.post(
    '/news',
    async function (
      request: FastifyRequest<{
        Body: {
          slug: string;
          title: string;
          content: string;
          status: NewsStatus;
          topics: [string];
        };
      }>,
      reply: FastifyReply
    ) {
      const { topics, ...newsData } = request.body;

      // check if slug already exists
      const existingNews = await fastify.prisma.news.findMany({
        where: { OR: [{ slug: newsData.slug }, { title: newsData.title }] }
      });

      if (existingNews.length > 0) {
        return this.httpErrors.conflict('News already exists');
      }

      // check if each topic exists
      const existingTopics = await fastify.prisma.topic.findMany({
        where: { name: { in: topics } }
      });

      if (existingTopics.length !== topics.length) {
        return this.httpErrors.badRequest('Invalid topics');
      }

      const news = await fastify.prisma.news.create({
        data: {
          ...newsData,
          topics: {
            create: existingTopics.map((topic) => ({
              topic: {
                connect: {
                  id: topic.id
                }
              }
            }))
          }
        },
        include: {
          topics: true
        }
      });

      reply.send(news);
    }
  );

  /**
   * PUT Update News
   */
  fastify.put(
    '/news/:slug',
    async function (
      request: FastifyRequest<{
        Params: { slug: string };
        Body: {
          title: string;
          content: string;
          status: NewsStatus;
          topics: [string];
        };
      }>,
      reply: FastifyReply
    ) {
      const { slug } = request.params;
      const { topics, ...newsData } = request.body;

      // check if news exists
      const existingNews = await fastify.prisma.news.findUnique({
        where: { slug },
        include: {
          topics: true
        }
      });

      if (!existingNews) {
        return this.httpErrors.notFound();
      }

      // check if we want to update title
      // but the new title already exists
      if (newsData.title && newsData.title !== existingNews.title) {
        const existingNews = await fastify.prisma.news.findUnique({
          where: { title: newsData.title }
        });

        if (existingNews) {
          return this.httpErrors.conflict('News already exists');
        }
      }

      // check if each topic exists
      const existingTopics = await fastify.prisma.topic.findMany({
        where: { name: { in: topics } }
      });

      if (existingTopics.length !== topics.length) {
        return this.httpErrors.badRequest('Invalid topics');
      }

      // delete topics that are not in the new list. compare by id
      const topicsToDelete = existingNews.topics.filter(
        (topic) => !existingTopics.find((t) => t.id === topic.topicId)
      );

      await fastify.prisma.newsTopic.deleteMany({
        where: {
          newsId: existingNews.id,
          topicId: {
            in: topicsToDelete.map((topic) => topic.topicId)
          }
        }
      });

      // add topics that are not in the old list. compare by id
      const topicsToAdd = existingTopics.filter(
        (topic) => !existingNews.topics.find((t) => t.topicId === topic.id)
      );

      const news = await fastify.prisma.news.update({
        where: { slug },
        data: {
          ...newsData,
          topics: {
            create: topicsToAdd.map((topic) => ({
              topic: {
                connect: {
                  id: topic.id
                }
              }
            }))
          }
        },
        include: {
          topics: true
        }
      });

      reply.send(news);
    }
  );

  /**
   * DELETE News
   */
  fastify.delete(
    '/news/:slug',
    async function (
      request: FastifyRequest<{
        Params: { slug: string };
      }>,
      reply: FastifyReply
    ) {
      const { slug } = request.params;

      // update status to DELETED
      const deleted = await fastify.prisma.news.update({
        where: { slug },
        data: { status: 'DELETED' }
      });

      reply.send(deleted);
    }
  );
}
