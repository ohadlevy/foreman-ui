import React from 'react';
import { BuildingIcon } from '@patternfly/react-icons';
import { useTaxonomyData } from '../../hooks/useTaxonomy';
import { TaxonomySelectorBase, TaxonomySelectorConfig } from './TaxonomySelectorBase';
import { Organization } from '../../types';

interface OrganizationSelectorProps {
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  variant = 'default',
  showLabels = true,
  className,
}) => {
  const {
    currentOrganization,
    availableOrganizations,
    setCurrentOrganization,
    isLoading,
    canViewOrganizations,
  } = useTaxonomyData();

  const config: TaxonomySelectorConfig<Organization> = {
    currentItem: currentOrganization,
    availableItems: availableOrganizations,
    isLoading,
    canView: canViewOrganizations,
    setCurrentItem: setCurrentOrganization,
    loadingText: 'Loading organizations...',
    anyItemText: 'Any organization',
    noItemsText: 'No organizations available',
    labelText: 'Organization:',
    icon: <BuildingIcon />,
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