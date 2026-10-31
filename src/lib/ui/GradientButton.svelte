<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    id = undefined,
    color = "blue",
    shadow = false,
    type = "button",
    disabled = false,
    class: customClass = "",
    onclick = undefined,
    children,
  }: {
    id?: string;
    color?: "blue" | "red" | "teal" | "green" | "purple" | "cyan" | "lime";
    shadow?: boolean;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  } = $props();

  const colorClasses: Record<string, string> = {
    blue: "text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800",
    red: "text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800",
    teal: "text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800",
    green: "text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800",
    purple: "text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800",
    cyan: "text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800",
    lime: "text-white bg-gradient-to-r from-lime-500 via-lime-600 to-lime-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-lime-300 dark:focus:ring-lime-800",
  };

  const shadowClasses: Record<string, string> = {
    blue: "shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80",
    red: "shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80",
    teal: "shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80",
    green: "shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80",
    purple: "shadow-lg shadow-purple-500/50 dark:shadow-lg dark:shadow-purple-800/80",
    cyan: "shadow-lg shadow-cyan-500/50 dark:shadow-lg dark:shadow-cyan-800/80",
    lime: "shadow-lg shadow-lime-500/50 dark:shadow-lg dark:shadow-lime-800/80",
  };
</script>

<button
  {id}
  {type}
  {disabled}
  {onclick}
  class="font-medium rounded-lg text-sm px-4 py-2 text-center inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed {colorClasses[color] || colorClasses.blue} {shadow ? (shadowClasses[color] || '') : ''} {customClass}"
>
  {@render children?.()}
</button>
