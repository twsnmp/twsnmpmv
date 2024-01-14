import P5 from "p5";
import { type TwsnmpEnt } from "./datastore";
import { TwsnmpAPI } from "./twsnmpapi";
import * as echarts from 'echarts';

const MAP_SIZE_X = window.screen.width > 4000 ? 5000 : 2500;
const MAP_SIZE_Y = 5000;

let mapRedraw = true;

export let nodes: any = {};
export let lines: any = [];
export let items: any = {};
export let pollings: any = {};
export let logs:  any = {};

let backImage: any = {
  X: 0,
  Y: 0,
  Width: 0,
  Height: 0,
  Data: "",
};
let _backImage: any = undefined;

let fontSize = 10;
let iconSize = 24;

const imageMap = new Map();

let _mapP5: P5 | undefined = undefined;
export let api: TwsnmpAPI;

export const initMAP = async (div: HTMLElement, twsnmp: TwsnmpEnt) => {
  _backImage = null;
  mapRedraw = false;
  nodes = {};
  lines = [];
  items = [];
  pollings = {};
  logs = [];
  api = new TwsnmpAPI(twsnmp.url);
  if (!(await api.login(twsnmp.user, twsnmp.password))) {
    return;
  }
  if (_mapP5 != undefined) {
    return;
  }
  div.oncontextmenu = (e) => {
    e.preventDefault();
  };
  _mapP5 = new P5(mapMain, div);
};

let oldBackImagePath = ""; 

export const updateMAP = async () => {
  const dark = isDark();
  const map = await api.get("/api/map");
  if (!map) {
    return;
  }
  iconSize = map.MapConf.IconSize || 24;
  fontSize = map.MapConf.FontSize || 12;
  nodes = map.Nodes;
  lines = map.Lines;
  items = map.Items;
  pollings = map.Pollings;
  logs = map.Logs;
  backImage = map.MapConf.BackImage;

  if (backImage && backImage.Path && oldBackImagePath != backImage.Path && _mapP5 != undefined) {
    oldBackImagePath = backImage.Path;
    _backImage = null;
    _mapP5.loadImage(await api.get("/backimage","data"), (img) => {
      _backImage = img;
      mapRedraw = true;
    });
  } else if(_backImage && !backImage.Path){
    _backImage = null;
  }
  for (const k in items) {
    switch (items[k].Type) {
      case 3:
        if (!imageMap.has(items[k].ID) && _mapP5 != undefined) {
          const tmp = await api.get("/image/" + items[k].Path,"data");
          _mapP5.loadImage(tmp, (img) => {
            imageMap.set(items[k].ID, img);
            mapRedraw = true;
          });
        }
        break;
      case 2:
      case 4:
        items[k].W = items[k].Size * items[k].Text.length;
        items[k].H = items[k].Size;
        if (!dark) {
          items[k].Color = items[k].Color != "#eee" ? items[k].Color : "#333";
        }
        break;
      case 5:
        items[k].H = items[k].Size * 10;
        items[k].W = items[k].Size * 10;
        if (items[k].Value < 0.001) {
          items[k].Value = 0.0;
        }
        break;
    }
  }
  mapRedraw = true;
};

export const deleteMap = () => {
  if (_mapP5) {
    _mapP5.remove();
    _mapP5 = undefined;
  }
};

const getLineColor = (state: string) => {
  if (state === "high" || state === "low" || state === "warn") {
    return getStateColor(state);
  }
  return 250;
};

const isDark = (): boolean => {
  const e = document.querySelector("html");
  return e != null && e.classList.contains("dark");
};


const mapMain = (p5: P5) => {
  let oldDark = false;
  p5.setup = () => {
    const c = p5.createCanvas(MAP_SIZE_X, MAP_SIZE_Y);
    p5.push();
    p5.textFont("Material Design Icons");
    p5.textFont("Roboto");
    p5.pop();
  };

  p5.draw = () => {
    const dark = isDark();
    if (dark != oldDark) {
      mapRedraw = true;
      oldDark = dark;
    }
    if (!mapRedraw) {
      return;
    }
    mapRedraw = false;
    p5.background(dark ? 23 : 252);
    if (_backImage) {
      if (backImage.Width) {
        p5.image(
          _backImage,
          backImage.X,
          backImage.Y,
          backImage.Width,
          backImage.Height
        );
      } else {
        p5.image(_backImage, backImage.X, backImage.Y);
      }
    }
    for (const k in lines) {
      if (!nodes[lines[k].NodeID1] || !nodes[lines[k].NodeID2]) {
        continue;
      }
      const x1 = nodes[lines[k].NodeID1].X;
      const x2 = nodes[lines[k].NodeID2].X;
      const y1 = nodes[lines[k].NodeID1].Y;
      const y2 = nodes[lines[k].NodeID2].Y;
      const xm = (x1 + x2) / 2;
      const ym = (y1 + y2) / 2;
      p5.push();
      p5.strokeWeight(lines[k].Width || 1);
      p5.stroke(getStateColor(lines[k].State1));
      p5.line(x1, y1, xm, ym);
      p5.stroke(getStateColor(lines[k].State2));
      p5.line(xm, ym, x2, y2);
      if (lines[k].Info) {
        const color: any = getLineColor(lines[k].State);
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        p5.textFont("Roboto");
        p5.textSize(fontSize);
        p5.fill(color);
        if (dx === 0 || dy / dx > 0.8) {
          p5.text(lines[k].Info, xm + 10, ym);
        } else {
          p5.text(lines[k].Info, xm - dx / 4, ym + 20);
        }
      }
      p5.pop();
    }
    for (const k in items) {
      p5.push();
      p5.translate(items[k].X, items[k].Y);
      switch (items[k].Type) {
        case 0: // rect
          p5.fill(items[k].Color);
          p5.stroke("rgba(23,23,23,0.9)");
          p5.rect(0, 0, items[k].W, items[k].H);
          break;
        case 1: // ellipse
          p5.fill(items[k].Color);
          p5.stroke("rgba(23,23,23,0.9)");
          p5.ellipse(items[k].W / 2, items[k].H / 2, items[k].W, items[k].H);
          break;
        case 2: // text
        case 4: // Polling
          p5.textSize(items[k].Size || 12);
          p5.fill(items[k].Color);
          p5.text(
            items[k].Text,
            0,
            0,
            items[k].Size * items[k].Text.length + 10,
            items[k].Size + 10
          );
          break;
        case 3: // Image
          if (imageMap.has(items[k].ID)) {
            p5.image(imageMap.get(items[k].ID), 0, 0, items[k].W, items[k].H);
          }
          break;
        case 5: {
          // Gauge
          const x = items[k].W / 2;
          const y = items[k].H / 2;
          const r0 = items[k].W;
          const r1 = items[k].W - items[k].Size;
          const r2 = items[k].W - items[k].Size * 4;
          p5.noStroke();
          p5.fill(dark ? "#eee" : "#333");
          p5.arc(x, y, r0, r0, 5 * p5.QUARTER_PI, -p5.QUARTER_PI);
          if (items[k].Value > 0) {
            p5.fill(items[k].Color);
            p5.arc(
              x,
              y,
              r0,
              r0,
              5 * p5.QUARTER_PI,
              -p5.QUARTER_PI -
                (p5.HALF_PI - p5.HALF_PI * Math.min(items[k].Value / 100, 1.0))
            );
          }
          p5.fill(dark ? 23 : 252);
          p5.arc(x, y, r1, r1, -p5.PI, 0);
          p5.textAlign(p5.CENTER);
          p5.textSize(8);
          p5.fill(dark ? "#eee" : "#333");
          p5.text(Number(items[k].Value).toFixed(3) + "%", x, y - 10);
          p5.textSize(items[k].Size);
          p5.text(items[k].Text || "", x, y + items[k].Size);
          p5.fill("#e31a1c");
          const angle = -p5.QUARTER_PI + (p5.HALF_PI * items[k].Value) / 100;
          const x1 = x + (r1 / 2) * p5.sin(angle);
          const y1 = y - (r1 / 2) * p5.cos(angle);
          const x2 = x + (r2 / 2) * p5.sin(angle) + 5 * p5.cos(angle);
          const y2 = y - (r2 / 2) * p5.cos(angle) + 5 * p5.sin(angle);
          const x3 = x + (r2 / 2) * p5.sin(angle) - 5 * p5.cos(angle);
          const y3 = y - (r2 / 2) * p5.cos(angle) - 5 * p5.sin(angle);
          p5.triangle(x1, y1, x2, y2, x3, y3);
        }
      }
      p5.pop();
    }
    for (const k in nodes) {
      const icon = getIconCode(nodes[k].Icon);
      p5.push();
      p5.translate(nodes[k].X, nodes[k].Y);
      if (dark) {
        p5.fill("rgba(23,23,23,0.9)");
        p5.stroke("rgba(23,23,23,0.9)");
      } else {
        p5.fill("rgba(252,252,252,0.9)");
        p5.stroke("rgba(252,252,252,0.9)");
      }
      const w = iconSize - 8;
      p5.rect(-w / 2, -w / 2, w, w);
      p5.textFont("Material Design Icons");
      p5.textSize(iconSize);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill(getStateColor(nodes[k].State));
      p5.text(icon, 0, 0);
      p5.textFont("Roboto");
      p5.textSize(fontSize);
      if (dark) {
        p5.fill(250);
      } else {
        p5.fill(23);
      }
      p5.text(nodes[k].Name, 0, 32);
      p5.pop();
    }
  };
};

const stateMap = new Map();

const stateList = [
  { color: "#e31a1c", value: "high", name:"重度",icon: "mdi-alert-circle" },
  { color: "#fb9a99", value: "low" , name:"軽度",icon: "mdi-alert-circle"},
  { color: "#dfdf22", value: "warn", name:"注意",icon: "mdi-alert" },
  { color: "#33a02c", value: "normal",name:"正常",icon: "mdi-check-circle" },
  { color: "#1f78b4", value: "repair",name:"復帰",icon: "mdi-autorenew" },
  { color: "#1f78b4", value: "info" ,name:"情報",icon: "mdi-information"},
];

stateList.forEach((e: any) => {
  stateMap.set(e.value, e);
});

export const getStateColor = (state: string): string => {
  return stateMap.has(state) ? stateMap.get(state).color : "gray";
};

export const getStateName = (state: string): string => {
  return stateMap.has(state) ? stateMap.get(state).name : "不明";
};

export const getStateIcon = (state: string): string => {
  return stateMap.has(state) ? stateMap.get(state).icon : "mdi-comment-question-outline";
};

export const iconList = [
  {icon: 'mdi-desktop-mac',value: 'desktop',code: 0xF01C4,},
  {icon: 'mdi-desktop-classic',value: 'desktop-classic',code: 0xF07C0,},
  { icon: 'mdi-laptop', value: 'laptop' ,code: 0xF0322},
  { icon: 'mdi-tablet-ipad', value: 'tablet' ,code:0xF04F8},
  { icon: 'mdi-server', value: 'server' ,code: 0xF048B},
  { icon: 'mdi-ip-network', value: 'hdd' ,code: 0xF0A60},
  { icon: 'mdi-ip-network', value: 'ip' ,code: 0xF0A60},
  { icon: 'mdi-lan', value: 'network' ,code: 0xF0317},
  { icon: 'mdi-wifi', value: 'wifi' ,code: 0xF05A9},
  { icon: 'mdi-cloud', value: 'cloud' ,code: 0xF015F },
  { icon: 'mdi-printer', value: 'printer' ,code: 0xF042A},
  { icon: 'mdi-cellphone', value: 'cellphone' ,code: 0xF011C},
  { icon: 'mdi-router', value: 'router' ,code: 0xF11E2},
  { icon: 'mdi-web', value: 'web' ,code: 0xF059F},
  { icon: 'mdi-database', value: 'db' ,code: 0xF01BC},
  { icon: 'mdi-router-wireless', value: 'mdi-router-wireless' ,code: 0xF0469},
  { icon: 'mdi-router-network', value: 'mdi-router-network' ,code: 0xF1087},
  { icon: 'mdi-security', value: 'mdi-security' ,code: 0xF0483},
  { icon: 'mdi-desktop-tower', value: 'mdi-desktop-tower' ,code: 0xF01C5},
  { icon: 'mdi-microsoft-windows', value: 'mdi-microsoft-windows' ,code: 0xF05B3},
  { icon: 'mdi-linux', value: 'mdi-linux' ,code: 0xF033D},
  { icon: 'mdi-raspberry-pi', value: 'mdi-raspberry-pi' ,code: 0xF043F},
  { icon: 'mdi-mailbox', value: 'mdi-mailbox' ,code: 0xF06EE},
  { icon: 'mdi-clock', value: 'mdi-clock' ,code: 0xF0954},
  { icon: 'mdi-android', value: 'mdi-android' ,code: 0xF0032},
  { icon: 'mdi-microsoft-azure', value: 'mdi-microsoft-azure' ,code: 0xF0805},
  { icon: 'mdi-amazon', value: 'mdi-amazon' ,code: 0xF002D},
  { icon: 'mdi-apple', value: 'mdi-apple' ,code: 0xF0035},
  { icon: 'mdi-google', value: 'mdi-google' ,code: 0xF02AD},
  { icon: 'mdi-disc-player', value: 'mdi-disc-player' ,code: 0xF0960},
  { icon: 'mdi-layers-search', value: 'mdi-layers-search' ,code: 0xF1206},
 
 ];

const iconMap = new Map();
const iconCodeMap = new Map();

iconList.forEach((e) => {
  iconMap.set(e.value, e.icon);
  iconCodeMap.set(e.value, String.fromCodePoint(e.code));
});

const getIconCode = (icon: string): number => {
  return iconCodeMap.has(icon) ? iconCodeMap.get(icon) : String.fromCodePoint(0xf0a39);
};

const getIcon = (icon: string): number => {
  return iconMap.get(icon) || 'mdi-comment-question-outline';
};


export const formatTime = (date:any, format:string) => {
  if (!format) {
      format = '{yyyy}/{MM}/{dd} {HH}:{mm}:{ss}'
  }
  return echarts.time.format(date,format,false)
}

export const renderTime = (t:number,type:string) => {
  if (t < 1) {
    return "";
  }
  const d = new Date(t /(1000*1000));
  return  formatTime(d,"");
}

export const renderState = (state:string,type:string) => {
  if(type=="sort") {
    return levelNum(state);
  }
  return `<span class="mdi ` +
      getStateIcon(state) +
      ` text-lg" style="color:` +
      getStateColor(state) +
      `;"></span><span class="ml-2">` +
      getStateName(state) +
      `</span>`;
};

export const renderNodeState = (state:string,type:string,n:any) => {
  if(type=="sort") {
    return levelNum(state);
  }
  const icon = n.Icon ? getIcon(n.Icon) : getStateIcon(state);
  return `<span class="mdi ` +
      icon +
      ` text-xl" style="color:` +
      getStateColor(state) +
      `;"></span><span class="ml-2">` +
      getStateName(state) +
      `</span>`;
};

export const renderIP = (ip:string,type:string) => {
  if (type=="sort") {
    return ip.split(".").reduce((int, v) => (Number(int) * 256  +Number(v)) + "");
  }
  return ip;
}


export const  levelNum = (s :string) :number => {
	switch (s) {
	case "high":
		return 0;
	case "low":
		return 1;
	case "warn":
		return 2;
	case "normal":
		return 4
	case "repair":
		return 3
	}
	return 5
}
