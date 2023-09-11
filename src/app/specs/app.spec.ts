import Fastify, { FastifyInstance } from 'fastify';
import { app } from '../app';
import fp from 'fastify-plugin';
import TopicsRoutes from '../routes/topics';
import { PrismaClient } from '@prisma/client';

describe('root path', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    server = Fastify();
    server.register(app);
  });

  it('should respond with a message "status ok" and status 200', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.statusCode).toEqual(200);
  });
});

describe('topics route', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    server = Fastify();
    server.register(fp(TopicsRoutes));
  });

  afterEach(() => {
    server.close();
  });

  it('GET /topics returns list of topics', async () => {
    const data = [
      { id: 1, name: 'Test Topic' },
      { id: 2, name: 'Test Topic 2' }
    ];

    // Decorate
    server.decorate('prisma', {
      topic: {
        findMany: jest.fn().mockResolvedValue(data)
      }
    });

    const response = await server.inject({
      method: 'GET',
      url: '/topics'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(data);
  });

  it('GET /topics/:id returns a topic', async () => {
    server.decorate('prisma', {
      topic: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Test Topic' })
      }
    });

    const response = await server.inject({
      method: 'GET',
      url: '/topics/1'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 1, name: 'Test Topic' });
  });

  it('POST /topics creates a new topic', async () => {
    const data = { id: 2, name: 'New Topic' };

    server.decorate('prisma', {
      topic: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(data)
      }
    });

    const response = await server.inject({
      method: 'POST',
      url: '/topics',
      payload: { name: 'New Topic' }
    });

    expect(JSON.parse(response.body)).toEqual(data);
  });

  it('PUT /topics/:id updates an existing topic', async () => {
    const oldData = { id: 1, name: 'Test Topic' };
    const newData = { id: 1, name: 'Updated Topic' };

    server.decorate('prisma', {
      topic: {
        findUnique: jest.fn().mockResolvedValue(oldData),
        update: jest.fn().mockResolvedValue(newData)
      }
    });

    const response = await server.inject({
      method: 'PUT',
      url: '/topics/1',
      payload: { name: 'Updated Topic' }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(newData);
  });

  it('DELETE /topics/:id deletes an existing topic', async () => {
    server.decorate('prisma', {
      topic: {
        delete: jest.fn().mockResolvedValue({ deleted: true })
      }
    });

    const response = await server.inject({
      method: 'DELETE',
      url: '/topics/1'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ deleted: true });
  });
});
