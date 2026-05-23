# Project Nationdex 2.0 🇪🇺

**The legacy nostalgic OG environment of Nationdex reinvented in 2026!**

Behold, one of the oldest Ballsdex-like bots in existence, created in December 2022 as a legitimate Ballsdex alternative in Bot Designer for Discord, with `arielaram` and `lukde22r` as the original founders!

Join our cause at the Nationdex [headquarters](https://dsc.nationdex.com/)!

## ⚙️ Setup:
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

## 🛠️ Troubleshooting:

⚠️ Sometimes you remove a command from the src directory but it still shows up on discord. In that case, run:

```bash
npm run fix
```

This will recreate the dist directory, up to date with the src directory.

To check formatting:

```bash
npm run check
```

Or if you want to check for any typechecking errors:

```bash
npm run typecheck
```
