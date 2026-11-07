<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { nodes, renderNodeState, renderIP } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { showStateChart, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;
  let table: any = undefined;
  let data: any[] = [];

  let totalNodes = 0;
  let normalNodes = 0;
  let warnNodes = 0;
  let highNodes = 0;

  const close = () => {
    show = false;
  };

  const showTable = () => {
    const tableId = "#node-table";
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

  const columns = [
    {
      data: "State",
      title: "状態",
      render: renderNodeState,
    },
    {
      data: "Name",
      title: "名前",
    },
    {
      data: "IP",
      title: "IPアドレス",
      render: renderIP,
    },
    {
      data: "MAC",
      title: "MACアドレス",
    },
  ];

  const onOpen = async () => {
    if (!nodes) {
      data = [];
      totalNodes = 0;
      normalNodes = 0;
      warnNodes = 0;
      highNodes = 0;
      return;
    }

    const list: any[] = [];
    let normal = 0;
    let warn = 0;
    let high = 0;

    for (const k in nodes) {
      const n = nodes[k];
      list.push(n);
      const st = String(n.State || "").toLowerCase();
      if (st === "normal") normal++;
      else if (st === "warn" || st === "low") warn++;
      else if (st === "high" || st === "repair") high++;
    }

    data = list;
    totalNodes = list.length;
    normalNodes = normal;
    warnNodes = warn;
    highNodes = high;

    await tick();
    showTable();
    showStateChart("node-chart", data);
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="ノードリスト" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="登録ノード総数"
        value={totalNodes}
        unit="台"
        subText="マップ上の全管理対象"
        color="cyan"
        iconPath={icons.mdiLaptop}
      />
      <KPICard
        title="正常稼働"
        value={normalNodes}
        unit="台"
        subText="正常ステータス (Normal)"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
      <KPICard
        title="警告・軽度"
        value={warnNodes}
        unit="台"
        subText="注意が必要なノード (Warn/Low)"
        color="amber"
        iconPath={icons.mdiAlert}
      />
      <KPICard
        title="重度・障害"
        value={highNodes}
        unit="台"
        subText="障害・復旧対象 (High/Repair)"
        color={highNodes > 0 ? "rose" : "slate"}
        iconPath={icons.mdiAlertOctagon}
      />
    </div>

    <!-- State Chart Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
        <Icon path={icons.mdiChartPie} size={0.75} />
        <span>ノード稼働ステータス内訳</span>
      </div>
      <div id="node-chart" class="w-full h-36 sm:h-40"></div>
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="node-table" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
