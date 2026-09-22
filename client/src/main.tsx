import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import { App } from "./App";
import "./styles/globals.css";
import "./stores/theme"; 

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);