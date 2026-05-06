"use client";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Zap, Users } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/app/newlogo.png";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-6 py-3 transition-all duration-300"
      style={{
        background: scrolled ? "var(--bg-card)" : "transparent",
        borderBottom: scrolled
          ? "1px solid var(--border)"
          : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
      }}
    >
      <Link href="/" className="no-underline flex items-center gap-2">
        <Image
          height={90}
          width={60}
          src={logo}
          alt={""}
          className="object-contain z-10"
        />
        {/* <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <Zap size={18} color="#000" fill="#000" />
        </div>
        <span
          className="text-[1.4rem] tracking-[2px]"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
          }}
        >
          Fantasy<span style={{ color: "var(--accent)" }}>XI</span>
        </span> */}
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/" className="no-underline">
          <button className="btn-ghost flex items-center gap-1.5 px-[0.9rem] py-[0.4rem]">
            <Users size={14} />
            <span className="hide-sm">Search</span>
          </button>
        </Link>

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
      </div>
    </nav>
  );
}
