<script lang="ts">
  import { Modal, GradientButton } from "flowbite-svelte";
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
      scrollY: "30vh",
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

<Modal bind:open={show} size="xl" dismissable={false} on:open={onOpen}>
  <div class="flex flex-col">
    <div id="chart" />
    <div class="m-5 grow">
      <table id="table" class="display compact nowrap" style="width:99%" />
    </div>
    <div class="flex justify-end space-x-2 mr-2">
      <GradientButton
        shadow
        type="button"
        color="teal"
        class="!p-2"
        on:click={close}
      >
        <Icon path={icons.mdiCancel} size={1.5} />
      </GradientButton>
    </div>
  </div>
</Modal>

<style>
  #table.nowrap {
    white-space: nowrap;
  }
  #chart {
    width: 98%;
    height: 30vh;
    margin: 0 auto;
  }
</style>