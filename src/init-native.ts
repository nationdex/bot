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
