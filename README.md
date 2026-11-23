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

### Discord panel sign-in

Optional Discord sign-in is configured in `website/.env` (or the bot's `.env`): set `PANEL_DISCORD_CLIENT_ID`, `PANEL_DISCORD_CLIENT_SECRET`, `PANEL_DISCORD_REDIRECT_URI`, and `PANEL_DISCORD_OWNER_ID`. Register the exact callback URL, `https://your-panel.example/api/auth/discord/callback`, in the Discord application's OAuth2 settings. HTTP is accepted only for localhost development. The login page then offers **Continue with Discord**, including during initial setup.

Only the configured owner Discord ID can create the first owner account through Discord. Other accounts must be listed in `PANEL_DISCORD_ALLOWED_IDS`; they receive dashboard-only member accounts that a panel owner can manage. The allowlist is checked on every Discord sign-in. Password sign-in remains available. Discord-only accounts use usernames like `discord_123456789012345678` and have no known password; a panel owner can set a password through account management if needed.

Discord identities are linked by immutable ID, never by username or email. Existing password accounts are not automatically linked or promoted, including when the configured Discord owner signs in after setup. Discord sign-in requires cookies; password sign-in retains the existing cookie-free fallback. OAuth secrets stay on the server; only the identify scope is requested, and Discord access/refresh tokens are not persisted. Changing the Discord allowlist does not revoke existing panel sessions: delete the account or revoke its sessions when removing access.

## HTTP API

The API is provided by `@nationdex/api`. Route implementations live in `src/api_routes/v1/GET` and `src/api_routes/v1/POST`.

### Read routes

Most GET routes are public. Sensitive views require a token with the listed capability. Player privacy settings still apply unless the token has `inspect.read`.

| Route                                         | Purpose                                     | Access                                       |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `GET /v1/stats`                               | Global bot and collection statistics        | Public                                       |
| `GET /v1/config`                              | Bot configuration                           | Public                                       |
| `GET /v1/collectibles/data?id=:id`            | Catalog, optionally one collectible         | Public                                       |
| `GET /v1/user?id=:discordId`                  | A player's inventory, auction, and settings | Public view; `inspect.read` bypasses privacy |
| `GET /v1/users/:id/auction`                   | Player auction statistics                   | Public view; `inspect.read` bypasses privacy |
| `GET /v1/guilds/:id`                          | Spawn settings for a joined server          | Public                                       |
| `GET /v1/cards` and `GET /v1/cards/:id/image` | Card catalog and card image                 | Public                                       |
| `GET /v1/commands/data`, `GET /v1/slash/data` | Registered command definitions              | Public                                       |
| `GET /v1/search_db/:variable?id=:id`          | Raw database records                        | `inspect.read`                               |

Example:

```sh
curl http://localhost:2222/v1/stats
curl 'http://localhost:2222/v1/collectibles/data?id=31'
```

### Write routes

The external API exposes only two POST routes. Both require the bot owner's API token and `Content-Type: application/json`:

| Route                     | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `POST /v1/extras/install` | Install or update an extra to a host-approved commit |
| `POST /v1/extras/remove`  | Disable an installed extra for removal on restart    |

The former configuration, collectible, card, category, user, guild, and auction mutation routes have been removed. The admin panel executes its operations internally through authenticated panel sessions and panel permissions; API tokens do not authenticate those sessions.

Extras changes are recorded in `/access audit`. Installation still requires remote extras to be enabled and the repository and exact commit to be approved in the panel.

Do not expose the API port directly to the public internet over plain HTTP. Use HTTPS through a reverse proxy or configure TLS for the service.

## Remote extras

The Nationdex index can connect to a reachable bot instance over HTTPS. Create an API token with `/api token` in Discord, then enter it on the index site. The site keeps the token in the open tab's memory and discards it on disconnect, tab close, or reload; it does not save the token in browser storage.

The panel owner must enable remote extras, approve the index origin, and add each allowed extra repository with a full commit SHA under **Settings → Remote extras**. The public index catalogue is only a directory; it does not authorize installation on a bot.

Extras are limited to 5,000 files, 50 MiB of extracted content and 100 MiB of fetched Git objects. Git commands have a 60-second timeout and bounded output. The Git object limit is checked after fetching; use host disk quotas to bound transfer-time disk usage. Installed directories and entrypoints are checked for symbolic links before loading.

A catalogue entry can optionally select a directory inside an extras monorepo:

```json
{
  "id": "example",
  "repository": "owner/extras",
  "ref": "<full 40-character commit SHA>",
  "path": "extras/example"
}
```

Omit `path` or leave it empty for a repository-root extra. The selected directory must contain `nationdex.extra.json` and its entrypoint. Only that directory is installed; workspace sibling imports and dependencies are not automatically included or installed. The panel owner approves this path with the repository and commit; browser install requests cannot override it.

An extra is trusted code executed with the bot process's privileges. Review its source before approving it. Installation and removal take effect after a bot restart. The API also exposes `GET /v1/discovery` with public product and extras-protocol metadata; sensitive management routes require the bot owner's API token.

### Owner prefix commands

Use the configured bot prefix with:

- `extrasinstall <id> <full commit SHA>`
- `extrasremove <id>`
- `extrasupdate <id> <full commit SHA>`
- `extrasedit <id> <full commit SHA>`
- `extraslist`

Only the actual Discord application owner can use these commands. They need no API token and remain available when remote extras management is disabled. Repositories, monorepo folders and exact commits must still be approved in the admin panel. Update and edit require an installed extra; edit changes its version rather than accepting arbitrary code. Restart the bot to apply changes. Command attempts are recorded in the access audit.

## Development checks

```sh
bun run bundle:prep
bun run lint
bun run typecheck
```

Run `bun run bundle:prep` after adding, renaming, or removing a function, event, command, slash command, or API route so the bot's registration bundle stays current.

## Contributors

Nationdex is built by its maintainers, staff, and community contributors. Thank you to everyone who has helped develop, review, test, and support the project.
