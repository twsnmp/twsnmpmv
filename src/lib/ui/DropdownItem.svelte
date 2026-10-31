<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    class: customClass = "",
    onclick = undefined,
    children,
  }: {
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  } = $props();
</script>

<button
  type="button"
  {onclick}
  class="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white transition-colors text-left {customClass}"
  role="menuitem"
>
  {@render children?.()}
</button>
