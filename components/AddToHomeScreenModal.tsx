"use client";
import { useEffect, useState } from "react";
import { Share, MoreVertical, SquarePlus, X } from "lucide-react";
import { useIsSafari } from "@/lib/browser";

type Platform = "ios" | "android";

const STEPS: Record<
  Platform,
  { icon: React.ReactNode; text: React.ReactNode }[]
> = {
  ios: [
    {
      icon: <Share size={15} />,
      text: (
        <>
          Open this site in <strong>Safari</strong> and tap the{" "}
          <strong>Share</strong> icon in the toolbar.
        </>
      ),
    },
    {
      icon: <SquarePlus size={15} />,
      text: (
        <>
          Scroll down and tap <strong>Add to Home Screen</strong>.
        </>
      ),
    },
    {
      icon: <span style={{ fontSize: 13, fontWeight: 700 }}>Add</span>,
      text: (
        <>
          Tap <strong>Add</strong> in the top right to confirm.
        </>
      ),
    },
  ],
  android: [
    {
      icon: <MoreVertical size={15} />,
      text: (
        <>
          Open this site in <strong>Chrome</strong> and tap the{" "}
          <strong>⋮ menu</strong> in the top right.
        </>
      ),
    },
    {
      icon: <SquarePlus size={15} />,
      text: (
        <>
          Tap <strong>Add to Home screen</strong> (or <strong>Install app</strong>).
        </>
      ),
    },
    {
      icon: <span style={{ fontSize: 13, fontWeight: 700 }}>Add</span>,
      text: (
        <>
          Tap <strong>Add</strong> / <strong>Install</strong> to confirm.
        </>
      ),
    },
  ],
};

export default function AddToHomeScreenModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<Platform>("ios");
  // Safari's compositor lags badly recomposing this overlay against the
  // page's other backdrop-filter glass underneath. Other iOS browsers
  // (Chrome, Firefox) don't show this, so it's scoped to Safari specifically.
  const skipBlur = useIsSafari();

  useEffect(() => {
    // Can't know this without reading navigator, which isn't available
    // during SSR — same reasoning as ThemeProvider's Safari check.
    const ua = navigator.userAgent;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (/android/i.test(ua)) setPlatform("android");
    else setPlatform("ios");
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-1000 flex items-end justify-center"
      style={{
        background: "rgba(0,0,0,0.65)",
        backdropFilter: skipBlur ? "none" : "blur(6px)",
        WebkitBackdropFilter: skipBlur ? "none" : "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in-up relative w-full px-5 pb-8 pt-3"
        style={{
          background: "var(--bg-card)",
          borderRadius: "20px 20px 0 0",
          maxWidth: 420,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="mx-auto mb-4 h-1 w-9 rounded-full"
          style={{ background: "var(--border-strong)" }}
        />
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 flex items-center justify-center rounded-full cursor-pointer border-0"
          style={{
            width: 30,
            height: 30,
            background: "var(--bg-subtle)",
            color: "var(--text-muted)",
          }}
        >
          <X size={15} />
        </button>

        <div
          className="text-lg tracking-[1px] mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add to Home Screen
        </div>
        <p className="text-[0.78rem] mb-4" style={{ color: "var(--text-secondary)" }}>
          Install this app on your phone for quick, full-screen access.
        </p>

        <div
          className="flex gap-0.5 rounded-lg p-0.5 mb-4"
          style={{ background: "var(--bg-subtle)" }}
        >
          {(["ios", "android"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className="flex-1 rounded-md text-[0.75rem] font-semibold cursor-pointer border-0 py-1.5 transition-colors duration-150"
              style={{
                background: platform === p ? "var(--bg-card)" : "transparent",
                color: platform === p ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: platform === p ? "var(--shadow-sm)" : "none",
              }}
            >
              {p === "ios" ? "iPhone / iPad" : "Android"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {STEPS[platform].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 26,
                  height: 26,
                  background: "var(--accent-glow)",
                  color: "var(--accent-dark)",
                }}
              >
                {step.icon}
              </div>
              <p
                className="text-[0.8rem] leading-snug pt-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[0.68rem] mt-4" style={{ color: "var(--text-muted)" }}>
          Note: this only works in Safari (iOS) or Chrome (Android) — it
          won&apos;t appear inside an app&apos;s built-in browser (e.g. Instagram
          or Twitter).
        </p>
      </div>
    </div>
  );
}
