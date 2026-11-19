import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, renameSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const targets: Record<string, string> = {
  'linux-x64': 'linux-x64-gnu',
  'linux-arm64': 'linux-arm64-gnu',
  'windows-x64': 'win32-x64-msvc',
  'darwin-arm64': 'darwin-arm64',
  'darwin-x64': 'darwin-x64',
  'android-arm64': 'android-arm64',
};

const [target, compression] = process.argv.slice(2);
if (!target || !Object.prototype.hasOwnProperty.call(targets, target) || (compression && compression !== '--zstd')) {
  throw new Error('Usage: bun src/scripts/build-binary.ts <target> [--zstd]');
}
const windows = target.startsWith('windows-');
if (windows && compression) throw new Error('Windows artifacts use ZIP.');

function run(args: string[], cwd = process.cwd()) {
  const result = spawnSync(args[0], args.slice(1), { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${args[0]} failed (${result.status})`);
}

const outputDir = resolve(process.env.NATIONDEX_BINARY_DIR || 'binaries');
mkdirSync(outputDir, { recursive: true });
const stage = mkdtempSync(join(outputDir, '.build-'));
try {
  const abi = targets[target];
  const name = `nationdex-bot-${target}`;
  const executable = name + (windows ? '.exe' : '');
  const bindings = [
    ['@napi-rs', 'canvas', 'skia'],
    ['@gifsx', 'gifsx', 'gifsx'],
  ];
  let installedBytes = 0;
  for (const [scope, pkg, binding] of bindings) {
    const relative = join('node_modules', scope, `${pkg}-${abi}`);
    const file = `${binding}.${abi}.node`;
    mkdirSync(join(stage, relative), { recursive: true });
    try {
      for (const member of ['package.json', file]) {
        copyFileSync(join(process.env.NATIONDEX_NATIVE_ROOT || '.', relative, member), join(stage, relative, member));
        installedBytes += statSync(join(stage, relative, member)).size;
      }
    } catch {
      throw new Error(`Install the locked native package ${scope}/${pkg}-${abi} before building ${target}.`);
    }
  }

  run(['bun', 'run', 'bundle:prep']);
  run(['bun', 'build', 'src/index.ts', '--compile', `--target=bun-${target}`,
    '--external', '@napi-rs/canvas-*', '--external', '@gifsx/gifsx-*',
    '--outfile', join(stage, executable)]);
  installedBytes += statSync(join(stage, executable)).size;

  const archive = name + (windows ? '.zip' : compression ? '.tar.zst' : '.tar.gz');
  if (windows) run(['zip', '-9', '-q', '-r', archive, executable, 'node_modules'], stage);
  else run(['tar', compression ? '--zstd' : '-z', '-cf', archive, executable, 'node_modules'], stage);
  const output = join(outputDir, archive);
  const hash = createHash('sha256').update(readFileSync(join(stage, archive))).digest('hex');
  writeFileSync(join(stage, 'checksum'), hash + '  ' + archive + '\n');
  renameSync(join(stage, archive), output);
  renameSync(join(stage, 'checksum'), output + '.sha256');
  console.log(`${archive}: ${statSync(output).size} download bytes, ${installedBytes} installed bytes`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
