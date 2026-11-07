<script lang="ts">
  import { Modal, Label, Input, Select, GradientButton } from "./ui";
  import { ds, type TwsnmpEnt } from "./datastore";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import { filterUrl, filterUsername, filterPassword } from "./util";

  export let show = false;
  export let twsnmp : TwsnmpEnt;

  let isComposingUrl = false;
  let isComposingUser = false;
  let isComposingPassword = false;

  const serverTypeOptions = [
    { value: "auto", name: "自動判定 (推奨)" },
    { value: "neo", name: "TWSNMP NEO" },
    { value: "fc", name: "TWSNMP FC" },
  ];

  $: if (twsnmp && !twsnmp.serverType) {
    twsnmp.serverType = "auto";
  }

  const close = () => {
    show = false;
  };

  const save = () => {
    if (twsnmp) {
      if (twsnmp.url) twsnmp.url = filterUrl(twsnmp.url);
      if (twsnmp.user) twsnmp.user = filterUsername(twsnmp.user);
      if (twsnmp.password) twsnmp.password = filterPassword(twsnmp.password);
      ds.save(twsnmp);
    }
    show = false;
  };

  const onUrlInput = () => {
    if (isComposingUrl) return;
    if (twsnmp?.url) {
      twsnmp.url = filterUrl(twsnmp.url);
    }
  };

  const onUrlCompositionEnd = () => {
    isComposingUrl = false;
    if (twsnmp?.url) {
      twsnmp.url = filterUrl(twsnmp.url);
    }
  };

  const onUserInput = () => {
    if (isComposingUser) return;
    if (twsnmp?.user) {
      twsnmp.user = filterUsername(twsnmp.user);
    }
  };

  const onUserCompositionEnd = () => {
    isComposingUser = false;
    if (twsnmp?.user) {
      twsnmp.user = filterUsername(twsnmp.user);
    }
  };

  const onPasswordInput = () => {
    if (isComposingPassword) return;
    if (twsnmp?.password) {
      twsnmp.password = filterPassword(twsnmp.password);
    }
  };

  const onPasswordCompositionEnd = () => {
    isComposingPassword = false;
    if (twsnmp?.password) {
      twsnmp.password = filterPassword(twsnmp.password);
    }
  };
</script>

<Modal title="サイト設定" bind:open={show} size="md" outsideclose={false}>
  <form class="flex flex-col space-y-2" onsubmit={(e) => e.preventDefault()}>
    <Label class="space-y-1">
      <span>サイト名</span>
      <Input
        bind:value={twsnmp.name}
        size="sm"
        placeholder="例: 本社TWSNMP"
        autocomplete="off"
        autocorrect="off"
      />
    </Label>
    <Label class="space-y-1">
      <span>種別</span>
      <Select items={serverTypeOptions} bind:value={twsnmp.serverType} size="sm" />
    </Label>
    <Label class="space-y-1">
      <span>URL</span>
      <Input
        type="text"
        inputmode="url"
        lang="en"
        pattern="[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;%=]+"
        bind:value={twsnmp.url}
        size="sm"
        placeholder="http://192.168.1.1:8080"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="none"
        spellcheck={false}
        oninput={onUrlInput}
        oncompositionstart={() => { isComposingUrl = true; }}
        oncompositionend={onUrlCompositionEnd}
        onblur={onUrlCompositionEnd}
      />
    </Label>
    <Label class="space-y-1">
      <span>ユーザー名</span>
      <Input
        type="text"
        inputmode="email"
        lang="en"
        pattern="[A-Za-z0-9._\-@]+"
        bind:value={twsnmp.user}
        size="sm"
        placeholder="admin"
        autocomplete="username"
        autocorrect="off"
        autocapitalize="none"
        spellcheck={false}
        oninput={onUserInput}
        oncompositionstart={() => { isComposingUser = true; }}
        oncompositionend={onUserCompositionEnd}
        onblur={onUserCompositionEnd}
      />
    </Label>
    <Label class="space-y-1">
      <span>パスワード</span>
      <Input
        type="password"
        lang="en"
        bind:value={twsnmp.password}
        size="sm"
        autocomplete="current-password"
        oninput={onPasswordInput}
        oncompositionstart={() => { isComposingPassword = true; }}
        oncompositionend={onPasswordCompositionEnd}
        onblur={onPasswordCompositionEnd}
      />
    </Label>
    <div class="flex justify-end space-x-2 mr-2">
      <GradientButton
        id="save-site-btn"
        ariaLabel="保存"
        shadow
        color="blue"
        type="button"
        class="!p-2"
        onclick={save}
      >
        <Icon path={icons.mdiContentSave} size={1.5} />
      </GradientButton>
    </div>
  </form>
</Modal>
