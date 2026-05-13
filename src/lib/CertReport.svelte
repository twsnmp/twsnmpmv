<script lang="ts">
  import { Modal as ModalOrig, GradientButton } from "flowbite-svelte";
  const Modal = ModalOrig as any;
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api, renderScore } from "./map";
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
    const id = `#table-cert-report`;
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
        scrollY: "65vh",
        scrollX: true,
        language: ja,
      });
    }
  };

  const columns = [
    { data: "Score", title: "スコア", render: renderScore },
    { data: "Target", title: "ターゲット" },
    { data: "Port", title: "ポート" },
    { data: "Subject", title: "証明内容" },
    { data: "Issuer", title: "発行者" },
    { 
      data: "Verify", 
      title: "検証", 
      render: (data: boolean) => data ? "はい" : "いいえ" 
    },
    { 
      data: "NotAfter", 
      title: "期限", 
      render: (data: number, type: string) => {
        if (type === 'display' && data) {
          const d = new Date(data * 1000);
          return d.toLocaleDateString();
        }
        return data;
      }
    },
  ];

  const onOpen = async () => {
    if (!api) return;
    try {
      const res = await api.get("/api/report/cert");
      dataList = Array.isArray(res) ? res : [];
      await showTable();
    } catch (e) {
      console.error("Fetch Cert report failed", e);
    }
  };
</script>

<Modal title="証明書管理" bind:open={show} size="xl" outsideclose={false} on:open={onOpen}>
  <div class="flex flex-col h-[70vh] text-xs sm:text-sm">
    <div class="m-1 overflow-auto">
      <table id="table-cert-report" class="display compact nowrap text-[10px]" style="width:99%" />
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