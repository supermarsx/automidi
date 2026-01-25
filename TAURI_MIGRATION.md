# Tauri Migration Implementation

This document describes the extensive Tauri conversion work completed for the AutoMIDI application.

## Overview

The application has been extensively converted to support Tauri, enabling it to run as a native desktop application with full MIDI capabilities, system integration, and persistent storage. The implementation maintains backward compatibility with the WebSocket-based architecture for development.

## Architecture

### Dual-Mode Operation

The application now operates in two modes:

1. **Tauri Mode** - Native desktop application with Rust backend
2. **WebSocket Mode** - Original web-based application for development

The mode is automatically detected at runtime using `isTauri()` from `src/tauri.ts`.

## Key Components

### 1. Environment Detection (`src/tauri.ts`)

Provides runtime detection and unified API access:

- `isTauri()` - Checks if running in Tauri environment
- `getTauriAPI()` - Returns Tauri API object
- `invoke()` - Wrapper for Tauri command invocation
- `listen()` - Wrapper for Tauri event listening
- `emit()` - Wrapper for Tauri event emission

### 2. MIDI Connection (`src/useTauriMidiConnection.ts`)

Replaces WebSocket communication with Tauri IPC:

- Converts all WebSocket messages to Tauri commands
- Handles MIDI device enumeration via `midi_list_devices`
- Sends MIDI data via `midi_send` command
- Listens for MIDI events via `midi:event` event
- Monitors device changes via `midi:devices` event
- Streams shell output via `shell:output` event

**Integration Point:** `src/useMidiConnection.ts` automatically uses Tauri or WebSocket based on environment.

### 3. Persistence Layer

#### Tauri Store (`src/tauriStore.ts`)

Persistent storage using Tauri's Store plugin:

- `saveSettings()` / `loadSettings()` - Application settings
- `saveMacros()` / `loadMacros()` - MIDI macros
- `saveConfigs()` / `loadConfigs()` - Launchpad configurations
- `savePads()` / `loadPads()` - Pad configurations
- `clearStore()` - Clear all stored data

#### Persistence Hooks (`src/useTauriPersistence.ts`)

Automatic Zustand ↔ Tauri Store synchronization:

- `useLoadTauriStore()` - Loads data on mount
- `usePersistSettings()` - Auto-saves settings (500ms debounce)
- `usePersistMacros()` - Auto-saves macros (500ms debounce)
- `usePersistConfigs()` - Auto-saves configs (500ms debounce)
- `usePersistPads()` - Auto-saves pads (500ms debounce)
- `useTauriPersistence()` - Combined hook (used in `App.tsx`)

### 4. File System Operations (`src/tauriDialogs.ts`)

Native file dialogs and file I/O:

- `openFile()` - File picker dialog
- `saveFile()` - Save file dialog
- `readTextFile()` - Read text file
- `writeTextFile()` - Write text file
- `showMessage()` - Native message dialog
- `showConfirm()` - Native confirmation dialog

### 5. Window Management (`src/tauriWindow.ts`)

Native window controls:

- `minimizeWindow()` / `maximizeWindow()` / `toggleMaximize()`
- `closeWindow()` / `showWindow()` / `hideWindow()`
- `setWindowTitle()` / `setAlwaysOnTop()`
- `getWindowPosition()` / `setWindowPosition()`
- `getWindowSize()` / `setWindowSize()`
- `focusWindow()` / `isMaximized()`

### 6. Notifications (`src/notify.ts`)

Updated to use native OS notifications:

- Automatically uses `notify` Tauri command when in Tauri mode
- Falls back to WebSocket message when in web mode
- Displays toast on failure

### 7. Unified API (`src/tauriApi.ts`)

Single import point for all Tauri functionality. Import everything from here:

```typescript
import { isTauri, invoke, openFile, useTauriPersistence } from './tauriApi';
```

## Rust Backend

### Commands Implemented (`src-tauri/src/lib.rs`)

#### MIDI Commands

- `midi_list_devices()` - Enumerate MIDI inputs/outputs
- `midi_send(portId, bytes)` - Send MIDI data to output
- `midi_set_listening(enabled)` - Enable/disable MIDI input listening

#### System Commands

- `run_app(appPath)` - Launch application
- `run_shell(cmd)` - Execute shell command with output streaming
- `run_shell_bg(cmd)` - Execute shell command in background
- `run_shell_win(cmd)` - Execute shell command in new window
- `keys_type(sequence, interval)` - Type key sequences
- `notify(title, message)` - Show OS notification
- `ping(ts)` - Ping/pong for latency measurement

#### Events Emitted

- `midi:event` - MIDI message received or sent
- `midi:devices` - Device list changed (hot-plug detection)
- `shell:output` - Shell command output line

### Plugins Initialized

- `tauri-plugin-log` - Logging
- `tauri-plugin-notification` - OS notifications
- `tauri-plugin-dialog` - File dialogs
- `tauri-plugin-fs` - File system access
- `tauri-plugin-store` - Persistent key-value store

### Security Features

- **Command allowlist** - Only pre-approved commands can run
- **Input validation** - Rejects shell injection characters (`;`, `&`, `|`, etc.)
- **Rate limiting** - Token bucket (5 commands/second by default)
- **Environment-based config** - `ALLOWED_CMDS`, `CMD_RATE_LIMIT`, `CMD_RATE_INTERVAL_MS`

## Usage Examples

### Checking Environment

```typescript
import { isTauri } from './tauriApi';

if (isTauri()) {
  console.log('Running as native desktop app');
} else {
  console.log('Running in web mode');
}
```

### Invoking Commands

```typescript
import { invoke } from './tauriApi';

// Send MIDI data
await invoke('midi_send', { portId: '0', bytes: [0x90, 0x3c, 0x7f] });

// Launch application
await invoke('run_app', { appPath: 'notepad.exe' });
```

### Using Persistence

```typescript
// In App.tsx or top-level component
import { useTauriPersistence } from './tauriApi';

function App() {
  useTauriPersistence(); // Enables auto-sync with Tauri Store
  // ... rest of component
}
```

### File Operations

```typescript
import { openFile, readTextFile, writeTextFile } from './tauriApi';

// Open file picker
const filePath = await openFile({
  title: 'Select Macro File',
  filters: [{ name: 'JSON', extensions: ['json'] }],
});

if (filePath) {
  const content = await readTextFile(filePath);
  console.log(content);
}
```

### Window Management

```typescript
import { minimizeWindow, setWindowTitle } from './tauriApi';

await setWindowTitle('AutoMIDI - Editing Mode');
await minimizeWindow();
```

## Migration Path

### For Developers

1. **No changes required for existing code** - The dual-mode architecture maintains backward compatibility
2. **New features** - Use Tauri APIs from `src/tauriApi.ts` for new functionality
3. **Testing** - Test in both modes:
   - Web: `npm run dev` (Vite dev server)
   - Tauri: `npm run tauri dev` (if configured)

### For Production

1. Build Tauri app: `cargo build --release` in `src-tauri/`
2. Package application using Tauri bundler
3. Distribute native executables for Windows/macOS/Linux

## Benefits

### Performance

- **Native execution** - No browser overhead
- **Direct MIDI access** - Lower latency than WebMIDI
- **Faster startup** - Native app vs browser page load

### Features

- **Persistent storage** - Data survives app restarts
- **System integration** - OS notifications, file dialogs, shell execution
- **Window control** - Minimize, maximize, always-on-top
- **Security** - Command allowlisting and rate limiting

### Distribution

- **Single executable** - No need for separate server
- **Auto-updates** - Can use Tauri updater plugin
- **Cross-platform** - Build for Windows, macOS, Linux

## Remaining Work

See `TODO_TAURI_NEXT16.md` for detailed remaining tasks:

- [ ] Environment variable replacement for Vite-specific code
- [ ] Frontend test updates for Tauri IPC mocking
- [ ] IndexedDB to Tauri Store migration script
- [ ] Settings schema validation
- [ ] Complete SysEx test fixtures
- [ ] Remove Node backend dependencies (Phase 7)
- [ ] Packaging and distribution setup (Phase 8)

## Files Created/Modified

### New Files

- `src/tauri.ts` - Core Tauri utilities
- `src/tauriStore.ts` - Persistent storage wrapper
- `src/tauriDialogs.ts` - File system and dialog utilities
- `src/tauriWindow.ts` - Window management utilities
- `src/tauriApi.ts` - Unified API exports
- `src/useTauriMidiConnection.ts` - Tauri MIDI connection hook
- `src/useTauriPersistence.ts` - Store synchronization hooks

### Modified Files

- `src/useMidiConnection.ts` - Added Tauri mode detection
- `src/notify.ts` - Added Tauri notification support
- `src/App.tsx` - Added persistence hook
- `src-tauri/Cargo.toml` - Added Store plugin
- `src-tauri/src/lib.rs` - Initialized Store plugin
- `TODO_TAURI_NEXT16.md` - Updated progress

## Configuration

### Rust Environment Variables

Set in `.env` or system environment:

```bash
# Comma-separated list of allowed commands
ALLOWED_CMDS=notepad,calc,ffmpeg,ls,dir

# Rate limiting
CMD_RATE_LIMIT=5
CMD_RATE_INTERVAL_MS=1000
```

### Tauri Store Location

Data stored in platform-specific locations:

- **Windows:** `%APPDATA%\com.automidi.app\automidi.json`
- **macOS:** `~/Library/Application Support/com.automidi.app/automidi.json`
- **Linux:** `~/.config/com.automidi.app/automidi.json`

## Testing

### Manual Testing Checklist

- [ ] MIDI device detection
- [ ] MIDI send/receive
- [ ] Macro execution
- [ ] Settings persistence
- [ ] File import/export
- [ ] OS notifications
- [ ] Keyboard automation
- [ ] Shell command execution
- [ ] Window controls

### Automated Testing

Run tests with:

```bash
npm test
```

Note: Some tests may need updates to mock Tauri APIs instead of WebSockets.

## Troubleshooting

### "Tauri API not available"

- Check if running in Tauri with `isTauri()`
- Verify `window.__TAURI__` exists in browser console
- Ensure running via `npm run tauri dev`

### "Command not allowed"

- Add command to `ALLOWED_CMDS` environment variable
- Check for shell injection characters in command

### "Rate limit exceeded"

- Reduce command frequency
- Increase `CMD_RATE_LIMIT` environment variable

### Persistence not working

- Check Tauri Store plugin is initialized
- Verify `useTauriPersistence()` is called in `App.tsx`
- Check console for store errors

## Future Enhancements

- [ ] Auto-update support with `tauri-plugin-updater`
- [ ] System tray integration
- [ ] Global keyboard shortcuts
- [ ] MIDI device hot-reload improvements
- [ ] Multi-window support
- [ ] Native menu bar
- [ ] Crash reporting
- [ ] Analytics (opt-in)

## Contributing

When adding new features that interact with the system:

1. Add Tauri command in `src-tauri/src/lib.rs`
2. Add TypeScript wrapper in appropriate `tauri*.ts` file
3. Export from `src/tauriApi.ts`
4. Update this documentation
5. Add tests for both Tauri and WebSocket modes

## License

See main project LICENSE file.
