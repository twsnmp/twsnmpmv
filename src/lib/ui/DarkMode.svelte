<script lang="ts">
  import { onMount } from "svelte";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";

  let isDark = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains("dark") ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });

  const toggle = () => {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
</script>

<button
  type="button"
  onclick={toggle}
  class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none rounded-lg text-sm p-2.5 inline-flex items-center justify-center"
  aria-label="ダークモード切替"
>
  {#if isDark}
    <Icon path={icons.mdiWeatherSunny} size={1.2} />
  {:else}
    <Icon path={icons.mdiWeatherNight} size={1.2} />
  {/if}
</button>
