<script lang="ts">
  import { Modal as ModalOrig, GradientButton } from "flowbite-svelte";
  const Modal = ModalOrig as any;
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { showIPAMHeatmap, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;

  let table: any = undefined;
  let dataList: any = [];

  const close = () => {
    show = false;
  };

  const showTable = async () => {
    const id = `#table-ipam-report`;
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
        scrollY: "35vh",
        scrollX: true,
        language: ja,
      });
    }
    showIPAMHeatmap("ipam-report-chart", dataList);
  };

  const columns = [
    { data: "Range", title: "IP範囲" },
    { data: "Size", title: "サイズ" },
    { data: "Used", title: "使用量" },
    { 
      data: "Usage", 
      title: "使用率", 
      render: (data: number) => (data || 0).toFixed(1) + "%" 
    },
  ];

  const onOpen = async () => {
    if (!api) return;
    try {
      const res = await api.get("/api/report/ipam");
      dataList = Array.isArray(res) ? res : [];
      await showTable();
    } catch (e) {
      console.error("Fetch IPAM report failed", e);
    }
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="IPAM" bind:open={show} size="xl" outsideclose={false} on:open={onOpen}>
  <div class="flex flex-col h-[70vh] text-xs sm:text-sm">
    <div id="ipam-report-chart" class="w-full h-[35vh] mb-2" />
    <div class="m-1 overflow-auto">
      <table id="table-ipam-report" class="display compact nowrap text-[10px]" style="width:99%" />
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
  #ipam-report-chart {
    margin: 0 auto;
  }
</style>