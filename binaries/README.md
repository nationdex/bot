# Nationdex 2026 Standalone Binaries

Standalone native executables for Project Nationdex 2026, compiled with Bun.
No Node.js, Bun, Go, or build tools are required on the host system to run these.

---

## Included Binaries & Native Addons

| File | Target Platform | Description |
| :--- | :--- | :--- |
| `nationdex-bot-linux-arm64` | Linux ARM64 | Precompiled bot executable for ARM64 (Galaxy Tab, PRoot Ubuntu, Raspberry Pi) |
| `skia.linux-arm64-gnu.node` | Linux ARM64 | Precompiled Skia canvas rendering library (auto-detected by bot) |
| `gifsx.linux-arm64-gnu.node` | Linux ARM64 | Precompiled GIF processing library (auto-detected by bot) |
| `nationdex-bot-linux-arm64-musl` | Linux ARM64 | For iSH (iOS) & Alpine Linux ARM64 |
| `nationdex-bot-linux-x64.tar.gz` | Linux x86_64 | Standard Ubuntu, Debian, Arch, Fedora x86_64 |
| `nationdex-bot-windows-x64.exe` | Windows x86_64 | Windows 10/11 64-bit |

---

## How to Run on Android (PRoot-Distro)

```bash
# 1. Pull the latest files
git pull origin dev

# 2. Enter PRoot Ubuntu (or run via 1-liner from Termux):
proot-distro login ubuntu -- ./binaries/nationdex-bot-linux-arm64
```
*(The bot will automatically detect `skia.linux-arm64-gnu.node` and initialize the canvas engine with zero manual configuration!)*

---

## How to Run on Linux x86_64
```bash
tar -xzf nationdex-bot-linux-x64.tar.gz
chmod +x nationdex-bot-linux-x64
./nationdex-bot-linux-x64
```

---

## How to Run on Windows
```powershell
.\nationdex-bot-windows-x64.exe
```

---

## Environment & Database
Every binary loads:
- **`.env`** from the current working directory for your bot credentials:
  ```env
  TOKEN=your_bot_token_here
  ```
- **`assets/`** from the current working directory for card templates and fonts.
- **`database/`** is initialized locally on disk wherever the binary is executed.
