'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void; canToggle: boolean }>({
  theme: 'dark',
  toggle: () => {},
  canToggle: true,
});

// Keep in sync with the beforeInteractive script in app/layout.tsx, which
// forces Safari to dark before first paint — light mode has a known,
// unresolved rendering issue on Safari/WebKit we haven't been able to fix,
// so Safari is locked to dark and the toggle is hidden there instead.
const isSafariBrowser = () =>
  /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Both must start at the same fixed values the server renders — reading
  // `document`/`navigator` here to guess the real values would make the
  // client's first hydration pass diverge from the server-rendered HTML,
  // which forces React to discard and fully re-render the tree instead of a
  // normal, cheap state update. The beforeInteractive script has already
  // applied the correct class to <html> ahead of hydration, so the *visual*
  // outcome is already correct before this corrects the React state.
  const [theme, setTheme] = useState<Theme>('dark');
  const [canToggle, setCanToggle] = useState(true);

  useEffect(() => {
    // Syncing React state from state set outside React (the beforeInteractive
    // script's UA check and DOM class) — there's no way to know this without
    // a cookie-based SSR read, so the lint rule's suggested alternatives don't apply.
    if (isSafariBrowser()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanToggle(false);
      return; // dark class already forced by the beforeInteractive script
    }
    if (!document.documentElement.classList.contains('dark')) {
      setTheme('light');
    }
  }, []);

  const toggle = () => {
    if (!canToggle) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fpl-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return <ThemeCtx.Provider value={{ theme, toggle, canToggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
