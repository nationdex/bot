import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { eq } from 'drizzle-orm';
import { db, promoCodes } from '../db';

/**
 * $getPromoCode[code]
 * Looks up a promo code (case-insensitive) in the database.
 * Returns a pipe-separated string: reward|message|usesLeft
 * Returns an empty string if the code does not exist or has 0 uses remaining.
 */
export default new NativeFunction({
  name: '$getPromoCode',
  description: 'Returns reward|message|usesLeft for the given promo code, or empty if invalid.',
  unwrap: true,
  brackets: true,
  args: [
    {
      name: 'code',
      description: 'The promo code to look up',
      type: ArgType.String,
      required: true,
      rest: false,
    },
  ],
  output: ArgType.String,
  async execute(_ctx, [code]) {
    if (!code) return this.success('');

    const [row] = await db
      .select({
        reward: promoCodes.reward,
        message: promoCodes.message,
        usesLeft: promoCodes.usesLeft,
      })
      .from(promoCodes)
      .where(eq(promoCodes.code, code.trim().toLowerCase()))
      .limit(1);

    if (!row || row.usesLeft <= 0) return this.success('');

    return this.success(`${row.reward}|${row.message}|${row.usesLeft}`);
  },
});
