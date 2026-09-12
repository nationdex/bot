# Nationdex 2026 Standalone Binaries

Standalone native executables for Project Nationdex 2026, compiled with Bun.
No Node.js, Bun, Go, or build tools are required on the host system to run these.

---

## Included Binaries

| Binary File | Target Platform | C Library | Use Cases |
| :--- | :--- | :--- | :--- |
| `nationdex-bot-linux-arm64` | Linux ARM64 | `glibc` | **Native Termux (via `glibc-runner`)**, Galaxy Tab S10 Lite, Raspberry Pi 4/5, ARM64 servers |
| `nationdex-bot-linux-arm64-musl` | Linux ARM64 | `musl` | **iSH (iOS)**, Alpine Linux ARM64, Termux `gcompat` |
| `nationdex-bot-linux-x64.tar.gz` | Linux x86_64 | `glibc` | Standard Ubuntu, Debian, Arch, Fedora x86_64 |
| `nationdex-bot-windows-x64.exe` | Windows x86_64 | MSVC/Win32 | Windows 10/11 64-bit |

---

## How to Run in Native Termux (Without PRoot)

Android uses Bionic libc instead of standard GNU libc, so running standard Linux ELF binaries natively in Termux requires the official Termux `glibc-runner` package:

1. In native Termux, install `glibc-runner`:
   ```bash
   pkg install glibc-runner
   ```
2. Make the binary executable:
   ```bash
   chmod +x nationdex-bot-linux-arm64
   ```
3. Run directly with `grun`:
   ```bash
   grun ./nationdex-bot-linux-arm64
   ```
   *(No PRoot, no container, no root required!)*

---

## How to Run in iSH / Alpine Linux

iSH runs Alpine Linux which uses the `musl` standard library. Run the musl-targeted binary directly:
```bash
chmod +x nationdex-bot-linux-arm64-musl
./nationdex-bot-linux-arm64-musl
```

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
