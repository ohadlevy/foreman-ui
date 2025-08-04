import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ModeProvider, useMode } from '../ModeContext';

// Test component that uses the mode context
const TestComponent: React.FC = () => {
  const { mode, switchMode, isAdminMode } = useMode();
  const location = useLocation();

  return (
    <div>
      <div data-testid="current-mode">{mode}</div>
      <div data-testid="is-admin-mode">{isAdminMode.toString()}</div>
      <div data-testid="current-path">{location.pathname}</div>
      <button 
        data-testid="switch-to-admin" 
        onClick={() => switchMode('admin')}
      >
        Switch to Admin
      </button>
      <button 
        data-testid="switch-to-user" 
        onClick={() => switchMode('user')}
      >
        Switch to User
      </button>
    </div>
  );
};

const renderWithRouter = (initialEntries: string[]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    </MemoryRouter>
  );
};

describe('ModeContext', () => {
  describe('Mode Detection', () => {
    it('should detect user mode for /user/* paths', () => {
      renderWithRouter(['/user/dashboard']);
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('user');
      expect(screen.getByTestId('is-admin-mode')).toHaveTextContent('false');
    });

    it('should detect admin mode for /admin/* paths', () => {
      renderWithRouter(['/admin/overview']);
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('admin');
      expect(screen.getByTestId('is-admin-mode')).toHaveTextContent('true');
    });

    it('should default to user mode for root path', () => {
      renderWithRouter(['/']);
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('user');
      expect(screen.getByTestId('is-admin-mode')).toHaveTextContent('false');
    });

    it('should default to user mode for unknown paths', () => {
      renderWithRouter(['/some/unknown/path']);
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('user');
      expect(screen.getByTestId('is-admin-mode')).toHaveTextContent('false');
    });
  });

  describe('Mode Switching', () => {
    it('should switch from user to admin mode', () => {
      renderWithRouter(['/user/dashboard']);
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('user');
      
      fireEvent.click(screen.getByTestId('switch-to-admin'));
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('admin');
      expect(screen.getByTestId('current-path')).toHaveTextContent('/admin/overview');
    });

    it('should switch from admin to user mode', () => {
      renderWithRouter(['/admin/overview']);
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('admin');
      
      fireEvent.click(screen.getByTestId('switch-to-user'));
      
      expect(screen.getByTestId('current-mode')).toHaveTextContent('user');
      expect(screen.getByTestId('current-path')).toHaveTextContent('/user/dashboard');
    });

    it('should not navigate if switching to same mode', () => {
      renderWithRouter(['/user/dashboard']);
      const initialPath = screen.getByTestId('current-path').textContent;
      
      fireEvent.click(screen.getByTestId('switch-to-user'));
      
      expect(screen.getByTestId('current-path')).toHaveTextContent(initialPath!);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useMode is used outside ModeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useMode must be used within a ModeProvider');
      
      consoleSpy.mockRestore();
    });
  });
});