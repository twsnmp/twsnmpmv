<script lang="ts">
  import { Modal, GradientButton } from "flowbite-svelte";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";
  import DataTable from "datatables.net-dt";
  import "datatables.net-select-dt";
  import {logs,renderState,renderTime} from "./map";
  import ja from "datatables.net-plugins/i18n/ja.json";
  import { tick } from "svelte";
  import {showLogChart,resizeChart} from "./chart";

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
    data = [];
    if (!logs) {
      return;
    }
    for(const l of logs) {
      if (l.Type != "user" ) {
        data.push(l);
      }
    }
    await tick();
    showTable();
    showLogChart("chart",data);
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
        <Icon path={icons.mdiCancel} size={1} />
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