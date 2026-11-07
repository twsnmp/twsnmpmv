<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { nodes, pollings, renderState, renderTime } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { showStateChart, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;
  let table: any = undefined;
  let data: any[] = [];

  let totalPollings = 0;
  let normalPollings = 0;
  let warnPollings = 0;
  let highPollings = 0;

  const close = () => {
    show = false;
  };

  const showTable = () => {
    const tableId = "#polling-table";
    if (table && DataTable.isDataTable(tableId)) {
      table.clear();
      table.destroy();
      table = undefined;
    }
    const el = document.querySelector(tableId);
    if (!el) return;

    table = new DataTable(tableId, {
      columns: columns,
      data: data,
      paging: false,
      searching: false,
      info: false,
      scrollY: "calc(35vh - 50px)",
      scrollX: true,
      language: ja,
      order: [[0, "asc"]],
    });
  };

  const getNodeName = (id: string) => {
    return nodes && nodes[id] ? nodes[id].Name || "" : "";
  };

  const columns = [
    {
      data: "State",
      title: "状態",
      render: renderState,
    },
    {
      data: "NodeID",
      title: "ノード名",
      render: (id: string) => getNodeName(id),
    },
    {
      data: "Name",
      title: "名前",
    },
    {
      data: "Type",
      title: "タイプ",
    },
    {
      data: "LastTime",
      title: "最終確認",
      render: renderTime,
    },
  ];

  const onOpen = async () => {
    if (!nodes || !pollings) {
      data = [];
      totalPollings = 0;
      normalPollings = 0;
      warnPollings = 0;
      highPollings = 0;
      return;
    }

    const list: any[] = [];
    let normal = 0;
    let warn = 0;
    let high = 0;

    const processItem = (p: any) => {
      list.push(p);
      const st = String(p.State || "").toLowerCase();
      if (st === "normal") normal++;
      else if (st === "warn" || st === "low") warn++;
      else if (st === "high" || st === "repair") high++;
    };

    for (const k in pollings) {
      const pVal = pollings[k];
      if (Array.isArray(pVal)) {
        for (const p of pVal) {
          processItem(p);
        }
      } else if (pVal && typeof pVal === "object") {
        processItem(pVal);
      }
    }

    data = list;
    totalPollings = list.length;
    normalPollings = normal;
    warnPollings = warn;
    highPollings = high;

    await tick();
    showTable();
    showStateChart("polling-chart", data);
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="ポーリング" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="監視項目総数"
        value={totalPollings}
        unit="個"
        subText="登録ポーリング総数"
        color="cyan"
        iconPath={icons.mdiLanCheck}
      />
      <KPICard
        title="正常稼働"
        value={normalPollings}
        unit="個"
        subText="正常ステータス (Normal)"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
      <KPICard
        title="警告・注意"
        value={warnPollings}
        unit="個"
        subText="注意が必要な項目 (Warn/Low)"
        color="amber"
        iconPath={icons.mdiAlert}
      />
      <KPICard
        title="障害・停止"
        value={highPollings}
        unit="個"
        subText="障害・復旧対象 (High/Repair)"
        color={highPollings > 0 ? "rose" : "slate"}
        iconPath={icons.mdiAlertOctagon}
      />
    </div>

    <!-- State Chart Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
        <Icon path={icons.mdiChartPie} size={0.75} />
        <span>ポーリング監視ステータス内訳</span>
      </div>
      <div id="polling-chart" class="w-full h-36 sm:h-40"></div>
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="polling-table" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
