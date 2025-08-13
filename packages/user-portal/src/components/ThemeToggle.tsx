import React from 'react';
import { Button } from '@patternfly/react-core';
import { MoonIcon, SunIcon, AdjustIcon } from '@patternfly/react-icons';
import { useUserSettingsStore, ThemeMode } from '../stores/userSettingsStore';

export const ThemeToggle: React.FC = () => {
  const { getCurrentUserSettings, toggleTheme } = useUserSettingsStore();
  const currentSettings = getCurrentUserSettings();

  const getThemeIcon = (theme: ThemeMode) => {
    switch (theme) {
      case 'light':
        return <SunIcon />;
      case 'dark':
        return <MoonIcon />;
      case 'system':
        return <AdjustIcon />;
      default:
        return <AdjustIcon />;
    }
  };

  const getThemeLabel = (theme: ThemeMode) => {
    switch (theme) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      case 'system':
        return 'System theme';
      default:
        return 'System theme';
    }
  };

  return (
    <Button
      variant="plain"
      aria-label={getThemeLabel(currentSettings.theme)}
      onClick={toggleTheme}
      icon={getThemeIcon(currentSettings.theme)}
    />
  );
};