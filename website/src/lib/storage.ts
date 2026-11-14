// Browser storage can be missing or throw: cookies blocked, private windows, Tor, strict privacy modes (even reading
// `localStorage` can throw there). Everything goes through here so the panel simply forgets instead of crashing.
// Only UI preferences (theme, animations) are kept; panel data is never written to the browser.
function area(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const storage = {
  get(key: string): string | null {
    try {
      return area()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      area()?.setItem(key, value);
    } catch {
      /* storage full or blocked: keep working without it */
    }
  },
  // Older builds cached API answers (user lists, staff accounts) here. Nothing is stored any more: wipe the leftovers.
  purge(prefix: string): void {
    try {
      const store = area();
      if (!store) return;
      for (const key of Object.keys(store)) if (key.startsWith(prefix)) store.removeItem(key);
    } catch {
      /* nothing to purge */
    }
  },
};
