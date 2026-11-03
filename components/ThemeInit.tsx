"use client";

import { useEffect } from "react";

/**
 * Reads saved theme from localStorage and applies it on mount.
 * Prevents flash of wrong theme on page load.
 */
export default function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("mall_theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return null;
}
