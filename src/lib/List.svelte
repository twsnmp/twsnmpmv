<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Listgroup, ListgroupItem,GradientButton,Modal } from "flowbite-svelte";
  import { ds,refreshCount,getStateIcon,getStateColor, type TwsnmpEnt } from "./datastore";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import EditSite from "./EditSite.svelte";

  let list : any = [];
  let showEditSite = false;
  let twsnmp :TwsnmpEnt;
  const dispatch = createEventDispatcher();

  refreshCount.subscribe(r => {
    list = [];
    for(const e of ds.list) {
      const state = ds.getState(e.id);
      list.push({
        id:e.id,
        name:e.name,
        icon:getStateIcon(state),
        color:getStateColor(state),
      });
    }
  });

  const edit = (id:string) => {
    twsnmp = ds.get(id);
    showEditSite = true;
  }

  let selected = "";
  let showDelConfirm = false;
  const delConfirm = (id:string) => {
    selected = id;
    if(id) {
      showDelConfirm = true;
    }
  }

  const del = () => {
    showDelConfirm = false;
    ds.del(selected);
  }

  const open = (id:string) => {
    dispatch("open", {id:id});
  }

</script>

<Listgroup>
  {#each  list as e }
    <ListgroupItem>
      <div class="flex">
        <div class="">
          <Icon path={e.icon} size={2} color={e.color}/>
        </div>
        <div class="grow m-1">
          {e.name}
        </div>
        <GradientButton class="!p-2 mr-1" color="lime" on:click={()=>open(e.id)}><Icon path={icons.mdiNetwork} size={1}/></GradientButton>
        <GradientButton class="!p-2 mr-1" color="blue" on:click={()=>edit(e.id)}><Icon path={icons.mdiPencil} size={1}/></GradientButton>
        <GradientButton class="!p-2" color="red" on:click={()=>delConfirm(e.id)}><Icon path={icons.mdiTrashCan} size={1} /></GradientButton>
      </div>
    </ListgroupItem>
  {/each}
</Listgroup>
<div class="h-32"></div>

<EditSite  bind:show={showEditSite} {twsnmp}  ></EditSite>


<Modal bind:open={showDelConfirm} size="xs" autoclose>
  <div class="text-center">
    <div class="flex justify-center mb-1">
      <Icon path={icons.mdiAlert} size={3} color="gray" />
    </div>
    <h3 class="mb-2 text-lg font-normal text-gray-500 dark:text-gray-400">削除しますか？</h3>
    <GradientButton color="red" class="mr-2" on:click={del}>
      <Icon path={icons.mdiTrashCan} size={2} />
    </GradientButton>
    <GradientButton color="teal" on:click={()=>showDelConfirm=false}>
      <Icon path={icons.mdiCancel} size={2} />
    </GradientButton>
  </div>
</Modal>