import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

app.get('/', (c) => {
  return c.json({ message: 'Nationdex API test' });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/stats', (c) => {
  return c.json({
    users: 1234,
    nations: 195,
    caught: 45678,
    guilds: 42,
  });
});

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
