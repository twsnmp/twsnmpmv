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

<label class="block text-sm font-medium text-gray-900 dark:text-gray-300 {customClass}">
  {@render children?.()}
</label>
