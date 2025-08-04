import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ApplicationMode = 'user' | 'admin';

interface ModeContextType {
  mode: ApplicationMode;
  switchMode: (newMode: ApplicationMode) => void;
  isUserMode: boolean;
  isAdminMode: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

interface ModeProviderProps {
  children: React.ReactNode;
}

export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine mode from current route
  const getCurrentMode = (): ApplicationMode => {
    if (location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'user';
  };

  const [mode, setMode] = useState<ApplicationMode>(getCurrentMode);

  // Update mode when route changes
  useEffect(() => {
    const currentMode = getCurrentMode();
    if (currentMode !== mode) {
      setMode(currentMode);
    }
  }, [location.pathname, mode]);

  const switchMode = (newMode: ApplicationMode) => {
    if (newMode === mode) return;

    // Navigate to the appropriate mode's default route
    if (newMode === 'admin') {
      navigate('/admin/overview');
    } else {
      navigate('/user/dashboard');
    }
  };

  const value: ModeContextType = {
    mode,
    switchMode,
    isUserMode: mode === 'user',
    isAdminMode: mode === 'admin',
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};