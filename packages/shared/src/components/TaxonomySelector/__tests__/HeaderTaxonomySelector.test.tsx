import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HeaderTaxonomySelector } from '../HeaderTaxonomySelector';
import { useTaxonomyData } from '../../../hooks/useTaxonomy';

// Mock the useTaxonomyData hook
vi.mock('../../../hooks/useTaxonomy');

const defaultMockData = {
  currentOrganization: null,
  currentLocation: null,
  availableOrganizations: [
    { id: 1, name: 'org1', title: 'Organization 1' },
  ],
  availableLocations: [
    { id: 1, name: 'loc1', title: 'Location 1' },
  ],
  setCurrentOrganization: vi.fn(),
  setCurrentLocation: vi.fn(),
  switchContext: vi.fn(),
  getContextPath: vi.fn(() => '/context'),
  isContextSet: false,
  hasOrganizations: true,
  hasLocations: true,
  isLoading: false,
  error: null,
  canViewOrganizations: true,
  canViewLocations: true,
};

describe('HeaderTaxonomySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaxonomyData).mockReturnValue(defaultMockData);
  });

  describe('Rendering', () => {
    it('should render both organization and location selectors when user has both permissions', () => {
      render(<HeaderTaxonomySelector />);

      expect(screen.getByText('Any organization')).toBeInTheDocument();
      expect(screen.getByText('Any location')).toBeInTheDocument();
    });

    it('should render only organization selector when user has only org permissions', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewLocations: false,
      });

      render(<HeaderTaxonomySelector />);

      expect(screen.getByText('Any organization')).toBeInTheDocument();
      expect(screen.queryByText('Any location')).not.toBeInTheDocument();
    });

    it('should render only location selector when user has only location permissions', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewOrganizations: false,
      });

      render(<HeaderTaxonomySelector />);

      expect(screen.queryByText('Any organization')).not.toBeInTheDocument();
      expect(screen.getByText('Any location')).toBeInTheDocument();
    });

    it('should not render anything when user has no taxonomy permissions', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewOrganizations: false,
        canViewLocations: false,
      });

      const { container } = render(<HeaderTaxonomySelector />);

      // Should render the Flex container but with no visible selectors
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryByText('Any organization')).not.toBeInTheDocument();
      expect(screen.queryByText('Any location')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render in compact mode by default', () => {
      render(<HeaderTaxonomySelector />);

      // In compact mode, labels should not be shown
      expect(screen.queryByText('Organization:')).not.toBeInTheDocument();
      expect(screen.queryByText('Location:')).not.toBeInTheDocument();
    });

    it('should accept custom variant prop', () => {
      render(<HeaderTaxonomySelector variant="default" />);

      // Should still work with default variant
      expect(screen.getByText('Any organization')).toBeInTheDocument();
      expect(screen.getByText('Any location')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should arrange selectors horizontally with proper spacing', () => {
      const { container } = render(<HeaderTaxonomySelector />);

      const flexContainer = container.querySelector('.pf-v5-l-flex');
      expect(flexContainer).toBeInTheDocument();

      // When user has both permissions, should show both selectors
      expect(screen.getByText('Any organization')).toBeInTheDocument();
      expect(screen.getByText('Any location')).toBeInTheDocument();

      // Check that the flex container has the proper PatternFly classes
      expect(flexContainer).toHaveClass('pf-m-space-items-sm');
      expect(flexContainer).toHaveClass('pf-m-align-items-center');

      // Check that both selector buttons are present within the flex container
      const buttons = flexContainer!.querySelectorAll('button[class*="menu-toggle"]');
      expect(buttons).toHaveLength(2); // One for org, one for location
    });
  });
});