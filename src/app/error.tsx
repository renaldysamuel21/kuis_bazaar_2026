"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="room-shell loading-shell">
      <div className="message-card" role="alert">
        <WarningCircle size={48} weight="fill" />
        <h1>Permainan perlu dimuat ulang</h1>
        <p>Data soal tetap aman di perangkat ini.</p>
        <button className="primary-button" onClick={reset} type="button">
          <ArrowClockwise size={22} weight="bold" /> Coba lagi
        </button>
      </div>
    </main>
  );
}
