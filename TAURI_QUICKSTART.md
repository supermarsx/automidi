# Tauri Quick Start Guide

This guide will help you get started with the Tauri version of AutoMIDI.

## Prerequisites

### Install Rust

Visit https://rustup.rs/ and follow the instructions for your platform.

**Windows:**
```powershell
# Install Rust
winget install Rustlang.Rustup

# Or download from https://rustup.rs/
```

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Install System Dependencies

**Windows:**
- Install Microsoft Visual Studio (Community edition is fine)
- Or install Microsoft C++ Build Tools

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

## Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

#### Option A: Tauri Desktop App (Recommended)

```bash
npm run dev:tauri
```

This will:
- Build the Rust backend
- Start the Vite dev server
- Launch the Tauri window
- Enable hot-reload for both frontend and backend

#### Option B: Web Mode (Original)

```bash
npm run dev
```

This will:
- Start the Node.js server
- Start the Vite dev server
- Open in browser at http://localhost:5173

### 3. Build for Production

#### Tauri Desktop App

```bash
npm run build:tauri
```

Output will be in `src-tauri/target/release/bundle/`

#### Web Version

```bash
npm run build
```

Output will be in `dist/`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Allowed commands for shell execution (comma-separated)
ALLOWED_CMDS=notepad,calc,ffmpeg,ls,dir,code

# Rate limiting for command execution
CMD_RATE_LIMIT=5
CMD_RATE_INTERVAL_MS=1000

# MIDI logging (optional)
LOG_MIDI=false
```

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to customize:

- App name and version
- Window size and decorations
- Bundle identifier
- Icon and resources
- Build settings

## Usage

### Detecting Tauri Mode

```typescript
import { isTauri } from './tauriApi';

if (isTauri()) {
  console.log('Running as desktop app');
} else {
  console.log('Running in web mode');
}
```

### Sending MIDI

```typescript
import { invoke } from './tauriApi';

// In Tauri mode
await invoke('midi_send', {
  portId: '0',
  bytes: [0x90, 0x3c, 0x7f], // Note On, Middle C, Velocity 127
});

// Or use the existing useMidi hook (works in both modes)
import { useMidi } from './useMidi';

function MyComponent() {
  const { send } = useMidi();
  
  const playNote = () => {
    send([0x90, 0x3c, 0x7f]);
  };
  
  return <button onClick={playNote}>Play Note</button>;
}
```

### File Operations

```typescript
import { openFile, readTextFile, writeTextFile, saveFile } from './tauriApi';

// Open a file
const filePath = await openFile({
  title: 'Select Macro File',
  filters: [{ name: 'JSON', extensions: ['json'] }],
});

if (filePath) {
  // Read file
  const content = await readTextFile(filePath);
  const data = JSON.parse(content);
  
  // Process data...
  
  // Save file
  const savePath = await saveFile({
    title: 'Save Macro File',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  
  if (savePath) {
    await writeTextFile(savePath, JSON.stringify(data, null, 2));
  }
}
```

### Window Management

```typescript
import {
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  setWindowTitle,
} from './tauriApi';

// Update window title
await setWindowTitle('AutoMIDI - Recording Mode');

// Minimize
await minimizeWindow();

// Maximize
await maximizeWindow();

// Close
await closeWindow();
```

### Persistent Storage

Data is automatically persisted when using the store. The `useTauriPersistence()` hook is already set up in `App.tsx`.

```typescript
import { useStore } from './store';

function MyComponent() {
  const settings = useStore((s) => s.settings);
  const setTheme = useStore((s) => s.setTheme);
  
  // This change will be automatically saved to disk
  const changeTheme = () => {
    setTheme('dark');
  };
  
  return <button onClick={changeTheme}>Dark Mode</button>;
}
```

## Debugging

### Rust Console

Rust logs appear in the terminal where you ran `npm run dev:tauri`.

Add debug prints in Rust:
```rust
eprintln!("Debug: {:#?}", some_variable);
```

### Frontend Console

Open the browser dev tools in the Tauri window:
- Right-click → Inspect Element
- Or keyboard shortcut: F12 (Windows/Linux), Cmd+Option+I (macOS)

### Rust Backend Debugging

In `src-tauri/src/lib.rs`, debug mode is enabled by default:

```rust
if cfg!(debug_assertions) {
  app.handle().plugin(
    tauri_plugin_log::Builder::default()
      .level(log::LevelFilter::Info)
      .build(),
  )?;
}
```

## Common Issues

### "Failed to init MIDI input/output"

**Cause:** No MIDI devices connected or permissions issue

**Solution:**
- Connect a MIDI device
- On macOS, grant microphone permissions in System Preferences
- Restart the app

### "Command not allowed"

**Cause:** Command not in allowlist

**Solution:**
Add command to `ALLOWED_CMDS` in `.env`:
```bash
ALLOWED_CMDS=notepad,calc,your-command-here
```

### "Rate limit exceeded"

**Cause:** Too many commands executed too quickly

**Solution:**
Increase rate limit in `.env`:
```bash
CMD_RATE_LIMIT=10
CMD_RATE_INTERVAL_MS=1000
```

### Build fails on Windows

**Cause:** Missing Visual Studio or C++ build tools

**Solution:**
Install Visual Studio Community with C++ development tools:
https://visualstudio.microsoft.com/downloads/

### "webkit2gtk not found" (Linux)

**Cause:** Missing system dependencies

**Solution:**
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- src/useMidi.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

## Distribution

### Build Release Binary

```bash
npm run build:tauri
```

Binaries will be in:
- **Windows:** `src-tauri/target/release/bundle/msi/`
- **macOS:** `src-tauri/target/release/bundle/dmg/`
- **Linux:** `src-tauri/target/release/bundle/deb/` or `appimage/`

### Code Signing (Optional)

For production releases, configure code signing in `tauri.conf.json`:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256"
    },
    "macOS": {
      "signingIdentity": "YOUR_SIGNING_IDENTITY"
    }
  }
}
```

## Next Steps

1. Read [TAURI_MIGRATION.md](./TAURI_MIGRATION.md) for detailed architecture
2. Check [TODO_TAURI_NEXT16.md](./TODO_TAURI_NEXT16.md) for remaining tasks
3. See [SPEC.md](./SPEC.md) for feature specifications
4. Review [agents.md](./agents.md) for development workflow

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Programming Language](https://www.rust-lang.org/learn)
- [midir MIDI Library](https://docs.rs/midir/)

## Support

For issues and questions:
1. Check existing GitHub issues
2. Review error logs in console
3. Enable debug logging in Rust
4. Create a new issue with full error details

## Contributing

See the main project README for contribution guidelines.
