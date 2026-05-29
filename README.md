# Project NationDex 2.0 🇪🇺

**The legacy nostalgic OG environment of NationDex reinvented in 2026!**

That is right, one of the oldest BallsDex-like bots in existence, created in December 2022 as a legitimate BallsDex alternative in Bot Designer for Discord, has returned.

Join our cause at the NationDex [headquarters](https://dsc.nationdex.com/)!

## ⚙️ Setup

To install dependencies:

```bash
npm install
```

To configure the bot through `config.ts`:

```bash
cp src/config/config.example.ts src/config/config.ts
```

To run on dev:

```bash
npm run dev
```

to start:

```bash
npm run start
```

## 🛠️ Troubleshooting

⚠️ Sometimes you remove a command from the src directory but it still shows up on discord. In that case, run:

```bash
npm run fix
```

This will recreate the dist directory, up to date with the src directory.

To check formatting:

```bash
npm run check

npm run check:fix
```

Or if you want to check for any typechecking errors:

```bash
npm run typecheck
```
