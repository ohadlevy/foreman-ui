import React from 'react';
import {
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { OrganizationSelector } from './OrganizationSelector';
import { LocationSelector } from './LocationSelector';

interface HeaderTaxonomySelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const HeaderTaxonomySelector: React.FC<HeaderTaxonomySelectorProps> = ({
  variant = 'compact',
  className,
}) => {
  return (
    <Flex
      className={className}
      alignItems={{ default: 'alignItemsCenter' }}
      spaceItems={{ default: 'spaceItemsSm' }}
    >
      <FlexItem>
        <OrganizationSelector
          variant={variant}
          showLabels={false}
        />
      </FlexItem>
      <FlexItem>
        <LocationSelector
          variant={variant}
          showLabels={false}
        />
      </FlexItem>
    </Flex>
  );
};