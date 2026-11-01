<script lang="ts">
  import { Modal, GradientButton } from "./ui";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import { api, renderScore, pollings, nodes } from "./map";
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
        scrollY: "65vh",
        scrollX: true,
        language: ja,
      });
    }
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
      render: (data: boolean) => data ? "はい" : "いいえ" 
    },
    { 
      data: "NotAfter", 
      title: "期限", 
      render: (data: number, type: string) => {
        if (type === 'display' && data) {
          const d = new Date(data * 1000);
          return d.toLocaleDateString();
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
        // 1. Extract from TLS cert pollings (matching twsnmpneo CertReport)
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
      await showTable();
    } catch (e) {
      console.error("Fetch Cert report failed", e);
    }
  };
</script>

<Modal title="証明書管理" bind:open={show} size="xl" outsideclose={false} onopen={onOpen}>
  <div class="flex flex-col h-[70vh] text-xs sm:text-sm">
    <div class="m-1 overflow-auto">
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