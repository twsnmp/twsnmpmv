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

<li class="w-full px-4 py-3 {customClass}">
  {@render children?.()}
</li>
