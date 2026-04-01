import { Elysia } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/', () => ({ message: 'Nationdex API' }))

  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  .get('/stats', () => ({
    users: 1234,
    nations: 195,
    caught: 45678,
    guilds: 42,
  }));

const handler = (req: Request) => app.handle(req);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
