import { ChevronLeft, HeartPulse } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  /** Show a back chevron in the header. */
  showBack?: boolean;
  /** Where back goes; defaults to browser history. */
  backTo?: string;
  /** Hide the bottom nav (e.g. during the focused check-in flow if desired). */
  hideNav?: boolean;
}

/** The centred phone-frame shell: header (wordmark + language), page, nav. */
export function Layout({ children, showBack, backTo, hideNav }: LayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen justify-center bg-stone-200">
      <div className="relative flex min-h-screen w-full max-w-md flex-col bg-cream shadow-xl">
        <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-cream/95 px-4 pb-2 pt-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {showBack && (
              <button
                type="button"
                onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
                aria-label="Back"
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-stone-600 ring-1 ring-stone-200 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <Link to="/home" className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
                <HeartPulse className="h-4 w-4" />
              </span>
              <span className="text-lg font-bold tracking-tight text-stone-800">
                Ghar<span className="text-brand">Sehat</span>
              </span>
            </Link>
          </div>
          <div className="mt-2">
            <LanguageSelector />
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
