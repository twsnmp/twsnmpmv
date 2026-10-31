<script lang="ts">
  let {
    value = $bindable(""),
    items = [],
    size = "sm",
    class: customClass = "",
  }: {
    value?: string;
    items?: Array<{ value: string; name: string }>;
    size?: "sm" | "md" | "lg";
    class?: string;
  } = $props();

  let sizeClass = $derived(size === "sm" ? "p-2 text-sm" : "p-2.5 text-base");
</script>

<select
  bind:value
  class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 {sizeClass} {customClass}"
>
  {#each items as item}
    <option value={item.value}>{item.name}</option>
  {/each}
</select>
