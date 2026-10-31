<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    classInner = "grid-cols-5",
    class: customClass = "",
    children,
  }: {
    classInner?: string;
    class?: string;
    position?: string;
    activeUrl?: string;
    size?: string;
    children?: Snippet;
  } = $props();
</script>

<div
  class="fixed bottom-0 left-0 z-40 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 {customClass}"
>
  <div class="grid h-full max-w-lg mx-auto font-medium {classInner}">
    {@render children?.()}
  </div>
</div>
