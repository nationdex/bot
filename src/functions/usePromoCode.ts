import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { eq, sql } from 'drizzle-orm';
import { db, promoCodes } from '../db';

/**
 * $usePromoCode[code]
 * Atomically decrements usesLeft for the given promo code (case-insensitive).
 * Returns "true" if the decrement succeeded (usesLeft was > 0), "false" otherwise.
 * Only decrements when usesLeft > 0 to prevent going negative.
 */
export default new NativeFunction({
  name: '$usePromoCode',
  description: 'Decrements usesLeft for a promo code. Returns true on success, false if exhausted.',
  unwrap: true,
  brackets: true,
  args: [
    {
      name: 'code',
      description: 'The promo code to consume one use of',
      type: ArgType.String,
      required: true,
      rest: false,
    },
  ],
  output: ArgType.String,
  async execute(ctx, [code]) {
    if (!code) return this.success('false');

    const result = await db
      .update(promoCodes)
      .set({ usesLeft: sql`${promoCodes.usesLeft} - 1` })
      .where(eq(promoCodes.code, code.trim().toLowerCase()))
      .returning({ usesLeft: promoCodes.usesLeft });

    // If no row was matched, or the update somehow left usesLeft negative, report failure
    const updated = result[0];
    if (!updated || updated.usesLeft < 0) return this.success('false');

    return this.success('true');
  },
});
