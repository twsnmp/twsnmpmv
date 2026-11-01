import { mount } from "svelte";
import "./app.pcss";
import "@mdi/font/css/materialdesignicons.css";
import "@fontsource/roboto";
import App from "./App.svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
