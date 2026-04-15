/**
 * Nationdex logger
 *
 * - INFO  → stdout  (compose/podman logs capture this)
 * - WARN  → stderr  (compose/podman logs capture this)
 * - ERROR → stderr  + logs/errors.log
 * - CRITICAL → stderr (with banner) + logs/errors.log + process.exitCode hint
 *
 * Console output is colorized when attached to a real TTY (dev terminal).
 * Log files and compose/docker logs always receive plain text.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'nationdex.log');
const ERR_FILE = join(LOG_DIR, 'errors.log');

mkdirSync(LOG_DIR, { recursive: true });

const SESSION_HEADER =
  `\n${'─'.repeat(80)}\n` +
  `[${new Date().toISOString()}] [SESSION START] PID ${process.pid}\n` +
  `${'─'.repeat(80)}\n`;

try {
  appendFileSync(LOG_FILE, SESSION_HEADER);
  appendFileSync(ERR_FILE, SESSION_HEADER);
} catch {
  // non-fatal — can't log the logger failing
}

// ── ANSI helpers (only when writing to a real TTY) ────────────────────────────

const TTY_OUT = process.stdout.isTTY === true;
const TTY_ERR = process.stderr.isTTY === true;

const A = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  bgRed:   '\x1b[41;1m',
} as const;

function color(tty: boolean, ...codes: string[]): string {
  return tty ? codes.join('') : '';
}

// ── Level config ──────────────────────────────────────────────────────────────

type Level = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

const LEVEL_META: Record<Level, { toStderr: boolean; label: string }> = {
  INFO:     { toStderr: false, label: 'INFO    ' },
  WARN:     { toStderr: true,  label: 'WARN    ' },
  ERROR:    { toStderr: true,  label: 'ERROR   ' },
  CRITICAL: { toStderr: true,  label: 'CRITICAL' },
};

// ── Core write function ───────────────────────────────────────────────────────

function formatErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    const lines = (error.stack ?? error.message).split('\n');
    return '\n' + lines.map((l) => `    ${l}`).join('\n');
  }
  if (error !== undefined) return `\n    ${String(error)}`;
  return '';
}

function write(level: Level, message: string, error?: unknown): void {
  const { toStderr, label } = LEVEL_META[level];
  const tty = toStderr ? TTY_ERR : TTY_OUT;
  const ts = new Date().toISOString();
  const detail = formatErrorDetail(error);

  // ── Plain line (for files, compose logs, non-TTY) ─────────────────────────
  const plain = `[${ts}] [${label}] ${message}${detail}`;

  // ── Colored line (for interactive terminals only) ─────────────────────────
  let levelTag: string;
  if (tty) {
    if (level === 'INFO')     levelTag = `${color(tty, A.cyan)}[${label}]${color(tty, A.reset)}`;
    else if (level === 'WARN') levelTag = `${color(tty, A.yellow)}[${label}]${color(tty, A.reset)}`;
    else if (level === 'ERROR') levelTag = `${color(tty, A.red)}[${label}]${color(tty, A.reset)}`;
    else                       levelTag = `${color(tty, A.bgRed)}[${label}]${color(tty, A.reset)}`;
  } else {
    levelTag = `[${label}]`;
  }

  const tsStr = tty ? `${color(tty, A.dim)}[${ts}]${color(tty, A.reset)}` : `[${ts}]`;
  const colored = `${tsStr} ${levelTag} ${message}${detail}`;

  // ── Console output ────────────────────────────────────────────────────────
  const stream = toStderr ? process.stderr : process.stdout;

  if (level === 'CRITICAL') {
    const bar = tty
      ? `${color(tty, A.bgRed)}${'!'.repeat(80)}${color(tty, A.reset)}`
      : `${'!'.repeat(80)}`;
    stream.write(`${bar}\n${colored}\n${bar}\n`);
  } else {
    stream.write(`${colored}\n`);
  }

  // ── File output (always plain, sync so nothing is lost on crash) ──────────
  try {
    appendFileSync(LOG_FILE, `${plain}\n`);
    if (level === 'ERROR' || level === 'CRITICAL') {
      const errBar = level === 'CRITICAL' ? `${'!'.repeat(80)}\n` : '';
      appendFileSync(ERR_FILE, `${errBar}${plain}\n${errBar}`);
    }
  } catch {
    // Don't let a logging failure take down the process
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const logger = {
  /** General informational messages — written to stdout. */
  info: (message: string) => write('INFO', message),

  /** Non-fatal warnings — written to stderr. */
  warn: (message: string, error?: unknown) => write('WARN', message, error),

  /** Recoverable errors — written to stderr and errors.log. */
  error: (message: string, error?: unknown) => write('ERROR', message, error),

  /**
   * Critical / unrecoverable errors — written to stderr with a banner and
   * errors.log. Callers should call `process.exit(1)` after this when the
   * error is truly fatal.
   */
  critical: (message: string, error?: unknown) => write('CRITICAL', message, error),
};
