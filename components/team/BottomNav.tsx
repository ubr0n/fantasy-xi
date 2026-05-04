"use client";
import { Trophy, Users, Zap, Activity } from "lucide-react";
import type { MobileTab } from "./types";

const TABS = [
  { key: "league" as MobileTab, label: "League", Icon: Trophy },
  { key: "team" as MobileTab, label: "My Team", Icon: Users },
  { key: "live" as MobileTab, label: "In Play", Icon: Zap },
  { key: "stats" as MobileTab, label: "Stats", Icon: Activity },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (t: MobileTab) => void;
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] flex border-t border-(--border) bg-(--bg-card) backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 cursor-pointer border-0 bg-transparent py-[0.55rem] px-1.5 transition-all duration-150"
          style={{
            color: active === key ? "var(--accent)" : "var(--text-muted)",
            borderTop:
              active === key
                ? "2px solid var(--accent)"
                : "2px solid transparent",
          }}
        >
          <Icon size={18} />
          <span className="text-[0.6rem] font-semibold mt-px">{label}</span>
        </button>
      ))}
    </div>
  );
}
