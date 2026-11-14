export const json = (data: unknown, status = 200, headers?: HeadersInit): Response =>
  Response.json(data, { status, headers });

export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    return (await req.json()) as Record<string, any>;
  } catch {
    return {};
  }
}

export const strings = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.map(String) : undefined);

export function accepted(header: string | null): Set<string> {
  const ok = new Set<string>();
  for (const part of (header ?? '').split(',')) {
    const [name, ...params] = part.trim().toLowerCase().split(';');
    const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    if (name && !(q && Number(q.slice(2)) === 0)) ok.add(name);
  }
  return ok;
}
