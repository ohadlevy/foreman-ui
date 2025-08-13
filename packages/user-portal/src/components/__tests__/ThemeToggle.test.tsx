import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { useUserSettingsStore } from '../../stores/userSettingsStore';

// Mock the user settings store
vi.mock('../../stores/userSettingsStore', () => ({
  useUserSettingsStore: vi.fn(),
}));

const mockUseUserSettingsStore = useUserSettingsStore as unknown as ReturnType<typeof vi.fn>;

describe('ThemeToggle', () => {
  const mockToggleTheme = vi.fn();
  const mockGetCurrentUserSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserSettingsStore.mockReturnValue({
      toggleTheme: mockToggleTheme,
      getCurrentUserSettings: mockGetCurrentUserSettings,
    });
  });

  it('should render light theme icon for light mode', () => {
    mockGetCurrentUserSettings.mockReturnValue({ theme: 'light' });
    
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /light theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Light theme');
  });

  it('should render dark theme icon for dark mode', () => {
    mockGetCurrentUserSettings.mockReturnValue({ theme: 'dark' });
    
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /dark theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Dark theme');
  });

  it('should render system theme icon for system mode', () => {
    mockGetCurrentUserSettings.mockReturnValue({ theme: 'system' });
    
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /system theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'System theme');
  });

  it('should call toggleTheme when clicked', () => {
    mockGetCurrentUserSettings.mockReturnValue({ theme: 'light' });
    
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockToggleTheme).toHaveBeenCalledOnce();
  });

  it('should handle unknown theme gracefully', () => {
    mockGetCurrentUserSettings.mockReturnValue({ theme: 'unknown' as 'light' | 'dark' | 'system' });
    
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /system theme/i });
    expect(button).toBeInTheDocument();
  });
});