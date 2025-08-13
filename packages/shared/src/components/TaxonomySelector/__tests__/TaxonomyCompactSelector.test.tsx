import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxonomyCompactSelector } from '../TaxonomyCompactSelector';
import type { EnhancedOrganization, EnhancedLocation } from '../../../types/taxonomy';
import { useTaxonomy } from '../../../hooks/useTaxonomy';

// Mock the dependencies
vi.mock('../../../hooks/useTaxonomy');
vi.mock('../TaxonomySelector', () => ({
  TaxonomySelector: ({ onSelectionChange, placeholder, type }: any) => (
    <div data-testid={`taxonomy-selector-${type}`}>
      <button
        onClick={() => {
          if (type === 'organization') {
            onSelectionChange?.(mockOrganizations[1].id); // Select different org ID to trigger action
          } else if (type === 'location') {
            onSelectionChange?.(mockLocations[1].id); // Select different location ID to trigger action
          }
        }}
      >
        {placeholder}
      </button>
    </div>
  )
}));

const mockOrganizations: EnhancedOrganization[] = [
  {
    id: 1,
    name: 'org1',
    title: 'Organization 1',
    description: 'First organization',
    hosts_count: 10,
    users_count: 5
  },
  {
    id: 2,
    name: 'org2',
    title: 'Organization 2',
    description: 'Second organization',
    hosts_count: 15,
    users_count: 8
  }
];

const mockLocations: EnhancedLocation[] = [
  {
    id: 1,
    name: 'loc1',
    title: 'Location 1',
    description: 'First location',
    hosts_count: 12,
    users_count: 6
  },
  {
    id: 2,
    name: 'loc2',
    title: 'Location 2',
    description: 'Second location',
    hosts_count: 8,
    users_count: 4
  }
];

const mockUseTaxonomyReturn = {
  context: {
    organization: mockOrganizations[0],
    location: mockLocations[0],
    availableOrganizations: mockOrganizations,
    availableLocations: mockLocations,
    isLoading: false,
    error: undefined
  },
  permissions: {
    canViewOrganizations: true,
    canEditOrganizations: true,
    canCreateOrganizations: true,
    canDeleteOrganizations: true,
    canViewLocations: true,
    canEditLocations: true,
    canCreateLocations: true,
    canDeleteLocations: true,
    canSwitchContext: true
  },
  isLoading: false,
  error: null,
  actions: {
    setCurrentOrganization: vi.fn(),
    setCurrentLocation: vi.fn(),
    resetSelection: vi.fn()
  }
};

describe('TaxonomyCompactSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaxonomy).mockReturnValue(mockUseTaxonomyReturn);
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<TaxonomyCompactSelector />);
      
      // Should show the toggle button with current context
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Organization 1 / Location 1')).toBeInTheDocument();
    });

    it('should render with current organization and location', () => {
      render(<TaxonomyCompactSelector />);
      
      expect(screen.getByText('Organization 1 / Location 1')).toBeInTheDocument();
    });

    it('should show "Select Context" when no context is selected', () => {
      vi.mocked(useTaxonomy).mockReturnValue({
        ...mockUseTaxonomyReturn,
        context: {
          ...mockUseTaxonomyReturn.context,
          organization: undefined,
          location: undefined
        }
      });

      render(<TaxonomyCompactSelector />);
      
      expect(screen.getByText('Select Context')).toBeInTheDocument();
    });

    it('should show only organization when showLocation is false', () => {
      render(<TaxonomyCompactSelector showLocation={false} />);
      
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
    });

    it('should show only location when showOrganization is false', () => {
      render(<TaxonomyCompactSelector showOrganization={false} />);
      
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });
  });

  describe('permissions', () => {
    it('should render as read-only when user cannot switch context', () => {
      vi.mocked(useTaxonomy).mockReturnValue({
        ...mockUseTaxonomyReturn,
        permissions: {
          ...mockUseTaxonomyReturn.permissions,
          canSwitchContext: false
        }
      });

      render(<TaxonomyCompactSelector />);
      
      // Should show read-only indicators instead of clickable button
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
      expect(screen.getByText('Location 1')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should open popover when toggle is clicked', async () => {
      render(<TaxonomyCompactSelector />);
      
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(screen.getByText('Switch Context')).toBeInTheDocument();
      });
    });

    it('should show taxonomy selectors in popover', async () => {
      render(<TaxonomyCompactSelector />);
      
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(screen.getByTestId('taxonomy-selector-organization')).toBeInTheDocument();
        expect(screen.getByTestId('taxonomy-selector-location')).toBeInTheDocument();
      });
    });

    it('should call onContextChange when selection changes', async () => {
      const onContextChange = vi.fn();
      render(<TaxonomyCompactSelector onContextChange={onContextChange} />);
      
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        const orgSelector = screen.getByText('Select Organization');
        fireEvent.click(orgSelector);
      });
      
      expect(onContextChange).toHaveBeenCalledWith({
        organization: mockOrganizations[1],
        location: mockLocations[0]
      });
    });

    it('should call store actions when context changes', async () => {
      const setCurrentOrganization = vi.fn();
      vi.mocked(useTaxonomy).mockReturnValue({
        ...mockUseTaxonomyReturn,
        actions: {
          ...mockUseTaxonomyReturn.actions,
          setCurrentOrganization
        }
      });

      render(<TaxonomyCompactSelector />);
      
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        const orgSelector = screen.getByText('Select Organization');
        fireEvent.click(orgSelector);
      });
      
      expect(setCurrentOrganization).toHaveBeenCalledWith(mockOrganizations[1]);
    });
  });

  describe('loading states', () => {
    it('should show loading state in toggle', () => {
      vi.mocked(useTaxonomy).mockReturnValue({
        ...mockUseTaxonomyReturn,
        isLoading: true
      });

      render(<TaxonomyCompactSelector />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label', () => {
      render(<TaxonomyCompactSelector />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label', 
        'Current taxonomy context: Organization 1 / Location 1. Click to change context.');
    });

    it('should support keyboard navigation', async () => {
      render(<TaxonomyCompactSelector />);
      
      const toggle = screen.getByRole('button');
      toggle.focus();
      expect(toggle).toHaveFocus();
      
      fireEvent.click(toggle);
      await waitFor(() => {
        expect(screen.getByText('Switch Context')).toBeInTheDocument();
      });
    });
  });

  describe('customization', () => {
    it('should apply custom className', () => {
      render(<TaxonomyCompactSelector className="custom-class" />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class');
    });

    it('should hide quick switch when showQuickSwitch is false', async () => {
      render(<TaxonomyCompactSelector showQuickSwitch={false} />);
      
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(screen.queryByText('Manage Preferences')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing context gracefully', () => {
      vi.mocked(useTaxonomy).mockReturnValue({
        ...mockUseTaxonomyReturn,
        context: {
          organization: undefined,
          location: undefined,
          availableOrganizations: [],
          availableLocations: [],
          isLoading: false,
          error: undefined
        }
      });

      render(<TaxonomyCompactSelector />);
      
      expect(screen.getByText('Select Context')).toBeInTheDocument();
    });
  });
});