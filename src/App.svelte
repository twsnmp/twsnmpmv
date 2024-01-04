<script>
  import {TwsnmpAPI} from "./lib/twsnmpapi";
  import { Alert,Button } from 'flowbite-svelte';
  let loginOK = false;
  let loginNG = false;
  let api = new TwsnmpAPI("http://localhost:8080");
  const login = async () => {
    loginOK = await api.login("twsnmp","twsnmp");
    loginNG = !loginOK;
    const map = await api.get("/api/map");
    console.log(map);
  }
</script>

<div class="p-8">
  {#if loginOK}
   <Alert color="indigo">ログイン成功</Alert>
  {/if}
  {#if loginNG}
    <Alert>ログイン失敗</Alert>
  {/if}
  <Button color="blue"  on:click={login}>ログイン</Button>
</div>
