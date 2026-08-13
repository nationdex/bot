# Project NationDex 2.0 🇪🇺

**The legacy nostalgic OG environment of Nationdex reinvented in 2026!**

That is right, one of the oldest Ballsdex-like bots in existence, created in December 2022 as a legitimate Ballsdex alternative in Bot Designer for Discord, has returned.

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

Nationdex uses **SurrealDB embedded** (SurrealKV) via `@nationdex/db`.  
Database files are stored locally in the `./database` directory and are ignored by Git.

No external database container or `DATABASE_URL` is required.

## 🚀 Production

To start the bot in production:

```bash
npm run pm2:start
```

To stop:

```bash
npm run pm2:stop
```

To restart:

```bash
npm run pm2:restart
```

To delete:

```bash
npm run pm2:delete
```

To view the status:

```bash
npm run pm2:status
```

To view the logs:

```bash
npm run pm2:logs
```

## 🐳 Docker

To build and run the bot in a Docker container:

```bash
docker compose up -d --build
```

To stop the instance:

```bash
docker compose down
```

To check the logs:

```bash
docker compose logs
```

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
