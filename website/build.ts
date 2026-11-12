import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import tailwind from 'bun-plugin-tailwind';

const root = import.meta.dir;
export const distDir = path.join(root, 'dist');

// Bundles the panel UI (React + Tailwind) into website/dist with Bun's own bundler.
export async function buildPanel(): Promise<void> {
  await rm(distDir, { recursive: true, force: true });
  const result = await Bun.build({
    entrypoints: [path.join(root, 'index.html')],
    outdir: distDir,
    plugins: [tailwind],
    minify: true,
    splitting: true,
    target: 'browser',
    publicPath: '/',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  if (!result.success) throw new AggregateError(result.logs, 'Admin panel build failed');
  await cp(path.join(root, 'public'), distDir, { recursive: true });
}

if (import.meta.main) {
  await buildPanel();
  console.log('Admin panel built into website/dist');
}
