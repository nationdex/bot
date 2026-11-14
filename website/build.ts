import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';
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

// Text assets are compressed once at build time and served as .br / .zst / .gz siblings (see server/index.ts).
// Bun and node:zlib do the work by default; set NSTD_BIN to the nstd CLI (github.com/nationdex/nstd) to use that.
const COMPRESSIBLE = /\.(js|css|html|json|svg|webmanifest|txt)$/;
const MIN_BYTES = 1024;

function encoders(): Record<'br' | 'zst' | 'gz', (file: string, data: Uint8Array<ArrayBuffer>) => Uint8Array> {
  const nstd = process.env.NSTD_BIN;
  const viaNstd = (flag: string, level: string) => (file: string): Uint8Array => {
    const run = Bun.spawnSync([nstd as string, flag, level, '-c', file]);
    if (!run.success) throw new Error(`nstd ${flag} failed on ${file}: ${run.stderr.toString()}`);
    return run.stdout;
  };
  if (nstd) return { br: viaNstd('-b', '-9'), zst: viaNstd('-z', '-9'), gz: viaNstd('-g', '-9') };
  return {
    br: (_f, data) => brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: data.length } }),
    zst: (_f, data) => Bun.zstdCompressSync(data, { level: 19 }),
    gz: (_f, data) => Bun.gzipSync(data, { level: 9 }),
  };
}

async function precompress(): Promise<void> {
  const encode = encoders();
  for (const rel of new Bun.Glob('**/*').scanSync({ cwd: distDir })) {
    if (!COMPRESSIBLE.test(rel)) continue;
    const file = path.join(distDir, rel);
    const data = new Uint8Array(await readFile(file)) as Uint8Array<ArrayBuffer>;
    if (data.length < MIN_BYTES) continue;
    for (const [ext, fn] of Object.entries(encode)) {
      const out = fn(file, data);
      if (out.length < data.length) await writeFile(`${file}.${ext}`, out);
    }
  }
}

// PWA tags are added after bundling: Bun's HTML bundler would try to resolve and rename these root-level files.
const PWA_HEAD = `
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#0a0a0a" />
  <meta name="color-scheme" content="dark light" />
  <meta name="application-name" content="Nationdex" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Nationdex" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="msapplication-TileColor" content="#0a0a0a" />
  <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
`;

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

  const swPath = path.join(distDir, 'sw.js');
  await writeFile(swPath, (await readFile(swPath, 'utf8')).replace("const VERSION = 'dev';", `const VERSION = '${Date.now().toString(36)}';`));

  const indexPath = path.join(distDir, 'index.html');
  const html = (await readFile(indexPath, 'utf8'))
    .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />')
    .replace('</head>', `${PWA_HEAD}</head>`);
  await writeFile(indexPath, html);

  await precompress();
}

if (import.meta.main) {
  await buildPanel();
  console.log('Admin panel built into website/dist');
}
