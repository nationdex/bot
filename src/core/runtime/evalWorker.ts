// Runs one eval request in a separate process with an empty environment and no live Discord/DB handles.
// This is not an OS sandbox: eval retains the service user’s filesystem, network and process privileges.
import { inspect } from 'util';

interface Request {
  code: string;
  mode: 'js' | 'forge';
  context: { authorId: string; username: string; guildId: string | null; channelId: string | null };
}

interface Reply {
  ok: boolean;
  output: string;
}

async function runJs(code: string, context: Request['context']): Promise<string> {
  (globalThis as any).require = require;
  (globalThis as any).ctx = context;
  let output: unknown;
  try {
    output = await (0, eval)(code);
  } catch (e: any) {
    if (e instanceof SyntaxError && /await|return/.test(e.message)) {
      output = await (0, eval)(`(async () => {\n${code}\n})()`);
    } else {
      throw e;
    }
  }
  return typeof output === 'string' ? output : inspect(output, { depth: 2, maxArrayLength: 50 });
}

async function runForge(code: string, context: Request['context']): Promise<string> {
  const { FunctionManager, Compiler, Interpreter, Context } = require('@tryforge/forgescript');
  FunctionManager.loadNative();
  // functions that need Discord have nothing to talk to here and report an error
  const client: any = new Proxy({ options: {}, users: { cache: new Map() } }, { get: (t: any, k) => t[k] });
  const user = { id: context.authorId, username: context.username, bot: false };
  const ctx = new Context({
    client,
    data: Compiler.compile(code),
    obj: { author: user, user, guildId: context.guildId, channelId: context.channelId },
    doNotSend: true,
    allowTopLevelReturn: true,
    environment: {},
    keywords: {},
  });
  const res = await Interpreter.run(ctx);
  return res === null || res === undefined ? '' : String(res);
}

async function main(): Promise<void> {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  let reply: Reply;
  try {
    const req: Request = JSON.parse(raw);
    const output = req.mode === 'js' ? await runJs(req.code, req.context) : await runForge(req.code, req.context);
    reply = { ok: true, output };
  } catch (e: any) {
    reply = { ok: false, output: String(e?.message ?? e) };
  }
  process.stdout.write(JSON.stringify(reply));
  process.exit(0);
}

main();
