import { Loader2, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

/** Rounded white card — the core surface of the warm healthcare look. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100 ${className}`}>
      {children}
    </div>
  );
}

/** Centered spinner for in-flight loads. */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-400">
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

/** Friendly error block — typically a backend that is down or a route missing. */
export function ErrorState({
  title,
  detail,
  onRetry,
  retryLabel = "Try again",
}: {
  title: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
      <WifiOff className="h-7 w-7 text-red-400" />
      <div>
        <p className="font-semibold text-red-800">{title}</p>
        {detail && <p className="mt-1 text-sm text-red-600">{detail}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white active:scale-95"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
