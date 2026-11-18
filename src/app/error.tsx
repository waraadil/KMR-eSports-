"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <AlertTriangle size={36} className="mx-auto text-red-400" />
        <h1 className="mt-6 font-display text-2xl font-bold text-white">Something crashed in the arena</h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] text-zinc-500">
          An unexpected error occurred. Your data and wallet are safe.
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded-full bg-white px-8 py-3.5 font-tech text-[12px] font-bold uppercase tracking-[0.16em] text-void-950 transition-transform hover:scale-[1.03]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
