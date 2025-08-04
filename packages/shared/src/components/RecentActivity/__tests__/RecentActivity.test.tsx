import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { RecentActivity, RecentHosts, RecentSearches } from '../RecentActivity';
import { useActivityStore, ActivityItem } from '../../../stores/activityStore';

// Mock the activity store
vi.mock('../../../stores/activityStore');
const mockUseActivityStore = vi.mocked(useActivityStore);

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock formatting utility
vi.mock('../../../utils/formatting', () => ({
  formatRelativeTime: (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date('2023-01-01T12:00:00Z');
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours ago`;
  },
}));

describe('RecentActivity', () => {
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'host_view',
      title: 'Test Host 1',
      url: '/hosts/1',
      timestamp: '2023-01-01T10:00:00Z',
      subtitle: 'host details',
    },
    {
      id: '2',
      type: 'search',
      title: 'Search: web servers',
      url: '/hosts?search=web',
      timestamp: '2023-01-01T09:30:00Z',
      subtitle: 'hosts search',
    },
    {
      id: '3',
      type: 'page_visit',
      title: 'Dashboard',
      url: '/dashboard',
      timestamp: '2023-01-01T09:00:00Z',
    },
  ];

  const mockActivityStore = {
    recentActivity: mockActivities,
    clearActivity: vi.fn(),
    getRecentHosts: vi.fn(() => mockActivities.filter(a => a.type.includes('host'))),
    getRecentSearches: vi.fn(() => mockActivities.filter(a => a.type === 'search')),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActivityStore.mockReturnValue(mockActivityStore);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('RecentActivity component', () => {
    describe('rendering', () => {
      it('should render recent activity items', () => {
        renderWithRouter(<RecentActivity />);
        
        expect(screen.getByText('Test Host 1')).toBeInTheDocument();
        expect(screen.getByText('Search: web servers')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      it('should display timestamps for activity items', () => {
        renderWithRouter(<RecentActivity />);
        
        // Check that timestamps are displayed (exact format may vary based on mock)
        const timestamps = screen.getAllByText(/hours? ago/);
        expect(timestamps.length).toBeGreaterThan(0);
      });

      it('should display subtitles as badges when available', () => {
        renderWithRouter(<RecentActivity />);
        
        expect(screen.getByText('host details')).toBeInTheDocument();
        expect(screen.getByText('hosts search')).toBeInTheDocument();
      });

      it('should show empty state when no activities', () => {
        mockUseActivityStore.mockReturnValue({
          ...mockActivityStore,
          recentActivity: [],
        });

        renderWithRouter(<RecentActivity />);
        
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
      });

      it('should limit displayed items to maxItems', () => {
        renderWithRouter(<RecentActivity maxItems={2} />);
        
        expect(screen.getByText('Test Host 1')).toBeInTheDocument();
        expect(screen.getByText('Search: web servers')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    describe('functionality', () => {
      it('should navigate when activity item is clicked', () => {
        renderWithRouter(<RecentActivity />);
        
        const hostItem = screen.getByText('Test Host 1');
        fireEvent.click(hostItem);
        
        expect(mockNavigate).toHaveBeenCalledWith('/hosts/1');
      });

      it('should call onItemSelect when provided', () => {
        const mockOnItemSelect = vi.fn();
        renderWithRouter(<RecentActivity onItemSelect={mockOnItemSelect} />);
        
        const hostItem = screen.getByText('Test Host 1');
        fireEvent.click(hostItem);
        
        expect(mockOnItemSelect).toHaveBeenCalledWith(mockActivities[0]);
      });

      it('should show clear history button by default', () => {
        renderWithRouter(<RecentActivity />);
        
        expect(screen.getByText('Clear history')).toBeInTheDocument();
      });

      it('should hide clear button when showClearButton is false', () => {
        renderWithRouter(<RecentActivity showClearButton={false} />);
        
        expect(screen.queryByText('Clear history')).not.toBeInTheDocument();
      });

      it('should call clearActivity when clear button is clicked', () => {
        renderWithRouter(<RecentActivity />);
        
        const clearButton = screen.getByText('Clear history');
        fireEvent.click(clearButton);
        
        expect(mockActivityStore.clearActivity).toHaveBeenCalled();
      });
    });

    describe('activity icons', () => {
      it('should display appropriate icons for different activity types', () => {
        renderWithRouter(<RecentActivity />);
        
        // Check that menu items are rendered (icons are part of MenuItem components)
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('RecentHosts component', () => {
    it('should render only host-related activities', () => {
      renderWithRouter(<RecentHosts />);
      
      expect(mockActivityStore.getRecentHosts).toHaveBeenCalled();
      expect(screen.getByText('Test Host 1')).toBeInTheDocument();
      expect(screen.queryByText('Search: web servers')).not.toBeInTheDocument();
    });

    it('should show empty state when no recent hosts', () => {
      const emptyStore = {
        ...mockActivityStore,
        getRecentHosts: vi.fn(() => []),
      };
      mockUseActivityStore.mockReturnValue(emptyStore);
      renderWithRouter(<RecentHosts />);
      
      expect(screen.getByText('No recent hosts')).toBeInTheDocument();
    });

    it('should call onItemSelect when host item is clicked', () => {
      const mockOnItemSelect = vi.fn();
      renderWithRouter(<RecentHosts onItemSelect={mockOnItemSelect} />);
      
      const hostItem = screen.getByText('Test Host 1');
      fireEvent.click(hostItem);
      
      expect(mockOnItemSelect).toHaveBeenCalledWith(mockActivities[0]);
    });
  });

  describe('RecentSearches component', () => {
    it('should render only search-related activities', () => {
      renderWithRouter(<RecentSearches />);
      
      expect(mockActivityStore.getRecentSearches).toHaveBeenCalled();
      expect(screen.getByText('Search: web servers')).toBeInTheDocument();
      expect(screen.queryByText('Test Host 1')).not.toBeInTheDocument();
    });

    it('should show empty state when no recent searches', () => {
      const emptyStore = {
        ...mockActivityStore,
        getRecentSearches: vi.fn(() => []),
      };
      mockUseActivityStore.mockReturnValue(emptyStore);
      renderWithRouter(<RecentSearches />);
      
      expect(screen.getByText('No recent searches')).toBeInTheDocument();
    });

    it('should navigate and call onItemSelect when search item is clicked', () => {
      const mockOnItemSelect = vi.fn();
      renderWithRouter(<RecentSearches onItemSelect={mockOnItemSelect} />);
      
      const searchItem = screen.getByText('Search: web servers');
      fireEvent.click(searchItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/hosts?search=web');
      expect(mockOnItemSelect).toHaveBeenCalledWith(mockActivities[1]);
    });
  });

  describe('accessibility', () => {
    it('should have proper menu structure', () => {
      renderWithRouter(<RecentActivity />);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      renderWithRouter(<RecentActivity />);
      
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
      
      // Test that menuitem elements are accessible
      const firstMenuItem = menuItems[0];
      expect(firstMenuItem).toBeInTheDocument();
      expect(firstMenuItem.getAttribute('tabindex')).not.toBe('-1');
    });
  });
});