import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'appEmoji',
  // Resolves an application emoji by name or ID via synchronous in-memory lookup.
  params: [
    {
      name: 'emoji',
      // The emoji/name/id
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value to get, name/id/emoji/url
      type: 'String',
      required: false,
    },
  ],
  code: `
  $return[$js[
    (() => {
      const q = String(ctx.getEnvironmentKey('emoji') ?? '').toLowerCase().trim();
      if (!q) return '';
      
      const map = globalThis.__ndxEmojiMap;
      let em = map ? map.get(q) : null;
      if (!em && globalThis.__ndxEmojiCache) {
        const found = globalThis.__ndxEmojiCache.find(e => e.id === q || (e.name && e.name.toLowerCase() === q));
        if (found) {
          const formatted = \`<\${found.animated ? 'a' : ''}:\${found.name}:\${found.id}>\`;
          em = { id: String(found.id), name: String(found.name), animated: Boolean(found.animated), formatted };
          if (map) {
            map.set(String(found.id).toLowerCase(), em);
            map.set(String(found.name).toLowerCase(), em);
          }
        }
      }
      if (!em && ctx.client?.application?.emojis?.cache) {
        const found = ctx.client.application.emojis.cache.get(q) || 
                      ctx.client.application.emojis.cache.find(e => e.name && e.name.toLowerCase() === q);
        if (found) {
          const formatted = \`<\${found.animated ? 'a' : ''}:\${found.name}:\${found.id}>\`;
          em = { id: String(found.id), name: String(found.name), animated: Boolean(found.animated), formatted };
          if (map) {
            map.set(String(found.id).toLowerCase(), em);
            map.set(String(found.name).toLowerCase(), em);
          }
        }
      }
      
      if (!em) return '';
      const v = String(ctx.getEnvironmentKey('value') ?? '').toLowerCase().trim();
      if (v === 'id') return em.id;
      if (v === 'name') return em.name;
      if (v === 'url') return \`https://cdn.discordapp.com/emojis/\${em.id}.\${em.animated ? 'gif' : 'png'}\`;
      return em.formatted;
    })()
  ]]
  `,
});
