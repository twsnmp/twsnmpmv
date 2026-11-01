<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    btnClass = "",
    id = undefined,
    onclick = undefined,
    children,
  }: {
    btnClass?: string;
    id?: string;
    appBtnPosition?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  } = $props();
</script>

{#if onclick}
  <button
    type="button"
    {id}
    {onclick}
    class="inline-flex flex-col items-center justify-center px-4 relative hover:bg-gray-50 dark:hover:bg-gray-700 group focus:outline-none {btnClass}"
  >
    {@render children?.()}
  </button>
{:else}
  <div
    {id}
    class="inline-flex flex-col items-center justify-center px-4 relative hover:bg-gray-50 dark:hover:bg-gray-700 group cursor-pointer {btnClass}"
  >
    {@render children?.()}
  </div>
{/if}
