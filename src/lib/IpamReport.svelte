<script lang="ts">
  import { Modal, KPICard } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import * as echarts from "echarts";
  import { api, nodes } from "./map";
  import { tick, onMount, onDestroy } from "svelte";
  import { isDark, resizeChart } from "./chart";

  export let show = false;

  interface SubnetBlock {
    Subnet: string;
    Size: number;
    Used: number;
    Usage: number;
  }

  interface IPAMRange {
    Range: string;
    StartIP: string;
    EndIP: string;
    Size: number;
    Used: number;
    Usage: number;
    UsedIP?: number[];
    Subnets?: SubnetBlock[];
  }

  interface IPAMReport {
    Ranges: IPAMRange[];
    TotalRanges: number;
    TotalSize: number;
    TotalUsed: number;
    TotalUsage: number;
  }

  let ipamReport: IPAMReport = {
    Ranges: [],
    TotalRanges: 0,
    TotalSize: 0,
    TotalUsed: 0,
    TotalUsage: 0,
  };

  let rawDevices: any[] = [];
  let effectiveDevices: any[] = [];
  let selectedRangeIndex = 0;
  let selectedSubnetBlock: string | null = null;
  let selectedHostInfo: any | null = null;
  let searchQuery = "";
  let onlyUsedBlocks = false;

  let chartInstance: echarts.ECharts | null = null;

  const close = () => {
    show = false;
  };

  const ipToUint32 = (ipStr: string): number => {
    const parts = (ipStr || "").trim().split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return 0;
    return ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
  };

  const uint32ToIp = (num: number): string => {
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
  };

  const parseRange = (rangeStr: string): { startIP: string; endIP: string; size: number } => {
    const range = (rangeStr || "").trim();
    if (range.includes("-")) {
      const parts = range.split("-").map((s) => s.trim());
      const sNum = ipToUint32(parts[0]);
      const eNum = ipToUint32(parts[1]);
      return {
        startIP: parts[0],
        endIP: parts[1],
        size: sNum > 0 && eNum >= sNum ? eNum - sNum + 1 : 0,
      };
    }
    if (range.includes("/")) {
      const [ipPart, maskStr] = range.split("/");
      const mask = parseInt(maskStr, 10);
      const ipNum = ipToUint32(ipPart.trim());
      if (!isNaN(mask) && mask >= 0 && mask <= 32 && ipNum >= 0) {
        const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
        const startNum = (ipNum & maskNum) >>> 0;
        const size = Math.pow(2, 32 - mask);
        const endNum = (startNum + size - 1) >>> 0;
        return {
          startIP: uint32ToIp(startNum),
          endIP: uint32ToIp(endNum),
          size,
        };
      }
    }
    return { startIP: "", endIP: "", size: 0 };
  };

  const buildEffectiveDevices = () => {
    const list: any[] = [];
    const seenIPs = new Set<string>();

    if (nodes) {
      for (const k in nodes) {
        const n = nodes[k];
        if (n && n.IP) {
          list.push({
            ip: n.IP,
            name: n.Name || n.IP,
            mac: n.MAC || "",
            vendor: n.Vendor || "",
            isManaged: true,
          });
          seenIPs.add(n.IP);
        }
      }
    }

    if (rawDevices && Array.isArray(rawDevices)) {
      for (const d of rawDevices) {
        const ip = d.IP || d.ip;
        if (ip && !seenIPs.has(ip)) {
          list.push({
            ip: ip,
            name: d.Name || d.name || d.Vendor || d.vendor || ip,
            mac: d.MAC || d.mac || d.ID || "",
            vendor: d.Vendor || d.vendor || "",
            isManaged: false,
          });
          seenIPs.add(ip);
        }
      }
    }
    effectiveDevices = list;
  };

  $: currentRange = ipamReport.Ranges[selectedRangeIndex] || null;

  $: isLargeRange = currentRange ? currentRange.Size > 256 : false;

  $: activeSubnetPrefix = (() => {
    if (selectedSubnetBlock) {
      return selectedSubnetBlock.replace(/\.0\/24$/, "");
    }
    if (currentRange && currentRange.Size <= 256) {
      const s = currentRange.StartIP || currentRange.Range.split("/")[0] || currentRange.Range.split("-")[0];
      const parts = s.split(".");
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
    }
    return "";
  })();

  $: currentSubnetHosts = (() => {
    const prefix = activeSubnetPrefix;
    const hostMap = new Map<number, any>();
    if (!prefix) return { prefix: "", hostMap };

    for (const d of effectiveDevices) {
      if (d.ip && d.ip.startsWith(prefix + ".")) {
        const last = parseInt(d.ip.substring(prefix.length + 1), 10);
        if (!isNaN(last) && last >= 1 && last <= 254) {
          hostMap.set(last, d);
        }
      }
    }
    return { prefix, hostMap };
  })();

  $: displayedSubnetBlocks = (() => {
    if (!currentRange || !currentRange.Subnets) return [];
    if (!onlyUsedBlocks) return currentRange.Subnets;
    return currentRange.Subnets.filter((b) => b.Used > 0);
  })();

  // Render ECharts IP density heatmap
  const renderHeatmap = () => {
    const el = document.getElementById("ipam-report-chart");
    if (!el || ipamReport.Ranges.length === 0) return;

    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }

    const dark = isDark();
    chartInstance = echarts.init(el, dark ? "dark" : undefined);
    const yData = ipamReport.Ranges.map((r) => r.Range).reverse();
    const xData: number[] = [];
    for (let i = 0; i < 100; i++) xData.push(i);

    const seriesData: [number, number, number][] = [];
    let maxVal = 1;
    for (let y = 0; y < ipamReport.Ranges.length; y++) {
      const r = ipamReport.Ranges[ipamReport.Ranges.length - 1 - y];
      for (let x = 0; x < 100; x++) {
        const val = r.UsedIP ? r.UsedIP[x] || 0 : 0;
        seriesData.push([x, y, val]);
        if (val > maxVal) maxVal = val;
      }
    }

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        position: "top",
        formatter: (params: any) => {
          const val = params.value;
          const rangeName = yData[val[1]];
          return `<b>${rangeName}</b><br/>相対位置: ${val[0]}% 〜 ${val[0] + 1}%<br/>使用中ホスト: ${val[2]} 件`;
        },
      },
      grid: {
        left: 8,
        right: 48,
        top: 10,
        bottom: 22,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xData.map((x) => `${x}%`),
        axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 9, interval: 19 },
        axisLine: { lineStyle: { color: dark ? "#334155" : "#cbd5e1" } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: yData,
        axisLabel: {
          color: dark ? "#cbd5e1" : "#334155",
          fontSize: 9,
          margin: 6,
          formatter: (val: string) => (val.length > 18 ? val.slice(0, 17) + "…" : val),
        },
        axisLine: { lineStyle: { color: dark ? "#334155" : "#cbd5e1" } },
        splitLine: { show: false },
      },
      visualMap: {
        min: 0,
        max: Math.max(1, maxVal),
        calculable: true,
        orient: "vertical",
        right: 4,
        top: "middle",
        itemWidth: 8,
        itemHeight: 56,
        text: ["高", "低"],
        textGap: 4,
        textStyle: { color: dark ? "#94a3b8" : "#475569", fontSize: 8 },
        inRange: {
          color: dark
            ? ["#1e293b", "#0284c7", "#10b981", "#eab308", "#f43f5e"]
            : ["#f1f5f9", "#93c5fd", "#10b981", "#f59e0b", "#ef4444"],
        },
      },
      series: [
        {
          name: "IP利用密度",
          type: "heatmap",
          data: seriesData,
          itemStyle: {
            borderColor: dark ? "#0f172a" : "#ffffff",
            borderWidth: 0.5,
          },
          emphasis: {
            itemStyle: {
              borderColor: "#38bdf8",
              borderWidth: 1.5,
            },
          },
          animation: false,
        },
      ],
    };

    chartInstance.setOption(option);
    chartInstance.resize();

    chartInstance.on("click", (params: any) => {
      if (params.value && Array.isArray(params.value)) {
        const yIdx = params.value[1];
        const clickedRange = yData[yIdx];
        const origIdx = ipamReport.Ranges.findIndex((r) => r.Range === clickedRange);
        if (origIdx !== -1) {
          selectedRangeIndex = origIdx;
          selectedSubnetBlock = null;
          selectedHostInfo = null;
        }
      }
    });
  };

  const getUsageBadgeColor = (usage: number) => {
    if (usage < 50) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
    if (usage < 80) return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30";
    if (usage < 95) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30";
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30";
  };

  const getUsageProgressBarColor = (usage: number) => {
    if (usage < 50) return "bg-emerald-500";
    if (usage < 80) return "bg-cyan-500";
    if (usage < 95) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Generate /24 subnet blocks if missing (FC compatibility)
  const populateSubnetBlocks = (r: IPAMRange, devices: any[]) => {
    if (r.Subnets && r.Subnets.length > 0) return;
    if (r.Size <= 256) return;

    const startNum = ipToUint32(r.StartIP);
    const endNum = ipToUint32(r.EndIP);
    if (startNum === 0 || endNum === 0 || startNum > endNum) return;

    // Group devices in range by /24 prefix
    const prefixCount = new Map<string, number>();
    for (const d of devices) {
      if (d.ip) {
        const dNum = ipToUint32(d.ip);
        if (dNum >= startNum && dNum <= endNum) {
          const parts = d.ip.split(".");
          if (parts.length === 4) {
            const pref = `${parts[0]}.${parts[1]}.${parts[2]}`;
            prefixCount.set(pref, (prefixCount.get(pref) || 0) + 1);
          }
        }
      }
    }

    const firstBlock = (startNum >>> 8) << 8;
    const lastBlock = (endNum >>> 8) << 8;
    const totalBlocks = Math.floor((lastBlock - firstBlock) / 256) + 1;

    const blocks: SubnetBlock[] = [];
    for (let b = 0; b < totalBlocks; b++) {
      const blockNet = (firstBlock + b * 256) >>> 0;
      const pref = `${(blockNet >>> 24) & 255}.${(blockNet >>> 16) & 255}.${(blockNet >>> 8) & 255}`;
      const used = prefixCount.get(pref) || 0;
      const size = 254;
      blocks.push({
        Subnet: `${pref}.0/24`,
        Size: size,
        Used: used,
        Usage: (used * 100) / size,
      });
    }

    r.Subnets = blocks;
  };

  const onOpen = async () => {
    if (!api) return;
    try {
      // 1. Fetch raw devices & IPs for host enrichment
      try {
        const devPath = api.getReportPath ? api.getReportPath("devices") : "/api/report/devices";
        const devRes = await api.get(devPath);
        rawDevices = Array.isArray(devRes) ? devRes : [];
        if (api.serverType !== "neo") {
          try {
            const ipRes = await api.get("/api/report/ips");
            if (Array.isArray(ipRes)) {
              rawDevices = [...rawDevices, ...ipRes];
            }
          } catch (_) {}
        }
      } catch (err) {
        rawDevices = [];
      }
      buildEffectiveDevices();

      // 2. Fetch IPAM report
      const ipamPath = api.getReportPath ? api.getReportPath("ipam") : "/api/report/ipam";
      const res = await api.get(ipamPath);

      if (res && Array.isArray(res.Ranges)) {
        // NEO response format
        ipamReport = {
          Ranges: res.Ranges,
          TotalRanges: res.TotalRanges || res.Ranges.length,
          TotalSize: res.TotalSize || res.Ranges.reduce((a: number, c: any) => a + (c.Size || 0), 0),
          TotalUsed: res.TotalUsed || res.Ranges.reduce((a: number, c: any) => a + (c.Used || 0), 0),
          TotalUsage: res.TotalUsage || 0,
        };
      } else if (Array.isArray(res)) {
        // FC response format (array of IPAMRangeEnt)
        const totalSize = res.reduce((a, c) => a + (c.Size || 0), 0);
        const totalUsed = res.reduce((a, c) => a + (c.Used || 0), 0);
        const totalUsage = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
        ipamReport = {
          Ranges: res,
          TotalRanges: res.length,
          TotalSize: totalSize,
          TotalUsed: totalUsed,
          TotalUsage: totalUsage,
        };
      } else {
        ipamReport = { Ranges: [], TotalRanges: 0, TotalSize: 0, TotalUsed: 0, TotalUsage: 0 };
      }

      // 3. Ensure StartIP, EndIP, Size and /24 Subnets are populated
      for (const r of ipamReport.Ranges) {
        const parsed = parseRange(r.Range);
        if (!r.StartIP && parsed.startIP) r.StartIP = parsed.startIP;
        if (!r.EndIP && parsed.endIP) r.EndIP = parsed.endIP;
        if (!r.Size && parsed.size) r.Size = parsed.size;
        populateSubnetBlocks(r, effectiveDevices);
      }

      selectedRangeIndex = 0;
      selectedSubnetBlock = null;
      selectedHostInfo = null;

      await tick();
      setTimeout(() => {
        renderHeatmap();
      }, 80);
    } catch (e) {
      console.error("Fetch IPAM report failed", e);
    }
  };

  const handleResize = () => {
    if (chartInstance) chartInstance.resize();
  };
</script>

<svelte:window on:resize={handleResize} />

<Modal title="IPAM (IPアドレス管理)" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col gap-4 text-xs sm:text-sm">
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="登録範囲数"
        value={ipamReport.TotalRanges}
        unit="範囲"
        subText={currentRange ? `選択中: ${currentRange.Range}` : "範囲未検出"}
        color="cyan"
        iconPath={icons.mdiFolderNetwork}
      />
      <KPICard
        title="総アドレス数"
        value={ipamReport.TotalSize.toLocaleString()}
        unit="個"
        subText="監視IPプール総数"
        color="slate"
        iconPath={icons.mdiLayers}
      />
      <KPICard
        title="使用中IP数"
        value={ipamReport.TotalUsed.toLocaleString()}
        unit={`/ ${ipamReport.TotalSize.toLocaleString()}`}
        subText="検出稼働中ホスト"
        color="emerald"
        iconPath={icons.mdiCheckCircle}
      />
      <KPICard
        title="平均使用率"
        value={ipamReport.TotalUsage.toFixed(1)}
        unit="%"
        subText={`空き: ${(ipamReport.TotalSize - ipamReport.TotalUsed).toLocaleString()} 個`}
        color="amber"
        iconPath={icons.mdiChartLine}
      />
    </div>

    <!-- Section 1: ECharts IP Density Heatmap -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <div class="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
          <Icon path={icons.mdiIpNetwork} size={0.8} />
          <span>IP利用密度ヒートマップ (0% 〜 100%)</span>
        </div>
      </div>
      <div id="ipam-report-chart" class="w-full h-36 sm:h-40"></div>
    </div>

    <!-- Section 2: Subnet List Table -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs overflow-hidden">
      <div class="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 flex items-center justify-between">
        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Icon path={icons.mdiFolderNetwork} size={0.75} />
          <span>サブネット一覧 ({ipamReport.Ranges.length})</span>
        </span>
      </div>

      <div class="overflow-x-auto max-h-48 overflow-y-auto">
        <table class="w-full min-w-[560px] text-left text-xs border-collapse font-mono whitespace-nowrap">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-1.5 px-2 w-8 text-center whitespace-nowrap">✓</th>
              <th class="py-1.5 px-3 whitespace-nowrap min-w-[120px]">IP範囲</th>
              <th class="py-1.5 px-3 whitespace-nowrap min-w-[110px]">開始IP</th>
              <th class="py-1.5 px-3 whitespace-nowrap min-w-[110px]">終了IP</th>
              <th class="py-1.5 px-3 text-right whitespace-nowrap min-w-[70px]">サイズ</th>
              <th class="py-1.5 px-3 text-right whitespace-nowrap min-w-[70px]">使用数</th>
              <th class="py-1.5 px-3 w-40 min-w-[140px] whitespace-nowrap">使用率</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/80 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
            {#if ipamReport.Ranges.length === 0}
              <tr>
                <td colspan="7" class="p-4 text-center text-slate-400 font-sans whitespace-nowrap">
                  範囲データがありません
                </td>
              </tr>
            {:else}
              {#each ipamReport.Ranges as r, idx}
                {@const isSelected = selectedRangeIndex === idx}
                <tr
                  onclick={() => { selectedRangeIndex = idx; selectedSubnetBlock = null; selectedHostInfo = null; }}
                  class="cursor-pointer transition-colors {isSelected ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-900 dark:text-cyan-200 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}"
                >
                  <td class="py-1.5 px-2 w-8 text-center whitespace-nowrap">
                    {#if isSelected}
                      <span class="h-2 w-2 rounded-full bg-cyan-500 inline-block animate-pulse"></span>
                    {:else}
                      <span class="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span>
                    {/if}
                  </td>
                  <td class="py-1.5 px-3 text-cyan-700 dark:text-cyan-400 font-bold whitespace-nowrap">
                    <span>{r.Range}</span>
                  </td>
                  <td class="py-1.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.StartIP}</td>
                  <td class="py-1.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.EndIP}</td>
                  <td class="py-1.5 px-3 text-right whitespace-nowrap">{r.Size.toLocaleString()}</td>
                  <td class="py-1.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">{r.Used.toLocaleString()}</td>
                  <td class="py-1.5 px-3 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="w-24 sm:w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all {getUsageProgressBarColor(r.Usage)}"
                          style="width: {Math.min(100, Math.max(r.Used > 0 ? 3 : 0, r.Usage))}%"
                        ></div>
                      </div>
                      <span class="text-[10px] w-12 text-right font-mono {r.Usage >= 90 ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}">
                        {r.Usage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 3: Adaptive Drill-down Visual View -->
    {#if currentRange}
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 sm:p-4 shadow-xs space-y-3">
        <!-- Header & Breadcrumbs & Controls -->
        <div class="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 gap-2">
          <div class="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
            <Icon path={icons.mdiGrid} size={0.75} />
            <button
              type="button"
              onclick={() => { selectedSubnetBlock = null; }}
              class="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {currentRange.Range} ({currentRange.Size.toLocaleString()} アドレス)
            </button>
            {#if selectedSubnetBlock}
              <span class="text-slate-400">/</span>
              <span class="text-cyan-600 dark:text-cyan-400 font-mono">{selectedSubnetBlock}</span>
            {/if}
          </div>

          <div class="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
            {#if selectedSubnetBlock}
              <button
                type="button"
                onclick={() => { selectedSubnetBlock = null; }}
                class="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-semibold mr-1"
              >
                <Icon path={icons.mdiArrowLeft} size={0.65} />
                <span>ブロック一覧へ</span>
              </button>
            {/if}

            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded bg-emerald-500"></span> 使用中
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded bg-slate-200 dark:bg-slate-700"></span> 空き
            </span>

            <!-- Quick search input -->
            <div class="relative">
              <input
                type="text"
                placeholder="IP / 端末名検索..."
                bind:value={searchQuery}
                class="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 text-[10px] w-28 sm:w-36 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <!-- CASE 1: Large Range (/16 etc.) Block Grid -->
        {#if isLargeRange && !selectedSubnetBlock}
          <div class="space-y-2">
            <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
              <span class="font-medium text-slate-700 dark:text-slate-300">/24 サブネットブロック</span>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-1 cursor-pointer select-none text-[10px]">
                  <input
                    type="checkbox"
                    bind:checked={onlyUsedBlocks}
                    class="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700"
                  />
                  <span>使用中ブロックのみ表示</span>
                </label>
                <span class="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  {displayedSubnetBlocks.length} / {currentRange.Subnets?.length || 0} ブロック
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 rounded-lg bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              {#each displayedSubnetBlocks as block}
                {@const hasUsed = block.Used > 0}
                {@const isMatch = searchQuery && block.Subnet.toLowerCase().includes(searchQuery.toLowerCase())}
                <button
                  type="button"
                  onclick={() => { selectedSubnetBlock = block.Subnet; }}
                  class="p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer hover:scale-105 {isMatch ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-50 dark:bg-amber-950/30' : hasUsed ? 'bg-white dark:bg-slate-900 border-cyan-400/60 dark:border-cyan-700 hover:border-cyan-400 shadow-xs' : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 opacity-50'}"
                >
                  <div class="text-[10px] font-mono font-bold truncate text-slate-800 dark:text-slate-200">
                    {block.Subnet.replace(/\.0\/24$/, "")}
                  </div>
                  <div class="flex items-center justify-between mt-1 text-[9px] font-mono">
                    <span class={hasUsed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                      {block.Used} 端末
                    </span>
                    <span class="rounded px-1 py-0 text-[8px] {getUsageBadgeColor(block.Usage)}">
                      {block.Usage.toFixed(0)}%
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>

        <!-- CASE 2: Single /24 Subnet or Drilled-Down /24 Host Grid (1..254) -->
        {:else}
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                サブネットホスト一覧: <b class="font-mono text-cyan-600 dark:text-cyan-400">{currentSubnetHosts.prefix}.1 〜 {currentSubnetHosts.prefix}.254</b>
              </span>
            </div>

            <div class="grid grid-cols-[repeat(16,minmax(0,1fr))] sm:grid-cols-[repeat(32,minmax(0,1fr))] gap-1 max-h-60 overflow-y-auto p-2 rounded-lg bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              {#each Array.from({ length: 254 }, (_, i) => i + 1) as hostNum}
                {@const host = currentSubnetHosts.hostMap.get(hostNum)}
                {@const isUsed = !!host}
                {@const hostIP = `${currentSubnetHosts.prefix}.${hostNum}`}
                {@const isQueryMatch = searchQuery && (hostIP.includes(searchQuery) || (host?.name && host.name.toLowerCase().includes(searchQuery.toLowerCase())) || (host?.mac && host.mac.toLowerCase().includes(searchQuery.toLowerCase())))}
                <button
                  type="button"
                  onclick={() => {
                    selectedHostInfo = isUsed
                      ? { ip: hostIP, name: host.name, mac: host.mac, vendor: host.vendor, isManaged: host.isManaged }
                      : { ip: hostIP, isFree: true };
                  }}
                  title="{hostIP} {isUsed ? `(${host.name || host.mac})` : '(空き)'}"
                  class="h-5 rounded text-[9px] flex items-center justify-center font-mono cursor-pointer transition-transform hover:scale-125 {isQueryMatch ? 'ring-2 ring-amber-400 font-bold' : ''} {isUsed ? 'bg-emerald-500 text-white font-bold shadow-xs' : 'bg-slate-200 dark:bg-slate-800/80 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'}"
                >
                  {hostNum}
                </button>
              {/each}
            </div>

            <!-- Host detail card -->
            {#if selectedHostInfo}
              <div class="rounded-lg border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/30 p-2.5 flex items-center justify-between text-xs">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div class="flex items-center gap-1.5 font-mono font-bold text-cyan-700 dark:text-cyan-300">
                    <Icon path={icons.mdiLaptop} size={0.7} />
                    <span>{selectedHostInfo.ip}</span>
                  </div>
                  {#if selectedHostInfo.isFree}
                    <span class="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                      未使用 (空きアドレス)
                    </span>
                  {:else}
                    <div class="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                      <span class="font-semibold">{selectedHostInfo.name}</span>
                    </div>
                    {#if selectedHostInfo.mac}
                      <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        MAC: {selectedHostInfo.mac}
                      </div>
                    {/if}
                    {#if selectedHostInfo.vendor}
                      <div class="text-[10px] rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 text-slate-600 dark:text-slate-300">
                        {selectedHostInfo.vendor}
                      </div>
                    {/if}
                    <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold {selectedHostInfo.isManaged ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                      {selectedHostInfo.isManaged ? '管理ノード' : '未登録ARP'}
                    </span>
                  {/if}
                </div>
                <button
                  type="button"
                  onclick={() => { selectedHostInfo = null; }}
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <Icon path={icons.mdiClose} size={0.7} />
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</Modal>
