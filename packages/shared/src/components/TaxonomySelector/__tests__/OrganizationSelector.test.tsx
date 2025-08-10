import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OrganizationSelector } from '../OrganizationSelector';
import { useTaxonomyData } from '../../../hooks/useTaxonomy';

// Mock the useTaxonomyData hook
vi.mock('../../../hooks/useTaxonomy');

const mockOrganizations = [
  { id: 1, name: 'org1', title: 'Organization 1' },
  { id: 2, name: 'org2', title: 'Parent › Child Organization' },
];

const defaultMockData = {
  currentOrganization: null,
  currentLocation: null,
  availableOrganizations: mockOrganizations,
  availableLocations: [],
  setCurrentOrganization: vi.fn(),
  setCurrentLocation: vi.fn(),
  switchContext: vi.fn(),
  getContextPath: vi.fn(() => '/context'),
  isContextSet: false,
  hasOrganizations: true,
  hasLocations: false,
  isLoading: false,
  error: null,
  canViewOrganizations: true,
  canViewLocations: true,
};

describe('OrganizationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaxonomyData).mockReturnValue(defaultMockData);
  });

  describe('Rendering', () => {
    it('should render organization selector when user has permissions', () => {
      render(<OrganizationSelector />);

      expect(screen.getByText('Any organization')).toBeInTheDocument();
    });

    it('should not render when user has no organization permissions', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewOrganizations: false,
      });

      const { container } = render(<OrganizationSelector />);
      expect(container.firstChild).toBeNull();
    });

    it('should show loading state', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        isLoading: true,
      });

      render(<OrganizationSelector />);
      expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
    });

    it('should display current organization when selected', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        currentOrganization: mockOrganizations[0],
      });

      render(<OrganizationSelector />);
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should open dropdown when clicked', () => {
      render(<OrganizationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Check that dropdown items are visible (there will be multiple "Any organization" texts)
      expect(screen.getAllByText('Any organization')).toHaveLength(2); // Button + dropdown item
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
    });

    it('should call setCurrentOrganization when organization is selected', () => {
      const mockSetCurrentOrganization = vi.fn();
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        setCurrentOrganization: mockSetCurrentOrganization,
      });

      render(<OrganizationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      const orgOption = screen.getByText('Organization 1');
      fireEvent.click(orgOption);

      expect(mockSetCurrentOrganization).toHaveBeenCalledWith(mockOrganizations[0]);
    });

    it('should handle "Any organization" selection', () => {
      const mockSetCurrentOrganization = vi.fn();
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        setCurrentOrganization: mockSetCurrentOrganization,
      });

      render(<OrganizationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      const anyOrgOption = screen.getAllByText('Any organization')[1]; // First is button text, second is dropdown item
      fireEvent.click(anyOrgOption);

      expect(mockSetCurrentOrganization).toHaveBeenCalledWith(null);
    });
  });

  describe('Tree View', () => {
    it('should display hierarchical organizations with proper indentation', () => {
      render(<OrganizationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Check that hierarchical organization is displayed (should show only the final segment)
      expect(screen.getByText('Child Organization')).toBeInTheDocument();
      // The tree connector should be present for nested items
      expect(screen.getByText('└')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render compact variant without labels', () => {
      render(<OrganizationSelector variant="compact" showLabels={false} />);

      // Should not show "Organization:" label in compact mode
      expect(screen.queryByText('Organization:')).not.toBeInTheDocument();
    });
  });
});