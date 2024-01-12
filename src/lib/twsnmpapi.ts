
export class TwsnmpAPI {
  url: string
  token: string
  constructor(url: string) {
    this.url = url;
    this.token = '';
  }
  async login(user:string,password:string) :Promise<boolean>  {
    try {
      const res = await fetch(this.url + '/login', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          UserID: user,
          Password: password,
        })
      })
      if (res.status == 200) {
        const r = await res.json();
        if (r && r.token ) {
          this.token = r.token;
          return true;
        }
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async get(api:string,type: string = "json") :Promise<any> {
    try {
      const res = await fetch(this.url + api, {
        method: 'GET',
        headers: {
        'Authorization': 'Bearer ' + this.token,
        },
      });
      if (res.status != 200) {
        return undefined;
      }
      switch(type) {
      case "json":
        return await res.json();
      case "data":
        const reader = new FileReader()
        reader.readAsDataURL(await res.blob());
        await new Promise<void>(resolve => reader.onload = () => resolve());
        return reader.result
      }
    } catch (e) {
      console.log(e);
      return undefined;
    }
  }
  async post(api:string,data:any) :Promise<any> {
    try {
      const res = await fetch(this.url + api, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.token,
        },
        body: JSON.stringify(data),
      })
      if (res.status != 200) {
        return undefined;
      }
      return await res.json();
    } catch (e) {
      console.log(e);
      return undefined;
    }
  }
  async delete(api:string): Promise<boolean> {
    try {
      const res = await fetch('APIURL'+ api, {
        method: 'DELETE',
        headers: {
        'Authorization': 'Bearer ' + this.token,
        },
      })
      return res.status == 204;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}

