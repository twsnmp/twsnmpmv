export type ServerType = 'auto' | 'fc' | 'neo';

/**
 * TwsnmpAPI class provides methods to interact with the TWSNMP REST API.
 * It handles authentication via JWT tokens (both TWSNMP FC and TWSNMP NEO)
 * and provides helper methods for GET, POST, and DELETE requests,
 * as well as map aggregation and resource URL resolution.
 */
export class TwsnmpAPI {
  url: string;
  token: string;
  serverType: ServerType;

  /**
   * Creates an instance of TwsnmpAPI.
   * @param url - The base URL of the TWSNMP API.
   * @param serverType - 'auto', 'fc', or 'neo' (defaults to 'auto').
   */
  constructor(url: string, serverType: ServerType = 'auto') {
    this.url = url;
    this.token = '';
    this.serverType = serverType;
  }

  /**
   * Authenticates with the TWSNMP API using credentials.
   * Supports both TWSNMP NEO (/api/login) and TWSNMP FC (/login),
   * with automatic detection fallback when serverType is 'auto'.
   * @param user - The UserID / user for authentication.
   * @param password - The password for authentication.
   * @returns A promise that resolves to true if login is successful, false otherwise.
   */
  async login(user: string, password: string): Promise<boolean> {
    if (this.serverType === 'neo') {
      return this.loginNeo(user, password);
    }
    if (this.serverType === 'fc') {
      return this.loginFc(user, password);
    }
    // 'auto' mode:
    // On FC, /login is a valid public route that returns 200 on success.
    // On NEO, POST /login returns 405 Method Not Allowed.
    // Checking /login first avoids triggering FC's JWT auth error (400 Bad Request) on /api/login.
    const fcRes = await this.loginFcStatus(user, password);
    if (fcRes.ok) {
      this.serverType = 'fc';
      return true;
    }
    if (await this.loginNeo(user, password)) {
      this.serverType = 'neo';
      return true;
    }
    return false;
  }

  private async loginNeo(user: string, password: string): Promise<boolean> {
    try {
      const res = await fetch(this.url + '/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user,
          password: password,
        }),
      });
      if (res.status === 200) {
        const r = await res.json();
        if (r && r.token) {
          this.token = r.token;
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  private async loginFc(user: string, password: string): Promise<boolean> {
    const res = await this.loginFcStatus(user, password);
    return res.ok;
  }

  private async loginFcStatus(user: string, password: string): Promise<{ ok: boolean; status: number }> {
    try {
      const res = await fetch(this.url + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserID: user,
          Password: password,
        }),
      });
      if (res.status === 200) {
        const r = await res.json();
        if (r && r.token) {
          this.token = r.token;
          return { ok: true, status: 200 };
        }
      }
      return { ok: false, status: res.status };
    } catch (e) {
      return { ok: false, status: 0 };
    }
  }

  /**
   * Fetches map data.
   * For TWSNMP FC, queries /api/map.
   * For TWSNMP NEO, parallel-fetches individual endpoints and normalizes to FC map object shape.
   */
  async fetchMap(): Promise<any> {
    if (this.serverType === 'neo') {
      return this.fetchMapNeo();
    }
    if (this.serverType === 'fc') {
      return this.get('/api/map');
    }
    // 'auto' mode: try /api/map first; if unavailable, fallback to NEO
    const fcMap = await this.get('/api/map');
    if (fcMap && (fcMap.Nodes || fcMap.MapConf)) {
      this.serverType = 'fc';
      return fcMap;
    }
    const neoMap = await this.fetchMapNeo();
    if (neoMap) {
      this.serverType = 'neo';
      return neoMap;
    }
    return undefined;
  }

  /**
   * Fetches and normalizes TWSNMP NEO endpoints into a unified map structure.
   */
  private async fetchMapNeo(): Promise<any> {
    try {
      const [
        nodesList,
        linesList,
        netList,
        itemList,
        mapConfRes,
        backImageRes,
        pollingsList,
        logsList,
        iconsList,
      ] = await Promise.all([
        this.get('/api/nodes').catch(() => []),
        this.get('/api/lines').catch(() => []),
        this.get('/api/networks').catch(() => []),
        this.get('/api/drawitems').catch(() => []),
        this.get('/api/map/conf').catch(() => this.get('/api/conf/map')).catch(() => ({})),
        this.get('/api/map/backimage').catch(() => ({})),
        this.get('/api/pollings').catch(() => []),
        this.get('/api/logs/events').catch(() => []),
        this.get('/api/icons').catch(() => []),
      ]);

      const mapConf = mapConfRes || {};
      const backImage = backImageRes || {};
      if (backImage && (backImage.Path || backImage.Width)) {
        mapConf.BackImage = backImage;
      }

      const Nodes: Record<string, any> = {};
      if (Array.isArray(nodesList)) {
        nodesList.forEach((n: any) => {
          const id = n.ID || n.id;
          if (id) Nodes[id] = n;
        });
      } else if (nodesList && typeof nodesList === 'object') {
        Object.assign(Nodes, nodesList);
      }

      const Networks: Record<string, any> = {};
      if (Array.isArray(netList)) {
        netList.forEach((n: any) => {
          const id = n.ID || n.id;
          if (id) Networks[id] = n;
        });
      } else if (netList && typeof netList === 'object') {
        Object.assign(Networks, netList);
      }

      const Items: Record<string, any> = {};
      if (Array.isArray(itemList)) {
        itemList.forEach((i: any) => {
          const id = i.ID || i.id;
          if (id) Items[id] = i;
        });
      } else if (itemList && typeof itemList === 'object') {
        Object.assign(Items, itemList);
      }

      const Pollings: Record<string, any[]> = {};
      if (Array.isArray(pollingsList)) {
        pollingsList.forEach((p: any) => {
          const nid = p.NodeID || p.node_id || p.nodeId || "";
          if (!Pollings[nid]) {
            Pollings[nid] = [];
          }
          Pollings[nid].push(p);
        });
      } else if (pollingsList && typeof pollingsList === 'object') {
        Object.assign(Pollings, pollingsList);
      }

      return {
        Nodes,
        Lines: Array.isArray(linesList) ? linesList : Object.values(linesList || {}),
        Networks,
        Items,
        Pollings,
        Logs: Array.isArray(logsList) ? logsList : [],
        MapConf: mapConf,
        Icons: Array.isArray(iconsList) ? iconsList : [],
      };
    } catch (e) {
      console.log(e);
      return undefined;
    }
  }

  /**
   * Resolves background image URL for GET request.
   */
  getBackImageUrl(path?: string): string {
    if (this.serverType === 'neo') {
      if (path) {
        if (path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) {
          return path;
        }
        return `/api/map/image/${path}`;
      }
      return '/api/map/backimage/raw';
    }
    return '/backimage';
  }

  /**
   * Resolves node custom icon image URL.
   */
  getNodeImageUrl(image: string): string {
    if (this.serverType === 'neo') {
      if (image.startsWith('http') || image.startsWith('/') || image.startsWith('data:')) {
        return image;
      }
      return `/api/map/image/${image}`;
    }
    return `/imageIcon/${image}`;
  }

  /**
   * Resolves DrawItem image URL.
   */
  getItemImageUrl(path: string): string {
    if (this.serverType === 'neo') {
      if (path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) {
        return path;
      }
      return `/api/map/image/${path}`;
    }
    return `/image/${path}`;
  }

  /**
   * Returns custom icon endpoint path based on server type.
   */
  getCustomIconsPath(): string {
    if (this.serverType === 'neo') {
      return '/api/icons';
    }
    return '/api/conf/icons';
  }

  /**
   * Returns report endpoint path based on server type.
   */
  getReportPath(kind: 'devices' | 'ipam' | 'cert' | 'env' | 'ai' | 'ailist'): string {
    if (this.serverType === 'neo') {
      switch (kind) {
        case 'devices':
          return '/api/arp';
        case 'ipam':
          return '/api/ipam';
        case 'cert':
          return '/api/cert_monitors';
        case 'env':
          return '/api/report/log/envMonitor';
        case 'ailist':
          return '/api/report/ai';
        case 'ai':
          return '/api/ai/result/';
      }
    }
    switch (kind) {
      case 'devices':
        return '/api/report/devices';
      case 'ipam':
        return '/api/report/ipam';
      case 'cert':
        return '/api/report/cert';
      case 'env':
        return '/api/report/EnvMonitor';
      case 'ailist':
        return '/api/report/ailist';
      case 'ai':
        return '/api/report/ai/';
    }
  }

  /**
   * Performs a GET request to the specified API endpoint.
   * @param api - The API endpoint (e.g., '/api/nodes').
   * @param type - The expected response type ('json' or 'data'). 'data' returns a Data URL.
   * @returns A promise that resolves to the response data, or undefined on failure.
   */
  async get(api: string, type: string = "json"): Promise<any> {
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
        const reader = new FileReader();
        reader.readAsDataURL(await res.blob());
        await new Promise<void>(resolve => reader.onload = () => resolve());
        return reader.result;
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
  async post(api: string, data: any): Promise<any> {
    try {
      const res = await fetch(this.url + api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token,
        },
        body: JSON.stringify(data),
      });
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
  async delete(api: string): Promise<boolean> {
    try {
      const res = await fetch(this.url + api, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + this.token,
        },
      });
      return res.status == 204;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
