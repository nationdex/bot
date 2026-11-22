import path from 'path';
import fs from 'fs';

// Auto-wire N-API native library paths for Canvas (Skia) and GIFSX across platforms
if (!process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
  const isGnu = process.platform === 'linux' ? '-gnu' : '';
  const isMsvc = process.platform === 'win32' ? '-msvc' : '';
  const abi = isGnu || isMsvc;
  const candidateNames = [
    `skia.${process.platform}-${process.arch}${abi}.node`,
    `skia.${process.platform}-${process.arch}.node`,
    `skia.node`,
  ];
  const candidateDirs = [
    process.cwd(),
    path.join(process.cwd(), 'binaries'),
    path.dirname(process.execPath),
    path.join(process.cwd(), 'node_modules', `@napi-rs/canvas-${process.platform}-${process.arch}${abi}`),
    path.join(process.cwd(), 'node_modules', `@napi-rs/canvas-${process.platform}-${process.arch}`),
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
  const abi = platform === 'linux' ? '-gnu' : (platform === 'win32' ? '-msvc' : '');

  const findCandidate = (baseName: string) => {
    const locations = [
      path.join(process.cwd(), 'binaries', baseName),
      path.join(path.dirname(process.execPath), baseName),
      path.join(process.cwd(), baseName),
    ];
    return locations.find(loc => fs.existsSync(loc));
  };

  // 1. Canvas / Skia
  const skiaCandidate = findCandidate(`skia.${platform}-${arch}${abi}.node`);
  const skiaModuleDir = path.join(process.cwd(), 'node_modules', '@napi-rs', `canvas-${platform}-${arch}${abi}`);
  if (skiaCandidate && !fs.existsSync(skiaModuleDir)) {
    fs.mkdirSync(skiaModuleDir, { recursive: true });
    fs.copyFileSync(skiaCandidate, path.join(skiaModuleDir, `skia.${platform}-${arch}${abi}.node`));
    fs.writeFileSync(
      path.join(skiaModuleDir, 'index.js'),
      `module.exports = require('./skia.${platform}-${arch}${abi}.node');\n`
    );
  }

  // 2. Gifsx
  const gifsxCandidate = findCandidate(`gifsx.${platform}-${arch}${abi}.node`);
  const gifsxModuleDir = path.join(process.cwd(), 'node_modules', '@gifsx', `gifsx-${platform}-${arch}${abi}`);
  if (gifsxCandidate && !fs.existsSync(gifsxModuleDir)) {
    fs.mkdirSync(gifsxModuleDir, { recursive: true });
    fs.copyFileSync(gifsxCandidate, path.join(gifsxModuleDir, `gifsx.${platform}-${arch}${abi}.node`));
    fs.writeFileSync(
      path.join(gifsxModuleDir, 'index.js'),
      `module.exports = require('./gifsx.${platform}-${arch}${abi}.node');\n`
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
  pgliteWasmPath = require('../../../node_modules/@electric-sql/pglite/dist/pglite.wasm');
  // @ts-ignore
  initdbWasmPath = require('../../../node_modules/@electric-sql/pglite/dist/initdb.wasm');
  // @ts-ignore
  pgliteDataPath = require('../../../node_modules/@electric-sql/pglite/dist/pglite.data');
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
  const { DataBase } = require('@nationdex/db/database');

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
      -- mirrors the @nationdex/db suggestion schema, since this patch replaces its connect()
      CREATE TABLE IF NOT EXISTS suggestion (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        submitter_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        fields JSONB NOT NULL,
        image_url TEXT,
        alt_image_url TEXT,
        message_id TEXT,
        channel_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS suggestion_vote (
        suggestion_id INTEGER NOT NULL REFERENCES suggestion(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        PRIMARY KEY (suggestion_id, user_id)
      );
    `);
    // an earlier suggestion system used a different type name for nations and capitalised classes
    await DataBase.pg.exec(`
      UPDATE suggestion SET type = 'nation' WHERE type NOT IN ('nation', 'feature');
      UPDATE suggestion SET fields = jsonb_set(fields, '{class}', to_jsonb(lower(fields->>'class')))
        WHERE type = 'nation' AND fields ? 'class' AND fields->>'class' <> lower(fields->>'class');
    `);
    DataBase.emitter.emit('connect');
  };
} catch {
  // If @nationdex/db is not present or cannot be patched, fail silently
}

// 4. ForgeCanvas / @napi-rs/canvas roundRect radius normalization
// When ForgeScript parses optional rest args without values, radius is passed as [].
// @napi-rs/canvas 1.0.13+ strictly validates 1 to 4 radii and throws RangeError if [] is passed.
try {
  const canvasMod = require('@napi-rs/canvas');
  const dummyCtx = canvasMod.createCanvas?.(1, 1)?.getContext('2d');
  const ctxProto = dummyCtx ? Object.getPrototypeOf(dummyCtx) : null;
  if (ctxProto && typeof ctxProto.roundRect === 'function') {
    const origRoundRect = ctxProto.roundRect;
    ctxProto.roundRect = function (x: number, y: number, w: number, h: number, radii?: any) {
      if (!radii || (Array.isArray(radii) && radii.length === 0)) {
        return origRoundRect.call(this, x, y, w, h, 0);
      }
      return origRoundRect.call(this, x, y, w, h, radii);
    };
  }
} catch (e) {
  console.warn('[canvas] Warning: Failed to patch CanvasRenderingContext2D.prototype.roundRect:', e);
}

try {
  const { CanvasBuilder } = require('@tryforge/forge.canvas');
  if (CanvasBuilder?.prototype) {
    const origDrawImage = CanvasBuilder.prototype.drawImage;
    CanvasBuilder.prototype.drawImage = function (
      manager: any,
      image: any,
      x: number,
      y: number,
      width?: number,
      height?: number,
      radius?: any,
      ...rest: any[]
    ) {
      if (Array.isArray(radius) && radius.length === 0) {
        radius = 0;
      }
      return origDrawImage.call(this, manager, image, x, y, width, height, radius, ...rest);
    };

    const origRect = CanvasBuilder.prototype.rect;
    CanvasBuilder.prototype.rect = function (
      type: any,
      x: number,
      y: number,
      width?: number,
      height?: number,
      radius?: any
    ) {
      if (Array.isArray(radius) && radius.length === 0) {
        radius = 0;
      }
      return origRect.call(this, type, x, y, width, height, radius);
    };
  }
} catch (e) {
  console.warn('[canvas] Warning: Failed to patch CanvasBuilder prototype:', e);
}

