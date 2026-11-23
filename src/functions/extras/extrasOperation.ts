import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { extrasOperation } from '../../core/extras';

async function readRequestBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  const started = Date.now();
  let size = 0;
  let body = '';
  for (;;) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let part: Awaited<ReturnType<typeof reader.read>>;
    try {
      part = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          const remaining = Math.max(1, 5000 - (Date.now() - started));
          timer = setTimeout(() => {
            void reader.cancel();
            reject(Object.assign(new Error('Request body timed out.'), { status: 408 }));
          }, remaining);
        }),
      ]).finally(() => clearTimeout(timer));
    } catch (error) {
      await reader.cancel().catch(() => undefined);
      throw error;
    }
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    }
    body += decoder.decode(part.value, { stream: true });
  }
  return body + decoder.decode();
}

export default new NativeFunction({
  name: '$extrasOperation',
  description: 'Lists or applies a host-approved remote extras operation.',
  output: ArgType.String,
  brackets: true,
  unwrap: true,
  args: [
    { name: 'operation', description: 'list, install, or remove', type: ArgType.String, rest: false, required: true },
  ],
  async execute(ctx, [operation]) {
    let body = '';
    if (operation !== 'list') {
      try {
        const request = (ctx.runtime.extras as any).request.raw as Request;
        body = await readRequestBody(request);
      } catch (error) {
        const status = Number((error as { status?: number })?.status);
        if (status === 408 || status === 413) {
          return this.success(JSON.stringify({ status, error: status === 413 ? 'Request body is too large.' : 'Request body timed out.' }));
        }
        return this.success(JSON.stringify({ status: 400, error: 'Could not read request body.' }));
      }
    }
    const result = await extrasOperation(String(operation), body);
    return this.success(JSON.stringify(result));
  },
});
