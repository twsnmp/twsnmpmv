<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";
  import { Map, NavigationControl, Marker, setWorkerUrl } from "maplibre-gl";
  import maplibreglWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
  import { getStateColor } from "./map";
  import { ds, refreshCount, type TwsnmpEnt } from "./datastore";
  import { onMount, onDestroy, tick } from "svelte";
  import type { Unsubscriber } from "svelte/store";

  setWorkerUrl(maplibreglWorkerUrl);

  let map: any = undefined;
  let markers: any = undefined;
  let unsubscribe: Unsubscriber | undefined = undefined;
  let hasStyle = true;

  const refresh = async () => {
    if (!map) {
      return;
    }
    if (markers) {
      for (const m of markers) {
        m.remove();
      }
    }
    markers = [];
    for (const twsnmp of ds.list) {
      if (!twsnmp.loc) {
        twsnmp.loc = "139.75,35.68";
      }
      addNodeMarker(twsnmp);
    }
  };

  const getLngLat = (loc: string): [number, number] => {
    const a = loc.split(",");
    if (a.length < 2) {
      return [0, 0];
    }
    return [Number(a[0]), Number(a[1])];
  };

  const addNodeMarker = (twsnmp: TwsnmpEnt) => {
    const color = getStateColor(ds.getState(twsnmp.id));
    const iconSize = ds.locConf.iconSize || 24;
    const divSize = iconSize + 8;
    const fontSize = Math.max(10, Math.floor(iconSize / 2));
    const nodeDiv = document.createElement("div");
    nodeDiv.classList.add("node");
    nodeDiv.innerHTML = `
    <div class="icon" style="height: ${divSize}px;width: ${divSize}px;background-color: ${color}; color: white;font-size: ${iconSize}px;text-align: center;line-height: ${divSize}px;border-radius: 4px;margin: 0 auto;">
      <span class="mdi mdi-lan"></span>
    </div>
    <div style="font-size: ${fontSize}px;text-align: center;white-space: nowrap;">
      ${twsnmp.name}
    </div>`;

    const marker = new Marker({ draggable: true, element: nodeDiv })
      .setLngLat(getLngLat(twsnmp.loc))
      .addTo(map);
    marker.on("dragend", (e: any) => {
      const loc = e.target.getLngLat();
      twsnmp.loc = loc.lng + "," + loc.lat;
      ds.saveLoc(twsnmp);
    });
    markers.push(marker);
  };

  const makeMap = () => {
    const rawStyle = (ds.locConf?.style || "").trim();
    if (!rawStyle) {
      hasStyle = false;
      return;
    }
    hasStyle = true;

    let styleObj: any = rawStyle;
    if (rawStyle.startsWith("{")) {
      try {
        styleObj = JSON.parse(rawStyle);
      } catch (e) {
        console.error("Failed to parse map style JSON", e);
        hasStyle = false;
        return;
      }
    }

    try {
      map = new Map({
        container: "map",
        style: styleObj,
        center: getLngLat(ds.locConf.center || "139.75,35.68"),
        zoom: ds.locConf.zoom || 2,
      });
      map.addControl(
        new NavigationControl({
          visualizePitch: true,
        })
      );
    } catch (e) {
      console.error("Failed to initialize map", e);
      map = undefined;
      hasStyle = false;
    }
  };

  onMount(() => {
    tick();
    makeMap();
    refresh();

    unsubscribe = refreshCount.subscribe(() => {
      refresh();
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
    if (markers) {
      for (const m of markers) {
        m.remove();
      }
      markers = undefined;
    }
    if (map) {
      const c = map.getCenter();
      ds.locConf.zoom = map.getZoom();
      ds.locConf.center = c.lng + "," + c.lat;
      ds.saveLocConf();
      map.remove();
      map = undefined;
    }
  });
</script>

{#if !hasStyle}
  <div class="flex flex-col items-center justify-center w-full h-full p-4 text-center text-gray-500 dark:text-gray-400">
    <div class="text-4xl mb-2">🗺️</div>
    <div class="text-base font-semibold mb-1">地図スタイルが設定されていません</div>
    <div class="text-xs">設定画面（右下の歯車アイコン）から地図スタイルまたはプリセットを選択してください。</div>
  </div>
{:else}
  <div id="map" class="w-full h-full"></div>
{/if}
