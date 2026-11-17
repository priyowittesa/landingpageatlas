"use client";

import { useCallback, useSyncExternalStore } from "react";

export function PaymentCountdown({ expiryTime }: { expiryTime: string }) {
  const expiresAt = Date.parse(expiryTime);
  const subscribe = useCallback((onChange: () => void) => {
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return () => {};
    }

    const timer = setInterval(() => {
      onChange();
      if (expiresAt <= Date.now()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  // Derive each tick from the provider deadline, not elapsed interval ticks.
  const remainingSeconds = useSyncExternalStore(
    subscribe,
    () => Number.isFinite(expiresAt)
      ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      : null,
    () => null
  );
  const countdown = remainingSeconds === null
    ? "-- : -- : --"
    : [
        Math.floor(remainingSeconds / 3600),
        Math.floor((remainingSeconds % 3600) / 60),
        remainingSeconds % 60
      ].map((value) => String(value).padStart(2, "0")).join(" : ");

  return (
    <div>
      <span className="text-gray-500">Time Remaining</span>
      <p role="timer" className="mt-2 text-2xl font-bold tracking-widest">
        {countdown}
      </p>
      <p className="text-[9px] text-gray-400">
        {remainingSeconds === 0
          ? "Payment expired"
          : <>Hours&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Minutes&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Seconds</>}
      </p>
    </div>
  );
}
