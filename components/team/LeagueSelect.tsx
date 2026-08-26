"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import type { LeagueMembership } from "@/lib/fpl";

export default function LeagueSelect({
  leagues,
  value,
  onChange,
}: {
  leagues: LeagueMembership[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = leagues.find((l) => l.id === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-lg px-[0.7rem] py-[0.4rem] text-[0.78rem] font-semibold cursor-pointer outline-none transition-colors duration-150"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${open ? "var(--accent)" : "var(--border-strong)"}`,
          color: "var(--text-primary)",
        }}
      >
        <span className="flex-1 min-w-0 text-left truncate">
          {selected?.name ?? "Select league"}
        </span>
        <motion.span
          className="flex items-center shrink-0"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden origin-top"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              borderRadius: 14,
              boxShadow: "var(--shadow-lg)",
              padding: 4,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {leagues.map((l) => {
              const isActive = l.id === value;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    onChange(l.id);
                    setOpen(false);
                  }}
                  className={`league-select-option w-full flex items-center gap-2 text-left rounded-[10px] px-[0.6rem] py-[0.45rem] text-[0.76rem] font-semibold cursor-pointer border-0 transition-colors duration-100 ${isActive ? "is-active" : ""}`}
                  style={{
                    background: isActive
                      ? "rgba(0, 214, 143, 0.14)"
                      : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  <span className="flex-1 min-w-0 truncate">{l.name}</span>
                  {isActive && <Check size={13} className="shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
