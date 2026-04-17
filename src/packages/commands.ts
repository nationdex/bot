/**
 * Package loader
 */
import type { Package } from '../types';
import path from "node:path";
import infoPackage from './info';
import nationsPackage from './nations';
import promocodesPackage from './promocodes';
import { existsSync } from 'node:fs';
import { getEnabledPackages } from './package';
import { pathToFileURL } from 'bun';

export const DEFAULT_PACKAGES: Record<string, Package> = {
  'info': infoPackage,
  'nations': nationsPackage,
  'codes': promocodesPackage,
}

export async function discoverCommands(): Promise<Package[]> {
  const packages: Package[] = [];

  const basePath = path.join(process.cwd(), "node_modules");

  for (const packageName of getEnabledPackages().keys()) {
    const packagePath = path.join(basePath, packageName, "commands", "index.ts");

    if (!existsSync(packagePath)) continue;

    const module = await import(pathToFileURL(packagePath).href);

    if (!module || !module.default) continue;

    packages.push(module.default);
  }

  return packages;
}

/**
 * Gets default packages and 3rd party packages.
 * 
 * @returns {Promise<Package[]>} She promised to stay with me forever... I just returned a list of packages. 
 */
export async function getCommands(): Promise<Package[]> {
  const extraPackages = await discoverCommands();

  return [...Object.values(DEFAULT_PACKAGES), ...extraPackages];
};

/**
 * Gets only default packages
 */
export async function getDefaultCommands(): Promise<Package[]> {
  return Object.values(DEFAULT_PACKAGES);
}

/**
 * Gets only 3rd party packages.
 */
export async function getExtraCommands(): Promise<Package[]> {
  return await discoverCommands();
}
