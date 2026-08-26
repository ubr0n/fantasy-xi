"use client";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, SquarePlus } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/app/app-logo.png";
import logoDark from "@/app/app-logo-dark.png";
import AddToHomeScreenModal from "./AddToHomeScreenModal";
import { useIsSafari } from "@/lib/browser";

export default function Navbar() {
  const { theme, toggle, canToggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const skipBlur = useIsSafari();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-6 py-3 transition-all duration-300"
      style={{
        background: scrolled
          ? skipBlur
            ? "var(--bg-card)"
            : "var(--glass-bg)"
          : "transparent",
        borderBottom: scrolled
          ? `1px solid ${skipBlur ? "var(--border)" : "var(--glass-border)"}`
          : "1px solid transparent",
        boxShadow: scrolled
          ? skipBlur
            ? "var(--shadow-sm)"
            : "var(--shadow-sm), inset 0 -1px 0 var(--glass-highlight)"
          : "none",
        backdropFilter:
          scrolled && !skipBlur ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter:
          scrolled && !skipBlur ? "blur(20px) saturate(180%)" : "none",
        transform: "translateZ(0)",
      }}
    >
      <Link href="/" className="no-underline flex items-start gap-2">
        <Image
          // height={20}
          // width={20}
          src={theme === "dark" ? logoDark : logo}
          alt={"app logo"}
          className="object-contain z-10 h-10 xl:h-12 w-fit"
        />
      </Link>

      <div className="flex items-center gap-2">
        <button
          className="btn-ghost flex items-center gap-1.5 px-[0.9rem] py-[0.4rem]"
          onClick={() => setShowInstallModal(true)}
        >
          <SquarePlus size={14} />
          <span className="hide-sm">Add to Home</span>
        </button>

        {canToggle && (
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border border-(--border)"
            style={{
              background: "var(--bg-subtle)",
              color: "var(--text-secondary)",
            }}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>
    </nav>
    {showInstallModal && (
      <AddToHomeScreenModal onClose={() => setShowInstallModal(false)} />
    )}
    </>
  );
}
