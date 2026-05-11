import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';
import * as icons from "@mdi/js";
import { writable } from 'svelte/store';
import { TwsnmpAPI } from './twsnmpapi';

export const refreshCount = writable(0);

/**
 * Represents a TWSNMP site configuration.
 */
export interface TwsnmpEnt  {
  id : string
  name: string
  url :string;
  user:string;
  password:string;
  loc: string;
}

/**
 * Configuration for the location/map view.
 */
export interface LocConfEnt {
  style: string
  zoom: number
  center: string
}

/**
 * DataStore manages the application state, including the list of TWSNMP sites,
 * their current status, and general configuration. It persists data using
 * Capacitor Preferences and handles periodic background status checks.
 */
export class DataStore {
  list :TwsnmpEnt[]
  stateMap: Map<string,string>
  apiMap: Map<string,any>
  timer: any
  checkIndex: number
  locConf: LocConfEnt

  constructor () {
    this.list = [];
    this.locConf = {
      style: "https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json",
      zoom:2,
      center:"139.75,35.68"
    }
    this.load();
    this.stateMap = new Map();
    this.checkIndex = 0;
    this.apiMap = new Map();
  }

  /**
   * Loads site configurations and general settings from persistent storage.
   * Initializes the background site check process.
   */
  async load() {
    this.list = [];
    await Preferences.configure({group:"twsnmpmv"});
    const kr = await Preferences.keys();
    for(const k of kr.keys) {
      const v = await Preferences.get({key:k});
      if (!v || v.value == null) {
        continue;
      }
      const e = JSON.parse(v.value);
      this.list.push(e);
    }
    await Preferences.configure({group:"twsnmpmv_conf"});
    const lcv = await Preferences.get({key:"locConf"});
    if( lcv && lcv.value) {
      this.locConf = JSON.parse(lcv.value);
    }
    refreshCount.update(n=>n+1);
    this.checkSite();
  }

  /**
   * Saves or updates a TWSNMP site configuration.
   * @param t - The TWSNMP entity to save.
   */
  public async save(t :TwsnmpEnt) {
    if(t.id) {
      this.list = this.list.filter((e)=> e.id != t.id);
      this.apiMap.delete(t.id);
      this.stateMap.delete(t.id);
    } else {
      t.id = uuidv4();
    }
    this.list.push(t);
    const v = JSON.stringify(t);
    await Preferences.configure({group:"twsnmpmv"});
    await Preferences.set({key:t.id,value:v});
    refreshCount.update(n=>n+1);
    if(this.list.length == 1) {
      this.checkSite();
    }
  }

  /**
   * Updates only the location field of a TWSNMP site.
   * @param t - The TWSNMP entity with updated location.
   */
  public async saveLoc(t :TwsnmpEnt) {
    if(!t.id) {
      return;
    }
    this.list = this.list.filter((e)=> e.id != t.id);
    this.list.push(t);
    const v = JSON.stringify(t);
    await Preferences.configure({group:"twsnmpmv"});
    await Preferences.set({key:t.id,value:v});
  }

  /**
   * Saves the general location configuration to persistent storage.
   */
  public async saveLocConf() {
    if (!this.locConf.style) {
      this.locConf.style = "https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json";
    }
    const v = JSON.stringify(this.locConf);
    await Preferences.configure({group:"twsnmpmv_conf"});
    await Preferences.set({key:"locConf",value:v});
  }

  /**
   * Deletes a TWSNMP site configuration.
   * @param id - The ID of the site to delete.
   */
  async del(id :string) {
    this.list = this.list.filter((e)=> e.id != id);
    await Preferences.configure({group:"twsnmpmv"});
    await Preferences.remove({key:id});
    this.apiMap.delete(id);
    this.stateMap.delete(id);
    refreshCount.update(n=>n+1);
  }

  /**
   * Retrieves a TWSNMP site configuration by ID.
   * @param id - The ID of the site to retrieve.
   * @returns The TWSNMP entity, or a default empty entity if not found.
   */
  get(id: string) :TwsnmpEnt {
    for(const t of this.list) {
      if (id == t.id) {
        return t
      }
    }
    return {
      id: "",
      name: "",
      url: "",
      user: "",
      password: "",
      loc: "",
    }
  }

  /**
   * Checks the status of a single site by fetching its nodes.
   * Updates the stateMap with the overall status (high, low, warn, normal, unknown).
   * @param i - The index of the site in the list to check.
   */
  async checkOneSite(i:number) {
    const t = this.list[i];
    let state = "unknown";
    let nodes: any;
    for(let i = 0;i < 2;i++) {
      let api :any;
      if ( this.apiMap.has(t.id)) {
        api = this.apiMap.get(t.id);
      } else {
        api = new TwsnmpAPI(t.url);
        if(!await api.login(t.user,t.password) ) {
          this.stateMap.set(t.id,"unknown");
          refreshCount.update(n=>n+1);
          return;
        }
        this.apiMap.set(t.id,api);
      }
      nodes = await api.get("/api/nodes");
      if(nodes != undefined) {
        break
      }
      this.apiMap.delete(t.id);
    }
    if(nodes && nodes.length >0 ) {
      for(const n of nodes) {
        if(n.State == "high") {
          state  = "high";
          break;
        } 
        if (state == "low" || n.State == "low") {
          state = "low";
          continue;
        }
        if (state == "warn" || n.State == "warn") {
          state = "warn";
          continue;
        }
        if(n.State == "normal" || n.State == "repair") {
          state = "normal";
        }
      }
    }
    this.stateMap.set(t.id,state);
    refreshCount.update(n=>n+1);
  }

  /**
   * Initiates periodic status checks for all configured sites.
   * Runs in a background loop using setTimeout.
   */
  checkSite() {
    let t = 1;
    if (this.list.length == 0) {
      this.timer = undefined;
      return;
    }
    this.checkOneSite(this.checkIndex);
    this.checkIndex++;
    if (this.checkIndex >= this.list.length) {
      this.checkIndex = 0;
      if (this.list.length < 60) {
        t = 60 - this.list.length;
      }
    }
    this.timer = setTimeout(()=>this.checkSite(),t * 1000);
  }

  /**
   * Stops the background status check process.
   */
  stopSiteCheck() {
    if(this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Gets the current status of a site.
   * @param id - The ID of the site.
   * @returns The status string (e.g., 'normal', 'high', 'unknown').
   */
  getState(id:string) :string {
    return this.stateMap.get(id) || "unknown";
  }
}

/**
 * Gets the color associated with a status.
 * @param s - The status string.
 * @returns The hex color string.
 */
export const getStateColor = (s:string):string => {
  switch(s) {
    case "normal":
      return "#33a02c";
    case "warn":
      return "#dfdf22";
    case "low":
      return "#fb9a99";
    case "high":
      return "#e31a1c";
    }
    return "gray";
}

/**
 * Gets the MDI icon associated with a status.
 * @param s - The status string.
 * @returns The icon path string.
 */
export const getStateIcon = (s:string):string => {
  switch(s) {
  case "normal":
    return icons.mdiCircle;
  case "warn":
    return icons.mdiAlert;
  case "low":
  case "high":
    return icons.mdiAlertCircle;
  }
  return icons.mdiHelp
}

export const ds = new DataStore();