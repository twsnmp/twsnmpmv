<script lang="ts">
  import { initMAP, updateMAP, deleteMap, zoomMap } from "./map";
  import { onMount, onDestroy } from "svelte";
  import { BottomNav,BottomNavItem,Tooltip,DarkMode,Dropdown,DropdownItem } from "flowbite-svelte";
  import * as icons from "@mdi/js";
  import {Icon} from "mdi-svelte-ts";
  import {ds } from "./datastore";
  import { createEventDispatcher } from "svelte";
  import Log from "./Log.svelte";
  import Node from "./Node.svelte";
  import Polling from "./Polling.svelte";
  import AI from "./AI.svelte";
  import LanReport from "./LanReport.svelte";
  import IpamReport from "./IpamReport.svelte";
  import CertReport from "./CertReport.svelte";
  import EnvReport from "./EnvReport.svelte";


  export let id:string;
  let map: any;
  let timer :any = undefined;
  let showLog = false;
  let showNode = false;
  let showPolling = false;
  let showAI = false;
  let showLanReport = false;
  let showIpamReport = false;
  let showCertReport = false;
  let showEnvReport = false;
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
    showLanReport = false;
    showIpamReport = false;
    showCertReport = false;
    showEnvReport = false;
  }

</script>

<div bind:this={map} class="h-full w-full overflow-scroll" />


<BottomNav
position="fixed"
classInner="grid-cols-5"
size="sm"
>
<BottomNavItem
  id="map-nav-close-btn"
  on:click={back}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiArrowLeft} size={2} />
</BottomNavItem>
<BottomNavItem
  id="map-nav-zoom-in-btn"
  on:click={()=>zoomMap(true)}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiMagnifyPlus} size={2} />
</BottomNavItem>
<BottomNavItem
  id="map-nav-zoom-out-btn"
  on:click={()=>zoomMap(false)}
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiMagnifyMinus} size={2} />
</BottomNavItem>
<BottomNavItem
  id="map-nav-more-btn"
  btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
>
  <Icon path={icons.mdiDotsVertical} size={2} />
  <Dropdown>
    <DropdownItem on:click={() => {clearModal();showLog = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiListBox} size={1} />
        <span>ログ</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showNode = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiLaptop} size={1} />
        <span>ノード</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showPolling = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiLanCheck} size={1} />
        <span>ポーリング</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showLanReport = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiLan} size={1} />
        <span>LANデバイス</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showIpamReport = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiIpNetwork} size={1} />
        <span>IPAM</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showCertReport = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiCertificate} size={1} />
        <span>証明書管理</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showEnvReport = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiThermometer} size={1} />
        <span>環境モニター</span>
      </div>
    </DropdownItem>
    <DropdownItem on:click={() => {clearModal();showAI = true}}>
      <div class="flex items-center space-x-2">
        <Icon path={icons.mdiBrain} size={1} />
        <span>AI分析</span>
      </div>
    </DropdownItem>
  </Dropdown>
</BottomNavItem>
<BottomNavItem>
  <DarkMode />
</BottomNavItem>
</BottomNav>

<Log bind:show={showLog}></Log>
<Node bind:show={showNode}></Node>
<Polling bind:show={showPolling}></Polling>
<AI bind:show={showAI}></AI>
<LanReport bind:show={showLanReport}></LanReport>
<IpamReport bind:show={showIpamReport}></IpamReport>
<CertReport bind:show={showCertReport}></CertReport>
<EnvReport bind:show={showEnvReport}></EnvReport>