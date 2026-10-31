import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwsnmpAPI } from './twsnmpapi';

describe('TwsnmpAPI', () => {
  const mockUrl = 'http://localhost:8080';
  let api: TwsnmpAPI;

  beforeEach(() => {
    api = new TwsnmpAPI(mockUrl);
    api.token = 'test-token';
    vi.stubGlobal('fetch', vi.fn());
  });

  it('delete method should use the correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    const apiPath = '/api/node/1';
    await api.delete(apiPath);

    expect(mockFetch).toHaveBeenCalledWith(
      mockUrl + apiPath,
      expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      })
    );
  });

  it('get method should return json data', async () => {
    const mockData = { foo: 'bar' };
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => mockData,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await api.get('/api/test');

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      mockUrl + '/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      })
    );
  });

  describe('Authentication (login)', () => {
    it('should authenticate with TWSNMP NEO endpoint when serverType is neo', async () => {
      const neoApi = new TwsnmpAPI(mockUrl, 'neo');
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ token: 'neo-token', user: { user: 'admin' } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const ok = await neoApi.login('admin', 'password');

      expect(ok).toBe(true);
      expect(neoApi.token).toBe('neo-token');
      expect(mockFetch).toHaveBeenCalledWith(
        mockUrl + '/api/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ user: 'admin', password: 'password' }),
        })
      );
    });

    it('should authenticate with TWSNMP FC endpoint when serverType is fc', async () => {
      const fcApi = new TwsnmpAPI(mockUrl, 'fc');
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ token: 'fc-token' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const ok = await fcApi.login('admin', 'password');

      expect(ok).toBe(true);
      expect(fcApi.token).toBe('fc-token');
      expect(mockFetch).toHaveBeenCalledWith(
        mockUrl + '/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ UserID: 'admin', Password: 'password' }),
        })
      );
    });

    it('should auto-detect TWSNMP FC when /login succeeds in auto mode', async () => {
      const autoApi = new TwsnmpAPI(mockUrl, 'auto');
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === mockUrl + '/login') {
          return { status: 200, json: async () => ({ token: 'fc-token' }) };
        }
        return { status: 404 };
      });
      vi.stubGlobal('fetch', mockFetch);

      const ok = await autoApi.login('admin', 'password');

      expect(ok).toBe(true);
      expect(autoApi.token).toBe('fc-token');
      expect(autoApi.serverType).toBe('fc');
    });

    it('should auto-detect TWSNMP NEO when /login returns 405/404 and /api/login succeeds in auto mode', async () => {
      const autoApi = new TwsnmpAPI(mockUrl, 'auto');
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === mockUrl + '/login') {
          return { status: 405, json: async () => ({ message: 'Method Not Allowed' }) };
        }
        if (url === mockUrl + '/api/login') {
          return { status: 200, json: async () => ({ token: 'neo-token' }) };
        }
        return { status: 404 };
      });
      vi.stubGlobal('fetch', mockFetch);

      const ok = await autoApi.login('admin', 'password');

      expect(ok).toBe(true);
      expect(autoApi.token).toBe('neo-token');
      expect(autoApi.serverType).toBe('neo');
    });
  });

  describe('fetchMap', () => {
    it('should fetch and normalize NEO endpoints into standard map structure', async () => {
      const neoApi = new TwsnmpAPI(mockUrl, 'neo');
      neoApi.token = 'test-token';

      const mockNodes = [{ ID: 'n1', Name: 'Router', X: 10, Y: 20, State: 'normal' }];
      const mockLines = [{ ID: 'l1', NodeID1: 'n1', NodeID2: 'n2', State: 'normal' }];
      const mockNets = [{ ID: 'net1', Name: 'Switch', Ports: [] }];
      const mockItems = [{ ID: 'i1', Type: 11, Text: 'CPU', Value: 42 }];
      const mockConf = { IconSize: 3, MapName: 'Office' };
      const mockBackImg = { Path: 'bg.png', Width: 1920, Height: 1080 };
      const mockPollings = [{ ID: 'p1', Name: 'Ping', State: 'normal' }];
      const mockLogs = [{ Time: 123456, Event: 'Node up' }];
      const mockIcons = [{ Icon: 'mdi-router', Code: 0xf001 }];

      vi.spyOn(neoApi, 'get').mockImplementation(async (path: string) => {
        if (path === '/api/nodes') return mockNodes;
        if (path === '/api/lines') return mockLines;
        if (path === '/api/networks') return mockNets;
        if (path === '/api/drawitems') return mockItems;
        if (path === '/api/map/conf' || path === '/api/conf/map') return mockConf;
        if (path === '/api/map/backimage') return mockBackImg;
        if (path === '/api/pollings') return mockPollings;
        if (path === '/api/logs/events') return mockLogs;
        if (path === '/api/icons') return mockIcons;
        return undefined;
      });

      const map = await neoApi.fetchMap();

      expect(map).toBeDefined();
      expect(map.Nodes['n1']).toEqual(mockNodes[0]);
      expect(map.Networks['net1']).toEqual(mockNets[0]);
      expect(map.Items['i1']).toEqual(mockItems[0]);
      expect(map.Pollings['p1']).toEqual(mockPollings[0]);
      expect(map.Lines).toEqual(mockLines);
      expect(map.Logs).toEqual(mockLogs);
      expect(map.MapConf.IconSize).toBe(3);
      expect(map.MapConf.BackImage).toEqual(mockBackImg);
      expect(map.Icons).toEqual(mockIcons);
    });

    it('should query /api/map directly when serverType is fc', async () => {
      const fcApi = new TwsnmpAPI(mockUrl, 'fc');
      fcApi.token = 'test-token';

      const mockMap = {
        Nodes: { n1: { ID: 'n1', Name: 'FC-Router' } },
        Lines: [],
        MapConf: { IconSize: 24 },
      };

      vi.spyOn(fcApi, 'get').mockImplementation(async (path: string) => {
        if (path === '/api/map') return mockMap;
        return undefined;
      });

      const map = await fcApi.fetchMap();
      expect(map).toEqual(mockMap);
    });
  });

  describe('Resource URL Resolvers', () => {
    it('resolves correct URLs for NEO server', () => {
      const neoApi = new TwsnmpAPI(mockUrl, 'neo');

      expect(neoApi.getBackImageUrl('map_bg.png')).toBe('/api/map/image/map_bg.png');
      expect(neoApi.getBackImageUrl()).toBe('/api/map/backimage/raw');
      expect(neoApi.getNodeImageUrl('custom_server.png')).toBe('/api/map/image/custom_server.png');
      expect(neoApi.getItemImageUrl('icon.png')).toBe('/api/map/image/icon.png');
      expect(neoApi.getCustomIconsPath()).toBe('/api/icons');
      expect(neoApi.getReportPath('devices')).toBe('/api/report/log/device');
      expect(neoApi.getReportPath('ipam')).toBe('/api/ipam');
      expect(neoApi.getReportPath('cert')).toBe('/api/cert_monitors');
      expect(neoApi.getReportPath('env')).toBe('/api/report/log/env');
      expect(neoApi.getReportPath('ailist')).toBe('/api/report/ai');
      expect(neoApi.getReportPath('ai')).toBe('/api/ai/result/');
    });

    it('resolves correct URLs for FC server', () => {
      const fcApi = new TwsnmpAPI(mockUrl, 'fc');

      expect(fcApi.getBackImageUrl('map_bg.png')).toBe('/backimage');
      expect(fcApi.getNodeImageUrl('custom_server.png')).toBe('/imageIcon/custom_server.png');
      expect(fcApi.getItemImageUrl('icon.png')).toBe('/image/icon.png');
      expect(fcApi.getCustomIconsPath()).toBe('/api/conf/icons');
      expect(fcApi.getReportPath('devices')).toBe('/api/report/devices');
      expect(fcApi.getReportPath('ipam')).toBe('/api/report/ipam');
      expect(fcApi.getReportPath('cert')).toBe('/api/report/cert');
      expect(fcApi.getReportPath('env')).toBe('/api/report/EnvMonitor');
      expect(fcApi.getReportPath('ailist')).toBe('/api/report/ailist');
      expect(fcApi.getReportPath('ai')).toBe('/api/report/ai/');
    });
  });
});
