import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../Settings';
import { useUserSettingsStore } from '../../stores/userSettingsStore';

// Mock the user settings store
vi.mock('../../stores/userSettingsStore', () => ({
  useUserSettingsStore: vi.fn(),
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: '🇺🇸 English' },
    { code: 'es', name: 'Spanish', nativeName: '🇪🇸 Español' },
    { code: 'fr', name: 'French', nativeName: '🇫🇷 Français' },
  ],
}));

const mockUseUserSettingsStore = useUserSettingsStore as unknown as ReturnType<typeof vi.fn>;

describe('Settings', () => {
  const mockSetTheme = vi.fn();
  const mockSetLanguage = vi.fn();
  const mockGetCurrentUserSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserSettingsStore.mockReturnValue({
      setTheme: mockSetTheme,
      setLanguage: mockSetLanguage,
      getCurrentUserSettings: mockGetCurrentUserSettings,
    });

    mockGetCurrentUserSettings.mockReturnValue({
      theme: 'system',
      language: 'en',
      notificationPreferences: {
        desktop: true,
        email: true,
        sound: false,
      },
    });
  });

  it('should render the settings page', () => {
    render(<Settings />);
    
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/customize your foreman experience/i)).toBeInTheDocument();
  });

  it('should render appearance settings', () => {
    render(<Settings />);
    
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('should render notification settings', () => {
    render(<Settings />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Desktop notifications')).toBeInTheDocument();
    expect(screen.getByText('Email notifications')).toBeInTheDocument();
    expect(screen.getByText('Sound notifications')).toBeInTheDocument();
  });

  describe('theme selection', () => {
    it('should show current theme selection', () => {
      mockGetCurrentUserSettings.mockReturnValue({
        theme: 'dark',
        language: 'en',
      });

      render(<Settings />);
      
      const darkThemeRadio = screen.getByRole('radio', { name: /dark theme/i });
      expect(darkThemeRadio).toBeChecked();
    });

    it('should call setTheme when theme is changed', () => {
      render(<Settings />);
      
      const lightThemeRadio = screen.getByRole('radio', { name: /light theme/i });
      fireEvent.click(lightThemeRadio);
      
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should handle light theme option', () => {
      render(<Settings />);
      
      const lightThemeRadio = screen.getByRole('radio', { name: /light theme/i });
      fireEvent.click(lightThemeRadio);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should handle dark theme option', () => {
      render(<Settings />);
      
      const darkThemeRadio = screen.getByRole('radio', { name: /dark theme/i });
      fireEvent.click(darkThemeRadio);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should handle system theme option', () => {
      // Set initial theme to something other than system to test the change
      mockGetCurrentUserSettings.mockReturnValue({
        theme: 'light',
        language: 'en',
        notificationPreferences: {
          desktop: true,
          email: true,
          sound: false,
        },
      });
      
      render(<Settings />);
      
      const systemThemeRadio = screen.getByRole('radio', { name: /follow system preference/i });
      fireEvent.click(systemThemeRadio);
      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });
  });

  describe('language selection', () => {
    it('should show current language selection', () => {
      mockGetCurrentUserSettings.mockReturnValue({
        theme: 'system',
        language: 'es',
      });

      render(<Settings />);
      
      // Should show Spanish as selected
      expect(screen.getByText('🇪🇸 Español')).toBeInTheDocument();
    });

    it('should open language dropdown when clicked', async () => {
      render(<Settings />);
      
      const languageButton = screen.getByRole('button', { name: /english/i });
      fireEvent.click(languageButton);
      
      await waitFor(() => {
        expect(screen.getByText('🇪🇸 Español')).toBeInTheDocument();
        expect(screen.getByText('🇫🇷 Français')).toBeInTheDocument();
      });
    });

    it('should call setLanguage when language is selected', async () => {
      render(<Settings />);
      
      // Open dropdown
      const languageButton = screen.getByRole('button', { name: /english/i });
      fireEvent.click(languageButton);
      
      // Select Spanish
      await waitFor(() => {
        const spanishOption = screen.getByText('🇪🇸 Español');
        fireEvent.click(spanishOption);
      });
      
      expect(mockSetLanguage).toHaveBeenCalledWith('es');
    });
  });

  describe('notification preferences', () => {
    it('should reflect current notification settings', () => {
      render(<Settings />);
      
      const desktopSwitch = screen.getByLabelText(/desktop notifications/i);
      const emailSwitch = screen.getByLabelText(/email notifications/i);
      const soundSwitch = screen.getByLabelText(/sound notifications/i);
      
      expect(desktopSwitch).toBeChecked();
      expect(emailSwitch).toBeChecked();
      expect(soundSwitch).not.toBeChecked();
    });

    it('should handle notification preference changes', () => {
      // Note: These are currently just console.log statements
      // In a real implementation, these would update the store
      render(<Settings />);
      
      const desktopSwitch = screen.getByLabelText(/desktop notifications/i);
      fireEvent.click(desktopSwitch);
      
      // For now, we just verify the component doesn't crash
      // In the future, this would test actual state updates
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels and descriptions', () => {
      render(<Settings />);
      
      expect(screen.getByText(/choose how foreman ui appears/i)).toBeInTheDocument();
      expect(screen.getByText(/choose your preferred language/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<Settings />);
      
      // Check that form inputs have proper ARIA labels
      const lightThemeRadio = screen.getByRole('radio', { name: /light theme/i });
      expect(lightThemeRadio).toHaveAttribute('name', 'theme');
      
      const languageSelect = screen.getByRole('button', { name: /english/i });
      expect(languageSelect).toHaveAttribute('aria-expanded');
    });
  });
});