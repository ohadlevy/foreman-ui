import { renderHook } from '@testing-library/react';
import { useUserSettingsInitializer } from '../useUserSettingsInitializer';
import { useAuth } from '@foreman/shared';
import { useUserSettingsStore } from '../../stores/userSettingsStore';

// Mock dependencies
vi.mock('@foreman/shared', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../stores/userSettingsStore', () => ({
  useUserSettingsStore: vi.fn(),
}));

vi.mock('../../i18n', () => ({
  i18next: {
    changeLanguage: vi.fn(),
  },
}));

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockUseUserSettingsStore = useUserSettingsStore as unknown as ReturnType<typeof vi.fn>;

describe('useUserSettingsInitializer', () => {
  const mockSetCurrentUser = vi.fn();
  const mockGetCurrentUserSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseUserSettingsStore.mockReturnValue({
      setCurrentUser: mockSetCurrentUser,
      getCurrentUserSettings: mockGetCurrentUserSettings,
    });
    
    mockGetCurrentUserSettings.mockReturnValue({
      language: 'en',
    });
  });

  it('should initialize user settings when user logs in', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 123 },
    });

    renderHook(() => useUserSettingsInitializer());

    expect(mockSetCurrentUser).toHaveBeenCalledWith('123');
  });

  it('should not initialize when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHook(() => useUserSettingsInitializer());

    expect(mockSetCurrentUser).not.toHaveBeenCalled();
  });

  it('should not initialize when user has no ID', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: null },
    });

    renderHook(() => useUserSettingsInitializer());

    expect(mockSetCurrentUser).not.toHaveBeenCalled();
  });

  it('should handle user changes', () => {
    const { rerender } = renderHook(() => useUserSettingsInitializer());

    // Initially no user
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    rerender();
    expect(mockSetCurrentUser).not.toHaveBeenCalled();

    // User logs in
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 456 },
    });
    rerender();
    expect(mockSetCurrentUser).toHaveBeenCalledWith('456');

    // Different user logs in
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 789 },
    });
    rerender();
    expect(mockSetCurrentUser).toHaveBeenCalledWith('789');
  });

  it('should apply language preference when settings are loaded', async () => {
    mockGetCurrentUserSettings.mockReturnValue({
      language: 'es',
    });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 123 },
    });

    renderHook(() => useUserSettingsInitializer());

    // Wait for dynamic import and language change
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockSetCurrentUser).toHaveBeenCalledWith('123');
    expect(mockGetCurrentUserSettings).toHaveBeenCalled();
  });

  it('should handle missing language gracefully', () => {
    mockGetCurrentUserSettings.mockReturnValue({
      language: null,
    });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 123 },
    });

    expect(() => {
      renderHook(() => useUserSettingsInitializer());
    }).not.toThrow();

    expect(mockSetCurrentUser).toHaveBeenCalledWith('123');
  });
});