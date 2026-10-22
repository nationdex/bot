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

## 🤝 Contributions

For those who are interested in contributing for Nationdex's development, you are always encouraged to open a Pull Request or Issue. For more information about how to contribute, please check out our full [contribution](https://github.com/nationdex/bot/blob/main/CONTRIBUTING.md) guidance.

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
