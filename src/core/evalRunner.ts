import { NativeFunction } from '@tryforge/forgescript';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { createHash } from 'crypto';

const TIMEOUT_MS = 10_000;
const MAX_OUTPUT = 1_000_000;
const RUN_LIMIT = 5;
const RUN_WINDOW = 60_000;

const running = new Set<string>();
const runs = new Map<string, number[]>();

export interface EvalResult {
  ok: boolean;
  output: string;
}

export function workerPath(): string {
  return path.join(__dirname, 'eval-worker.js');
}

// One fresh process per run: no shared state between users, killed on timeout.
export function runInWorker(
  code: string,
  mode: 'js' | 'forge',
  context: { authorId: string; username: string; guildId: string | null; channelId: string | null },
): Promise<EvalResult> {
  return new Promise((resolve) => {
    const file = workerPath();
    if (!existsSync(file)) return resolve({ ok: false, output: 'Eval worker is not available in this build.' });
    const cwd = mkdtempSync(path.join(tmpdir(), 'ndx-eval-'));
    const done = (r: EvalResult) => {
      try {
        rmSync(cwd, { recursive: true, force: true });
      } catch {
        // best effort cleanup
      }
      resolve(r);
    };
    // empty environment: the bot token and every other secret stay in the parent process
    const child = spawn(process.execPath, [file], {
      cwd,
      env: { PATH: process.env.PATH ?? '' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGKILL');
      done({ ok: false, output: `Timed out after ${TIMEOUT_MS / 1000}s.` });
    }, TIMEOUT_MS);
    child.stdout.on('data', (d) => {
      out += d;
      if (out.length > MAX_OUTPUT && !finished) {
        finished = true;
        clearTimeout(timer);
        child.kill('SIGKILL');
        done({ ok: false, output: 'Output exceeded the size limit.' });
      }
    });
    child.on('error', (e) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      done({ ok: false, output: `Eval worker failed to start: ${e.message}` });
    });
    child.on('close', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        done(JSON.parse(out));
      } catch {
        done({ ok: false, output: 'Eval worker returned no result.' });
      }
    });
    child.stdin.end(JSON.stringify({ code, mode, context }));
  });
}

function runLimited(user: string): boolean {
  const now = Date.now();
  const recent = (runs.get(user) ?? []).filter((t) => now - t < RUN_WINDOW);
  if (recent.length >= RUN_LIMIT) {
    runs.set(user, recent);
    return false;
  }
  recent.push(now);
  runs.set(user, recent);
  return true;
}

export const evalFunctions = [
  new NativeFunction({
    name: '$evalPrefixCode',
    version: '2.0.0',
    description: 'Runs the code of the prefix command in the isolated eval worker, replies with the result and returns an audit line. Permission checks happen in the command (hasCap, accessEvalAllowed)',
    unwrap: false,
    brackets: false,
    args: [],
    async execute(ctx) {
      const authorId = ctx.user?.id;
      const message = ctx.message;
      if (!authorId || !message) return this.stop();

      const guildId = message.guild?.id ?? null;
      const channelId = message.channel?.id ?? null;

      let rawContent = '';
      const full = message.content || '';
      try {
        const prefix = await (ctx.client as any).getPrefix(message);
        let afterPrefix = full;
        if (prefix && full.startsWith(prefix)) afterPrefix = full.slice(prefix.length).trim();
        rawContent = afterPrefix.replace(/^(eval|ev)\b/i, '').trim();
      } catch {
        rawContent = (ctx.args || []).join(' ').trim();
      }

      if (!rawContent) {
        await message.reply('**Usage**: `n.eval <code>` or `n.eval js: <code>`');
        return this.success('');
      }

      let code = rawContent;
      let isExplicitJs = false;
      if (code.startsWith('```') && code.endsWith('```')) {
        const match = code.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*)\n?```$/);
        if (match) {
          if (['js', 'javascript', 'ts', 'typescript'].includes((match[1] || '').toLowerCase())) isExplicitJs = true;
          code = match[2];
        } else {
          code = code.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
        }
      }
      const isJs = isExplicitJs || code.toLowerCase().startsWith('js:');
      const actualCode = isJs && code.toLowerCase().startsWith('js:') ? code.slice(3).trim() : code;

      if (running.has(authorId)) {
        await message.reply('An eval is already running for you.');
        return this.success('');
      }
      if (!runLimited(authorId)) {
        await message.reply('You are running eval too quickly. Wait a minute.');
        return this.success('');
      }

      running.add(authorId);
      const started = performance.now();
      let result: EvalResult;
      try {
        result = await runInWorker(actualCode, isJs ? 'js' : 'forge', {
          authorId,
          username: message.author?.username ?? 'unknown',
          guildId,
          channelId,
        });
      } finally {
        running.delete(authorId);
      }
      const elapsed = (performance.now() - started).toFixed(2);

      const detail = `${isJs ? 'js' : 'forge'} sha256:${createHash('sha256').update(actualCode).digest('hex').slice(0, 16)} ${elapsed}ms ${result.ok ? 'ok' : 'error'} in ${guildId ?? 'dm'}/${channelId ?? ''}`;

      if (!result.ok) {
        await message.reply({ content: `**Eval Error** (\`${elapsed}ms\`):\n\`\`\`\n${result.output.slice(0, 1900)}\n\`\`\`` });
        return this.success(detail);
      }
      const display = result.output === '' ? '[No output / return value]' : result.output;
      if (display.length > 1900) {
        await message.reply({
          content: `**Eval Result** (\`${elapsed}ms\`):\nOutput exceeded 2,000 characters, sent as file.`,
          files: [{ attachment: Buffer.from(display, 'utf-8'), name: 'eval_result.txt' }],
        });
      } else {
        await message.reply({ content: `**Eval Result** (\`${elapsed}ms\`):\n\`\`\`${isJs ? 'js' : ''}\n${display}\n\`\`\`` });
      }
      return this.success(detail);
    },
  }),
];
