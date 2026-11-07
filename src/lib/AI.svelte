<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api, renderScore, renderTime } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { showAIChart, showAIHeatMap, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;
  let table: any = undefined;
  let data: any[] = [];
  let selectedTitle: string = "";

  let totalItems = 0;
  let highAnomalies = 0;
  let avgScore = "0.0";
  let maxScore = "0.0";

  const close = () => {
    show = false;
  };

  const showTable = () => {
    const tableId = "#ai-table";
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
      select: {
        style: "single",
      },
      order: [[0, "desc"]],
    });

    table.on("select", () => {
      const selected = table.rows({ selected: true }).data();
      if (selected.length === 1) {
        const row = selected[0];
        selectedTitle = `${row.NodeName} - ${row.PollingName}`;
        showHeatMap(row.ID);
      }
    });

    table.on("deselect", () => {
      selectedTitle = "";
      showAIChart("ai-chart", data);
    });
  };

  const showHeatMap = async (id: string) => {
    if (!api || !id) {
      return;
    }
    const path = api.getReportPath ? api.getReportPath("ai") : "/api/report/ai/";
    const air = await api.get(path + id);
    if (air) {
      const scoreData = (air.AIResult && air.AIResult.ScoreData) || air.ScoreData;
      if (scoreData) {
        showAIHeatMap("ai-chart", scoreData);
      }
    }
  };

  const columns = [
    {
      data: "Score",
      title: "異常スコア",
      render: renderScore,
    },
    {
      data: "NodeName",
      title: "ノード",
    },
    {
      data: "PollingName",
      title: "ポーリング",
    },
    {
      data: "Count",
      title: "データ数",
    },
    {
      data: "LastTime",
      title: "最終確認",
      render: (data: number, type: string) => {
        if (!data) return "";
        const nano = data > 1e14 ? data : (data > 1e11 ? data * 1000 * 1000 : data * 1000 * 1000 * 1000);
        return renderTime(nano, type);
      },
    },
  ];

  const onOpen = async () => {
    data = [];
    selectedTitle = "";
    if (!api) return;
    const listPath = api.getReportPath ? api.getReportPath("ailist") : "/api/report/ailist";
    const ai = await api.get(listPath);
    const list: any[] = [];
    let high = 0;
    let scoreSum = 0;
    let max = 0;

    if (Array.isArray(ai)) {
      for (const a of ai) {
        a.NodeName = a.NodeName || a.Node || "";
        a.PollingName = a.PollingName || a.Polling || "";
        list.push(a);
        const sc = a.Score || 0;
        if (sc >= 60) high++;
        scoreSum += sc;
        if (sc > max) max = sc;
      }
    }

    data = list;
    totalItems = list.length;
    highAnomalies = high;
    avgScore = list.length > 0 ? (scoreSum / list.length).toFixed(1) : "0.0";
    maxScore = list.length > 0 ? max.toFixed(1) : "0.0";

    await tick();
    showTable();
    showAIChart("ai-chart", data);
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="異常検知 (AI分析)" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="AI分析対象数"
        value={totalItems}
        unit="個"
        subText="分析中のポーリング項目"
        color="cyan"
        iconPath={icons.mdiBrain}
      />
      <KPICard
        title="異常検知 (≥60)"
        value={highAnomalies}
        unit="個"
        subText="スコア急上昇項目"
        color={highAnomalies > 0 ? "rose" : "emerald"}
        iconPath={icons.mdiAlertOctagon}
      />
      <KPICard
        title="平均異常スコア"
        value={avgScore}
        subText="全体平均スコア"
        color="slate"
        iconPath={icons.mdiChartLine}
      />
      <KPICard
        title="最大異常スコア"
        value={maxScore}
        subText="最高検知スコア"
        color={Number(maxScore) >= 60 ? "rose" : "amber"}
        iconPath={icons.mdiArrowUp}
      />
    </div>

    <!-- Chart Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <div class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Icon path={icons.mdiBrain} size={0.75} />
          <span>{selectedTitle ? `詳細ヒートマップ: ${selectedTitle}` : "異常スコア分布"}</span>
        </div>
      </div>
      <div id="ai-chart" class="w-full h-36 sm:h-40"></div>
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="ai-table" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
