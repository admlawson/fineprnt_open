import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls to top on pathname changes. If a hash is present, do nothing
// so in-page anchor navigation still works.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname, hash]);

  return null;
}
