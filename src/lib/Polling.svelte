<script lang="ts">
  import { Modal as ModalOrig, GradientButton } from "flowbite-svelte";
  const Modal = ModalOrig as any;
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import {nodes,pollings,renderState,renderTime} from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import {showStateChart,resizeChart} from "./chart";

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
      order: [[0, "asc"]],
    });
  };

  const getNodeName = (id:string) => {
    return nodes ? nodes[id].Name || "" : "";
  }

  const columns = [
    {
      data: "State",
      title: "状態",
      render: renderState,
    },
    {
      data: "NodeID",
      title: "ノード名",
      render: (id:string) => getNodeName(id),
    },
    {
      data: "Name",
      title: "名前",
    },
    {
      data: "Type",
      title: "タイプ",
    },
    {
      data: "LastTime",
      title: "最終確認",
      render: renderTime,
    },
  ];

  const onOpen = async () => {
    data = [];
    if (!nodes|| !pollings) {
      return;
    }
    for(const k in pollings) {
      for( const p of pollings[k]) {
        data.push(p);
      } 
    }
    await tick();
    showTable();
    showStateChart("chart",data);
  };
</script>

<svelte:window on:resize={resizeChart} />

<Modal title="ポーリング" bind:open={show} size="xl" outsideclose={false} on:open={onOpen}>
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