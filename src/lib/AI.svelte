<script lang="ts">
  import { Modal as ModalOrig, GradientButton } from "flowbite-svelte";
  const Modal = ModalOrig as any;
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import {api,renderScore,renderTime} from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import {showAIChart,showAIHeatMap,resizeChart} from "./chart";
  import "../assets/jquery.dataTables.css";

  export let show = false;
  let table :any = undefined;
  let data : any = [];
  const close = () => {
    show = false;
  };

  const showTable = () => {
    if (table && DataTable.isDataTable("#table")) {
      table.clear();
      table.destroy();
      table = undefined;
    }
    table = new DataTable("#table", {
      columns: columns,
      data: data,
      paging: false,
      searching:false,
      info:false,
      scrollY: "35vh",
      scrollX: true,
      language: ja,
      select: {
        style: "single",
      },
      order: [[0, "desc"]],
    });
    table.on("select", () => {
      const ids = table.rows({ selected: true }).data().pluck("ID");
      if (ids.length == 1) {
        showHeatMap(ids[0]);
      }
    });
    table.on("deselect", () => {
      showAIChart("chart",data);
    });
  };

  const showHeatMap = async (id:string) => {
    if(!api || !id) {
      return;
    }
    const air = await api.get("/api/report/ai/" +id);
    if(air && air.AIResult) {
      showAIHeatMap("chart",air.AIResult.ScoreData);
    }
  }


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
      render: (data:number,type:string) =>
        renderTime(data * 1000 * 1000 * 1000,type),
    },
  ];

  const onOpen = async () => {
    data = [];
    const ai = await api.get("/api/report/ailist");
    for(const a of ai) {
      data.push(a);
    }
    await tick();
    showTable();
    showAIChart("chart",data);
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="AI分析" bind:open={show} size="xl" outsideclose={false} on:open={onOpen}>
  <div class="flex flex-col h-[70vh]">
    <div id="chart" />
    <div class="m-1 grow overflow-auto">
      <table id="table" class="display compact nowrap text-[10px]" style="width:99%" />
    </div>
  </div>
</Modal>

<style>
  table.nowrap {
    white-space: nowrap;
  }
  #chart {
    width: 98%;
    height: 35vh;
    margin: 0 auto;
  }
  :global(.dataTables_wrapper .dataTables_scrollBody) {
    font-size: 10px;
  }
</style>