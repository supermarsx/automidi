![image](https://github.com/user-attachments/assets/010b9f3d-9d22-4e4c-b033-274f3ef24bd2)

# automidi

**automidi** is a Vite + React application that provides a simple interface for
controlling MIDI devices. When a Launchpad X is detected the app automatically
switches the controller into _Programmer_ mode so that every pad can be
addressed individually.

## Setup

Install dependencies before running any lint or build steps:

```bash
npm run setup
```

This script simply runs `npm install` to fetch all project packages.

---

## Node server

The project ships with a small Node server that exposes MIDI devices to the
browser. It must be running for the React frontend to communicate with your
hardware.

Start it with:

```bash
npm run server
```

It listens on port `3000` and still exposes two REST endpoints for
compatibility:

- `GET /midi/devices` – lists available MIDI inputs and outputs
- `POST /midi/send` – sends a raw MIDI message to a specified output

  A WebSocket on the same port handles the communication used by the frontend.
  When a client connects it sends the current device list and it pushes `devices`
  events whenever ports change. Incoming MIDI messages are forwarded as `midi`
  events so the UI can react in real time. Device listings, outgoing MIDI messages
  and automation commands are all transmitted over this socket as implemented in
  `useMidiConnection.ts` and `useKeyMacroPlayer.ts`.

  The frontend's **Settings** panel controls reconnection behavior. Setting
  _Max reconnect attempts_ to `0` or a negative value removes the limit and the
  client will continue retrying indefinitely.

### API key

Every request to the server, including WebSocket connections, must include the
server's API key. When the server starts it prints this key to the console. You
can also set it explicitly via the `API_KEY` environment variable. Configure the
frontend in the **Settings** panel so the `API key` field matches the value
logged by the server. A mismatched key will result in the connection being
rejected with a `401` response.

### Shell command security

The server exposes endpoints that can execute local shell commands. To avoid
accidental or malicious use these routes now validate commands against a
whitelist defined in the `ALLOWED_CMDS` environment variable. Commands that do
not match the whitelist or contain characters commonly used for injection are
rejected with a `403` response.

Example:

```bash
ALLOWED_CMDS="ffmpeg,ls" npm run server
```

Only `ffmpeg` and `ls` will be accepted by `/run/shell*` routes. Review your
allowed commands carefully as running arbitrary processes can compromise your
system.

### MIDI logging

By default the server keeps MIDI logging quiet. Set the `LOG_MIDI` environment
variable to `true` to print incoming and outgoing MIDI messages along with
device events to the console.

---

## Development workflow

1. Install dependencies with `npm install`.
2. Start the development servers with `npm run dev`. This launches both the backend and Vite dev server concurrently.
3. Visit <http://localhost:5173> and start playing with your MIDI gear.

For a production build run `npm run build`. The output is placed in `dist/` and
can be previewed locally using `npm run preview`.

---

## Launchpad X features

- The **LaunchpadCanvas** component mirrors the Launchpad X layout allowing you
  to set pad colours via colour pickers. Pad changes are sent as note or CC
  messages.
- When a Launchpad X is connected the app sends the required SysEx to enter
  Programmer mode automatically.
- Top and side pads are mapped to CC numbers while the main grid is mapped to
  notes, letting you experiment with lighting and macros.
  Color modes are chosen independently via the MIDI channel:
  - **Channel 1** (`0x90`/`0xB0`) for static colours
  - **Channel 2** (`0x91`/`0xB1`) for flashing colours
  - **Channel 3** (`0x92`/`0xB2`) for pulsing colours
  - Each pad's side panel now offers colour pickers for **STATIC**, **FLASH**
    and **PULSE** modes. Selecting a mode button sends the chosen colour on the
    corresponding channel so modes can be mixed across the grid.

---

## MIDI macros

Recorded or hand written macros can be managed from the **Macros** panel.
Messages and timing are persisted in IndexedDB using Zustand. The
**MacroEditor** offers a simple timeline view or raw JSON editing. Macros can be
played back with optional looping and tempo control.

The **Sysex Workbench** helper builds Launchpad SysEx messages and is handy for
testing device specific commands.

---

## Useful scripts

- `npm run dev` – start both the backend and Vite dev server
- `npm run setup` – install all dependencies
- `npm run build` – build the React application for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint
- `npm run format` – run Prettier
- `npm run server` – start only the MIDI backend
- `npm test` – compile the server then run all tests with Vitest
