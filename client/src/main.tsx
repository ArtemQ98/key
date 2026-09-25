import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import { App } from "./App";
import "./styles/globals.css";
import "./stores/theme";

// Авто-перезагрузка при устаревшем чанке после деплоя.
// Vite эмитит vite:preloadError, когда не может загрузить динамический импорт.
// Мы один раз перезагружаем страницу — она подтянет свежий index.html
// со ссылками на актуальные чанки.
window.addEventListener("vite:preloadError", (event) => {
  // Глушим ошибку, чтобы она не всплыла в глобальный обработчик
  event.preventDefault?.();

  const key = "vite:preloadError:reloaded";
  const last = Number(sessionStorage.getItem(key) || "0");
  const now = Date.now();

  // Если перезагружались меньше 10 секунд назад — не долбим,
  // значит проблема не в кэше, а в чём-то реальном
  if (now - last > 10_000) {
    sessionStorage.setItem(key, String(now));
    window.location.reload();
  } else {
    console.error("Preload error повторился — пропускаем перезагрузку");
  }
});

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);