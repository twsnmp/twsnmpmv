import { mount } from "svelte";
import "./app.pcss";
import "@mdi/font/css/materialdesignicons.css";
import "@fontsource/roboto";
import App from "./App.svelte";

// Prevent unwanted double-tap zoom gestures on iOS WebKit
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("input, textarea, select")) {
        event.preventDefault();
      }
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

document.addEventListener("dblclick", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest("input, textarea, select")) {
    event.preventDefault();
  }
});

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
