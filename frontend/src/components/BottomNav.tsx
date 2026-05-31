import { Bandage, Bell, Home, LineChart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

interface NavItem {
  to: string;
  en: string;
  hi: string;
  icon: typeof Home;
  end?: boolean;
}

const ITEMS: NavItem[] = [
  { to: "/", en: "Home", hi: "होम", icon: Home, end: true },
  { to: "/dressing-guide", en: "Dressing", hi: "ड्रेसिंग", icon: Bandage },
  { to: "/progress", en: "Progress", hi: "प्रगति", icon: LineChart },
  { to: "/alerts", en: "Alerts", hi: "अलर्ट", icon: Bell },
];

/** Persistent bottom navigation, pinned within the centred phone frame. */
export function BottomNav() {
  const { tr, hiClass } = useLanguage();
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-stone-200 bg-white/95 backdrop-blur">
      <ul className="flex">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                    isActive ? "text-brand" : "text-stone-400 hover:text-stone-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                    <span className={hiClass}>{tr(item.en, item.hi)}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
