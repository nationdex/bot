import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

const root = import.meta.dir;
export const distDir = path.join(root, 'dist');

// Text assets are compressed once at build time and served as .br / .gz siblings (see server/index.ts).
// Brotli is the smallest, but browsers only ask for it over HTTPS (or localhost), so plain-HTTP visitors get gzip.
const COMPRESSIBLE = /\.(js|css|html|json|svg|webmanifest|txt)$/;
const MIN_BYTES = 1024;

const encoders: Record<'br' | 'gz', (data: Uint8Array<ArrayBuffer>) => Uint8Array> = {
  br: (data) =>
    brotliCompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: data.length },
    }),
  gz: (data) => Bun.gzipSync(data, { level: 9 }),
};

async function precompress(): Promise<void> {
  for (const rel of new Bun.Glob('**/*').scanSync({ cwd: distDir })) {
    if (!COMPRESSIBLE.test(rel)) continue;
    const file = path.join(distDir, rel);
    const data = new Uint8Array(await readFile(file)) as Uint8Array<ArrayBuffer>;
    if (data.length < MIN_BYTES) continue;
    for (const [ext, encode] of Object.entries(encoders)) {
      const out = encode(data);
      if (out.length < data.length) await writeFile(`${file}.${ext}`, out);
    }
  }
}

// PWA tags are added after bundling: Bun's HTML bundler would try to resolve and rename these root-level files.
const PWA_HEAD = `
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/fonts/inter.css" />
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

// Bundles the panel UI (native DOM + CSS) into website/dist with Bun's own bundler.
export async function buildPanel(): Promise<void> {
  await rm(distDir, { recursive: true, force: true });
  const result = await Bun.build({
    entrypoints: [path.join(root, 'index.html')],
    outdir: distDir,
    minify: true,
    splitting: true,
    target: 'browser',
    publicPath: '/',
    metafile: true,
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  if (!result.success) throw new AggregateError(result.logs, 'Admin panel build failed');

  // The Dashboard is the first page after sign-in and loads lazily: preload it (and what it imports) with the shell.
  const outputs = (result.metafile?.outputs ?? {}) as Record<
    string,
    { inputs: Record<string, unknown>; imports: Array<{ path: string; kind: string }> }
  >;
  const dash = Object.entries(outputs).find(([, o]) =>
    Object.keys(o.inputs).some((i) => i.endsWith('pages/dashboard/Dashboard.ts')),
  );
  const preload = dash
    ? [dash[0], ...dash[1].imports.filter((i) => i.kind === 'import-statement').map((i) => i.path)]
        .map((p) => `  <link rel="modulepreload" href="/${path.basename(p)}" />\n`)
        .join('')
    : '';
  await cp(path.join(root, 'public'), distDir, { recursive: true });

  const swPath = path.join(distDir, 'sw.js');
  await writeFile(
    swPath,
    (await readFile(swPath, 'utf8')).replace("const VERSION = 'dev';", `const VERSION = '${Date.now().toString(36)}';`),
  );

  const indexPath = path.join(distDir, 'index.html');
  const html = (await readFile(indexPath, 'utf8'))
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    )
    .replace('</head>', `${preload}${PWA_HEAD}</head>`);
  await writeFile(indexPath, html);

  await precompress();
}

if (import.meta.main) {
  await buildPanel();
  console.log('Admin panel built into website/dist');
}
