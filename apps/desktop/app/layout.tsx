import type { Metadata } from "next";
import "../src/index.css";
import "../src/App.css";
import "../src/ActionBar.css";
import "../src/LaunchpadCanvas.css";
import "../src/MidiDevices.css";
import "../src/SysexWorkbench.css";
import "../src/SettingsModal.css";

export const metadata: Metadata = {
  title: "AutoMIDI v2.0",
  description: "Automidi desktop application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstra.386@1.0.0/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=VT323:wght@400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
