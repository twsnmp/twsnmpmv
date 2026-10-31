<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    class: customClass = "",
    children,
  }: {
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<ul class="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white divide-y divide-gray-200 dark:divide-gray-600 {customClass}">
  {@render children?.()}
</ul>
