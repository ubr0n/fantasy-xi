"use client";
import { motion } from "framer-motion";
import { Trophy, Users, Zap, Activity } from "lucide-react";
import type { MobileTab } from "./types";

const TABS = [
  { key: "league" as MobileTab, label: "League", Icon: Trophy },
  { key: "team" as MobileTab, label: "My Team", Icon: Users },
  { key: "live" as MobileTab, label: "In Play", Icon: Zap },
  { key: "stats" as MobileTab, label: "Stats", Icon: Activity },
];

const CELL = 100 / TABS.length;

export default function BottomNav({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (t: MobileTab) => void;
}) {
  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.key === active),
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-200 flex justify-center px-3 pointer-events-none"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}
    >
      <div
        className="w-full pointer-events-auto"
        style={{
          maxWidth: 420,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          boxShadow: "var(--shadow-lg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: 6,
        }}
      >
        {/* Positioned ancestor holds no padding of its own, so the
            sliding highlight's percentage math lines up exactly with
            the flex-basis of the buttons beside it. */}
        <div className="relative flex w-full">
          <motion.div
            className="absolute top-0 bottom-0 z-0"
            style={{ width: `${CELL}%` }}
            animate={{ left: `${activeIndex * CELL}%` }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div
              className="absolute inset-1 rounded-2xl"
              style={{ background: "rgba(0, 214, 143, 0.14)" }}
            />
          </motion.div>

          {TABS.map(({ key, label, Icon }) => {
            const isActive = active === key;
            return (
              <motion.button
                key={key}
                onClick={() => onChange(key)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="relative z-1 flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer border-0 bg-transparent py-2.5"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <motion.span
                  className="flex items-center justify-center"
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.4 : 2}
                    color={isActive ? "var(--accent)" : "var(--text-muted)"}
                  />
                </motion.span>
                <span
                  className="text-[0.6rem] font-semibold tracking-tight transition-colors duration-200"
                  style={{
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
