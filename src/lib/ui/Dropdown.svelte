<script lang="ts">
  import { onMount, setContext, type Snippet } from "svelte";

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

  const close = () => {
    open = false;
  };

  setContext("dropdown", { close });

  onMount(() => {
    const parent = dropdownEl?.parentElement;
    if (parent) {
      const handleParentClick = (e: MouseEvent) => {
        // ドロップダウン内部のクリックは無視（外側判定側で制御）
        if (dropdownEl && dropdownEl.contains(e.target as Node)) return;
        open = !open;
      };
      parent.addEventListener("click", handleParentClick);

      const handleDocClick = (e: MouseEvent) => {
        const target = e.target as Node;
        // 親（トリガー要素）をクリックした場合は handleParentClick に任せる
        if (parent.contains(target)) return;
        // 外部をクリックした場合は閉じる
        open = false;
      };

      document.addEventListener("click", handleDocClick);

      return () => {
        parent.removeEventListener("click", handleParentClick);
        document.removeEventListener("click", handleDocClick);
      };
    }
  });
</script>

<div
  bind:this={dropdownEl}
  class="absolute bottom-16 right-0 z-50 min-w-44 bg-white divide-y divide-gray-100 rounded-lg shadow-xl dark:bg-gray-700 dark:divide-gray-600 border border-gray-200 dark:border-gray-600 py-1 text-left {open ? 'block' : 'hidden'} {customClass}"
  onkeydown={(e) => { if (e.key === "Escape") close(); }}
  tabindex="-1"
  role="menu"
>
  {@render children?.()}
</div>
