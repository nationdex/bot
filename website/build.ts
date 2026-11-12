import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createGenerator } from '@unocss/core';
import unoConfig from './uno.config';

const root = import.meta.dir;
export const distDir = path.join(root, 'dist');

// UnoCSS has no Bun plugin: scan the sources and write the utilities the UI imports (src/main.tsx).
async function generateUno(): Promise<void> {
  const files = [...new Bun.Glob('src/**/*.{ts,tsx}').scanSync({ cwd: root }), 'index.html'];
  const code = (await Promise.all(files.map((f) => Bun.file(path.join(root, f)).text()))).join('\n');
  const { css } = await (await createGenerator(unoConfig)).generate(code);
  await mkdir(path.join(root, '.generated'), { recursive: true });
  await Bun.write(path.join(root, '.generated', 'uno.css'), css);
}

// Bundles the panel UI (React + UnoCSS) into website/dist with Bun's own bundler.
export async function buildPanel(): Promise<void> {
  await generateUno();
  await rm(distDir, { recursive: true, force: true });
  const result = await Bun.build({
    entrypoints: [path.join(root, 'index.html')],
    outdir: distDir,
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
