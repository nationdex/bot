# Nationdex 2026 Standalone Binaries

Standalone native executables for Project Nationdex 2026, compiled with Bun.
All required native graphic engines (Skia & GIFSX) are bundled inside.
No Node.js, Bun, Go, or build tools are required on the host system to run these.

---

## Included Binaries

| Binary File | Target Platform | Description |
| :--- | :--- | :--- |
| `nationdex-bot-linux-arm64.tar.gz` | Linux ARM64 (glibc) | **Galaxy Tab S10 Lite, PRoot Ubuntu, Raspberry Pi 4/5, ARM64 servers** |
| `nationdex-bot-linux-arm64-musl` | Linux ARM64 (musl) | iSH (iOS) & Alpine Linux ARM64 |
| `nationdex-bot-linux-x64.tar.gz` | Linux x86_64 (glibc) | Standard Ubuntu, Debian, Arch, Fedora x86_64 |
| `nationdex-bot-windows-x64.exe` | Windows x86_64 | Windows 10/11 64-bit |

---

## How to Run on Android (PRoot-Distro / Galaxy Tab S10 Lite)

```bash
# 1. Pull the latest files
git pull origin dev

# 2. Extract the ARM64 binary
tar -xzf binaries/nationdex-bot-linux-arm64.tar.gz -C binaries

# 3. Make executable (if needed)
chmod +x binaries/nationdex-bot-linux-arm64

# 4. Run inside PRoot Ubuntu (or from Termux via 1-liner):
proot-distro login ubuntu -- ./binaries/nationdex-bot-linux-arm64
```
*(Zero npm commands, zero build tools, zero optional dependency bugs!)*

---

## How to Run on Linux x86_64
```bash
tar -xzf binaries/nationdex-bot-linux-x64.tar.gz -C binaries
chmod +x binaries/nationdex-bot-linux-x64
./binaries/nationdex-bot-linux-x64
```

---

## How to Run on Windows
```powershell
.\binaries\nationdex-bot-windows-x64.exe
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
