<script lang="ts">
  import { Modal, Label, Input, Select, GradientButton } from "./ui";
  import { ds } from "./datastore";
  import { Icon } from "mdi-svelte-ts";
  import * as icons from "@mdi/js";

  export let show = false;

  let style = "";
  let lat = "35.68";
  let lng = "139.75";
  let zoom = 2;
  let iconSize = "24";
  let selectedPreset = "0";
  let showStyleError = false;

  const locStylePresets = [
    {
      name: "プリセットから選択...",
      style: "",
    },
    {
      name: "国土地理院 淡色地図 (推奨)",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            "gsi-pale": {
              type: "raster",
              tiles: [
                "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "国土地理院 (地理院タイル 淡色地図)",
            },
          },
          layers: [
            {
              id: "gsi-pale",
              type: "raster",
              source: "gsi-pale",
              minzoom: 2,
              maxzoom: 18,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "CARTO Dark Matter (ダーク推奨)",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            "carto-dark": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors, © CARTO",
            },
          },
          layers: [
            {
              id: "carto-dark",
              type: "raster",
              source: "carto-dark",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "OSM Bright (OpenStreetMap Japan)",
      style: "https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json",
    },
    {
      name: "MIERUNE Mono (モノクロ)",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            MIERUNEMAP: {
              type: "raster",
              tiles: [
                "https://tile.mierune.co.jp/mierune_mono/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution:
                "Maptiles by MIERUNE, under CC BY. Data by OpenStreetMap contributors, under ODbL.",
            },
          },
          layers: [
            {
              id: "MIERUNEMAP",
              type: "raster",
              source: "MIERUNEMAP",
              minzoom: 0,
              maxzoom: 18,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "国土地理院 標準地図",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            "gsi-std": {
              type: "raster",
              tiles: [
                "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "国土地理院 (地理院タイル 標準地図)",
            },
          },
          layers: [
            {
              id: "gsi-std",
              type: "raster",
              source: "gsi-std",
              minzoom: 2,
              maxzoom: 18,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "国土地理院 写真 (航空写真)",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            "gsi-photo": {
              type: "raster",
              tiles: [
                "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
              ],
              tileSize: 256,
              attribution: "国土地理院 (地理院タイル 写真)",
            },
          },
          layers: [
            {
              id: "gsi-photo",
              type: "raster",
              source: "gsi-photo",
              minzoom: 2,
              maxzoom: 18,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "CARTO Positron (ライト)",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            "carto-light": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors, © CARTO",
            },
          },
          layers: [
            {
              id: "carto-light",
              type: "raster",
              source: "carto-light",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "OpenStreetMap 標準",
      style: JSON.stringify(
        {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: "なし (スタイルを空にする)",
      style: "",
    },
  ];

  const presetItems = locStylePresets.map((p, i) => ({
    value: i.toString(),
    name: p.name,
  }));

  const iconSizeList = [
    { value: "16", name: "16 px (極小)" },
    { value: "24", name: "24 px (標準)" },
    { value: "32", name: "32 px (中)" },
    { value: "48", name: "48 px (大)" },
    { value: "64", name: "64 px (極大)" },
  ];

  $: if (selectedPreset && selectedPreset !== "0") {
    const idx = parseInt(selectedPreset, 10);
    if (!isNaN(idx) && locStylePresets[idx]) {
      style = locStylePresets[idx].style;
      showStyleError = false;
    }
    selectedPreset = "0";
  }

  const save = () => {
    showStyleError = false;
    const trimmed = (style || "").trim();
    if (trimmed.startsWith("{")) {
      try {
        JSON.parse(trimmed);
      } catch (e) {
        showStyleError = true;
        return;
      }
    }
    const saveLng = (lng ?? "").toString().trim() || "139.75";
    const saveLat = (lat ?? "").toString().trim() || "35.68";
    ds.locConf.style = trimmed;
    ds.locConf.center = `${saveLng},${saveLat}`;
    ds.locConf.zoom = Number(zoom) || 2;
    ds.locConf.iconSize = Number(iconSize) || 24;
    ds.saveLocConf();
    show = false;
  };

  const onOpen = () => {
    style = ds.locConf.style ?? "";
    const parts = (ds.locConf.center || "139.75,35.68").split(",");
    lng = parts[0]?.trim() || "139.75";
    lat = parts[1]?.trim() || "35.68";
    zoom = ds.locConf.zoom ?? 2;
    iconSize = (ds.locConf.iconSize ?? 24).toString();
    selectedPreset = "0";
    showStyleError = false;
  };
</script>

<Modal title="地図設定" bind:open={show} size="lg" outsideclose={false} onopen={onOpen}>
  <form class="flex flex-col space-y-3" onsubmit={(e) => { e.preventDefault(); save(); }}>
    {#if showStyleError}
      <div class="p-3 text-xs sm:text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 border border-red-300 dark:border-red-800 flex items-center gap-2">
        <Icon path={icons.mdiAlert} size={1} />
        <span>スタイルは、URLかJSONで指定してください。</span>
      </div>
    {/if}

    <div class="space-y-1">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
        <span class="text-xs font-medium text-gray-900 dark:text-gray-300">
          地図スタイル (URL または JSON)
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            プリセット
          </span>
          <div class="w-full sm:w-64">
            <Select
              items={presetItems}
              bind:value={selectedPreset}
              size="sm"
            />
          </div>
        </div>
      </div>
      <textarea
        bind:value={style}
        rows="6"
        placeholder="https://... または &#123; ... &#125;"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-mono rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      ></textarea>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Label class="space-y-1 text-xs">
        <span>緯度</span>
        <Input type="text" inputmode="decimal" lang="en" bind:value={lat} placeholder="35.68" size="sm" />
      </Label>
      <Label class="space-y-1 text-xs">
        <span>経度</span>
        <Input type="text" inputmode="decimal" lang="en" bind:value={lng} placeholder="139.75" size="sm" />
      </Label>
      <Label class="space-y-1 text-xs">
        <span>ズーム</span>
        <Input
          type="number"
          min="2"
          max="18"
          bind:value={zoom}
          size="sm"
        />
      </Label>
      <Label class="space-y-1 text-xs">
        <span>アイコンサイズ</span>
        <Select
          items={iconSizeList}
          bind:value={iconSize}
          size="sm"
        />
      </Label>
    </div>

    <div class="flex justify-end space-x-2 mr-2 pt-2 border-t border-gray-200 dark:border-gray-700">
      <GradientButton
        id="save-settings-btn"
        shadow
        color="blue"
        type="button"
        class="!p-2"
        onclick={save}
      >
        <Icon path={icons.mdiContentSave} size={1.5} />
      </GradientButton>
    </div>
  </form>
</Modal>
