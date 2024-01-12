import "./app.pcss";
import "@mdi/font/css/materialdesignicons.css";
import "@fontsource/roboto";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app") as Element,
});

export default app;
