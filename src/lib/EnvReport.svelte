<script lang="ts">
  import { Modal as ModalOrig, GradientButton, Tabs, TabItem } from "flowbite-svelte";
  const Modal = ModalOrig as any;
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api, renderTime } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { showEnvChart, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;

  let table: any = undefined;
  let dataList: any = [];
  let selectedType = "RSSI";

  const close = () => {
    show = false;
  };

  const showTable = async () => {
    const id = `#table-env-report`;
    await tick();
    
    if (table) {
      table.destroy();
      table = undefined;
      const el = document.querySelector(id);
      if (el) {
        el.innerHTML = "";
      }
    }

    const el = document.querySelector(id);
    if (!el) return;

    const displayData = getDisplayData();
    if (displayData && displayData.length > 0) {
      table = new DataTable(id, {
        columns: timeSeriesColumns,
        data: displayData,
        paging: false,
        searching: false,
        info: false,
        scrollY: "35vh",
        scrollX: true,
        language: ja,
        destroy: true,
      });
    }
    updateChart();
  };

  const typesToFilter = ["BarometricPressure", "ECo2", "RSSI"];

  const getDisplayData = () => {
    const result: any[] = [];
    dataList.forEach((s: any) => {
      if (s.EnvData) {
        s.EnvData.forEach((d: any) => {
          const val = d[selectedType];
          if (typesToFilter.includes(selectedType) && val === 0) return;
          result.push({
            Time: d.Time,
            Name: s.Name || s.Address,
            Value: val,
          });
        });
      }
    });
    return result.sort((a, b) => b.Time - a.Time);
  };

  const updateChart = () => {
    const divId = "env-report-chart";
    const div = document.getElementById(divId);
    if (!div) return;
    showEnvChart(divId, dataList, selectedType);
  };

  const timeSeriesColumns = [
    { 
      data: "Time", 
      title: "日時", 
      render: (data: any, type: string) => renderTime(data, type) 
    },
    { data: "Name", title: "センサー名" },
    { 
      data: "Value", 
      title: "値",
      render: (data: any) => typeof data === 'number' ? data.toFixed(2) : data
    },
  ];

  const onOpen = async () => {
    if (!api) return;
    try {
      const res = await api.get("/api/report/EnvMonitor");
      dataList = Array.isArray(res) ? res : [];
      selectedType = "RSSI";
      await showTable();
    } catch (e) {
      console.error("Fetch Env report failed", e);
    }
  };

  $: if (show && selectedType) {
    showTable();
  }
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="環境モニター" bind:open={show} size="xl" outsideclose={false} on:open={onOpen}>
  <div class="flex flex-col h-[70vh] text-xs sm:text-sm">
    <div class="flex flex-col mb-2 overflow-hidden">
      <div class="overflow-x-auto scrollbar-hide">
        <Tabs style="underline" contentClass="p-0" defaultClass="flex flex-nowrap space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700 min-w-max">
          <TabItem open={selectedType === 'RSSI'} title="RSSI" titleClass="px-1 py-2 text-[10px]" on:click={() => selectedType = 'RSSI'} />
          <TabItem open={selectedType === 'Temp'} title="気温" titleClass="px-1 py-2 text-[10px]" on:click={() => selectedType = 'Temp'} />
          <TabItem open={selectedType === 'Humidity'} title="湿度" titleClass="px-1 py-2 text-[10px]" on:click={() => selectedType = 'Humidity'} />
          <TabItem open={selectedType === 'BarometricPressure'} title="気圧" titleClass="px-1 py-2 text-[10px]" on:click={() => selectedType = 'BarometricPressure'} />
          <TabItem open={selectedType === 'ECo2'} title="CO2" titleClass="px-1 py-2 text-[10px]" on:click={() => selectedType = 'ECo2'} />
        </Tabs>
      </div>
      <div id="env-report-chart" class="w-full h-[35vh]" />
    </div>
    <div class="m-1 overflow-auto flex-grow bg-white dark:bg-gray-800">
      <table id="table-env-report" class="display compact nowrap text-[10px]" style="width:99%" />
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
  #env-report-chart {
    margin: 0 auto;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>