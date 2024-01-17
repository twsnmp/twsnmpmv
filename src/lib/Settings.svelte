<script lang="ts">
  import { Modal, Label, Input, GradientButton } from "flowbite-svelte";
  import { ds  } from "./datastore";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";

  export let show = false;
  let  style  = "";

  const close = () => {
    show = false;
  };

  const save = () => {
    ds.locConf.style = style;
    ds.saveLocConf();
    show = false;
  };

  const onOpen = () => {
    style = ds.locConf.style;
  }

</script>

<Modal bind:open={show} size="lg" dismissable={false} class="w-full" on:open={onOpen}>
  <form class="flex flex-col space-y-4" action="#">
    <Label class="space-y-2">
      <span>地図スタイル</span>
      <Input bind:value={style} />
    </Label>
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
