<script lang="ts">
  import { initMAP, updateMAP, deleteMap, zoomMap } from "./map";
  import { onMount, onDestroy } from "svelte";
  import { BottomNav,BottomNavItem,Tooltip,DarkMode } from "flowbite-svelte";
  import * as icons from "@mdi/js";
  import {Icon} from "mdi-svelte-ts";
  import {ds } from "./datastore";
  import { createEventDispatcher } from "svelte";
  import Log from "./Log.svelte";
  import Node from "./Node.svelte";
  import Polling from "./Polling.svelte";
  import AI from "./AI.svelte";


  export let id:string;
  let map: any;
  let timer :any = undefined;
  let showLog = false;
  let showNode = false;
  let showPolling = false;
  let showAI = false;
  const dispatch = createEventDispatcher();

  onMount(async () => {
    const twsnmp = ds.get(id)
    await initMAP(map, twsnmp);
    await updateMAP();
    setTimeout(refreshMap,500);
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

  const back = () => {
    dispatch("close",{});
  }

  const clearModal = () => {
    showAI = false;
    showLog = false;
    showNode = false;
    showPolling = false;
  }

</script>

<div bind:this={map} class="h-full w-full overflow-scroll" />


<BottomNav
position="fixed"
classInner="grid-cols-8"
size="sm"
>
<BottomNavItem
  on:click={() => {clearModal();showLog = true}}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiListBox} size={2} />
</BottomNavItem>
<BottomNavItem
  on:click={() => {clearModal();showNode = true}}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiLaptop} size={2} />
</BottomNavItem>
<BottomNavItem
  on:click={() => {clearModal();showPolling = true}}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiLanCheck} size={2} />
</BottomNavItem>
<BottomNavItem
  on:click={() => {clearModal();showAI = true}}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiBrain} size={2} />
</BottomNavItem>
<BottomNavItem
  on:click={back}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiClose} color="red" size={2} />
</BottomNavItem>
<BottomNavItem
  on:click={()=>zoomMap(true)}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiMagnifyPlus} size={2} />
</BottomNavItem>
<BottomNavItem
  on:click={()=>zoomMap(false)}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiMagnifyMinus} size={2} />
</BottomNavItem>
<BottomNavItem>
  <DarkMode />
</BottomNavItem>
</BottomNav>

<Log bind:show={showLog}></Log>
<Node bind:show={showNode}></Node>
<Polling bind:show={showPolling}></Polling>
<AI bind:show={showAI}></AI>