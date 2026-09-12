# Nationdex 2026 Standalone Binaries

Standalone native executables for Project Nationdex 2026, compiled with Bun.
No Node.js, Bun, Go, or build tools are required on the host system to run these.

---

## Included Binaries

| Binary File | Target Platform | Architecture / C Lib | Use Cases |
| :--- | :--- | :--- | :--- |
| `nationdex-bot-linux-arm64` | Linux ARM64 | `aarch64` (glibc) | **Termux (PRoot Ubuntu / glibc)**, Galaxy Tab S10 Lite, Raspberry Pi 4/5, ARM64 servers |
| `nationdex-bot-linux-x64.tar.gz` | Linux x86_64 | `x86_64` (glibc) | Standard Ubuntu, Debian, Arch, Fedora x86_64 |
| `nationdex-bot-windows-x64.exe` | Windows x86_64 | `x86_64` | Windows 10/11 64-bit |

---

## How to Run

### 1. Requirements in the Run Directory
Every binary expects the following files in the same working directory from which it is executed:
1. **`.env`**: A text file containing your Discord bot token:
   ```env
   TOKEN=your_discord_bot_token_here
   ```
2. **`assets/`**: The directory containing fonts, card frames, and graphics (from the root of the repository).

### 2. Running on Android / Termux PRoot (Galaxy Tab S10 Lite)
```bash
# Inside Termux PRoot Ubuntu:
chmod +x nationdex-bot-linux-arm64
./nationdex-bot-linux-arm64
```

### 3. Running on Linux x86_64
```bash
tar -xzf nationdex-bot-linux-x64.tar.gz
chmod +x nationdex-bot-linux-x64
./nationdex-bot-linux-x64
```

### 4. Running on Windows
```powershell
.\nationdex-bot-windows-x64.exe
```

---

## Security & Isolation
- **No credentials or tokens are bundled into any binary.**
- **No database files are bundled into any binary.**
- Databases (`./database`) and `.env` configs are loaded locally at runtime from disk.
