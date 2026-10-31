<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    defaultClass = "flex flex-nowrap space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700 min-w-max",
    children,
  }: {
    defaultClass?: string;
    contentClass?: string;
    style?: string;
    children?: Snippet;
  } = $props();
</script>

<div class={defaultClass}>
  {@render children?.()}
</div>
