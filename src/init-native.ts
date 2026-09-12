import path from 'path';
import fs from 'fs';

// Auto-wire N-API native library paths for Canvas (Skia) and GIFSX across platforms
if (!process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
  const isGnu = process.platform === 'linux' ? '-gnu' : '';
  const candidateNames = [
    `skia.${process.platform}-${process.arch}${isGnu}.node`,
    `skia.${process.platform}-${process.arch}.node`,
  ];
  const candidateDirs = [
    process.cwd(),
    path.join(process.cwd(), 'binaries'),
    path.dirname(process.execPath),
    path.join(process.cwd(), 'node_modules', `@napi-rs/canvas-${process.platform}-${process.arch}${isGnu}`),
  ];

  for (const dir of candidateDirs) {
    for (const name of candidateNames) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) {
        process.env.NAPI_RS_NATIVE_LIBRARY_PATH = fullPath;
        break;
      }
    }
    if (process.env.NAPI_RS_NATIVE_LIBRARY_PATH) break;
  }
}

// Auto-link native bindings into local node_modules if running from standalone bundle
try {
  const arch = process.arch;
  const platform = process.platform;
  const isGnu = platform === 'linux' ? '-gnu' : '';

  // 1. Canvas / Skia
  const skiaCandidate = path.join(process.cwd(), 'binaries', `skia.${platform}-${arch}${isGnu}.node`);
  const skiaModuleDir = path.join(process.cwd(), 'node_modules', '@napi-rs', `canvas-${platform}-${arch}${isGnu}`);
  if (fs.existsSync(skiaCandidate) && !fs.existsSync(skiaModuleDir)) {
    fs.mkdirSync(skiaModuleDir, { recursive: true });
    fs.copyFileSync(skiaCandidate, path.join(skiaModuleDir, `skia.${platform}-${arch}${isGnu}.node`));
    fs.writeFileSync(
      path.join(skiaModuleDir, 'index.js'),
      `module.exports = require('./skia.${platform}-${arch}${isGnu}.node');\n`
    );
  }

  // 2. Gifsx
  const gifsxCandidate = path.join(process.cwd(), 'binaries', `gifsx.${platform}-${arch}${isGnu}.node`);
  const gifsxModuleDir = path.join(process.cwd(), 'node_modules', '@gifsx', `gifsx-${platform}-${arch}${isGnu}`);
  if (fs.existsSync(gifsxCandidate) && !fs.existsSync(gifsxModuleDir)) {
    fs.mkdirSync(gifsxModuleDir, { recursive: true });
    fs.copyFileSync(gifsxCandidate, path.join(gifsxModuleDir, `gifsx.${platform}-${arch}${isGnu}.node`));
    fs.writeFileSync(
      path.join(gifsxModuleDir, 'index.js'),
      `module.exports = require('./gifsx.${platform}-${arch}${isGnu}.node');\n`
    );
  }
} catch {
  // Best-effort auto-linking; fail silently if read-only filesystem
}

// 3. PGlite WASM & Data Bundle Embedding for Standalone Binaries
let pgliteWasmPath: string | undefined;
let initdbWasmPath: string | undefined;
let pgliteDataPath: string | undefined;

try {
  // Relative require ensures Bun compiler bundles these assets into /$bunfs/root/
  // @ts-ignore
  pgliteWasmPath = require('../node_modules/@electric-sql/pglite/dist/pglite.wasm');
  // @ts-ignore
  initdbWasmPath = require('../node_modules/@electric-sql/pglite/dist/initdb.wasm');
  // @ts-ignore
  pgliteDataPath = require('../node_modules/@electric-sql/pglite/dist/pglite.data');
} catch {
  try {
    const pglitePkg = path.dirname(require.resolve('@electric-sql/pglite/package.json'));
    pgliteWasmPath = path.join(pglitePkg, 'dist', 'pglite.wasm');
    initdbWasmPath = path.join(pglitePkg, 'dist', 'initdb.wasm');
    pgliteDataPath = path.join(pglitePkg, 'dist', 'pglite.data');
  } catch {
    // Ignore fallback failure
  }
}

let pgliteWasmModule: WebAssembly.Module | undefined;
let initdbWasmModule: WebAssembly.Module | undefined;
let fsBundle: Blob | undefined;

function getPgliteAssets() {
  if (!pgliteWasmModule && pgliteWasmPath && initdbWasmPath && pgliteDataPath) {
    try {
      if (fs.existsSync(pgliteWasmPath)) {
        const pgliteWasmBytes = fs.readFileSync(pgliteWasmPath);
        pgliteWasmModule = new WebAssembly.Module(pgliteWasmBytes);
      }
      if (fs.existsSync(initdbWasmPath)) {
        const initdbWasmBytes = fs.readFileSync(initdbWasmPath);
        initdbWasmModule = new WebAssembly.Module(initdbWasmBytes);
      }
      if (fs.existsSync(pgliteDataPath)) {
        const pgliteDataBytes = fs.readFileSync(pgliteDataPath);
        fsBundle = new Blob([pgliteDataBytes]);
      }
    } catch (e) {
      console.warn('[db] Warning: Could not precompile embedded PGlite assets:', e);
    }
  }
  return { pgliteWasmModule, initdbWasmModule, fsBundle };
}

try {
  const { PGlite } = require('@electric-sql/pglite');
  const { DataBase } = require('@nationdex/db/dist/util/database');

  DataBase.prototype.connect = async function () {
    const folder = this.options?.memory ? undefined : (process.env.DATABASE_FOLDER ?? this.options?.folder ?? 'database');

    // Clean up stale postmaster.pid lock if previous run crashed or was terminated
    if (folder && typeof folder === 'string') {
      const pidPath = path.join(folder, 'postmaster.pid');
      if (fs.existsSync(pidPath)) {
        try {
          const pidStr = fs.readFileSync(pidPath, 'utf8').trim().split('\n')[0];
          const pid = parseInt(pidStr, 10);
          let isRunning = false;
          if (!isNaN(pid) && pid > 0) {
            try {
              process.kill(pid, 0);
              isRunning = true;
            } catch {
              isRunning = false;
            }
          }
          if (!isRunning) {
            fs.unlinkSync(pidPath);
            console.log('[db] Cleaned up stale postmaster.pid lock file.');
          }
        } catch {
          // ignore error removing pid file
        }
      }
    }

    const assets = getPgliteAssets();
    const pgliteOpts: any = {};
    if (assets.pgliteWasmModule) pgliteOpts.pgliteWasmModule = assets.pgliteWasmModule;
    if (assets.initdbWasmModule) pgliteOpts.initdbWasmModule = assets.initdbWasmModule;
    if (assets.fsBundle) pgliteOpts.fsBundle = assets.fsBundle;

    DataBase.pg = new PGlite(folder, pgliteOpts);
    await DataBase.pg.waitReady;
    await DataBase.pg.exec(`
      CREATE TABLE IF NOT EXISTS record (
        identifier TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        id TEXT,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        guild_id TEXT
      );
      CREATE TABLE IF NOT EXISTS cooldown (
        identifier TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        id TEXT,
        started_at TEXT NOT NULL,
        duration BIGINT NOT NULL
      );
    `);
    DataBase.emitter.emit('connect');
  };
} catch {
  // If @nationdex/db is not present or cannot be patched, fail silently
}

