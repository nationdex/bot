import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { eq } from 'drizzle-orm';
import { db, nations } from '../db';

/**
 * $getNationData[slug]
 * Given a nation slug, returns a pipe-separated string:
 *   country|emojiId|rarity|health|attack
 * Returns an empty string if the nation is not found.
 */
export default new NativeFunction({
  name: '$getNationData',
  description: 'Returns country|emojiId|rarity for the given nation slug.',
  unwrap: true,
  brackets: true,
  args: [
    {
      name: 'slug',
      description: 'The nation slug to look up',
      type: ArgType.String,
      required: true,
      rest: false,
    },
  ],
  output: ArgType.String,
  async execute(_ctx, [slug]) {
    if (!slug) return this.success('');

    const [row] = await db
      .select({
        country: nations.country,
        emojiId: nations.emojiId,
        rarity: nations.rarity,
        health: nations.health,
        attack: nations.attack,
      })
      .from(nations)
      .where(eq(nations.slug, slug.trim()))
      .limit(1);

    if (!row) return this.success('');

    return this.success(`${row.country}|${row.emojiId}|${row.rarity}|${row.health}|${row.attack}`);
  },
});
