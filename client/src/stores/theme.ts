import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const STORAGE_KEY = "key_theme";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = t === "dark" || (t === "system" && systemDark);
  root.classList.toggle("dark", isDark);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem(STORAGE_KEY) as Theme) || "system",

  setTheme: (t) => {
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    set({ theme: t });
  },
}));

if (typeof window !== "undefined") {
  applyTheme(useThemeStore.getState().theme);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (useThemeStore.getState().theme === "system") {
        applyTheme("system");
      }
    });
}