/**
 * Nationdex logger
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'nationdex.log');

// Ensure the logs directory exists
mkdirSync(LOG_DIR, { recursive: true });

// Write a session separator so multiple restarts are clearly delimited in the log
try {
  appendFileSync(
    LOG_FILE,
    `\n${'─'.repeat(80)}\n[${new Date().toISOString()}] [SESSION START] PID ${process.pid}\n${'─'.repeat(80)}\n`
  );
} catch {
  // non-fatal
}

type Level = 'INFO' | 'WARN' | 'ERROR';

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: Level, message: string, error?: unknown): void {
  const errorDetail =
    error instanceof Error
      ? `\n  ${error.stack ?? error.message}`
      : error !== undefined
        ? `\n  ${String(error)}`
        : '';

  const line = `[${timestamp()}] [${level}] ${message}${errorDetail}`;

  // Console output
  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }

  // File output — sync write so nothing is lost on crash
  try {
    appendFileSync(LOG_FILE, `${line}\n`);
  } catch {
    // Don't let a logging failure take down the process
  }
}

export const logger = {
  info: (message: string) => write('INFO', message),
  warn: (message: string, error?: unknown) => write('WARN', message, error),
  error: (message: string, error?: unknown) => write('ERROR', message, error),
};
