# Tauri Frontend-Backend Integration

## Overview

This document details the comprehensive frontend-to-Rust IPC integration completed for the AutoMIDI desktop application. All UI components now use Tauri commands instead of WebSocket messages when running in Tauri mode.

## Architecture

### Dual-Mode Design

The application supports two runtime modes:
- **Tauri Desktop Mode**: Uses IPC commands to communicate with Rust backend
- **Web Browser Mode**: Uses WebSocket to communicate with Node.js server

Runtime detection via `isTauri()` function enables seamless switching between modes.

### Detection Layer

**File**: [src/tauri.ts](src/tauri.ts)

```typescript
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
```

This function checks if the `__TAURI__` global is present, indicating the app is running in Tauri context.

## Integration Points

### 1. MIDI Connection Layer

**File**: [src/useMidiConnection.ts](src/useMidiConnection.ts)

**Changes**:
- Automatically selects Tauri or WebSocket connection based on runtime
- Returns unified interface regardless of backend

```typescript
export function useMidiConnection() {
  if (isTauri()) {
    return useTauriMidiConnection();
  }
  // WebSocket fallback...
}
```

**Tauri Commands Used**:
- `listDevices` - Enumerate MIDI devices
- `setListening` - Enable/disable MIDI event listening
- `sendMidi` - Send MIDI messages to output device

### 2. Macro Execution

**File**: [src/useKeyMacroPlayer.ts](src/useKeyMacroPlayer.ts)

**Changes**:
- Detects Tauri mode when playing macros
- Routes shell/app/keys commands to Tauri IPC
- Routes MIDI data through Tauri `sendMidi` command

**Tauri Commands Used**:
- `runShell` - Execute shell command (visible terminal)
- `runShellWin` - Execute in new window
- `runShellBg` - Execute hidden background process
- `runApp` - Launch application
- `runKeys` - Simulate keyboard input
- `sendMidi` - Send MIDI data

```typescript
if (isTauri()) {
  // Shell commands
  if (macro.type === 'shell') {
    await invoke('runShell', { cmd: macro.command });
  }
  // Keyboard simulation
  else if (macro.type === 'keys') {
    await invoke('runKeys', { 
      keys: macro.sequence, 
      interval: macro.interval 
    });
  }
  // MIDI messages
  for (const bytes of macro.midiData) {
    await invoke('sendMidi', { port, bytes });
  }
} else {
  // WebSocket fallback...
}
```

### 3. File Operations

All file import/export operations now use native Tauri dialogs in desktop mode.

#### Config Export/Import

**File**: [src/ConfigManager.tsx](src/ConfigManager.tsx)

**Changes**:
- `exportConfig()` uses `saveFile()` + `writeTextFile()` in Tauri mode
- `importConfigTauri()` uses `openFile()` + `readTextFile()` for native file picker
- Falls back to browser blob download/FileReader in web mode

#### Macro Export/Import

**Files**: 
- [src/MacroExportButton.tsx](src/MacroExportButton.tsx)
- [src/MacroImportModal.tsx](src/MacroImportModal.tsx)

**Changes**:
- Export uses `saveFile()` dialog with `.json` filter
- Import shows native file picker with `openFile()`
- Conditional UI displays appropriate controls per mode

#### Settings Export/Import

**File**: [src/SettingsModal.tsx](src/SettingsModal.tsx)

**Changes**:
- `exportSettings()` async function with Tauri dialog support
- `importSettingsTauri()` handles native file picker
- Import button conditionally calls correct handler
- Extracted `applyImportedSettings()` for code reuse

### 4. Device Enumeration

**File**: [src/useMidi.ts](src/useMidi.ts)

**Changes**:
- Requests device list on mount and connection
- Enables MIDI listening automatically
- Works transparently with Tauri connection layer

```typescript
useEffect(() => {
  if (status === 'connected') {
    sendRaw({ type: 'listDevices' });
    sendRaw({ type: 'setListening', enabled: true });
  }
}, [status, sendRaw]);
```

### 5. Status Indicators

**File**: [src/ActionBar.tsx](src/ActionBar.tsx)

**Changes**:
- Displays "◆ TAURI DESKTOP MODE" indicator when in Tauri
- Shows "IPC" instead of "SOCKET" for connection type
- Hides reconnect button in Tauri mode (not applicable)

```tsx
{isTauri() && <span className="badge badge-tauri">◆ TAURI DESKTOP MODE</span>}
<span className={`badge badge-${statusColor}`}>
  {isTauri() ? 'IPC' : 'SOCKET'}
</span>
```

## API Reference

### Tauri Dialog Functions

**File**: [src/tauriDialogs.ts](src/tauriDialogs.ts)

#### saveFile()

Opens native save file dialog.

```typescript
interface SaveFileOptions {
  title?: string;
  filters?: FileFilter[];
  defaultPath?: string;
}

const filePath = await saveFile({
  title: 'Export Config',
  filters: [{ name: 'JSON', extensions: ['json'] }],
  defaultPath: 'config.json',
});
```

#### openFile()

Opens native file picker dialog.

```typescript
interface OpenFileOptions {
  title?: string;
  filters?: FileFilter[];
  multiple?: boolean;
}

const filePath = await openFile({
  title: 'Import Macro',
  filters: [{ name: 'JSON', extensions: ['json'] }],
});
```

#### readTextFile()

Reads text file contents.

```typescript
const content = await readTextFile(filePath);
const data = JSON.parse(content);
```

#### writeTextFile()

Writes text to file.

```typescript
const success = await writeTextFile(filePath, JSON.stringify(data, null, 2));
```

### Tauri Command Functions

**File**: [src/tauri.ts](src/tauri.ts)

#### invoke()

Invokes Tauri command with type-safe parameters.

```typescript
await invoke('runShell', { cmd: 'ls -la' });
await invoke('sendMidi', { port: 'device-id', bytes: [0x90, 0x3C, 0x7F] });
```

#### listen()

Listens for Tauri events from Rust backend.

```typescript
const unlisten = await listen<MidiEvent>('midi:event', (event) => {
  console.log('MIDI:', event.payload);
});
```

#### emit()

Emits events to Rust backend.

```typescript
await emit('request-devices');
```

## Message Types

### Shared Types

**File**: [shared/messages.ts](shared/messages.ts)

Extended with Tauri-specific message types:

```typescript
interface ListDevicesMessage {
  type: 'listDevices';
}

interface SetListeningMessage {
  type: 'setListening';
  enabled: boolean;
}

type ClientMessage = 
  | SendMessage 
  | ListDevicesMessage 
  | SetListeningMessage
  | /* ...other types */;
```

## UI Components Updated

### Complete Integration

All components now properly detect Tauri mode and use appropriate APIs:

1. ✅ **ConfigManager** - File import/export with native dialogs
2. ✅ **MacroExportButton** - Native save dialog
3. ✅ **MacroImportModal** - Native file picker
4. ✅ **SettingsModal** - Settings file operations
5. ✅ **ActionBar** - Mode indicator and status display
6. ✅ **useMidi** - Device enumeration on mount
7. ✅ **useKeyMacroPlayer** - Macro execution via IPC
8. ✅ **useMidiConnection** - Automatic connection selection

### WebSocket-Specific Settings

In Tauri mode, WebSocket configuration options are still available in settings but unused. The connection layer automatically routes to Tauri IPC, making these settings inactive in desktop mode.

## Testing

### Verify Tauri Integration

1. **Build and run Tauri app**:
   ```bash
   npm run tauri dev
   ```

2. **Check indicators**:
   - Status bar should show "◆ TAURI DESKTOP MODE"
   - Connection type should display "IPC" not "SOCKET"

3. **Test MIDI operations**:
   - Connect a MIDI device
   - Devices should enumerate automatically
   - Test sending MIDI messages
   - Verify events are received

4. **Test file operations**:
   - Export a config → should show native save dialog
   - Import a config → should show native file picker
   - Export macros → native dialog
   - Import macros → native dialog
   - Export settings → native dialog
   - Import settings → native dialog

5. **Test macro execution**:
   - Create key macro → should invoke via `runKeys`
   - Create shell macro → should invoke via `runShell`
   - Create MIDI macro → should invoke via `sendMidi`
   - Test macro chaining with `nextId`

6. **Verify fallback**:
   - Run `npm run dev` (web mode)
   - Should use WebSocket connection
   - Should use browser file APIs
   - No Tauri mode indicators

### Debug Tools

Open DevTools in Tauri:
- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

Check console for:
- `isTauri()` detection results
- IPC command invocations
- Event listener registrations

## Performance Notes

### IPC vs WebSocket

Tauri IPC offers several advantages:
- **Lower latency**: Direct process communication
- **Type safety**: Rust type checking on backend
- **No network overhead**: No TCP stack involved
- **Native APIs**: Direct OS integration

### MIDI Timing

MIDI operations in Tauri mode benefit from:
- Direct midir library access (no network layer)
- Rust's zero-cost abstractions
- Compiled performance vs interpreted JavaScript server

## Error Handling

All Tauri operations include proper error handling:

```typescript
try {
  const filePath = await saveFile({ title: 'Export' });
  if (filePath) {
    const success = await writeTextFile(filePath, data);
    if (success) {
      addToast('File saved', 'success');
    } else {
      addToast('Failed to write file', 'error');
    }
  }
} catch (error) {
  addToast(`Operation failed: ${error}`, 'error');
}
```

## Migration Status

### ✅ Completed

- Core Tauri utilities and detection
- MIDI connection abstraction layer
- Tauri-specific MIDI connection implementation
- Macro execution with IPC commands
- File operations with native dialogs
- Device enumeration on connection
- Status indicators for Tauri mode
- Settings import/export with dialogs
- Type-safe message definitions
- Error handling for all operations

### 🎯 Production Ready

The frontend-backend integration is complete and production-ready. All UI components properly detect runtime mode and use appropriate APIs. The dual-mode architecture allows the same codebase to run as:
- Native desktop app with Tauri IPC
- Web app with WebSocket server

## Code Quality

### TypeScript Status

All TypeScript compilation passes with no errors:
```bash
npm run build  # ✅ Success
```

### Type Safety

- All Tauri commands have proper type definitions
- Event payloads explicitly typed
- No `any` types in integration code
- Zustand store integration fully typed

## Next Steps

### Optional Enhancements

1. **Disable WebSocket settings in Tauri mode**
   - Gray out host/port/apiKey fields
   - Add tooltip: "Not used in desktop mode"

2. **Tauri-specific settings**
   - Window preferences (always on top, etc.)
   - Startup behavior options
   - Update check preferences

3. **Native notifications**
   - Already supported via `src/notify.ts`
   - Can be enhanced with custom styles

4. **System tray integration**
   - Minimize to tray option
   - Quick actions menu

5. **Auto-update mechanism**
   - Tauri updater plugin integration
   - Version checking and download

## Resources

- [Tauri Documentation](https://tauri.app)
- [Tauri IPC Reference](https://tauri.app/v1/guides/features/command)
- [Tauri Dialog API](https://tauri.app/v1/api/js/dialog)
- [Tauri File System](https://tauri.app/v1/api/js/fs)

## Support

For issues or questions about the Tauri integration:
1. Check existing GitHub issues
2. Review [TAURI_QUICKSTART.md](TAURI_QUICKSTART.md)
3. Review [TAURI_MIGRATION.md](TAURI_MIGRATION.md)
4. Open a new issue with "Tauri:" prefix

---

**Integration completed**: All frontend components fully connected to Rust backend via IPC. Dual-mode architecture supports both desktop and web deployments from single codebase.
