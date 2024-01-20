<script lang="ts">
  import { BottomNav, BottomNavItem, Tooltip, DarkMode } from "flowbite-svelte";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import EditSite from "./lib/EditSite.svelte";
  import List from "./lib/List.svelte";
  import Location from "./lib/Location.svelte";
  import Map from "./lib/Map.svelte";
  import Settings from "./lib/Settings.svelte";

  let page = "list";
  let showEditSite = false;
  let showSettings = false;
  let selected = "";

  const open = (e: CustomEvent<{ id: string }>) => {
    selected = e.detail.id;
    page = "map";
  };
</script>

{#if page == "list"}
  <List on:open={open}></List>
{:else if page == "loc"}
  <Location></Location>
{:else if page == "map"}
  <Map id={selected} on:close={() => (page = "list")}></Map>
{/if}

{#if page != "map"}
  <BottomNav
    position="fixed"
    classInner="grid-cols-5"
    activeUrl={page}
    size="sm"
  >
    <BottomNavItem
      on:click={() => (page = "list")}
      btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
    >
      <Icon path={icons.mdiListBox} size={2} />
    </BottomNavItem>
    <BottomNavItem
      on:click={() => (page = "loc")}
      btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
    >
      <Icon path={icons.mdiMapMarker} size={2} />
    </BottomNavItem>
    <div class="flex items-center justify-center">
      <BottomNavItem
        btnClass="inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800 text-white"
        on:click={() => (showEditSite = true)}
      >
        <Icon path={icons.mdiPlus} size={2} />
      </BottomNavItem>
    </div>
    <BottomNavItem
      btnClass="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500"
      on:click={() => {
        page = "list";
        showSettings = true;
      }}
    >
      <Icon path={icons.mdiCog} size={2} />
    </BottomNavItem>
    <BottomNavItem appBtnPosition="right">
      <DarkMode />
    </BottomNavItem>
  </BottomNav>
{/if}

<EditSite
  bind:show={showEditSite}
  twsnmp={{ id: "", name: "New", url: "", user: "", password: "", loc: "" }}
></EditSite>

<Settings bind:show={showSettings}></Settings>
