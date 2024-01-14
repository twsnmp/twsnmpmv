<script lang="ts">
  import { initMAP, updateMAP, deleteMap } from "./map";
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

  const back = () => {
    dispatch("close",{});
  }

</script>

<div bind:this={map} class="h-full w-full overflow-scroll" />


<BottomNav
position="fixed"
navType="application"
classInner="grid-cols-6"
>
<BottomNavItem
  btnName="ログ"
  on:click={() => showLog = true}
  appBtnPosition="left"
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiListBox} size={2} />
  <Tooltip arrow={false}>ログ</Tooltip>
</BottomNavItem>
<BottomNavItem
  btnName="ノード"
  on:click={() => showNode = true}
  appBtnPosition="left"
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiLaptop} size={2} />
  <Tooltip arrow={false}>ノード</Tooltip>
</BottomNavItem>
<BottomNavItem
  btnName="ポーリング"
  on:click={() => showPolling = true}
  appBtnPosition="middle"
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiLanCheck} size={2} />
  <Tooltip arrow={false}>ポーリング</Tooltip>
</BottomNavItem>
<BottomNavItem
  btnName="AI分析"
  on:click={() => showAI = true}
  appBtnPosition="middle"
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiBrain} size={2} />
  <Tooltip arrow={false}>AI分析</Tooltip>
</BottomNavItem>
<BottomNavItem
  btnName="バック"
  on:click={back}
  appBtnPosition="right"
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiClose} color="red" size={2} />
</BottomNavItem>
<BottomNavItem btnName="ダーク" appBtnPosition="right">
  <DarkMode />
  <Tooltip arrow={false}>ダーク</Tooltip>
</BottomNavItem>
</BottomNav>

<Log bind:show={showLog}></Log>
<Node bind:show={showNode}></Node>
<Polling bind:show={showPolling}></Polling>
<AI bind:show={showAI}></AI>