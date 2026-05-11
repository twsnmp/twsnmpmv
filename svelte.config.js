import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],
  onwarn: (warning, handler) => {
    if (warning.code.startsWith("a11y-") && warning.filename?.includes("node_modules")) {
      return;
    }
    handler(warning);
  },
};
