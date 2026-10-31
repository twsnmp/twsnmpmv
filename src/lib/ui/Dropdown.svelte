<script lang="ts">
  import { onMount, type Snippet } from "svelte";

  let {
    open = $bindable(false),
    class: customClass = "",
    children,
  }: {
    open?: boolean;
    class?: string;
    children?: Snippet;
  } = $props();

  let dropdownEl: HTMLElement | undefined = $state();

  onMount(() => {
    const parent = dropdownEl?.parentElement;
    if (parent) {
      const handleParentClick = (e: MouseEvent) => {
        if (dropdownEl && dropdownEl.contains(e.target as Node)) return;
        open = !open;
      };
      parent.addEventListener("click", handleParentClick);
      return () => {
        parent.removeEventListener("click", handleParentClick);
      };
    }
  });

  const close = () => {
    open = false;
  };
</script>

<svelte:window onclick={close} />

<div
  bind:this={dropdownEl}
  class="absolute bottom-16 right-0 z-50 min-w-44 bg-white divide-y divide-gray-100 rounded-lg shadow-xl dark:bg-gray-700 dark:divide-gray-600 border border-gray-200 dark:border-gray-600 py-1 text-left {open ? 'block' : 'hidden'} {customClass}"
  onclick={(e) => e.stopPropagation()}
  onkeydown={(e) => { if (e.key === "Escape") close(); }}
  tabindex="-1"
  role="menu"
>
  {@render children?.()}
</div>
