import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { count } from 'drizzle-orm';
import { db, nations } from '../db';

/**
 * $getNationCount[]
 * Returns the total number of nations in the database.
 */
export default new NativeFunction({
  name: '$getNationCount',
  description: 'Returns the total number of nations registered in the database.',
  unwrap: true,
  brackets: false,
  args: [],
  output: ArgType.Number,
  async execute(_ctx) {
    const [row] = await db.select({ value: count() }).from(nations);
    return this.success(row?.value ?? 0);
  },
});
