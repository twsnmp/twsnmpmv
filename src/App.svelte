<script lang="ts">
  import { BottomNav, BottomNavItem, Tooltip, DarkMode } from "flowbite-svelte";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import EditSite from "./lib/EditSite.svelte";
  import List from "./lib/List.svelte";

  let page = "list";
  let showEditSite = false;
  let selected = "";

  const open = (e:CustomEvent<{id:string}>) => {
    selected = e.detail.id;
    console.log("open",selected);
  }

</script>

{#if page == "list"}
  <List on:open={open}></List>
{:else if page == "map"}
  map
{/if}

<BottomNav
  position="absolute"
  navType="application"
  classInner="grid-cols-5"
  activeUrl={page}
>
  <BottomNavItem
    btnName="リスト"
    on:click={() => (page = "list")}
    appBtnPosition="left"
    btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
  >
    <Icon path={icons.mdiListBox} size={2} />
    <Tooltip arrow={false}>リスト</Tooltip>
  </BottomNavItem>
  <BottomNavItem
    btnName="地図"
    on:click={() => (page = "map")}
    appBtnPosition="middle"
    btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
  >
    <Icon path={icons.mdiMapMarker} size={2} />
    <Tooltip arrow={false}>地図</Tooltip>
  </BottomNavItem>
  <div class="flex items-center justify-center">
    <BottomNavItem
      btnName="追加"
      appBtnPosition="middle"
      btnClass="inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800 text-white"
      on:click={()=>showEditSite=true}
      >
      <Icon path={icons.mdiPlus} size={2} />
      <Tooltip arrow={false}>追加</Tooltip>
    </BottomNavItem>
  </div>
  <BottomNavItem
    btnName="設定"
    appBtnPosition="middle"
    btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
  >
    <Icon path={icons.mdiCog} size={2} />
    <Tooltip arrow={false}>設定</Tooltip>
  </BottomNavItem>
  <BottomNavItem btnName="ダーク" appBtnPosition="right">
    <DarkMode />
    <Tooltip arrow={false}>ダーク</Tooltip>
  </BottomNavItem>
</BottomNav>

<EditSite bind:show={showEditSite} twsnmp={{id:"",name:"New",url:"",user:"",password:"",loc:""}}  ></EditSite>
