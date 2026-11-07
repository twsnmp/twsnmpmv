<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { logs, renderState, renderTime } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { showLogChart, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;
  let table: any = undefined;
  let data: any[] = [];

  let totalLogs = 0;
  let highLogs = 0;
  let warnLogs = 0;
  let infoLogs = 0;

  const close = () => {
    show = false;
  };

  const showTable = () => {
    const tableId = "#log-table";
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
      order: [[1, "desc"]],
    });
  };

  const columns = [
    {
      data: "Level",
      title: "レベル",
      render: renderState,
    },
    {
      data: "Time",
      title: "日時",
      render: renderTime,
    },
    {
      data: "Type",
      title: "タイプ",
    },
    {
      data: "NodeName",
      title: "ノード",
    },
    {
      data: "Event",
      title: "イベント",
    },
  ];

  const onOpen = async () => {
    if (!logs) {
      data = [];
      totalLogs = 0;
      highLogs = 0;
      warnLogs = 0;
      infoLogs = 0;
      return;
    }

    const list: any[] = [];
    let high = 0;
    let warn = 0;
    let info = 0;

    for (const l of logs) {
      if (l.Type !== "user") {
        list.push(l);
        const lvl = String(l.Level || "").toLowerCase();
        if (lvl === "emergency" || lvl === "alert" || lvl === "crit" || lvl === "error" || lvl === "high") {
          high++;
        } else if (lvl === "warn" || lvl === "warning" || lvl === "low") {
          warn++;
        } else {
          info++;
        }
      }
    }

    data = list;
    totalLogs = list.length;
    highLogs = high;
    warnLogs = warn;
    infoLogs = info;

    await tick();
    showTable();
    showLogChart("log-chart", data);
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="ログ" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="総イベントログ"
        value={totalLogs}
        unit="件"
        subText="取得イベントログ総数"
        color="cyan"
        iconPath={icons.mdiListBox}
      />
      <KPICard
        title="重大・障害"
        value={highLogs}
        unit="件"
        subText="重要度: Error / High"
        color={highLogs > 0 ? "rose" : "slate"}
        iconPath={icons.mdiAlertOctagon}
      />
      <KPICard
        title="警告・注意"
        value={warnLogs}
        unit="件"
        subText="重要度: Warn / Low"
        color={warnLogs > 0 ? "amber" : "slate"}
        iconPath={icons.mdiAlert}
      />
      <KPICard
        title="情報・通常"
        value={infoLogs}
        unit="件"
        subText="正常動作・通知イベント"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
    </div>

    <!-- Chart Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
        <Icon path={icons.mdiChartTimelineVariant} size={0.75} />
        <span>イベントログ時系列推移</span>
      </div>
      <div id="log-chart" class="w-full h-36 sm:h-40"></div>
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="log-table" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
