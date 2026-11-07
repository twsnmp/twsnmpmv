<script lang="ts">
  import { Modal, KPICard, Tabs, TabItem } from "./ui";
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
  let dataList: any[] = [];
  let selectedType = "RSSI";

  let sensorCount = 0;
  let latestVal = "-";
  let maxVal = "-";
  let minVal = "-";

  const close = () => {
    show = false;
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

  const getMetricUnit = (type: string): string => {
    switch (type) {
      case "Temp": return "℃";
      case "Humidity": return "%";
      case "BarometricPressure": return "hPa";
      case "ECo2": return "ppm";
      case "RSSI": return "dBm";
      default: return "";
    }
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
    sensorCount = dataList.length;
    const metricValues = displayData
      .map((d) => (typeof d.Value === "number" ? d.Value : parseFloat(d.Value)))
      .filter((v) => !isNaN(v));
    latestVal = metricValues.length > 0 ? metricValues[0].toFixed(1) : "-";
    maxVal = metricValues.length > 0 ? Math.max(...metricValues).toFixed(1) : "-";
    minVal = metricValues.length > 0 ? Math.min(...metricValues).toFixed(1) : "-";

    if (displayData && displayData.length > 0) {
      table = new DataTable(id, {
        columns: timeSeriesColumns,
        data: displayData,
        paging: false,
        searching: false,
        info: false,
        scrollY: "calc(35vh - 70px)",
        scrollX: true,
        language: ja,
        destroy: true,
      });
    }
    updateChart();
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
      render: (data: any) => (typeof data === "number" ? data.toFixed(2) : data)
    },
  ];

  const onOpen = async () => {
    if (!api) return;
    try {
      const path = api.getReportPath ? api.getReportPath("env") : "/api/report/EnvMonitor";
      const res = await api.get(path);
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

<Modal title="環境モニター" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="監視センサー数"
        value={sensorCount}
        unit="台"
        subText="環境測定端末"
        color="cyan"
        iconPath={icons.mdiThermometer}
      />
      <KPICard
        title={`最新 ${selectedType}`}
        value={latestVal}
        unit={getMetricUnit(selectedType)}
        subText="最新測定データ"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
      <KPICard
        title={`最高 ${selectedType}`}
        value={maxVal}
        unit={getMetricUnit(selectedType)}
        subText="期間内ピーク値 (Max)"
        color="amber"
        iconPath={icons.mdiArrowUp}
      />
      <KPICard
        title={`最低 ${selectedType}`}
        value={minVal}
        unit={getMetricUnit(selectedType)}
        subText="期間内ボトム値 (Min)"
        color="slate"
        iconPath={icons.mdiArrowDown}
      />
    </div>

    <!-- Chart with Category Tabs -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 gap-2">
        <div class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Icon path={icons.mdiChartLine} size={0.75} />
          <span>環境センサー時系列推移</span>
        </div>
        <div class="overflow-x-auto scrollbar-hide">
          <Tabs style="underline" contentClass="p-0" defaultClass="flex flex-nowrap space-x-1 rtl:space-x-reverse min-w-max">
            <TabItem open={selectedType === 'RSSI'} title="RSSI" titleClass="px-2 py-1 text-[11px]" onclick={() => selectedType = 'RSSI'} />
            <TabItem open={selectedType === 'Temp'} title="気温" titleClass="px-2 py-1 text-[11px]" onclick={() => selectedType = 'Temp'} />
            <TabItem open={selectedType === 'Humidity'} title="湿度" titleClass="px-2 py-1 text-[11px]" onclick={() => selectedType = 'Humidity'} />
            <TabItem open={selectedType === 'BarometricPressure'} title="気圧" titleClass="px-2 py-1 text-[11px]" onclick={() => selectedType = 'BarometricPressure'} />
            <TabItem open={selectedType === 'ECo2'} title="CO2" titleClass="px-2 py-1 text-[11px]" onclick={() => selectedType = 'ECo2'} />
          </Tabs>
        </div>
      </div>
      <div id="env-report-chart" class="w-full h-36 sm:h-40"></div>
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="table-env-report" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
