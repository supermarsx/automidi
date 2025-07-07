![image](https://github.com/user-attachments/assets/010b9f3d-9d22-4e4c-b033-274f3ef24bd2)

# automidi

**automidi** is a Vite + React application that provides a simple interface for
controlling MIDI devices. When a Launchpad X is detected the app automatically
switches the controller into _Programmer_ mode so that every pad can be
addressed individually.

---

## Node server

The project ships with a small Node server that exposes MIDI devices to the
browser. It must be running for the React frontend to communicate with your
hardware.

Start it with:

```bash
npm run server
```

It listens on port `3000` and exposes two REST endpoints:

- `GET /midi/devices` – lists available MIDI inputs and outputs
- `POST /midi/send` – sends a raw MIDI message to a specified output

There is also a WebSocket on the same port. When a client connects it sends the
current device list and it pushes `devices` events whenever ports change. Incoming
MIDI messages are forwarded as `midi` events so the UI can react in real time.

The React code uses `fetch` for the REST calls and opens a WebSocket connection
to receive device updates and MIDI messages.

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
- `npm run build` – build the React application for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint
- `npm run format` – run Prettier
- `npm run server` – start only the MIDI backend
