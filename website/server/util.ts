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
