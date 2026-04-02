import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { sum } from 'drizzle-orm';
import { db, nations } from '../db';

/**
 * $getTotalRareness[]
 * Returns the sum of all nation rarity values in the database.
 */
export default new NativeFunction({
  name: '$getTotalRareness',
  description: 'Returns the sum of all nation rarity values in the database.',
  unwrap: true,
  brackets: false,
  args: [],
  output: ArgType.Number,
  async execute(ctx) {
    const [row] = await db.select({ value: sum(nations.rarity) }).from(nations);
    return this.success(Number(row?.value ?? 0));
  },
});
