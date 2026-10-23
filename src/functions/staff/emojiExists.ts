import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'emojiExists',
  // Checks that an application emoji exists, by name or ID, refreshing the list from Discord on a miss. Returns true, false or unverified (Discord could not be reached).
  params: [
    {
      name: 'emoji',
      // The emoji name or ID.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $return[$js[(async () => {
    const q = String(ctx.getEnvironmentKey('emoji') ?? '').toLowerCase().trim();
    if (!q) return 'false';
    const find = () => {
      const map = globalThis.__ndxEmojiMap;
      if (map && map.get(q)) return true;
      const cache = globalThis.__ndxEmojiCache;
      if (cache && cache.some((e) => String(e.id) === q || (e.name && String(e.name).toLowerCase() === q))) return true;
      const live = ctx.client?.application?.emojis?.cache;
      return !!(live && (live.get(q) || live.find((e) => e.name && e.name.toLowerCase() === q)));
    };
    if (find()) return 'true';
    try {
      const list = Array.from((await ctx.client.application.emojis.fetch()).values());
      globalThis.__ndxEmojiCache = list.map((e) => ({ id: String(e.id), name: String(e.name), animated: Boolean(e.animated) }));
      const map = new Map();
      list.forEach((e) => {
        const data = { id: String(e.id), name: String(e.name), animated: Boolean(e.animated), formatted: '<' + (e.animated ? 'a' : '') + ':' + e.name + ':' + e.id + '>' };
        map.set(String(e.id).toLowerCase(), data);
        map.set(String(e.name).toLowerCase(), data);
      });
      globalThis.__ndxEmojiMap = map;
    } catch (e) {
      return 'unverified';
    }
    return find() ? 'true' : 'false';
  })()]]
  `,
});
