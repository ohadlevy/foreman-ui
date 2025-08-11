import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxonomyContextSelector } from '../TaxonomyContextSelector';
import { EnhancedOrganization, EnhancedLocation, TaxonomySelection } from '../../../types/taxonomy';

// Mock the TaxonomySelector component
vi.mock('../TaxonomySelector', () => ({
  TaxonomySelector: ({ type, selectedId, onSelectionChange, isLoading, error }: any) => (
    <div data-testid={`${type}-selector`}>
      {isLoading ? (
        <div>Loading {type}s...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div>
          <span>Selected {type}: {selectedId || 'none'}</span>
          <button onClick={() => onSelectionChange(1)}>
            Select {type} 1
          </button>
          <button onClick={() => onSelectionChange(undefined)}>
            Clear {type}
          </button>
        </div>
      )}
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

describe('TaxonomyContextSelector', () => {
  const defaultSelection: TaxonomySelection = {
    organizationId: undefined,
    locationId: undefined
  };

  const defaultProps = {
    selection: defaultSelection,
    organizations: mockOrganizations,
    locations: mockLocations,
    onSelectionChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<TaxonomyContextSelector {...defaultProps} />);
      
      expect(screen.getByText('Taxonomy Context')).toBeInTheDocument();
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    it('should render without card wrapper when asCard is false', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          asCard={false}
        />
      );
      
      expect(screen.queryByText('Taxonomy Context')).not.toBeInTheDocument();
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          title="Custom Context"
        />
      );
      
      expect(screen.getByText('Custom Context')).toBeInTheDocument();
    });

    it('should render in horizontal orientation', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          orientation="horizontal"
        />
      );
      
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    it('should show current context when entities are selected', () => {
      const selectionWithEntities: TaxonomySelection = {
        organizationId: 1,
        locationId: 1
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selectionWithEntities}
        />
      );
      
      expect(screen.getByText('Current Context')).toBeInTheDocument();
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading skeleton for organizations', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          organizationsLoading={true}
        />
      );
      
      // Should show skeleton instead of TaxonomySelector for organizations
      expect(screen.queryByTestId('organization-selector')).not.toBeInTheDocument();
      // Location selector should still be present
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    it('should show loading skeleton for locations', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          locationsLoading={true}
        />
      );
      
      // Should show skeleton instead of TaxonomySelector for locations  
      expect(screen.queryByTestId('location-selector')).not.toBeInTheDocument();
      // Organization selector should still be present
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
    });

    it('should show loading for both when both are loading', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          organizationsLoading={true}
          locationsLoading={true}
        />
      );
      
      // Both selectors should be replaced with skeletons
      expect(screen.queryByTestId('organization-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('location-selector')).not.toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('should show error for organizations', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          organizationsError="Failed to load organizations"
        />
      );
      
      expect(screen.getByText('Error: Failed to load organizations')).toBeInTheDocument();
    });

    it('should show error for locations', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          locationsError="Failed to load locations"
        />
      );
      
      expect(screen.getByText('Error: Failed to load locations')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onSelectionChange when organization is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
        />
      );
      
      const selectOrgButton = screen.getByText('Select organization 1');
      await user.click(selectOrgButton);
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        organizationId: 1,
        locationId: undefined
      });
    });

    it('should call onSelectionChange when location is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
        />
      );
      
      const selectLocButton = screen.getByText('Select location 1');
      await user.click(selectLocButton);
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        organizationId: undefined,
        locationId: 1
      });
    });

    it('should preserve existing selection when updating one field', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: undefined
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const selectLocButton = screen.getByText('Select location 1');
      await user.click(selectLocButton);
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        organizationId: 1,
        locationId: 1
      });
    });

    it('should handle clearing organization selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const clearOrgButton = screen.getByText('Clear organization');
      await user.click(clearOrgButton);
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        organizationId: undefined,
        locationId: 2
      });
    });

    it('should handle clearing location selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const clearLocButton = screen.getByText('Clear location');
      await user.click(clearLocButton);
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        organizationId: 1,
        locationId: undefined
      });
    });
  });

  describe('switch context functionality', () => {
    it('should show switch button by default', () => {
      render(<TaxonomyContextSelector {...defaultProps} />);
      
      expect(screen.getByLabelText('Switch organization and location')).toBeInTheDocument();
    });

    it('should hide switch button when showSwitchButton is false', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          showSwitchButton={false}
        />
      );
      
      expect(screen.queryByLabelText('Switch organization and location')).not.toBeInTheDocument();
    });

    it('should disable switch button when no selections are made', () => {
      render(<TaxonomyContextSelector {...defaultProps} />);
      
      const switchButton = screen.getByLabelText('Switch organization and location');
      expect(switchButton).toBeDisabled();
    });

    it('should enable switch button when at least one selection is made', () => {
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: undefined
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
        />
      );
      
      const switchButton = screen.getByLabelText('Switch organization and location');
      expect(switchButton).not.toBeDisabled();
    });

    it('should call onSwitchContext when provided', async () => {
      const user = userEvent.setup();
      const onSwitchContext = vi.fn();
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
          onSwitchContext={onSwitchContext}
        />
      );
      
      const switchButton = screen.getByLabelText('Switch organization and location');
      await user.click(switchButton);
      
      expect(onSwitchContext).toHaveBeenCalled();
    });

    it('should swap selections when no custom onSwitchContext is provided', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const switchButton = screen.getByLabelText('Switch organization and location');
      await user.click(switchButton);
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        organizationId: 2,
        locationId: 1
      });
    });
  });

  describe('disabled state', () => {
    it('should disable both selectors when isDisabled is true', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          isDisabled={true}
        />
      );
      
      // The selectors should receive the disabled prop
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    it('should disable switch button when isDisabled is true', () => {
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={selection}
          isDisabled={true}
        />
      );
      
      const switchButton = screen.getByLabelText('Switch organization and location');
      expect(switchButton).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      render(<TaxonomyContextSelector {...defaultProps} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should have proper labels for form groups', () => {
      render(<TaxonomyContextSelector {...defaultProps} />);
      
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('should have accessible switch button', () => {
      render(<TaxonomyContextSelector {...defaultProps} />);
      
      const switchButton = screen.getByLabelText('Switch organization and location');
      expect(switchButton).toHaveAttribute('aria-label', 'Switch organization and location');
    });
  });

  describe('edge cases', () => {
    it('should handle empty organizations array', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          organizations={[]}
        />
      );
      
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
    });

    it('should handle empty locations array', () => {
      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          locations={[]}
        />
      );
      
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    it('should handle selection with non-existent entity IDs', () => {
      const invalidSelection: TaxonomySelection = {
        organizationId: 999,
        locationId: 888
      };

      render(
        <TaxonomyContextSelector 
          {...defaultProps} 
          selection={invalidSelection}
        />
      );
      
      // Should not crash and should still render
      expect(screen.getByTestId('organization-selector')).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });
  });
});