'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Must start at the same fixed value the server renders — reading
  // `document` here to guess the real theme would make the client's first
  // hydration pass diverge from the server-rendered HTML, which forces React
  // to discard and fully re-render the tree instead of a normal, cheap
  // state update. A beforeInteractive script (see app/layout.tsx) has
  // already applied the correct class to <html> ahead of hydration, so the
  // *visual* flash is avoided even before this corrects the React state.
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) return;
    // Syncing React state from a DOM class set outside React (by the
    // beforeInteractive script) — there's no way to know this without a
    // cookie-based SSR read, so the lint rule's suggested alternatives don't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme('light');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fpl-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
