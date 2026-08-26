import { useEffect, useState } from "react";

// Real Safari, excluding the in-app-browser/other-vendor UAs that also
// contain "Safari" (Chrome, Firefox, and other iOS browsers all report a
// Safari-flavored UA since they're required to use WebKit, but only Safari
// itself carries this app's known rendering quirks).
export const isSafariBrowser = () =>
  /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);

/** False during SSR/first paint (no navigator yet), then flips once mounted on real Safari. */
export function useIsSafari(): boolean {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => setIsSafari(isSafariBrowser()), []);
  return isSafari;
}
