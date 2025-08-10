import React from 'react';
import { GlobeIcon } from '@patternfly/react-icons';
import { useTaxonomyData } from '../../hooks/useTaxonomy';
import { TaxonomySelectorBase, TaxonomySelectorConfig } from './TaxonomySelectorBase';
import { Location } from '../../types';

interface LocationSelectorProps {
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  variant = 'default',
  showLabels = true,
  className,
}) => {
  const {
    currentLocation,
    availableLocations,
    setCurrentLocation,
    isLoading,
    canViewLocations,
  } = useTaxonomyData();

  const config: TaxonomySelectorConfig<Location> = {
    currentItem: currentLocation,
    availableItems: availableLocations,
    isLoading,
    canView: canViewLocations,
    setCurrentItem: setCurrentLocation,
    loadingText: 'Loading locations...',
    anyItemText: 'Any location',
    noItemsText: 'No locations available',
    labelText: 'Location:',
    icon: <GlobeIcon />,
  };

  return (
    <TaxonomySelectorBase
      config={config}
      variant={variant}
      showLabels={showLabels}
      className={className}
    />
  );
};