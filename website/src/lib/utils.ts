export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}

// Shared controls can explicitly opt out of defaults they replace.
export function withoutDefaults(defaults: string, omitDefaults?: string): string {
  if (!omitDefaults) return defaults;
  const omitted = new Set(omitDefaults.split(' '));
  return defaults.split(' ').filter((name) => !omitted.has(name)).join(' ');
}
