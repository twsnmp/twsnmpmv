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
});
