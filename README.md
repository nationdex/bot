# Project NationDex 2.0 🇪🇺

**The legacy nostalgic OG environment of Nationdex reinvented in 2026!**

That is right, one of the oldest Ballsdex-like bots in existence, created in December 2022 as a legitimate Ballsdex alternative, has returned.

Join our cause at the NDS [headquarters](https://dsc.nationdex.com/)!

## ⚙️ Setup

To install dependencies:

```bash
bun install
```

To build the bot:

```bash
bun run build
```

To run on dev:

```bash
bun run dev
```

To start:

```bash
bun run start
```

## 🛠️ Troubleshooting

⚠️ Sometimes you remove a command from the src directory but it still shows up on Discord. In that case, run:

```bash
# Linux
rm -rf dist/ && bun run build

# Windows
Remove-Item dist/ -Recurse -Force
bun run build
```

This will recreate the dist directory, up to date with the src directory.

In order to check for any errors and warnings on the codebase, run:

```bash
bun run typecheck
```

## 🗄️ Database

Nationdex uses an embedded **PGlite** (WASM Postgres) instance via `@nationdex/db`. No external database container or `DATABASE_URL` is required. And most importantly, **no more Docker**!

## 🌐 API

Nationdex serves an HTTP API through `@nationdex/api`. The routes are ForgeScript files in `src/api_routes/v1/GET` (read) and `src/api_routes/v1/POST` (write). It listens on `API_PORT` (default `2222`), so the examples below use `http://localhost:2222`.

### Reading data (GET)

GET routes return JSON and need no token, except `/v1/search_db`, which needs one with the `inspect.read` capability (see below). Query values go in the URL (`?id=...`).

| Route | Query | Returns |
|---|---|---|
| `GET /v1/stats` | none | `collectibles_caught_global`, `collectibles_count`, `registered_users`, `registered_guilds` |
| `GET /v1/config` | none | The bot config (`bot`, `urls`, `paths`, `maintainers`, `prefix`, `logChannel`, `accent`) |
| `GET /v1/collectibles/data` | optional `id` | The whole catalog, or just that nation. Unknown `id` gives `404` and `{"error": "Collectible Not Found"}` |
| `GET /v1/user` | `id` (Discord user ID, required) | `collectiblesData` (inventory), `auctionData`, `settings`. A player's privacy settings are honoured: a private inventory or profile comes back as `{"private": true}` unless the request carries a token with `inspect.read`. Unknown user gives `404` and `{"error": "User Not Found"}` |
| `GET /v1/users/:id/auction` | none | The user's auction stats (`total`, `sold`, `earnings`, `onSale`). A private profile returns `{"private": true}` unless the request carries a token with `inspect.read`. Unknown user gives `404` and `{"error": "User Not Found"}` |
| `GET /v1/cards` | none | The card backgrounds as an array of `id`, `name`, `file`, `url` and `nationsCount` (how many nations use it). `url` is the path of the image, for example `/v1/cards/democracy/image` |
| `GET /v1/cards/:id/image` | `id` from `GET /v1/cards` | The card background PNG itself (`image/png`, cached for an hour), ready for an `<img>` tag. Unknown `id` gives `404` and `{"error": "Card Not Found"}` |
| `GET /v1/commands/data` | none | The prefix command definitions (`src/config/commands.ts`) |
| `GET /v1/slash/data` | none | The slash command definitions (`src/config/slash.ts`) |
| `GET /v1/search_db/:variable` | optional `id`. **Needs a token with `inspect.read`** (`401` without a token, `403` without the capability) | The raw database records of a variable, for example `/v1/search_db/spawnConfig` or `/v1/search_db/userCollectibles?id=123`. Each record has `identifier`, `name`, `id`, `type`, `value` (a JSON string) and `guild_id` |

```bash
curl http://localhost:2222/v1/stats
curl "http://localhost:2222/v1/collectibles/data?id=31"
curl "http://localhost:2222/v1/user?id=525421785001361408"
```

`search_db` returns raw records (balances, staff grants, the audit log), which is why it needs a token. Send it the same way as for the POST routes below. Keep the API port behind a reverse proxy with HTTPS so tokens are not sent in clear text.

### Changing data (POST)

POST routes edit users, nations, cards and the bot settings. Every call needs a token and a JSON body.

1. A staff member with a role (see `/access grant`) runs `/access token` in the main server. The token is shown once. Up to 3 tokens per person, `/access tokenrevoke` removes them.
2. Send it as `Authorization: Bearer ndx_...` with `Content-Type: application/json`.
3. The token only identifies you. Each route checks your **current** capability, so removing someone's role cuts their API access at once.

| Capability | Routes | Default roles |
|---|---|---|
| `nations.edit` | `/v1/nations*` (except `/card`) | `curator` |
| `cards.edit` | `/v1/nations/:id/card`, `/v1/categories*`, `/v1/cards/backgrounds*` | `curator` |
| `users.edit` | `/v1/users/:id/*` | `support` |
| `config.edit` | `/v1/config*` | `owner` only |
| `inspect.read` | `GET /v1/search_db/*`, the full `GET /v1/user` view | `developer` |

```bash
curl -X POST http://localhost:2222/v1/users/525421785001361408/balance \
  -H "Authorization: Bearer ndx_<your token>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "add", "amount": 500}'
```

Every answer has the same shape, and `ok` is `true` only for status `200`:

```json
{ "ok": true,  "status": 200, "statusText": "OK", "value": { } }
{ "ok": false, "status": 400, "statusText": "Bad Request", "error": "A nation named Atlantis already exists." }
```

| Status | Meaning |
|---|---|
| `200` | Done. `value` may carry a result |
| `400` | The input was rejected. `error` says why and nothing was changed |
| `401` | Missing, malformed or revoked token |
| `403` | The token's owner does not hold the capability this route needs |
| `404` | `users` routes only: no such Discord user |
| `413` | Body too large (64 KB, or 15 MB for the background upload) |
| `500` | Unexpected error, nothing was changed |
| `503` | The application emojis could not be checked with Discord. Try again in a moment |

Successful calls are written to `/access audit` as `api:<route>`. Request bodies are never logged.

#### Nations

| Route | Body keys |
|---|---|
| `POST /v1/nations` | **`name`** text, 1-80 chars, must be unique. **`class`** an existing category. **`emoji_id`** the name or ID of an existing application emoji, up to 64 chars (`400` if it does not exist, `503` if Discord cannot be asked right now; emojis uploaded after startup are found). **`attack`** whole number, 0 or more. **`health`** whole number, 0 or more. `rarity` / `weight` positive number, float or int (spawn weight, default `10`). Optional `short_name`, `regime`, `economy`, `capacity_name`, `capacity_description`, `credits`, `translations`, `catch_names` / `catching_names`, `global_caught`, `price`, `sell_price`. `wild_card` and `collection_card` are artwork file names that must already exist (see `/art` below). Answers `{ "value": { "id": "112" } }`. A new nation cannot spawn or be given to players until it has artwork |
| `POST /v1/nations/:id` | Send any or all fields to change. `name` (1-80), `short_name` (up to 48, empty or null clears it), `class` (existing category, moves category and updates counters), `emoji_id` (up to 64, skips Discord re-verification if unchanged), `credits` (up to 120), `attack`, `health` (0 or more), `rarity` / `weight` (positive number, float or int like `0.8`, updates both and recounts owner inventories), `regime` (background name in `assets/cards`, `.png` extension optional), `economy` (icon filename in `assets/icons`), `price`, `sell_price` (0 or more), `global_caught` (0 or more), `capacity_name` (up to 64), `capacity_description` (up to 600), `catch_names` and `catching_names` (array or comma separated text, lowercased, at least one, kept in sync, no clash with other nations), `translations` (same, empty clears it), `wild_card` and `collection_card` (existing artwork filename in `assets/spawn_art` or `assets/window_art`, skips check if unchanged). If an `id` field is present in the payload, it is automatically ignored. At least one valid field is required |
| `POST /v1/nations/:id/category` | **`class`** an existing category. Moves the nation and fixes every counter |
| `POST /v1/nations/:id/delete` | `cascade` `true` also deletes every catch of the nation and recounts the owners. Without it, the call fails while catches exist. Always refused while an auction holds the nation |
| `POST /v1/nations/:id/art` | Needs `cards.edit`. **`kind`** `spawn` (the wild artwork shown when it spawns) or `window` (the collection artwork). **`data`** the image, base64 encoded, PNG, JPEG or WebP, up to 10 MB. `name` the file name without extension (letters, numbers, `-`, `_`, up to 60); it is generated from the nation when left out. Answers `{ "value": { "file": "Atlantis.png" } }`. A nation needs `spawn` artwork to spawn and both kinds before it can be given to a player |
| `POST /v1/nations/:id/card` | `regime` card background (file name in `assets/cards` without `.png`), `economy` icon (file name in `assets/icons` with its extension). Send either or both |

#### Categories and card backgrounds

| Route | Body keys |
|---|---|
| `POST /v1/categories` | **`name`** 2-20 chars: lowercase letters, numbers, `-` or `_`, starting with a letter. `total`, `total_caught`, `classes` and `collectibles` are reserved |
| `POST /v1/categories/:name/delete` | none. Fails while a nation uses the category, and for the last category |
| `POST /v1/cards/backgrounds` | **`name`** 1-40 chars, no `.`, `/` or `\`. **`data`** the PNG, base64 encoded, exactly 1428x2000 pixels, up to 10 MB. Fails if the name already exists |
| `POST /v1/cards/backgrounds/:name/replace` | Needs `cards.edit`. **`data`** the new PNG, base64 encoded, exactly 1428x2000 pixels, up to 10 MB. Overwrites the file `assets/cards/<name>.png`, so every nation and special that uses the background shows the new image at once. `404` when the background does not exist |
| `POST /v1/cards/backgrounds/:name/delete` | none. Fails while a nation or a special uses it |

#### Users

`:id` is a Discord user ID that must exist.

| Route | Body keys |
|---|---|
| `POST /v1/users/:id/balance` | **`mode`** `set`, `add` or `remove`. **`amount`** whole number, up to 12 digits. The result stays between 0 and 999999999999 |
| `POST /v1/users/:id/settings` | **`key`** `inventory_privacy` or `profile_privacy` (value `public` or `private`), or `accept_gifts` (value `true` or `false`). **`value`** one of those values |
| `POST /v1/users/:id/settings/reset` | none. Back to the defaults |
| `POST /v1/users/:id/stats` | **`key`** `catches_total`, `battles_won`, `trades_completed` or `gifts_sent`. **`value`** whole number, up to 9 digits |
| `POST /v1/users/:id/auction` | Updates auction stats. Can send direct fields (`total`, `sold`, `earnings` whole numbers up to 12 digits, and/or `onSale` array of auction IDs), or send **`key`** (`total`, `sold`, `earnings`, `onSale`) and **`value`** with optional `mode` (`set`, `add` or `remove`) |
| `POST /v1/users/:id/nations/give` | **`nation`** a catalog ID. `count` 1-25 (default `1`) |
| `POST /v1/users/:id/nations/remove` | **`catch`** the 7-character catch ID. Fails if the user does not hold it (catches in an active auction are not in their inventory) |

#### Bot settings

`root` is `config` (the bot config) or `keywords` (the words the bot uses, such as `currency.plural`). `path` is a dotted path like `urls.server`. Text values are up to 300 chars. Keywords become Discord command and option names, so they must be 1-32 lowercase letters, numbers, `-` or `_`. Texts built at startup, like command descriptions, change after a restart.

| Route | Body keys |
|---|---|
| `POST /v1/config` | **`root`**, **`path`** of an existing value, **`value`**. Checked by path: `accent` is `#rrggbb`, `prefix` is 1-5 chars without spaces, `maintainers.*` are full http(s) profile links (the key is the name shown in `/about`, underscores show as spaces; add one with `parent` `maintainers`), `logChannel` is a channel ID or empty, `paths.*` are relative and cannot contain `..`, `urls.*` and `*.profile` / `*.repo` must be `http(s)` URLs, `bot.name` is 1-32 chars, `api.allowedOrigins` is a list of origins (see below). Keywords follow the rule above |
| `POST /v1/config/add` | **`root`**, `parent` the group to add to (empty for the top level), **`key`** letters, numbers and `_` (up to 32, starting with a letter), **`value`** |
| `POST /v1/config/delete` | **`root`**, **`path`** of a custom value. Built-in values cannot be deleted |
| `POST /v1/config/reset` | **`root`**, **`path`** of a built-in value, back to its default |

Keys in **bold** are required.

#### Calling from a browser (CORS)

By default only requests from the same origin, servers and tools like `curl` work. To let a website call the API from the browser, list its origins (comma separated, scheme and host, no path) in the `api.allowedOrigins` setting:

```bash
curl -X POST http://localhost:2222/v1/config \
  -H "Authorization: Bearer ndx_<owner token>" -H "Content-Type: application/json" \
  -d '{"root": "config", "path": "api.allowedOrigins", "value": "https://nationdex.com, http://localhost:5173"}'
```

Every route answers the browser's `OPTIONS` preflight (`204`), and every answer, errors included, carries `Access-Control-Allow-Origin` for a listed origin. Other origins get no CORS headers, so the browser blocks them. Browsers need `Authorization` and `Content-Type` allowed, which the preflight does.

## 👥 Devs and Mentions

Made with great honor and dedication by those who worked for Nationdex.

|     Developers      |             Roles             |
| ------------------- | ----------------------------- |
| Ariel Aram          | Founding Father               |
| Aditya              | Frontend Developer            |
| Ayansh              | Backend Developer             |

|        Staff        |             Roles             |
| ------------------- | ----------------------------- |
| Mr. Lore            | Staff Member                  |
| BloxyBlitz          | Staff & Code Reviewer         |
| HiboMan             | Staff & Code Reviewer         |
| AhmedTheWarrior     | Staff Member                  |

And Nationdex as a whole was only possible at some point thanks to the help from the following people.

| Honourable Mentions |             Roles             |
| ------------------- | ----------------------------- |
| Luka22r             | Former BDFD & Python Head-Dev |
| MetroKitten         | Former Developer & Ex-Manager |
| Tape                | Former BDFD & FS Developer    |
| Econome             | Former FS & DJS Developer     |
| Gasvo               | Former BDFD Expert Developer  |
| Emtyapple           | Former BDFD Mid-Range Dev     |
| Emperor Scorpion    | Leader of Scorpceltic Empire  |
| Hariri              | Original Idealist             |
| UG                  | Former Server Shareholder     |

Project Nationdex 2026, our gratitude to everyone who made it possible, our response to everyone who fought for a better community.
**Wishes, are eternal.**
