<script lang="ts">
  import { initMAP, updateMAP, deleteMap } from "./map";
  import { onMount, onDestroy } from "svelte";
  import { Modal, GradientButton, Label, Input } from "flowbite-svelte";
  import * as icons from "@mdi/js";
  import {Icon} from "mdi-svelte-ts";
  import {ds } from "./datastore";


  export let id:string;
  let map: any;
  let timer :any = undefined;

  onMount(async () => {
    const twsnmp = ds.get(id)
    initMAP(map, twsnmp);
    refreshMap();
  });

  onDestroy(() => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    deleteMap();
  });

  const refreshMap = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    updateMAP();
    timer = setTimeout(refreshMap, 1000 * 10);
  };

</script>

<div bind:this={map} class="h-full w-full overflow-scroll" />






