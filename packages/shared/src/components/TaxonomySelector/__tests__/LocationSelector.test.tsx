import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LocationSelector } from '../LocationSelector';
import { useTaxonomyData } from '../../../hooks/useTaxonomy';

// Mock the useTaxonomyData hook
vi.mock('../../../hooks/useTaxonomy');

const mockLocations = [
  { id: 1, name: 'loc1', title: 'Location 1' },
  { id: 2, name: 'loc2', title: 'Datacenter › Room A' },
];

const defaultMockData = {
  currentOrganization: null,
  currentLocation: null,
  availableOrganizations: [],
  availableLocations: mockLocations,
  setCurrentOrganization: vi.fn(),
  setCurrentLocation: vi.fn(),
  switchContext: vi.fn(),
  getContextPath: vi.fn(() => '/context'),
  isContextSet: false,
  hasOrganizations: false,
  hasLocations: true,
  isLoading: false,
  error: null,
  canViewOrganizations: true,
  canViewLocations: true,
};

describe('LocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaxonomyData).mockReturnValue(defaultMockData);
  });

  describe('Rendering', () => {
    it('should render location selector when user has permissions', () => {
      render(<LocationSelector />);

      expect(screen.getByText('Any location')).toBeInTheDocument();
    });

    it('should not render when user has no location permissions', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        canViewLocations: false,
      });

      const { container } = render(<LocationSelector />);
      expect(container.firstChild).toBeNull();
    });

    it('should show loading state', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        isLoading: true,
      });

      render(<LocationSelector />);
      expect(screen.getByText('Loading locations...')).toBeInTheDocument();
    });

    it('should display current location when selected', () => {
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        currentLocation: mockLocations[0],
      });

      render(<LocationSelector />);
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should open dropdown when clicked', () => {
      render(<LocationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Check that dropdown items are visible (there will be multiple "Any location" texts)
      expect(screen.getAllByText('Any location')).toHaveLength(2); // Button + dropdown item
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    it('should call setCurrentLocation when location is selected', () => {
      const mockSetCurrentLocation = vi.fn();
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        setCurrentLocation: mockSetCurrentLocation,
      });

      render(<LocationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      const locOption = screen.getByText('Location 1');
      fireEvent.click(locOption);

      expect(mockSetCurrentLocation).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('should handle "Any location" selection', () => {
      const mockSetCurrentLocation = vi.fn();
      vi.mocked(useTaxonomyData).mockReturnValue({
        ...defaultMockData,
        setCurrentLocation: mockSetCurrentLocation,
      });

      render(<LocationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      const anyLocOption = screen.getAllByText('Any location')[1]; // First is button text, second is dropdown item
      fireEvent.click(anyLocOption);

      expect(mockSetCurrentLocation).toHaveBeenCalledWith(null);
    });
  });

  describe('Tree View', () => {
    it('should display hierarchical locations with proper indentation', () => {
      render(<LocationSelector />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Check that hierarchical location is displayed (should show only the final segment)
      expect(screen.getByText('Room A')).toBeInTheDocument();
      // The tree connector should be present for nested items
      expect(screen.getByText('└')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render compact variant without labels', () => {
      render(<LocationSelector variant="compact" showLabels={false} />);

      // Should not show "Location:" label in compact mode
      expect(screen.queryByText('Location:')).not.toBeInTheDocument();
    });
  });
});