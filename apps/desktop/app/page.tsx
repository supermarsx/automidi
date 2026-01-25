"use client";

import { useEffect, useState } from "react";
import { isTauriRuntime } from "./lib/tauri";

export default function Home() {
  const [tauriReady, setTauriReady] = useState(false);

  useEffect(() => {
    setTauriReady(isTauriRuntime());
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Automidi Desktop</h1>
      <p>Next.js 16 + Tauri migration scaffold.</p>
      <p>Status: {tauriReady ? "Tauri runtime detected" : "Browser runtime"}</p>
    </main>
  );
}
