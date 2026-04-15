CREATE TABLE "nations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"country" varchar(128) NOT NULL,
	"emoji_id" varchar(32) NOT NULL,
	"rarity" integer DEFAULT 1 NOT NULL,
	"health" integer DEFAULT 100 NOT NULL,
	"attack" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"reward" varchar(64) NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"uses_left" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
