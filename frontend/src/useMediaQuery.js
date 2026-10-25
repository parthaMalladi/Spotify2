import { useCallback, useSyncExternalStore } from "react";

// Screen-size breakpoints. Keep these in step with the @media rules in index.css.
// Phones get the tab-bar layout; tablets and small laptops get the desktop layout with the queue as a drawer.
export const MOBILE_QUERY = "(max-width: 767px)";
export const NARROW_QUERY = "(max-width: 1100px)";

// True while the media query matches. Re-renders when that changes (resizing the window, rotating a tablet).
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}
