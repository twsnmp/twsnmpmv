<script lang="ts">
  import { Modal, Label, Input, GradientButton } from "flowbite-svelte";
  import { ds, type TwsnmpEnt } from "./datastore";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";

  export let show = false;
  export let twsnmp : TwsnmpEnt;

  const close = () => {
    show = false;
  };

  const save = () => {
    ds.save(twsnmp);
    show = false;
  };

</script>

<Modal bind:open={show} size="md" dismissable={false} >
  <form class="flex flex-col space-y-2" action="#">
    <Label class="space-y-1">
      <span>サイト名</span>
      <Input bind:value={twsnmp.name} size="sm" />
    </Label>
    <Label class="space-y-1">
      <span>URL</span>
      <Input type="url" bind:value={twsnmp.url} size="sm" />
    </Label>
    <Label class="space-y-1">
      <span>ユーザー名</span>
      <Input bind:value={twsnmp.user} size="sm" />
    </Label>
    <Label class="space-y-1">
      <span>パスワード</span>
      <Input type="password" bind:value={twsnmp.password} size="sm"/>
    </Label>
    <div class="flex justify-end space-x-2 mr-2">
      <GradientButton
        shadow
        color="blue"
        type="button"
        class="!p-2"
        on:click={save}
      >
        <Icon path={icons.mdiContentSave} size={1.5} />
      </GradientButton>
      <GradientButton
        shadow
        type="button"
        color="teal"
        class="!p-2"
        on:click={close}
      >
        <Icon path={icons.mdiCancel} size={1.5} />
      </GradientButton>
    </div>
  </form>
</Modal>
