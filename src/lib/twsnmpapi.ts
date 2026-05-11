
/**
 * TwsnmpAPI class provides methods to interact with the TWSNMP REST API.
 * It handles authentication via JWT tokens and provides helper methods for GET, POST, and DELETE requests.
 */
export class TwsnmpAPI {
  url: string
  token: string

  /**
   * Creates an instance of TwsnmpAPI.
   * @param url - The base URL of the TWSNMP API.
   */
  constructor(url: string) {
    this.url = url;
    this.token = '';
  }

  /**
   * Authenticates with the TWSNMP API using a UserID and Password.
   * @param user - The UserID for authentication.
   * @param password - The password for authentication.
   * @returns A promise that resolves to true if login is successful, false otherwise.
   */
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

  /**
   * Performs a GET request to the specified API endpoint.
   * @param api - The API endpoint (e.g., '/api/nodes').
   * @param type - The expected response type ('json' or 'data'). 'data' returns a Data URL.
   * @returns A promise that resolves to the response data, or undefined on failure.
   */
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

  /**
   * Performs a POST request to the specified API endpoint.
   * @param api - The API endpoint.
   * @param data - The data to be sent in the request body.
   * @returns A promise that resolves to the response JSON, or undefined on failure.
   */
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

  /**
   * Performs a DELETE request to the specified API endpoint.
   * @param api - The API endpoint.
   * @returns A promise that resolves to true if the deletion was successful (HTTP 204), false otherwise.
   */
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

