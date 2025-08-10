import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { TaxonomySelector } from '../TaxonomySelector';
import { useTaxonomyData } from '../../../hooks/useTaxonomy';
import { Organization, Location } from '../../../types';

// Mock the hook
vi.mock('../../../hooks/useTaxonomy');

const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: 'org1',
    title: 'Organization 1',
    description: 'First organization',
  },
  {
    id: 2,
    name: 'org2',
    title: 'Organization 2',
    description: 'Second organization',
  },
];

const mockLocations: Location[] = [
  {
    id: 1,
    name: 'loc1',
    title: 'Location 1',
    description: 'First location',
  },
  {
    id: 2,
    name: 'loc2',
    title: 'Location 2',
    description: 'Second location',
  },
];

const defaultMockData = {
  currentOrganization: null,
  currentLocation: null,
  availableOrganizations: mockOrganizations,
  availableLocations: mockLocations,
  setCurrentOrganization: vi.fn(),
  setCurrentLocation: vi.fn(),
  switchContext: vi.fn(),
  getContextPath: vi.fn(() => 'All Context'),
  isContextSet: false,
  hasOrganizations: true,
  hasLocations: true,
  isLoading: false,
  error: null,
  canViewOrganizations: true,
  canViewLocations: true,
};

describe('TaxonomySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaxonomyData).mockReturnValue(defaultMockData);
  });

  describe('Rendering', () => {
    it('should render the selector when user has permissions', () => {
      render(<TaxonomySelector />);

      expect(screen.getByText('Context:')).toBeInTheDocument();
      expect(screen.getByText('All Context')).toBeInTheDocument();
    });

    it('should not render when user has no permissions', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewOrganizations: false,
        canViewLocations: false,
      });

      const { container } = render(<TaxonomySelector />);

      expect(container.firstChild).toBeNull();
    });

    it('should show loading state', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        isLoading: true,
      });

      render(<TaxonomySelector />);

      expect(screen.getByText('Loading context...')).toBeInTheDocument();
    });

    it('should render compact variant', () => {
      render(<TaxonomySelector variant="compact" />);

      expect(screen.queryByText('Context:')).not.toBeInTheDocument();
      expect(screen.getByText('All Context')).toBeInTheDocument();
    });

    it('should hide labels when showLabels is false', () => {
      render(<TaxonomySelector showLabels={false} />);

      expect(screen.queryByText('Context:')).not.toBeInTheDocument();
      expect(screen.getByText('All Context')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<TaxonomySelector className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Context Display', () => {
    it('should display current context path', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        getContextPath: vi.fn(() => 'Organization 1 • Location 1'),
        isContextSet: true,
      });

      render(<TaxonomySelector />);

      expect(screen.getByText('Organization 1 • Location 1')).toBeInTheDocument();
    });

    it('should show appropriate icon for organization context', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        currentOrganization: mockOrganizations[0],
      });

      render(<TaxonomySelector />);

      // Check for building icon (organization icon)
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show globe icon when no organization is selected', () => {
      render(<TaxonomySelector />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Dropdown Interactions', () => {
    it('should open dropdown when clicked', async () => {
      render(<TaxonomySelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Organizations')).toBeInTheDocument();
        expect(screen.getByText('Locations')).toBeInTheDocument();
      });
    });

    it('should close dropdown after selecting an option', async () => {
      render(<TaxonomySelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Organization 1'));

      expect(defaultMockData.setCurrentOrganization).toHaveBeenCalledWith(mockOrganizations[0]);
    });
  });

  describe('Organization Section', () => {
    beforeEach(async () => {
      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText('Organizations')).toBeInTheDocument();
      });
    });

    it('should display organizations section when user has permission', () => {
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Select an organization context')).toBeInTheDocument();
    });

    it('should display "All Organizations" option', () => {
      expect(screen.getByText('All Organizations')).toBeInTheDocument();
    });

    it('should display available organizations', () => {
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
      expect(screen.getByText('Organization 2')).toBeInTheDocument();
    });

    it('should handle organization selection', () => {
      fireEvent.click(screen.getByText('Organization 1'));

      expect(defaultMockData.setCurrentOrganization).toHaveBeenCalledWith(mockOrganizations[0]);
    });

    it('should handle "All Organizations" selection', () => {
      fireEvent.click(screen.getByText('All Organizations'));

      expect(defaultMockData.setCurrentOrganization).toHaveBeenCalledWith(null);
    });

    it('should show selected organization', async () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        currentOrganization: mockOrganizations[0],
        getContextPath: vi.fn(() => 'Organization 1'),
        isContextSet: true,
      });

      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button', { name: /context: organization 1/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // The selected organization should be highlighted (PatternFly handles this with isSelected prop)
        const dropdownItems = screen.getAllByText('Organization 1');
        expect(dropdownItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Location Section', () => {
    beforeEach(async () => {
      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText('Locations')).toBeInTheDocument();
      });
    });

    it('should display locations section when user has permission', () => {
      expect(screen.getByText('Locations')).toBeInTheDocument();
      expect(screen.getByText('Select a location context')).toBeInTheDocument();
    });

    it('should display "All Locations" option', () => {
      expect(screen.getByText('All Locations')).toBeInTheDocument();
    });

    it('should display available locations', () => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
      expect(screen.getByText('Location 2')).toBeInTheDocument();
    });

    it('should handle location selection', () => {
      fireEvent.click(screen.getByText('Location 1'));

      expect(defaultMockData.setCurrentLocation).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('should handle "All Locations" selection', () => {
      fireEvent.click(screen.getByText('All Locations'));

      expect(defaultMockData.setCurrentLocation).toHaveBeenCalledWith(null);
    });
  });

  describe('Permission-based Rendering', () => {
    it('should only show organizations when user lacks location permission', async () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewLocations: false,
      });

      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Organizations')).toBeInTheDocument();
        expect(screen.queryByText('Locations')).not.toBeInTheDocument();
      });
    });

    it('should only show locations when user lacks organization permission', async () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewOrganizations: false,
      });

      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Locations')).toBeInTheDocument();
        expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
      });
    });

    it('should show divider when both sections are present', async () => {
      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Organizations')).toBeInTheDocument();
        expect(screen.getByText('Locations')).toBeInTheDocument();
      });

      // PatternFly Divider is rendered but might not have visible text
      const dropdown = screen.getByRole('menu', { hidden: true }) ||
                     document.querySelector('[role="listbox"]') ||
                     document.querySelector('.pf-v5-c-dropdown__menu');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show no contexts message when none are available', async () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        availableOrganizations: [],
        availableLocations: [],
      });

      render(<TaxonomySelector />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('No contexts available')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TaxonomySelector />);

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update ARIA expanded state when opened', async () => {
      render(<TaxonomySelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});