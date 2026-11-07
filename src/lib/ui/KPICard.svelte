<script lang="ts">
  import { Icon } from "mdi-svelte-ts";

  let {
    title = "",
    value = 0,
    unit = "",
    subText = "",
    color = "cyan",
    iconPath = undefined,
  }: {
    title: string;
    value: string | number;
    unit?: string;
    subText?: string;
    color?: "cyan" | "emerald" | "amber" | "rose" | "slate";
    iconPath?: string;
  } = $props();

  const colorStyles: Record<string, { text: string; icon: string }> = {
    cyan: {
      text: "text-cyan-600 dark:text-cyan-400",
      icon: "text-cyan-500",
    },
    emerald: {
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-500",
    },
    amber: {
      text: "text-amber-600 dark:text-amber-400",
      icon: "text-amber-500",
    },
    rose: {
      text: "text-rose-600 dark:text-rose-400",
      icon: "text-rose-500",
    },
    slate: {
      text: "text-slate-700 dark:text-slate-300",
      icon: "text-slate-400",
    },
  };
</script>

<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs dark:shadow-md flex flex-col justify-between transition-all">
  <div class="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
    <span class="truncate">{title}</span>
    {#if iconPath}
      <span class={colorStyles[color]?.icon || "text-slate-400"}>
        <Icon path={iconPath} size={0.75} />
      </span>
    {/if}
  </div>
  <div class="text-xl sm:text-2xl font-bold font-mono {colorStyles[color]?.text || 'text-slate-700 dark:text-slate-200'}">
    {value}
    {#if unit}
      <span class="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">{unit}</span>
    {/if}
  </div>
  {#if subText}
    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
      {subText}
    </div>
  {/if}
</div>
