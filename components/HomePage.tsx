"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import {
  fetchBootstrap,
  searchManagers,
  BootstrapStatic,
  ManagerSearchResult,
} from "@/lib/fpl";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootstrap, setBootstrap] = useState<BootstrapStatic | null>(null);
  const [suggestions, setSuggestions] = useState<ManagerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBootstrap()
      .then((d) => setBootstrap(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setError("");
    const trimmed = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (/^\d+$/.test(trimmed) || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchManagers(trimmed);
        setSuggestions(res.results.slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleSelect = useCallback(
    (entry: number) => {
      setSuggestions([]);
      router.push("/team/" + entry);
    },
    [router],
  );

  const handleSearch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      setLoading(true);
      setError("");
      setSuggestions([]);
      if (/^\d+$/.test(trimmed)) {
        router.push("/team/" + trimmed);
        return;
      }
      const leagueMatch = trimmed.match(/^(?:l:|league:)(\d+)$/i);
      if (leagueMatch) {
        router.push("/league/" + leagueMatch[1]);
        return;
      }
      try {
        const res = await searchManagers(trimmed);
        if (res.results.length > 0) {
          router.push("/team/" + res.results[0].entry);
        } else {
          setError("No team found with that name");
          setLoading(false);
        }
      } catch {
        setError("Search failed — try a Team ID instead");
        setLoading(false);
      }
    },
    [query, router],
  );

  const currentEvent =
    bootstrap?.events.find((e) => e.is_current) ||
    bootstrap?.events.find((e) => e.is_next);
  const stats = currentEvent
    ? [
        {
          label: "GW Avg",
          value: currentEvent.average_entry_score || "—",
          icon: "📊",
        },
        {
          label: "GW High",
          value: currentEvent.highest_score || "—",
          icon: "🏆",
        },
        {
          label: "Transfers",
          value: currentEvent.transfers_made
            ? Math.round(currentEvent.transfers_made / 1000) + "K"
            : "—",
          icon: "🔄",
        },
      ]
    : [];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: "-20%",
            left: "-10%",
            width: "60%",
            height: "60%",
            filter: "blur(120px)",
            opacity: 0.12,
            background: "radial-gradient(circle, #00d68f 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            bottom: "-20%",
            right: "-10%",
            width: "60%",
            height: "60%",
            filter: "blur(120px)",
            opacity: 0.08,
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-1">
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
          {currentEvent && (
            <div
              className="animate-fade-in inline-flex items-center gap-1.5 mb-8 px-4 py-1.5 rounded-full border border-(--border-strong) text-[0.8rem] font-semibold"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="live-dot" />
              Gameweek {currentEvent.id}{" "}
              {currentEvent.finished ? "(Finished)" : "— Live"}
            </div>
          )}

          <h1
            className="animate-fade-in-up leading-[0.9] tracking-[0.02em]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3.5rem, 12vw, 8rem)",
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            FANTASY
          </h1>
          <h1
            className="animate-fade-in-up leading-[0.9] tracking-[0.02em] mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3.5rem, 12vw, 8rem)",
              WebkitTextStroke: "2px var(--accent)",
              color: "transparent",
              animationDelay: "0.1s",
            }}
          >
            LIVE
            <span style={{ color: "var(--accent)", WebkitTextStroke: "none" }}>
              .
            </span>
          </h1>

          <p
            className="animate-fade-in-up mb-10 leading-[1.65]"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
              color: "var(--text-secondary)",
              maxWidth: 500,
              animationDelay: "0.15s",
            }}
          >
            Track live FPL points, compare teams, monitor league standings, and
            never miss a gameweek moment.
          </p>

          {/* Search */}
          <div
            className="animate-fade-in-up w-full"
            style={{ maxWidth: 520, animationDelay: "0.2s" }}
            ref={wrapperRef}
          >
            <form onSubmit={handleSearch}>
              <div
                className="flex gap-2 rounded-2xl p-1.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div className="flex-1 relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    className="input pl-10 rounded-[10px] bg-transparent border-0 shadow-none"
                    placeholder="Team ID..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary min-w-22.5 rounded-[10px] justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div
                      className="animate-spin-custom rounded-full border-2 border-black/20 border-t-black"
                      style={{ width: 16, height: 16 }}
                    />
                  ) : (
                    <>
                      <span>Track</span> <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Suggestions dropdown */}
            {(suggestions.length > 0 || searching) && (
              <div
                className="mt-1.5 rounded-xl overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                {searching && suggestions.length === 0 && (
                  <div
                    className="px-4 py-3 text-[0.85rem]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Searching…
                  </div>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s.entry}
                    type="button"
                    onClick={() => handleSelect(s.entry)}
                    className="w-full flex flex-col px-4 py-[0.65rem] bg-transparent border-0 border-b border-(--border) cursor-pointer text-left transition-[background] duration-150 last:border-b-0"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-subtle)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      className="font-semibold text-[0.9rem]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {s.entry_name}
                    </span>
                    <span
                      className="text-[0.75rem]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.player_first_name} {s.player_last_name} · #{s.entry}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p
                className="text-[0.8rem] mt-2 text-left pl-1"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </p>
            )}
            <p
              className="text-[0.75rem] mt-2.5"
              style={{ color: "var(--text-muted)" }}
            >
              Search by your Team ID directly
            </p>
          </div>

          {/* GW stats */}
          {stats.length > 0 && (
            <div
              className="animate-fade-in-up flex flex-wrap justify-center gap-3 mt-12"
              style={{ animationDelay: "0.3s" }}
            >
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="card flex items-center gap-2.5 px-6 py-3"
                >
                  <span className="text-[1.2rem]">{s.icon}</span>
                  <div>
                    <div
                      className="text-[1.4rem] leading-none"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="text-[0.68rem] uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 text-center border-t border-(--border)">
          <p className="text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
            FPL Live uses the unofficial Fantasy Premier League API. Not
            affiliated with the Premier League or FPL.
          </p>
        </footer>
      </div>
    </div>
  );
}
