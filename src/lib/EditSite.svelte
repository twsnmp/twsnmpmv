<script lang="ts">
  import { Modal, Label, Input, GradientButton } from "flowbite-svelte";
  import { DataStore, type TwsnmpEnt } from "./datastore";
  import { createEventDispatcher } from "svelte";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";

  export let show = false;
  export let ds: DataStore;
  export let twsnmp: TwsnmpEnt;

  const dispatch = createEventDispatcher();

  const close = () => {
    show = false;
    dispatch("close");
  };
  const save = () => {
    ds.save(twsnmp);
    show = false;
    dispatch("close");
  };
</script>

<Modal bind:open={show} size="lg" dismissable={false} class="w-full">
  <form class="flex flex-col space-y-4" action="#">
    <Label class="space-y-2">
      <span>サイト名</span>
      <Input bind:value={twsnmp.name} />
    </Label>
    <Label class="space-y-2">
      <span>URL</span>
      <Input bind:value={twsnmp.url} />
    </Label>
    <div class="flex justify-start space-x-2">
      <Label class="space-y-2">
        <span>ユーザー名</span>
        <Input bind:value={twsnmp.user} />
      </Label>
      <Label class="space-y-2">
        <span>パスワード</span>
        <Input type="password" bind:value={twsnmp.password} />
      </Label>
    </div>
    <div class="flex justify-end space-x-2 mr-2">
      <GradientButton
        shadow
        color="blue"
        type="button"
        class="!p-2"
        on:click={save}
      >
        <Icon path={icons.mdiContentSave} size={2} />
      </GradientButton>
      <GradientButton
        shadow
        type="button"
        color="teal"
        class="!p-2"
        on:click={close}
      >
        <Icon path={icons.mdiCancel} size={2} />
      </GradientButton>
    </div>
  </form>
</Modal>
