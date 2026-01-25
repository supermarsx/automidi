# Migration TODO: Tauri (Rust) + Next.js 16

Status: Draft plan for migration

## Phase 0 - Discovery and inventory

- [ ] Catalogue all UI surfaces and flows in the current app.
- [ ] List all WebSocket message types and the screens that use them.
- [ ] Inventory settings keys and defaults in `SettingsModal` and stores.
- [ ] Map MIDI features: devices, send, listen, logging, and sysex helpers.
- [ ] Identify external dependencies to replace in Rust (node-key-sender,
      toasted-notifier, WebMidi, child_process).
- [ ] Document required environment variables and how they map to Tauri config.
- [ ] Capture current automated tests and gaps to port/replace.

## Phase 1 - Repository structure and scaffolding

- [ ] Decide the target layout:
      - Option A: keep Next app at repo root and add `src-tauri/`.
      - Option B: move Next app to `apps/desktop/` and keep shared code in
        `shared/`.
- [ ] Initialize Tauri and confirm it can load a Next dev server.
- [ ] Scaffold Next.js 16 App Router with TypeScript.
- [ ] Configure a static output or compatible Tauri dev/build pipeline.
- [ ] Set up shared TS config and path aliases for `shared/` modules.
- [ ] Add a minimal `@tauri-apps/api` bridge and smoke test commands.

## Phase 2 - Rust backend (MIDI core)

- [ ] Select a MIDI crate (midir recommended) and confirm SysEx support.
- [ ] Implement device enumeration for inputs and outputs.
- [ ] Implement send MIDI bytes to output by id.
- [ ] Implement MIDI input listening and event emission to the frontend.
- [ ] Add hot-plug detection and emit `midi:devices` events.
- [ ] Mirror the current message schema from `server/messages`.
- [ ] Add outgoing MIDI event echo for logger parity.
- [ ] Add unit tests for byte validation and port selection logic.

## Phase 3 - Backend utilities (parity with server features)

- [ ] Implement OS notifications (Tauri plugin).
- [ ] Implement keystroke automation (evaluate `enigo` or `rdev`).
- [ ] Implement app launch and shell execution using Tauri shell.
- [ ] Enforce allowlist rules and basic injection protections.
- [ ] Add rate limiting for command execution (token bucket).
- [ ] Implement `shell:output` event streaming.

## Phase 4 - Frontend migration to Next.js 16

- [ ] Port global styles, CSS modules, and assets into Next layout.
- [ ] Convert entry point to App Router (`app/layout.tsx`, `app/page.tsx`).
- [ ] Replace Vite-specific env usage with Next `process.env` or runtime config.
- [ ] Replace WebSocket client with Tauri IPC hooks.
- [ ] Create a `useTauriMidi` adapter mirroring `useMidiConnection`.
- [ ] Update `socket.ts`, `useWebSocket.ts`, and call sites.
- [ ] Validate all panels: LaunchpadCanvas, MacroBuilder, Logger, Settings.
- [ ] Ensure keyboard and pointer behavior matches current app.

## Phase 5 - Data and persistence

- [ ] Decide macro storage location (keep IndexedDB or move to Tauri Store).
- [ ] If moving, write a one-time migration from existing IndexedDB data.
- [ ] Add file import/export for macros using Tauri file dialogs.
- [ ] Store settings via Tauri Store with schema validation.

## Phase 6 - Launchpad X and SysEx parity

- [ ] Verify all SysEx builders produce identical byte arrays.
- [ ] Ensure programmer mode activation is triggered on connect.
- [ ] Validate pad color selection and channel-based modes.
- [ ] Add test fixtures for common SysEx payloads.

## Phase 7 - Decommission Node backend

- [ ] Remove server dependencies from package.json.
- [ ] Delete or archive `server/` once Rust parity is verified.
- [ ] Update scripts (`npm run dev`, `npm run server`) to new workflow.

## Phase 8 - QA, packaging, and release

- [ ] Add integration smoke tests for MIDI send/receive in dev builds.
- [ ] Create a manual test checklist for each platform.
- [ ] Verify packaging, code signing, and auto-update strategy (if needed).
- [ ] Validate performance and cold start times.
- [ ] Update documentation and onboarding steps.
