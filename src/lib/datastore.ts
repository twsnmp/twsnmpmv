import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';

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
    const keys = await Preferences.keys();
    for(const k in keys) {
      const v = await Preferences.get({key:k});
      if (!v || v.value == null) {
        continue;
      }
      const e = JSON.parse(v.value);
      this.list.push(e);
    }
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
  }
  // 削除
  async del(id :string) {
    this.list = this.list.filter((e)=> e.id != id);
    await Preferences.configure({group:"twsnmpmv"});
    await Preferences.remove({key:id})
  }
}
