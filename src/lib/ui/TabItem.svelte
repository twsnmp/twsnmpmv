<script lang="ts">
  let {
    open = false,
    title = "",
    titleClass = "",
    onclick = undefined,
  }: {
    open?: boolean;
    title?: string;
    titleClass?: string;
    onclick?: (e: MouseEvent) => void;
  } = $props();
</script>

<button
  type="button"
  {onclick}
  class="inline-block font-medium border-b-2 rounded-t-lg transition-colors {open
    ? 'text-primary-600 border-primary-600 dark:text-primary-500 dark:border-primary-500'
    : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} {titleClass}"
>
  {title}
</button>
