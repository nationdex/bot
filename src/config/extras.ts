import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { ForgeDB } from '@tryforge/forge.db';
import type { ForgeClient } from '@tryforge/forgescript';
import type { NationDexExtra } from './extra';

const SUBDIRS = ['functions', 'commands', 'slash'] as const;
const EXTRA_DIR = path.join(process.cwd(), 'extra');

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isLocalLocation(location: string): boolean {
  return (
    location.startsWith('./') ||
    location.startsWith('../') ||
    location.startsWith('file:') ||
    path.isAbsolute(location)
  );
}

function findPackageRoot(installDir: string): string | null {
  const nodeModules = path.join(installDir, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    return null;
  }

  for (const entry of fs.readdirSync(nodeModules)) {
    if (entry.startsWith('.')) {
      continue;
    }
    if (entry.startsWith('@')) {
      const scopeDir = path.join(nodeModules, entry);
      for (const pkg of fs.readdirSync(scopeDir)) {
        if (!pkg.startsWith('.')) {
          return path.join(scopeDir, pkg);
        }
      }
      continue;
    }
    return path.join(nodeModules, entry);
  }

  return null;
}

function resolveModuleRoot(root: string): string {
  const distRoot = path.join(root, 'dist');
  if (SUBDIRS.some((subdir) => fs.existsSync(path.join(distRoot, subdir)))) {
    return distRoot;
  }
  return root;
}

function resolveExtraRoot(extra: NationDexExtra): string | null {
  const entry = extra.path ?? '';

  if (isLocalLocation(extra.location)) {
    const localRoot = path.resolve(
      process.cwd(),
      extra.location.replace(/^file:/, '')
    );
    if (!fs.existsSync(localRoot)) {
      console.warn(`[extras] Skipping "${extra.name}": local path not found (${extra.location})`);
      return null;
    }
    return path.join(localRoot, entry);
  }

  const installDir = path.join(EXTRA_DIR, slugify(extra.name) || 'extra');
  const packageRoot = findPackageRoot(installDir);
  if (!packageRoot) {
    return null;
  }

  return path.join(packageRoot, entry);
}

function npmInstall(extra: NationDexExtra, installDir: string) {
  fs.mkdirSync(installDir, { recursive: true });
  console.log(`[extras] Installing "${extra.name}" (${extra.location})`);
  execSync(
    `npm install "${extra.location}" --prefix "${installDir}" --no-save --no-package-lock --ignore-scripts`,
    { stdio: 'inherit' }
  );
}

export function installExtras(extras: NationDexExtra[]) {
  fs.mkdirSync(EXTRA_DIR, { recursive: true });

  for (const extra of extras) {
    if (!extra.enabled || isLocalLocation(extra.location)) {
      continue;
    }

    const installDir = path.join(EXTRA_DIR, slugify(extra.name) || 'extra');
    if (findPackageRoot(installDir)) {
      continue;
    }

    try {
      npmInstall(extra, installDir);
    } catch (error) {
      console.warn(`[extras] Failed to install "${extra.name}" (${extra.location})`);
      if (error instanceof Error) {
        console.warn(error.message);
      }
    }
  }
}

function stageSlashCommands(moduleRoot: string, extraName: string, slashRoot: string) {
  const extraSlash = path.join(moduleRoot, 'slash');
  if (!fs.existsSync(extraSlash)) {
    return;
  }

  for (const entry of fs.readdirSync(extraSlash)) {
    const source = path.join(extraSlash, entry);
    const target = path.join(slashRoot, entry);

    if (fs.existsSync(target)) {
      console.warn(
        `[extras] "${extraName}" skipped slash entry "${entry}" (conflicts with core or another extra)`
      );
      continue;
    }

    fs.cpSync(source, target, { recursive: true });
  }
}

function loadExtraModules(client: ForgeClient, moduleRoot: string, extraName: string) {
  const slashRoot = path.join(process.cwd(), 'dist/slash');

  for (const subdir of SUBDIRS) {
    const subdirPath = path.join(moduleRoot, subdir);
    if (!fs.existsSync(subdirPath)) {
      continue;
    }

    if (subdir === 'slash') {
      stageSlashCommands(moduleRoot, extraName, slashRoot);
    } else if (subdir === 'functions') {
      client.functions.load(subdirPath);
    } else {
      client.commands.load(subdirPath);
    }
  }
}

export function loadExtraVariables(
  db: ForgeDB,
  extras: NationDexExtra[],
  baseVariables: Record<string, unknown>
) {
  const merged = { ...baseVariables };

  for (const extra of extras) {
    if (!extra.enabled) {
      continue;
    }

    const extraRoot = resolveExtraRoot(extra);
    if (!extraRoot || !fs.existsSync(extraRoot)) {
      continue;
    }

    const variablesPath = path.join(resolveModuleRoot(extraRoot), 'variables.json');
    if (!fs.existsSync(variablesPath)) {
      continue;
    }

    const extraVariables = JSON.parse(fs.readFileSync(variablesPath, 'utf-8')) as Record<
      string,
      unknown
    >;

    for (const [key, value] of Object.entries(extraVariables)) {
      if (key in merged) {
        console.warn(
          `[extras] "${extra.name}" skipped variables key "${key}" (already defined in core)`
        );
        continue;
      }
      merged[key] = value;
    }
  }

  db.variables(merged);
}

export function loadExtras(client: ForgeClient, extras: NationDexExtra[]) {
  for (const extra of extras) {
    if (!extra.enabled) {
      continue;
    }

    const extraRoot = resolveExtraRoot(extra);
    if (!extraRoot || !fs.existsSync(extraRoot)) {
      console.warn(`[extras] Skipping "${extra.name}": package entry not found`);
      continue;
    }

    loadExtraModules(client, resolveModuleRoot(extraRoot), extra.name);
    console.log(`[extras] Loaded "${extra.name}" from ${extraRoot}`);
  }
}

if (require.main === module) {
  const { extras } = require('./extra') as { extras: NationDexExtra[] };
  installExtras(extras);
}
