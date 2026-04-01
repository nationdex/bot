/**
 * Admin panel BM2 entry point
 */
export {};

const isDev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT ?? '3000';
const cmd = isDev ? 'dev' : 'start';

console.log(
  `[admin-panel] Starting Next.js in ${isDev ? 'development' : 'production'} mode on port ${port}`
);

const proc = Bun.spawn(['bun', 'next', cmd, '--port', port], {
  cwd: import.meta.dir,
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env, PORT: port },
});

process.on('SIGTERM', () => proc.kill());
process.on('SIGINT', () => proc.kill(2)); // 2 = SIGINT

const code = await proc.exited;
process.exit(code ?? 0);
