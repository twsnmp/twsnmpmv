import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';
import * as icons from "@mdi/js";
import { writable } from 'svelte/store';

export const refreshCount = writable(0);
export interface TwsnmpEnt  {
  id : string
  name: string
  url :string;
  user:string;
  password:string;
  loc: string;
}

export class DataStore {
  list :TwsnmpEnt[]
  constructor () {
    this.list = [];
    this.load();
  }
  // 読み込み
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
    refreshCount.update(n=>n+1);
  }
  // 保存
  public async save(t :TwsnmpEnt) {
    if(t.id) {
      this.list = this.list.filter((e)=> e.id != t.id);
    } else {
      t.id = uuidv4();
    }
    this.list.push(t);
    const v = JSON.stringify(t);
    await Preferences.configure({group:"twsnmpmv"});
    await Preferences.set({key:t.id,value:v});
    console.log(this.list);
    refreshCount.update(n=>n+1);
  }
  // 削除
  async del(id :string) {
    this.list = this.list.filter((e)=> e.id != id);
    await Preferences.configure({group:"twsnmpmv"});
    await Preferences.remove({key:id});
    refreshCount.update(n=>n+1);
  }
  // 取得
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
  getState(id:string) :string {
    return "normal";
  }
}

export const getStateColor = (s:string):string => {
  switch(s) {
    case "normal":
      return "green";
    case "warn":
      return "yellow";
    case "low":
      return "pink";
    case "high":
      return "red";
    }
    return "gray";
}

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