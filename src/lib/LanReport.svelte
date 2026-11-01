<script lang="ts">
  import { Modal, GradientButton } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api, renderScore, renderTime, renderIP, nodes } from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import "../assets/jquery.dataTables.css";

  export let show = false;

  let table: any = undefined;
  let dataList: any = [];

  const close = () => {
    show = false;
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
        scrollY: "65vh",
        scrollX: true,
        language: ja,
      });
    }
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
            });
            if (a.IP) seenIPs.add(a.IP);
            if (cleanMac) seenMACs.add(cleanMac);
          }
        }
        dataList = list;
      } else {
        dataList = rawList;
      }
      await showTable();
    } catch (e) {
      console.error("Fetch LAN report failed", e);
    }
  };
</script>

<Modal title="LANデバイス" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col h-[70vh] text-xs sm:text-sm">
    <div class="m-1 overflow-auto">
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