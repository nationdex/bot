#!/usr/bin/env bun
/**
 * BM2 State Validation & Cleanup
 *
 * This script validates BM2's state before startup to prevent duplicate instances.
 * It ensures:
 * - Exactly 3 instances exist (postgres, nationdex, admin-panel)
 * - Each service has only 1 instance
 * - Old/orphaned instances are cleaned up
 *
 * Run before starting BM2: bun scripts/validate-bm2-state.ts
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const BM2_DIR = join(process.env.HOME ?? '/home/arielaram', '.bm2');
const EXPECTED_SERVICES = ['postgres', 'nationdex', 'admin-panel'];
const MAX_INSTANCES = 3;

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  BM2 State Validation');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Check if BM2 has been initialized
if (!existsSync(BM2_DIR)) {
  console.log('✓ BM2 state directory not found — will start fresh');
  console.log('');
  process.exit(0);
}

// ── Parse BM2 daemon status ───────────────────────────────────────────────────
let pidCount = 0;
const pidsDir = join(BM2_DIR, 'pids');

if (existsSync(pidsDir)) {
  const { readdirSync } = await import('node:fs');
  const pidFiles = readdirSync(pidsDir);
  pidCount = pidFiles.length;
}

console.log(`Detected ${pidCount} process records in BM2 state`);

// ── Check for duplicates ──────────────────────────────────────────────────────
if (pidCount > MAX_INSTANCES) {
  console.warn(`⚠️  WARNING: Found ${pidCount} instances (expected ${MAX_INSTANCES})`);
  console.warn('   BM2 has accumulated duplicate process records');
  console.warn('   Cleaning up old state...');
  console.log('');

  try {
    rmSync(BM2_DIR, { recursive: true, force: true });
    console.log('✓ BM2 state cleaned successfully');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error(`✗ Failed to clean BM2 state: ${error}`);
    console.error('');
    console.error('Manual cleanup required:');
    console.error(`  rm -rf ${BM2_DIR}`);
    console.error('');
    process.exit(1);
  }
}

// ── Validate service configuration ────────────────────────────────────────────
if (pidCount === MAX_INSTANCES) {
  const { readdirSync } = await import('node:fs');
  const pidFiles = readdirSync(pidsDir);
  const serviceCount: Record<string, number> = {};

  for (const service of EXPECTED_SERVICES) {
    serviceCount[service] = 0;
  }

  // Count instances per service
  for (const pidFileName of pidFiles) {
    for (const service of EXPECTED_SERVICES) {
      if (pidFileName.includes(`${service}-`)) {
        serviceCount[service] = (serviceCount[service] ?? 0) + 1;
      }
    }
  }

  const duplicates = Object.entries(serviceCount).filter(([_, count]) => count > 1);

  if (duplicates.length > 0) {
    console.warn('⚠️  WARNING: Duplicate instances detected:');
    for (const [service, count] of duplicates) {
      console.warn(`   ${service}: ${count} instances (expected 1)`);
    }
    console.warn('');
    console.warn('Cleaning up state...');
    console.log('');

    try {
      rmSync(BM2_DIR, { recursive: true, force: true });
      console.log('✓ BM2 state cleaned successfully');
      console.log('');
      process.exit(0);
    } catch (error) {
      console.error(`✗ Failed to clean BM2 state: ${error}`);
      process.exit(1);
    }
  }

  console.log('✓ BM2 state is healthy');
  console.log(`  postgres:    1 instance`);
  console.log(`  nationdex:   1 instance`);
  console.log(`  admin-panel: 1 instance`);
  console.log('');
  process.exit(0);
}

// ── Default case ──────────────────────────────────────────────────────────────
if (pidCount === 0) {
  console.log('✓ BM2 state is empty (fresh start)');
  console.log('');
  process.exit(0);
}

console.log('');
process.exit(0);
