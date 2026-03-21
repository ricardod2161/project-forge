import { useState, useEffect } from "react";

/**
 * Shared theme hook — single source of truth for dark/light mode.
 * Reads/writes to localStorage["theme"] and toggles `.light` on <html>.
 * Default: dark mode (no class on html = dark, .light class = light mode).
 */
export function useAppTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const theme = isDark ? "dark" : "light";

  const setTheme = (value: "dark" | "light") => {
    setIsDark(value === "dark");
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { theme, isDark, setTheme, toggleTheme };
}
