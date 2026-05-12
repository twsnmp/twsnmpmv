<script lang="ts">
  import { Modal as ModalOrig, GradientButton } from "flowbite-svelte";
  const Modal = ModalOrig as any;
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api, renderScore, renderTime, renderIP } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import "../assets/jquery.dataTables.css";

  export let show = false;

  let table: any = undefined;
  let dataList: any = [];

  const close = () => {
    show = false;
  };

  const showTable = async () => {
    const id = `#table-lan-report`;
    await tick();
    if (table && DataTable.isDataTable(id)) {
      table.clear();
      table.destroy();
      table = undefined;
    }
    const el = document.querySelector(id);
    if (!el) return;

    if (dataList && dataList.length > 0) {
      table = new DataTable(id, {
        columns: columns,
        data: dataList,
        paging: false,
        searching: false,
        info: false,
        scrollY: "50vh",
        scrollX: true,
        language: ja,
      });
    }
  };

  const columns = [
    { data: "Score", title: "スコア", render: renderScore },
    { data: "ID", title: "MACアドレス" },
    { data: "Name", title: "名前" },
    { data: "IP", title: "IPアドレス", render: renderIP },
    { data: "Vendor", title: "ベンダー" },
    { 
      data: "FirstTime", 
      title: "初回", 
      render: (data: any, type: string) => renderTime(data, type) 
    },
    { 
      data: "LastTime", 
      title: "最終", 
      render: (data: any, type: string) => renderTime(data, type) 
    },
  ];

  const onOpen = async () => {
    if (!api) return;
    try {
      const res = await api.get("/api/report/devices");
      dataList = Array.isArray(res) ? res : [];
      await showTable();
    } catch (e) {
      console.error("Fetch LAN report failed", e);
    }
  };
</script>

<Modal bind:open={show} size="xl" outsideclose={false} on:open={onOpen} title="LANデバイス">
  <div class="flex flex-col h-[70vh] text-xs sm:text-sm">
    <div class="m-1 overflow-auto">
      <table id="table-lan-report" class="display compact nowrap text-[10px]" style="width:99%" />
    </div>
    <div class="flex justify-end mt-auto p-2">
      <GradientButton
        shadow
        type="button"
        color="teal"
        class="!p-2"
        on:click={close}
      >
        <Icon path={icons.mdiCancel} size={1.2} />
      </GradientButton>
    </div>
  </div>
</Modal>

<style>
  table.nowrap {
    white-space: nowrap;
  }
  :global(.dataTables_wrapper .dataTables_scrollBody) {
    font-size: 10px;
  }
</style>