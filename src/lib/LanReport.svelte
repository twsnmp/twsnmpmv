<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import * as echarts from "echarts";
  import { api, renderScore, renderTime, renderIP, nodes } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick, onMount, onDestroy } from "svelte";
  import { isDark, resizeChart } from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;

  let table: any = undefined;
  let dataList: any[] = [];
  let vendorChartElem: HTMLElement | null = null;
  let vendorChartInstance: echarts.ECharts | null = null;

  let totalDevices = 0;
  let managedCount = 0;
  let unmanagedCount = 0;
  let alertCount = 0;

  const close = () => {
    show = false;
  };

  const isManagedDevice = (d: any): boolean => {
    if (d.isManaged !== undefined) return d.isManaged;
    if (!nodes) return false;
    const dMac = String(d.ID || d.MAC || "").toUpperCase();
    return Object.values(nodes).some((n: any) => {
      if (n.IP && d.IP && n.IP === d.IP) return true;
      if (n.MAC && dMac && String(n.MAC).toUpperCase() === dMac) return true;
      return false;
    });
  };

  const renderVendorChart = () => {
    if (!vendorChartElem || dataList.length === 0) return;
    if (vendorChartInstance) {
      vendorChartInstance.dispose();
    }
    const dark = isDark();
    vendorChartInstance = echarts.init(vendorChartElem, dark ? "dark" : undefined);

    const vendorMap = new Map<string, number>();
    for (const d of dataList) {
      const v = (d.Vendor || "").trim() || "不明 (Unknown)";
      vendorMap.set(v, (vendorMap.get(v) || 0) + 1);
    }

    const topVendors = Array.from(vendorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reverse();

    const yData = topVendors.map(([name]) => name);
    const seriesData = topVendors.map(([, count]) => count);

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          if (!params || !params.length) return "";
          const item = params[0];
          return `<b>${item.name}</b>: ${item.value} 台`;
        },
      },
      grid: {
        top: 8,
        bottom: 20,
        left: 110,
        right: 40,
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
        data: yData,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: dark ? "#cbd5e1" : "#475569",
          formatter: (val: string) => (val.length > 14 ? val.slice(0, 13) + "…" : val),
        },
      },
      series: [
        {
          name: "端末数",
          type: "bar",
          data: seriesData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#38bdf8" },
              { offset: 1, color: "#0284c7" },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
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

    vendorChartInstance.setOption(option);
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
        scrollY: "calc(35vh - 50px)",
        scrollX: true,
        language: ja,
      });
    }
    renderVendorChart();
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
      const path = api.getReportPath ? api.getReportPath("devices") : "/api/report/devices";
      const res = await api.get(path);
      const rawList = Array.isArray(res) ? res : [];
      if (api.serverType === "neo" || (rawList.length > 0 && rawList[0].MAC !== undefined && rawList[0].ID === undefined)) {
        // Normalize NEO ARP table & nodes into FC devices format
        const arpByIP = new Map<string, any>();
        const arpByMAC = new Map<string, any>();
        for (const a of rawList) {
          if (a.IP) arpByIP.set(a.IP, a);
          if (a.MAC) arpByMAC.set(String(a.MAC).toUpperCase(), a);
        }

        const list: any[] = [];
        const seenIPs = new Set<string>();
        const seenMACs = new Set<string>();

        // 1. Add known nodes from map
        if (nodes) {
          for (const k in nodes) {
            const n = nodes[k];
            const cleanMac = String(n.MAC || "").toUpperCase();
            const matchedArp = (n.IP ? arpByIP.get(n.IP) : undefined) || (cleanMac ? arpByMAC.get(cleanMac) : undefined);
            const state = String(n.State || "").toLowerCase();
            const score = state === "normal" ? 40 : (state === "warn" ? 50 : (state ? 80 : 40));
            list.push({
              Score: score,
              ID: cleanMac || (matchedArp ? matchedArp.MAC : "-"),
              Name: n.Name || "",
              IP: n.IP || (matchedArp ? matchedArp.IP : ""),
              Vendor: n.Vendor || (matchedArp ? matchedArp.Vendor : ""),
              FirstTime: matchedArp ? matchedArp.FirstTime : 0,
              LastTime: matchedArp ? matchedArp.LastTime : 0,
              isManaged: true,
            });
            if (n.IP) seenIPs.add(n.IP);
            if (cleanMac) seenMACs.add(cleanMac);
          }
        }

        // 2. Add remaining unmanaged ARP entries
        for (const a of rawList) {
          const cleanMac = String(a.MAC || "").toUpperCase();
          if (!seenIPs.has(a.IP) && (!cleanMac || !seenMACs.has(cleanMac))) {
            list.push({
              Score: 40,
              ID: a.MAC || "-",
              Name: a.Vendor || a.IP,
              IP: a.IP,
              Vendor: a.Vendor || "",
              FirstTime: a.FirstTime || 0,
              LastTime: a.LastTime || 0,
              isManaged: false,
            });
            if (a.IP) seenIPs.add(a.IP);
            if (cleanMac) seenMACs.add(cleanMac);
          }
        }
        dataList = list;
      } else {
        dataList = rawList;
      }

      let managed = 0;
      let alert = 0;
      for (const d of dataList) {
        if (isManagedDevice(d)) managed++;
        if (d.Score && (d.Score >= 60 || d.Score <= 35)) alert++;
      }
      totalDevices = dataList.length;
      managedCount = managed;
      unmanagedCount = totalDevices - managed;
      alertCount = alert;

      await showTable();
    } catch (e) {
      console.error("Fetch LAN report failed", e);
    }
  };

  const handleResize = () => {
    if (vendorChartInstance) vendorChartInstance.resize();
    resizeChart();
  };
</script>

<svelte:window on:resize={handleResize} />

<Modal title="LANデバイス" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-3 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="検出端末総数"
        value={totalDevices}
        unit="台"
        subText="LAN内で検知された全端末"
        color="cyan"
        iconPath={icons.mdiLaptop}
      />
      <KPICard
        title="管理ノード数"
        value={managedCount}
        unit="台"
        subText="マップ登録済み機器"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
      <KPICard
        title="未管理デバイス"
        value={unmanagedCount}
        unit="台"
        subText="ARP検知・未登録機器"
        color="amber"
        iconPath={icons.mdiFolderNetwork}
      />
      <KPICard
        title="注意・変化検知"
        value={alertCount}
        unit="台"
        subText="高スコア / 要確認端末"
        color={alertCount > 0 ? "rose" : "slate"}
        iconPath={icons.mdiInformation}
      />
    </div>

    <!-- Vendor Breakdown Bar Chart -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
        <Icon path={icons.mdiLaptop} size={0.75} />
        <span>上位ベンダー内訳 (Top 5 Vendors)</span>
      </div>
      {#if dataList.length === 0}
        <div class="p-6 text-center text-slate-400 text-xs">データがありません</div>
      {:else}
        <div bind:this={vendorChartElem} class="w-full h-32 sm:h-36"></div>
      {/if}
    </div>

    <!-- DataTable Container -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 shadow-xs overflow-hidden">
      <table id="table-lan-report" class="display compact nowrap text-[10px]" style="width:99%"></table>
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
