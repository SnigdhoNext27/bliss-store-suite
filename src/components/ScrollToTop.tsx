import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures each route starts from the top of the page.
 * Uses layout effect to avoid briefly showing the previous scroll position.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // If navigating to an anchor on the same/new page, let the browser handle it.
    if (hash) return;

    // Do it now + next frame to handle animated route wrappers.
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname, hash]);

  return null;
}

