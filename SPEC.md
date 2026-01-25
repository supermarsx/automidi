# Automidi Desktop Spec (Tauri + Next 16)

Status: Draft (migration target)

## Overview

Automidi will move from a Vite + React web app with a Node MIDI server to a
Tauri desktop app with a Next.js 16 frontend and a Rust MIDI backend.

## Goals

- Ship a cross-platform desktop app for Windows, macOS, and Linux.
- Replace the Node server with a Rust backend that handles MIDI I/O.
- Preserve existing UI features and workflows (Launchpad X, macros, logging).
- Eliminate local HTTP/WebSocket dependencies in favor of Tauri IPC.
- Keep data local, with predictable storage and export paths.

## Non-goals

- Building a hosted web version of the app.
- Adding cloud sync or user accounts during this migration.
- Reworking the UI or interaction model beyond compatibility updates.

## Target stack

- Frontend: Next.js 16 (App Router), React 19, TypeScript.
- Desktop runtime: Tauri (current stable).
- Backend: Rust 2021, MIDI via a Rust crate (midir preferred).
- Storage: Renderer-side IndexedDB for macros (initially), Tauri Store for
  settings and preferences.

## Architecture

- The Next.js UI runs in the Tauri webview.
- Rust exposes Tauri commands for one-off actions and emits events for streams.
- MIDI input events and device change notifications are emitted as Tauri events.
- No local HTTP server is required in production.

## Core features (parity requirements)

- Device discovery (inputs/outputs) with hot-plug updates.
- Send MIDI bytes to a selected output.
- Receive incoming MIDI messages with timestamps and metadata.
- Launchpad X programmer mode support and color controls.
- MIDI logger with filtering and log limits.
- Macro recording, editing, playback, and looping.
- Sysex workbench for custom messages.
- Notifications to the OS.
- Shell/app launch and keystroke automation with allowlist + rate limits.
- Connection status and retry logic surfaced in settings.

## IPC API (draft)

Commands:
- `midi_list_devices() -> { inputs, outputs }`
- `midi_send(port_id, bytes[])`
- `midi_set_listening(enabled: bool)`
- `notify(title, message)`
- `keys_type(sequence[], interval_ms)`
- `shell_run(cmd, mode)` where mode = `foreground|background|windowed`
- `app_launch(path)`
- `ping(ts) -> pong`

Events:
- `midi:devices` (full device list)
- `midi:event` (incoming or outgoing MIDI event)
- `shell:output` (stdout/stderr chunks)
- `app:log` (backend log messages as needed)

## Data model

Settings:
- API key (if retained for internal auth), log limits, reconnect behavior,
  MIDI logging toggles, shell allowlist.

Macros:
- Name, steps array (bytes or actions), timing, loop settings, metadata.
- Stored in IndexedDB for compatibility; export/import via file dialogs.

## Security

- Shell/app execution is allowlisted and rate limited.
- Tauri capabilities explicitly restrict file, shell, and notification access.
- MIDI access is local only; no network exposure by default.

## Build and release

- Dev: `next dev` + `tauri dev`.
- Prod: `next build` + `next export` (or static output) + `tauri build`.
- CI builds per platform with signed artifacts where possible.

## Testing

- Rust unit tests for MIDI message parsing and allowlist validation.
- Frontend unit tests for stores and macro playback.
- Manual integration tests for device discovery and sysex send.
