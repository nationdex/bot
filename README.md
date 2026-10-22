# Project NationDex 2.0 🇪🇺

**The legacy nostalgic OG environment of Nationdex reinvented in 2026!**

That is right, one of the oldest dex bots in existence, created in December 2022, has returned.

Join our cause at the Nationdex [headquarters](https://dsc.nationdex.com/)!

## ⚙️ Setup

To install dependencies:

```bash
npm install
```

To run on dev:

```bash
npm run dev
```

To start:

```bash
npm run start
```

To prepare for production:

```bash
npm run prod:build
```

## 🛠️ Troubleshooting

⚠️ Sometimes you remove a command from the src directory but it still shows up on Discord. In that case, run:

```bash
npm run fix
```

This will recreate the dist directory, up to date with the src directory.

In order to check for any errors and warnings on the codebase, run:

```bash
npm run typecheck
```

## 🗄️ Database

Nationdex uses an embedded **PGlite** (WASM Postgres) instance via `@nationdex/db`.
Database files are stored locally in the `./database` directory and are ignored by Git.

No external database container or `DATABASE_URL` is required.

## 🔐 Staff access

Staff tools (`/admin`, `/access`, auction moderation and `n.eval`) are controlled by capabilities stored in the database, never by Discord permissions such as Administrator and never by user IDs in the code.

- Set `HOME_GUILD_ID` in `.env` to the main server's ID. Staff commands are registered in, and only work from, that server. Without it every staff capability is denied.
- On a fresh database nobody has access. The Discord application owner (the owner of the team that owns the application) runs `/access claim` in the home server once to become the first owner.
- Owners then use `/access grant`, `/access revoke`, `/access role`, `/access roles`, `/access list`, `/access audit` and `/access evalchannel`.
- Capabilities: `eval.run`, `suggestions.review`, `suggestions.approve`, `blacklist.read`, `blacklist.write`, `auction.moderate`, `users.edit`, `nations.edit`, `cards.edit`, `config.edit` (owner-grant only), `access.manage`. Default roles: `owner`, `developer`, `moderator`, `reviewer`, `curator` (nations and cards), `support` (users).
- Edits to users, nations, cards and bot settings go through the staff API (`POST /v1/...`, ForgeScript routes in `src/api_routes/v1/POST`, see below). Create a token with `/access token`; it is sent as `Authorization: Bearer <token>` and every call is checked against your current capabilities (`nations.edit`, `cards.edit`, `users.edit`, `config.edit`). `/access tokenrevoke` removes your tokens.
- `n.eval` runs in a separate worker process with an empty environment (no bot token) and no database handle. Run the bot under a dedicated, unprivileged OS user with no access to files it does not need.
- Per-server `/spawn` configuration is a community feature gated by Manage Server in that server and is not part of this system.

### Staff API

All routes are `POST`, answer JSON (`{"ok", "status", "error", "value"}`) and need `Authorization: Bearer <token>`.

| Route | Needs | Body |
|---|---|---|
| `/v1/nations` | `nations.edit` | `name`, `class`, `emoji_id`, `attack`, `health`, optional `rarity` |
| `/v1/nations/:id` | `nations.edit` | any of `name`, `short_name`, `emoji_id`, `credits`, `attack`, `health`, `rarity`, `price`, `sell_price`, `capacity_name`, `capacity_description`, `catch_names`, `translations` |
| `/v1/nations/:id/category` | `nations.edit` | `class` |
| `/v1/nations/:id/delete` | `nations.edit` | optional `cascade: true` to remove its catches |
| `/v1/nations/:id/card` | `cards.edit` | `regime` (card background) and/or `economy` (icon) |
| `/v1/categories`, `/v1/categories/:name/delete` | `cards.edit` | `name` |
| `/v1/cards/backgrounds`, `/v1/cards/backgrounds/:name/delete` | `cards.edit` | `name`, `data` (base64 PNG, 1428x2000) |
| `/v1/users/:id/balance` | `users.edit` | `mode` (`set`, `add`, `remove`), `amount` |
| `/v1/users/:id/settings`, `/settings/reset` | `users.edit` | `key` (`inventory_privacy`, `profile_privacy`, `accept_gifts`), `value` |
| `/v1/users/:id/stats` | `users.edit` | `key`, `value` |
| `/v1/users/:id/nations/give`, `/nations/remove` | `users.edit` | `nation`, `count` / `catch` |
| `/v1/config`, `/config/add`, `/config/delete`, `/config/reset` | `config.edit` | `root` (`config` or `keywords`), `path`, `value`, `parent`, `key` |

## 🚀 Production

Run the bot under a process manager such as systemd. Build it first with `bun run build` and start it with `bun dist/index.js`.

## 🤝 Contributions

For those who are interested in contributing for Nationdex's development, you are always encouraged to open a Pull Request or Issue. For more information about how to contribute, please check out [our full contribution guidance](https://github.com/nationdex/bot/blob/main/CONTRIBUTING.md).

## 👥 Devs and Mentions

Made with great honor and dedication by the Nationdex Team.

|     Developers      |             Roles             |
| ------------------- | ----------------------------- |
| Ariel Aram          | Founding Father               |
| Aditya              | Frontend Developer            |
| Ayansh              | Backend Developer             |

|        Staff        |             Roles             |
| ------------------- | ----------------------------- |
| Mr. Lore            | Staff Member                  |
| BloxyBlitz          | Staff & Code Reviewer         |
| F.m.e               | Staff & Artist                |
| HiboMan             | Staff & Code Reviewer         |
| AhmedTheWarrior     | Staff Member                  |

Nationdex as a whole was only possible at some point thanks to the help from the following people.

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

To all of them, together with all the supporters and contributors, let's make the dex community blue and united once again, as we all stand together, united, and committed for a better environment, one that is built on our own values and principles, one that intends to be with the community in high-regard, and one that turns creativity and passion into a norm!
