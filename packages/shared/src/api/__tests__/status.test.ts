import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchForemanStatus, ForemanStatus } from '../status';
import { createDefaultClient } from '../client';

// Mock the client
vi.mock('../client', () => ({
  createDefaultClient: vi.fn(),
}));

describe('fetchForemanStatus', () => {
  const mockClient = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createDefaultClient as any).mockReturnValue(mockClient);
  });

  it('should fetch Foreman status successfully', async () => {
    const mockStatus: ForemanStatus = {
      version: '3.12.1',
      api_version: 2,
      satellite: false,
    };

    mockClient.get.mockResolvedValue(mockStatus);

    const result = await fetchForemanStatus();

    expect(mockClient.get).toHaveBeenCalledWith('/status');
    expect(result).toEqual(mockStatus);
  });

  it('should handle errors when fetching status', async () => {
    const mockError = new Error('Network error');
    mockClient.get.mockRejectedValue(mockError);

    await expect(fetchForemanStatus()).rejects.toThrow('Network error');
    expect(mockClient.get).toHaveBeenCalledWith('/status');
  });

  it('should handle satellite installations', async () => {
    const mockStatus: ForemanStatus = {
      version: '6.12.1',
      api_version: 2,
      satellite: true,
    };

    mockClient.get.mockResolvedValue(mockStatus);

    const result = await fetchForemanStatus();

    expect(result.satellite).toBe(true);
    expect(result.version).toBe('6.12.1');
  });
});