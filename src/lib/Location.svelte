<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";
  import { Map, NavigationControl, Marker } from "maplibre-gl";
  import {  getStateColor } from "./map";
  import {ds,refreshCount, type TwsnmpEnt} from "./datastore";
  import { onMount, onDestroy,tick } from "svelte";

  let map: any = undefined;
  let markers :any = undefined;


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
      if(!twsnmp.loc) {
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

  const addNodeMarker = (twsnmp:TwsnmpEnt) => {
    const color = getStateColor(ds.getState(twsnmp.id));
    const nodeDiv = document.createElement("div");
    nodeDiv.classList.add("node");
    nodeDiv.innerHTML = `
    <div class="icon" style="height: 32px;width: 32px;background-color: ${color}; color: white;font-size: 24px;text-align: center;line-height: 32px;">
			<span class="mdi mdi-lan"></span>
		</div>
		<div style="font-size: 12px;text-align: center;">
      ${twsnmp.name}
    </div>`;

    const marker = new Marker({ draggable: true, element: nodeDiv })
      .setLngLat(getLngLat(twsnmp.loc))
      .addTo(map)
      .on("dragend", (e) => {
        const loc = e.target.getLngLat();
        twsnmp.loc = loc.lng + "," + loc.lat;
        ds.saveLoc(twsnmp);
      });
    markers.push(marker);
  };

  const makeMap = () => {
    map = new Map({
      container: "map",
      style: ds.locConf.style,
      center: getLngLat(ds.locConf.center),
      zoom: ds.locConf.zoom,
    });
    map.addControl(
      new NavigationControl({
        visualizePitch: true,
      })
    );
  };

  onMount(() => {
    tick();
    makeMap();
    refresh();
  });

  onDestroy(() => {
    if(markers) {
      for(const m of markers) {
        m.remove();
      }
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

  refreshCount.subscribe(()=>{
    refresh();
  });

</script>

<div id="map" class="w-full h-full"/>

