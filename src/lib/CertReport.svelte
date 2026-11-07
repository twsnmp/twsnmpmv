<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import * as echarts from "echarts";
  import { api, renderScore, pollings, nodes } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import { isDark, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;

  let table: any = undefined;
  let dataList: any[] = [];
  let chartElem: HTMLElement | null = null;
  let chartInstance: echarts.ECharts | null = null;

  let totalCerts = 0;
  let validCerts = 0;
  let expiringCerts = 0;
  let errorCerts = 0;

  const close = () => {
    show = false;
  };

  const getRemainingDays = (notAfterSec: number): number => {
    if (!notAfterSec || notAfterSec <= 0) return 0;
    const nowSec = Math.floor(Date.now() / 1000);
    return Math.ceil((notAfterSec - nowSec) / 86400);
  };

  const renderCertChart = () => {
    if (!chartElem || dataList.length === 0) return;
    if (chartInstance) {
      chartInstance.dispose();
    }
    const dark = isDark();
    chartInstance = echarts.init(chartElem, dark ? "dark" : undefined);

    let d7 = 0;
    let d30 = 0;
    let d90 = 0;
    let dMore = 0;
    let expired = 0;

    for (const c of dataList) {
      const days = getRemainingDays(c.NotAfter);
      if (days <= 0) expired++;
      else if (days <= 7) d7++;
      else if (days <= 30) d30++;
      else if (days <= 90) d90++;
      else dMore++;
    }

    const categories = ["失効", "7日以内", "30日以内", "90日以内", "90日超"];
    const counts = [expired, d7, d30, d90, dMore];
    const colors = ["#f43f5e", "#fb7185", "#f59e0b", "#38bdf8", "#10b981"];

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          if (!params || !params.length) return "";
          const item = params[0];
          return `<b>${item.name}</b>: ${item.value} 件`;
        },
      },
      grid: {
        top: 10,
        bottom: 22,
        left: 60,
        right: 30,
        containLabel: false,
      },
      xAxis: {
        type: "value",
        minInterval: 1,
        splitLine: {
          lineStyle: {
            color: dark ? "#334155" : "#e2e8f0",
            type: "dashed",
          },
        },
        axisLabel: {
          fontSize: 9,
          color: dark ? "#94a3b8" : "#64748b",
        },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: dark ? "#cbd5e1" : "#475569",
        },
      },
      series: [
        {
          name: "証明書数",
          type: "bar",
          data: counts.map((cnt, idx) => ({
            value: cnt,
            itemStyle: { color: colors[idx], borderRadius: [0, 4, 4, 0] },
          })),
          label: {
            show: true,
            position: "right",
            fontSize: 10,
            fontFamily: "monospace",
            color: dark ? "#94a3b8" : "#64748b",
          },
        },
      ],
    };

    chartInstance.setOption(option);
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
        scrollY: "calc(35vh - 50px)",
        scrollX: true,
        language: ja,
      });
    }
    renderCertChart();
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
      render: (data: boolean) => (data ? "合格" : "<span class='text-rose-500 font-bold'>失敗</span>") 
    },
    { 
      data: "NotAfter", 
      title: "期限", 
      render: (data: number, type: string) => {
        if (type === 'display' && data) {
          const d = new Date(data * 1000);
          const days = getRemainingDays(data);
          const badge = days <= 0
            ? "<span class='text-rose-500 font-bold ml-1'>(失効)</span>"
            : days <= 30
            ? `<span class='text-amber-500 font-bold ml-1'>(${days}日)</span>`
            : `<span class='text-slate-400 ml-1'>(${days}日)</span>`;
          return `${d.toLocaleDateString()} ${badge}`;
        }
        return data;
      }
    },
  ];

  const onOpen = async () => {
    if (!api) return;
    try {
      if (api.serverType === "neo") {
        const list: any[] = [];
        // 1. Extract from TLS cert pollings
        if (pollings) {
          const pollList: any[] = [];
          for (const k in pollings) {
            const pVal = pollings[k];
            if (Array.isArray(pVal)) {
              pollList.push(...pVal);
            } else if (pVal && typeof pVal === "object") {
              pollList.push(pVal);
            }
          }
          const certPolls = pollList.filter((p) => {
            const pType = String(p.Type || p.type || "").toLowerCase();
            const pMode = String(p.Mode || p.mode || "").toLowerCase();
            return pType === "tls" && pMode === "cert";
          });

          for (const p of certPolls) {
            const res = (p.Result || p.result || {}) as Record<string, any>;
            const pNodeId = p.NodeID || p.node_id || p.nodeId || "";
            const node = nodes && nodes[pNodeId];
            const rawTarget = res.target || p.Params || p.params || (node ? node.IP || node.ip : "") || "";
            let host = rawTarget;
            let port = 443;
            if (rawTarget.includes(":")) {
              const parts = rawTarget.split(":");
              host = parts[0];
              port = Number(parts[1]) || 443;
            } else if (!isNaN(Number(rawTarget)) && Number(rawTarget) > 0) {
              port = Number(rawTarget);
              host = node ? node.IP || node.ip : "";
            }

            let notAfterSec = 0;
            if (res.notAfterUnix) {
              notAfterSec = Number(res.notAfterUnix);
            } else if (res.notAfter) {
              notAfterSec = Math.floor(Date.parse(res.notAfter) / 1000);
            }

            const state = String(p.State || p.state || "").toLowerCase();
            const score = state === "normal" ? 40 : (state === "warn" ? 50 : 80);

            list.push({
              Score: score,
              Target: host,
              Port: port,
              Subject: res.subject || "-",
              Issuer: res.issuer || "-",
              Verify: res.verify !== false && res.valid !== "false",
              NotAfter: notAfterSec,
            });
          }
        }

        // 2. Also check external TLS monitors (/api/cert_monitors)
        try {
          const res = await api.get("/api/cert_monitors");
          if (Array.isArray(res)) {
            for (const c of res) {
              list.push({
                Score: c.Score || (c.state === "error" ? 80 : (c.state === "warn" ? 50 : 40)),
                Target: c.Target || c.target || "",
                Port: c.Port || c.port || 443,
                Subject: c.Subject || c.subject || "-",
                Issuer: c.Issuer || c.issuer || "-",
                Verify: c.Verify ?? c.verify ?? true,
                NotAfter: c.NotAfter || c.notAfter || 0,
              });
            }
          }
        } catch (_) {}

        dataList = list;
      } else {
        const path = api.getReportPath ? api.getReportPath("cert") : "/api/report/cert";
        const res = await api.get(path);
        dataList = Array.isArray(res) ? res : [];
      }

      let valid = 0;
      let expiring = 0;
      let errCount = 0;
      for (const c of dataList) {
        const days = getRemainingDays(c.NotAfter);
        const hasErr = c.Verify === false || days <= 0 || (c.Score !== undefined && c.Score >= 60);
        if (hasErr) {
          errCount++;
        } else if (days <= 30) {
          expiring++;
        } else {
          valid++;
        }
      }
      totalCerts = dataList.length;
      validCerts = valid;
      expiringCerts = expiring;
      errorCerts = errCount;

      await showTable();
    } catch (e) {
      console.error("Fetch Cert report failed", e);
    }
  };

  const handleResize = () => {
    if (chartInstance) chartInstance.resize();
    resizeChart();
  };
</script>

<svelte:window on:resize={handleResize} />

<Modal title="証明書管理" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="監視証明書総数"
        value={totalCerts}
        unit="件"
        subText="TLS監視対象証明書"
        color="cyan"
        iconPath={icons.mdiCertificate}
      />
      <KPICard
        title="有効 (30日超)"
        value={validCerts}
        unit="件"
        subText="十分な有効期限残 (Normal)"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
      <KPICard
        title="期限切迫 (30日以内)"
        value={expiringCerts}
        unit="件"
        subText="更新推奨 (Warn)"
        color={expiringCerts > 0 ? "amber" : "slate"}
        iconPath={icons.mdiAlert}
      />
      <KPICard
        title="失効・検証エラー"
        value={errorCerts}
        unit="件"
        subText="即時対応要 (High / Error)"
        color={errorCerts > 0 ? "rose" : "slate"}
        iconPath={icons.mdiAlertOctagon}
      />
    </div>

    <!-- Expiration Breakdown Chart -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
        <Icon path={icons.mdiShieldCheck} size={0.75} />
        <span>TLS証明書有効期限分布</span>
      </div>
      {#if dataList.length === 0}
        <div class="p-6 text-center text-slate-400 text-xs">監視対象の証明書がありません</div>
      {:else}
        <div bind:this={chartElem} class="w-full h-32 sm:h-36"></div>
      {/if}
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="table-cert-report" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
