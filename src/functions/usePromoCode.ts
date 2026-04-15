import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db, promoCodes } from '../db';

/**
 * $usePromoCode[code]
 * Atomically decrements usesLeft for the given promo code (case-insensitive).
 * Returns "true" if the decrement succeeded, "false" if the code is exhausted
 * or not found.
 *
 * The WHERE clause includes `uses_left > 0` so the decrement and the guard are
 * a single atomic DB operation — no separate read-then-write race condition.
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
  async execute(_ctx, [code]) {
    if (!code) return this.success('false');

    const result = await db
      .update(promoCodes)
      .set({ usesLeft: sql`${promoCodes.usesLeft} - 1` })
      .where(and(eq(promoCodes.code, code.trim().toLowerCase()), gt(promoCodes.usesLeft, 0)))
      .returning({ usesLeft: promoCodes.usesLeft });

    // If no rows were updated the code was either not found or already exhausted.
    if (result.length === 0) return this.success('false');

    return this.success('true');
  },
});
