<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    value = $bindable(""),
    type = "text",
    size = "sm",
    class: customClass = "",
    placeholder = undefined,
    min = undefined,
    max = undefined,
    step = undefined,
    disabled = false,
    readonly = false,
    required = false,
    autocomplete = undefined,
    autocapitalize = undefined,
    autocorrect = undefined,
    spellcheck = undefined,
    ...rest
  }: {
    value?: string | number;
    size?: "sm" | "md" | "lg";
    class?: string;
  } & Omit<HTMLInputAttributes, "size"> = $props();

  let sizeClass = $derived(size === "sm" ? "p-2 text-sm" : "p-2.5 text-base");
</script>

<input
  {type}
  bind:value
  {placeholder}
  {min}
  {max}
  {step}
  {disabled}
  {readonly}
  {required}
  {autocomplete}
  {autocapitalize}
  {autocorrect}
  {spellcheck}
  {...rest}
  class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 {sizeClass} {customClass}"
/>
