/**
 * Drizzle ORM schema definitions
 */
import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  /** The redeemable code string (case-insensitive; stored lowercase) */
  code: varchar('code', { length: 64 }).notNull().unique(),
  /** Nation slug awarded on redemption */
  reward: varchar('reward', { length: 64 }).notNull(),
  /** Message shown to the user on a successful redemption */
  message: text('message').notNull().default(''),
  /** How many more times this code can be redeemed; 0 = exhausted */
  usesLeft: integer('uses_left').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const nations = pgTable('nations', {
  id: serial('id').primaryKey(),
  /** Internal slug used as the collectible identifier (e.g. "france") */
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  /** Display name of the nation */
  country: varchar('country', { length: 128 }).notNull(),
  /** Discord emoji ID for the nation's flag/icon */
  emojiId: varchar('emoji_id', { length: 32 }).notNull(),
  /** Rarity weight — higher = more common */
  rarity: integer('rarity').notNull().default(1),
  /** Maximum health stat */
  health: integer('health').notNull().default(100),
  /** Maximum attack/strength stat */
  attack: integer('attack').notNull().default(100),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Nation = typeof nations.$inferSelect;
export type NewNation = typeof nations.$inferInsert;
export type PromoCode = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;
