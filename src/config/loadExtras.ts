import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { ForgeDB } from '@tryforge/forge.db';
import type { ForgeClient } from '@tryforge/forgescript';
import type { NationDexExtra } from './extra';

const SUBDIRS = ['functions', 'commands', 'slash'] as const;
const EXTRA_CACHE = path.join(process.cwd(), 'extra');

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeGitLocation(location: string): string {
  return location.replace(/^git\+/, '');
}

function isLocalLocation(location: string): boolean {
  return (
    location.startsWith('./') ||
    location.startsWith('../') ||
    path.isAbsolute(location) ||
    !/^https?:\/\//.test(normalizeGitLocation(location))
  );
}

function cloneExtra(extra: NationDexExtra, targetDir: string) {
  const location = normalizeGitLocation(extra.location);
  const refArgs = extra.ref ? `--branch ${extra.ref}` : '';
  execSync(`git clone --depth 1 ${refArgs} ${location} "${targetDir}"`, {
    stdio: 'inherit',
  });
}

function materializeExtra(extra: NationDexExtra): string | null {
  const localRoot = isLocalLocation(extra.location)
    ? path.resolve(process.cwd(), extra.location)
    : path.join(EXTRA_CACHE, slugify(extra.name) || 'extra');

  if (isLocalLocation(extra.location)) {
    if (!fs.existsSync(localRoot)) {
      console.warn(`[extras] Skipping "${extra.name}": local path not found (${extra.location})`);
      return null;
    }
    return path.join(localRoot, extra.path);
  }

  fs.mkdirSync(EXTRA_CACHE, { recursive: true });

  if (!fs.existsSync(localRoot)) {
    try {
      console.log(`[extras] Fetching "${extra.name}" from ${extra.location}`);
      cloneExtra(extra, localRoot);
    } catch (error) {
      console.warn(`[extras] Failed to fetch "${extra.name}" from ${extra.location}`);
      if (error instanceof Error) {
        console.warn(error.message);
      }
      return null;
    }
  }

  return path.join(localRoot, extra.path);
}

function resolveModuleRoot(extraRoot: string): string {
  const distRoot = path.join(extraRoot, 'dist');
  if (SUBDIRS.some((subdir) => fs.existsSync(path.join(distRoot, subdir)))) {
    return distRoot;
  }
  return extraRoot;
}

function mergeVariables(
  base: Record<string, unknown>,
  extra: Record<string, unknown>,
  extraName: string
) {
  for (const [key, value] of Object.entries(extra)) {
    if (key in base) {
      console.warn(
        `[extras] "${extraName}" skipped variables key "${key}" (already defined in core)`
      );
      continue;
    }
    base[key] = value;
  }
}

function stageSlashCommands(extraRoot: string, extraName: string, slashRoot: string) {
  const extraSlash = path.join(extraRoot, 'slash');
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

function loadExtraModules(client: ForgeClient, extraRoot: string, extraName: string) {
  const moduleRoot = resolveModuleRoot(extraRoot);
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

    const extraRoot = materializeExtra(extra);
    if (!extraRoot || !fs.existsSync(extraRoot)) {
      continue;
    }

    const moduleRoot = resolveModuleRoot(extraRoot);
    const variablesPath = path.join(moduleRoot, 'variables.json');
    if (!fs.existsSync(variablesPath)) {
      continue;
    }

    const extraVariables = JSON.parse(fs.readFileSync(variablesPath, 'utf-8')) as Record<
      string,
      unknown
    >;
    mergeVariables(merged, extraVariables, extra.name);
  }

  db.variables(merged);
}

export function loadExtras(client: ForgeClient, extras: NationDexExtra[]) {
  const enabled = extras.filter((extra) => extra.enabled);
  if (enabled.length === 0) {
    return;
  }

  for (const extra of enabled) {
    const extraRoot = materializeExtra(extra);
    if (!extraRoot || !fs.existsSync(extraRoot)) {
      console.warn(`[extras] Skipping "${extra.name}": entry path not found (${extra.path})`);
      continue;
    }

    loadExtraModules(client, extraRoot, extra.name);
    console.log(`[extras] Loaded "${extra.name}" from ${extraRoot}`);
  }
}
