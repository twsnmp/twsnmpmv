<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
  }: {
    children?: Snippet;
  } = $props();
</script>

<!-- Tooltip accessibility pass-through -->
<span class="sr-only">{@render children?.()}</span>
