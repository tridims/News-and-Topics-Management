import Fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import newsRoutes, { NewsStatus } from '../routes/news';
import createPrismaMock from 'prisma-mock';
import { PrismaClient } from '@prisma/client';
import sensible from '../plugins/sensible';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

describe('news route', () => {
  let client: PrismaClient;
  let server: FastifyInstance;

  beforeAll(() => {
    server = Fastify();
    client = createPrismaMock();

    server.decorate('prisma', client);
    server.register(sensible);
    server.register(fp(newsRoutes));
  });

  afterAll(() => {
    server.close();
  });

  describe('Test prisma mock functionality', () => {
    it('Test prisma mock functionality', async () => {
      const data = {
        title: 'Test News',
        slug: 'test-news',
        status: NewsStatus.PUBLISHED,
        content: 'Test News Content',
        topics: {
          create: [
            {
              topic: {
                create: {
                  name: 'Test Topic'
                }
              }
            }
          ]
        }
      };

      await client.news.create({
        data
      });

      const news = await client.news.findMany();

      expect({ ...news[0], topics: data.topics }).toEqual({ ...data, id: 1 });
    });
  });

  // TODO: Find solution in this issue
  // describe('GET /news', () => {
  //   it('GET /news returns list of news', async () => {
  //     const data = {
  //       title: 'Test News',
  //       slug: 'test-news',
  //       status: NewsStatus.PUBLISHED,
  //       content: 'Test News Content',
  //       topics: {
  //         create: [
  //           {
  //             topic: {
  //               create: {
  //                 name: 'Test Topic'
  //               }
  //             }
  //           }
  //         ]
  //       }
  //     };

  //     await client.news.create({
  //       data
  //     });

  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/news'
  //     });

  //     // expect(response.statusCode).toBe(200);
  //     // expect(JSON.parse(response.body)).toEqual(data);
  //   });
  // });
});
