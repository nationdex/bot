import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { inArray } from 'drizzle-orm';
import { db, nations } from '../db';

/**
 * $getNationEmojis[slug1,slug2,...]
 * Given a comma-separated list of nation slugs, returns a comma-separated
 * string of Discord emoji strings (<:emoji:ID>) in the same order.
 * Unknown slugs are silently skipped.
 */
export default new NativeFunction({
  name: '$getNationEmojis',
  description: 'Returns comma-separated emoji strings for the given nation slugs.',
  unwrap: true,
  brackets: true,
  args: [
    {
      name: 'slugs',
      description: 'Comma-separated nation slugs',
      type: ArgType.String,
      required: true,
      rest: false,
    },
  ],
  output: ArgType.String,
  async execute(_ctx, [slugList]) {
    if (!slugList) return this.success('');

    const slugs = slugList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length === 0) return this.success('');

    const rows = await db
      .select({ slug: nations.slug, emojiId: nations.emojiId })
      .from(nations)
      .where(inArray(nations.slug, slugs));

    // Build a lookup map to preserve caller order
    const map = new Map(rows.map((r) => [r.slug, r.emojiId]));
    const emojis = slugs
      .map((s) => (map.has(s) ? `<:emoji:${map.get(s)}>` : null))
      .filter(Boolean)
      .join(',');

    return this.success(emojis);
  },
});
