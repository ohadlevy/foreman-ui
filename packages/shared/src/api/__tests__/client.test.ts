import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { ForemanAPIClient, createDefaultClient, resetDefaultClient } from '../client';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, { deep: true });

// NOTE: Test expectations updated to match actual client implementation
// The client uses withCredentials: false to prevent session-based auth bypass,
// so tests have been corrected to expect this behavior rather than withCredentials: true

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ForemanAPIClient', () => {
  let client: ForemanAPIClient;
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    head: vi.fn(),
    options: vi.fn(),
    getUri: vi.fn(),
    create: vi.fn(),
    defaults: {} as any,
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockedAxios.create).mockReturnValue(mockAxiosInstance);

    client = new ForemanAPIClient({
      baseURL: '/api/v2',
      timeout: 30000,
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: '/api/v2',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        auth: undefined,
        withCredentials: false,
      });
    });

    it('should create axios instance with basic auth when username/password provided', () => {
      new ForemanAPIClient({
        baseURL: '/api/v2',
        username: 'testuser',
        password: 'testpass',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: '/api/v2',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        auth: {
          username: 'testuser',
          password: 'testpass',
        },
        withCredentials: false,
      });
    });

    it('should set up interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('token management', () => {
    it('should set token', () => {
      const token = 'test-token';
      client.setToken(token);
      expect(client.getToken()).toBe(token);
    });

    it('should clear token and localStorage', () => {
      client.setToken('test-token');
      client.clearToken();

      expect(client.getToken()).toBeUndefined();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('foreman_auth_token');
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({ data: { result: 'success' } });
      mockAxiosInstance.post.mockResolvedValue({ data: { result: 'created' } });
      mockAxiosInstance.put.mockResolvedValue({ data: { result: 'updated' } });
      mockAxiosInstance.patch.mockResolvedValue({ data: { result: 'patched' } });
      mockAxiosInstance.delete.mockResolvedValue({ data: { result: 'deleted' } });
    });

    it('should make GET request', async () => {
      const result = await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ result: 'success' });
    });

    it('should make GET request with config', async () => {
      const config = { params: { page: 1 } };
      await client.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });

    it('should make POST request', async () => {
      const data = { name: 'test' };
      const result = await client.post('/test', data);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toEqual({ result: 'created' });
    });

    it('should make PUT request', async () => {
      const data = { name: 'updated' };
      const result = await client.put('/test/1', data);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', data, undefined);
      expect(result).toEqual({ result: 'updated' });
    });

    it('should make PATCH request', async () => {
      const data = { name: 'patched' };
      const result = await client.patch('/test/1', data);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', data, undefined);
      expect(result).toEqual({ result: 'patched' });
    });

    it('should make DELETE request', async () => {
      const result = await client.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual({ result: 'deleted' });
    });
  });

  describe('getPaginated', () => {
    it('should make paginated GET request', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1 }, { id: 2 }],
          total: 2,
          page: 1,
          per_page: 20,
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getPaginated('/hosts', { page: 1, per_page: 20 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/hosts', {
        params: { page: 1, per_page: 20 }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('handleError', () => {
    it('should handle axios error with response', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Not found',
              details: 'Resource not found'
            }
          }
        }
      };

      vi.mocked(mockedAxios.isAxiosError).mockReturnValue(true);

      const result = client.handleError(axiosError);

      expect(result).toEqual({
        error: {
          message: 'Not found',
          details: 'Resource not found'
        }
      });
    });

    it('should handle axios error without detailed message', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
        response: {
          data: {}
        }
      };

      vi.mocked(mockedAxios.isAxiosError).mockReturnValue(true);

      const result = client.handleError(axiosError);

      expect(result).toEqual({
        error: {
          message: 'Network Error',
          details: undefined
        }
      });
    });

    it('should handle non-axios error', () => {
      const error = new Error('Generic error');
      vi.mocked(mockedAxios.isAxiosError).mockReturnValue(false);

      const result = client.handleError(error);

      expect(result).toEqual({
        error: {
          message: 'Generic error'
        }
      });
    });

    it('should handle unknown error', () => {
      vi.mocked(mockedAxios.isAxiosError).mockReturnValue(false);

      const result = client.handleError('string error');

      expect(result).toEqual({
        error: {
          message: 'An unknown error occurred'
        }
      });
    });
  });
});

describe('createDefaultClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDefaultClient();
    localStorageMock.getItem.mockReturnValue(null);

    // Mock environment
    process.env.REACT_APP_API_URL = '/api/v2';
  });

  it('should create client with default config', () => {
    vi.mocked(mockedAxios.create).mockReturnValue({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      }
    } as any);

    createDefaultClient();

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: '/api/v2',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      auth: undefined,
      withCredentials: false,
    });
  });

  it('should reuse existing client instance', () => {
    vi.mocked(mockedAxios.create).mockReturnValue({
      baseURL: '/api/v2',
      setToken: vi.fn(),
      clearToken: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      }
    } as any);

    const client1 = createDefaultClient();
    const client2 = createDefaultClient();

    expect(client1).toBe(client2);
    expect(mockedAxios.create).toHaveBeenCalledTimes(1);
  });

  it('should update token when it changes on existing client', () => {
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      head: vi.fn(),
      options: vi.fn(),
      getUri: vi.fn(),
      create: vi.fn(),
      defaults: {} as Record<string, unknown>,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      }
    } as unknown as AxiosInstance;

    vi.mocked(mockedAxios.create).mockReturnValue(mockAxiosInstance);

    // First call with initial token
    localStorageMock.getItem.mockReturnValue('initial-token');
    const client1 = createDefaultClient();

    // Spy on the setToken method of the actual client instance
    const setTokenSpy = vi.spyOn(client1, 'setToken');

    // Second call with different token - should update existing client instance
    localStorageMock.getItem.mockReturnValue('new-token');
    const client2 = createDefaultClient();

    // Should be same instance
    expect(client1).toBe(client2);
    // Should update token on the existing instance
    expect(setTokenSpy).toHaveBeenCalledWith('new-token');
  });

  it('should clear token when token is removed from existing client', () => {
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      head: vi.fn(),
      options: vi.fn(),
      getUri: vi.fn(),
      create: vi.fn(),
      defaults: {} as Record<string, unknown>,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      }
    } as unknown as AxiosInstance;

    vi.mocked(mockedAxios.create).mockReturnValue(mockAxiosInstance);

    // First call with token
    localStorageMock.getItem.mockReturnValue('existing-token');
    const client1 = createDefaultClient();

    // Spy on the clearToken method of the actual client instance
    const clearTokenSpy = vi.spyOn(client1, 'clearToken');

    // Second call with no token - should clear token on existing client instance
    localStorageMock.getItem.mockReturnValue(null);
    const client2 = createDefaultClient();

    // Should be same instance
    expect(client1).toBe(client2);
    // Should clear token on the existing instance
    expect(clearTokenSpy).toHaveBeenCalled();
  });

  it('should create new client when baseURL changes', () => {
    vi.mocked(mockedAxios.create).mockReturnValue({
      baseURL: '/api/v2',
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      }
    } as any);

    createDefaultClient();

    // Change environment
    process.env.REACT_APP_API_URL = '/api/v3';

    createDefaultClient();

    expect(mockedAxios.create).toHaveBeenCalledTimes(2);
  });
});