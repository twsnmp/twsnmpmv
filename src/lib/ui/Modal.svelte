<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";

  let {
    open = $bindable(false),
    title = "",
    size = "md",
    outsideclose = true,
    dismissable = true,
    onopen = undefined,
    children,
  }: {
    open: boolean;
    title?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    outsideclose?: boolean;
    dismissable?: boolean;
    onopen?: () => void;
    children?: Snippet;
  } = $props();

  const sizeClasses: Record<string, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
  };

  let wasOpen = false;

  $effect(() => {
    const isOpen = open;
    if (isOpen && !wasOpen) {
      wasOpen = true;
      untrack(() => {
        onopen?.();
      });
    } else if (!isOpen) {
      wasOpen = false;
    }
  });

  const close = () => {
    open = false;
  };
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
    {#if outsideclose}
      <button
        type="button"
        class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0"
        onclick={close}
        tabindex="-1"
        aria-label="閉じる"
      ></button>
    {/if}

    <div
      class="relative w-full {sizeClasses[size] || sizeClasses.md} bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh] z-10 my-auto"
      role="dialog"
      aria-modal="true"
    >
      {#if title || dismissable}
        <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {#if dismissable}
            <button
              type="button"
              onclick={close}
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
              aria-label="閉じる"
            >
              <Icon path={icons.mdiClose} size={1} />
            </button>
          {/if}
        </div>
      {/if}

      <div class="p-4 overflow-y-auto grow">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
