# Project Nationdex 2026

Project Nationdex 2026 is a Discord collectible bot built with Bun, TypeScript, and ForgeScript. It is a revival of Nationdex.bot, first created in 2022.

[Nationdex community](https://dsc.nationdex.com/) · [Source code](https://github.com/nationdex/bot)

![Nationdex banner](assets/banner.jpg)

## Run the bot

### Requirements

- Bun 1.4.3 or newer
- A Discord application and bot token
- A home server ID for staff commands and access controls

The database is embedded PGlite, managed by `@nationdex/db`. You do not need a separate PostgreSQL server or Docker.

### Install and start

```sh
bun install
bun run start
```

For development with file watching:

```sh
bun run dev
```

Set the required bot credentials in the root `.env` file:

```dotenv
TOKEN=your_discord_bot_token
HOME_GUILD_ID=your_staff_server_id
```

The API listens on port `2222` by default. Set `API_PORT` to change it. The panel listens on port `3000` by default and has separate settings in `website/.env.example`.

## Bot access and API tokens

In the configured home server, the Discord application owner can use `/access grant` to give staff the `admin` or `moderator` preset. Use `/access roles` to review presets and available capabilities. Owners can also create custom roles and grant individual capabilities.

The verified Discord application owner receives owner capabilities automatically. No ownership claim command is required. Only that owner can create API tokens with `/api token`; the token is shown once. Revoke tokens with `/api tokenrevoke`. A token carries the current capabilities of its owner, so removing access also removes the token's API permissions.

Eval access is owner-controlled. Admin and Moderator presets do not include eval. Keep API tokens private: they can access any API route allowed by their owner's capabilities.

## Admin panel

The panel is served by the bot's Bun process. It uses `website/dist` for its built interface and can build that directory from `website/` source when needed. Panel accounts and their permissions are separate from Discord bot staff permissions.

For public access, put the panel behind HTTPS. The panel can also serve HTTPS directly with certificate and key paths configured in `website/.env`; see [the deployment guide](website/deploy/README.md) for Nginx and tunnel examples.

## HTTP API

The API is provided by `@nationdex/api`. Route implementations live in `src/api_routes/v1/GET` and `src/api_routes/v1/POST`.

### Read routes

Most GET routes are public. Sensitive views require a token with the listed capability. Player privacy settings still apply unless the token has `inspect.read`.

| Route | Purpose | Access |
| --- | --- | --- |
| `GET /v1/stats` | Global bot and collection statistics | Public |
| `GET /v1/config` | Bot configuration | Public |
| `GET /v1/collectibles/data?id=:id` | Catalog, optionally one collectible | Public |
| `GET /v1/user?id=:discordId` | A player's inventory, auction, and settings | Public view; `inspect.read` bypasses privacy |
| `GET /v1/users/:id/auction` | Player auction statistics | Public view; `inspect.read` bypasses privacy |
| `GET /v1/guilds/:id` | Spawn settings for a joined server | Public |
| `GET /v1/cards` and `GET /v1/cards/:id/image` | Card catalog and card image | Public |
| `GET /v1/commands/data`, `GET /v1/slash/data` | Registered command definitions | Public |
| `GET /v1/search_db/:variable?id=:id` | Raw database records | `inspect.read` |

Example:

```sh
curl http://localhost:2222/v1/stats
curl 'http://localhost:2222/v1/collectibles/data?id=31'
```

### Write routes

Every POST request needs `Authorization: Bearer <token>`, `Content-Type: application/json`, and the capability listed below. The token is created by the Discord application owner with `/api token`.

| Route family | Capability | Examples |
| --- | --- | --- |
| `/v1/nations*` | `nations.edit` or `cards.edit` for card/art operations | Add, edit, categorize, delete, and add artwork to nations |
| `/v1/categories*`, `/v1/cards*` | `cards.edit` | Manage card backgrounds, specials, and categories |
| `/v1/users/:id/*` | `users.edit` | Edit balances, settings, stats, auctions, and inventories |
| `/v1/guilds/:id/edit` | `guilds.edit` | Change a server's spawn channel and spawn status |
| `/v1/config*` | `config.edit` | Change bot settings and keywords |

Example:

```sh
curl -X POST http://localhost:2222/v1/users/525421785001361408/balance \
  -H 'Authorization: Bearer ndx_<token>' \
  -H 'Content-Type: application/json' \
  -d '{"mode":"add","amount":500}'
```

Successful writes are recorded in `/access audit`; request bodies are not logged. Common responses are `200` for success, `400` for invalid input, `401` for a missing or revoked token, `403` for a missing capability, `413` for an oversized request, and `500` for an unexpected error.

Do not expose the API port directly to the public internet over plain HTTP. Use HTTPS through a reverse proxy or configure TLS for the service.

## Remote extras

The Nationdex index can connect to a reachable bot instance over HTTPS. Create an API token with `/api token` in Discord, then enter it on the index site. The site keeps the token in the open tab's memory and discards it on disconnect, tab close, or reload; it does not save the token in browser storage.

The panel owner must enable remote extras, approve the index origin, and add each allowed extra repository with a full commit SHA under **Settings → Remote extras**. The public index catalogue is only a directory; it does not authorize installation on a bot.

An extra is trusted code executed with the bot process's privileges. Review its source before approving it. Installation and removal take effect after a bot restart. The API also exposes `GET /v1/discovery` with public product and extras-protocol metadata; sensitive management routes require the bot owner's API token.

## Development checks

```sh
bun run bundle:prep
bun run lint
bun run typecheck
```

Run `bun run bundle:prep` after adding, renaming, or removing a function, event, command, slash command, or API route so the bot's registration bundle stays current.

## Contributors

Nationdex is built by its maintainers, staff, and community contributors. Thank you to everyone who has helped develop, review, test, and support the project.
