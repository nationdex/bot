/**
 * Package loader
 */
import { config } from '../../config';
import type { Command, Package } from '../types';
import infoPackage from './info';
import nationsPackage from './nations';
import promocodesPackage from './promocodes';

// ── Registry ──────────────────────────────────────────────────────────────────
const PACKAGE_REGISTRY: Record<string, Package> = {
  'nationdex.packages.info': infoPackage,
  'nationdex.packages.nations': nationsPackage,
  'nationdex.packages.promocodes': promocodesPackage,
};

// ── Resolution ────────────────────────────────────────────────────────────────
export const packages: Package[] = config.packages.map((name: string) => {
  const pkg = PACKAGE_REGISTRY[name];
  if (!pkg) {
    throw new Error(
      `[packages] Unknown package "${name}" in config.packages.\n` +
        `  Available: ${Object.keys(PACKAGE_REGISTRY).join(', ')}`
    );
  }
  return pkg;
});

export const allCommands: Command[] = packages.flatMap((pkg) => pkg.commands);
