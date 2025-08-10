import React, { useState } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Divider,
  Icon,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  BuildingIcon,
  GlobeIcon,
  CaretDownIcon,
} from '@patternfly/react-icons';
import { useTaxonomyData } from '../../hooks/useTaxonomy';
import { Organization, Location } from '../../types';

interface TaxonomySelectorProps {
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export const TaxonomySelector: React.FC<TaxonomySelectorProps> = ({
  variant = 'default',
  showLabels = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentOrganization,
    currentLocation,
    availableOrganizations,
    availableLocations,
    setCurrentOrganization,
    setCurrentLocation,
    getContextPath,
    isContextSet,
    isLoading,
    canViewOrganizations,
    canViewLocations,
  } = useTaxonomyData();

  // Don't render if user has no permissions
  if (!canViewOrganizations && !canViewLocations) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <MenuToggle isDisabled>
          Loading context...
        </MenuToggle>
      </div>
    );
  }

  const handleOrganizationSelect = (org: Organization | null) => {
    setCurrentOrganization(org);
    setIsOpen(false);
  };

  const handleLocationSelect = (loc: Location | null) => {
    setCurrentLocation(loc);
    setIsOpen(false);
  };

  const contextText = isContextSet ? getContextPath() : 'All Context';
  const isCompact = variant === 'compact';

  const dropdownItems = (
    <DropdownList>
      {/* Organizations Section */}
      {canViewOrganizations && availableOrganizations.length > 0 && (
        <>
          <DropdownItem
            key="org-header"
            isDisabled
            description="Select an organization context"
          >
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Icon>
                  <BuildingIcon />
                </Icon>
              </FlexItem>
              <FlexItem>
                <strong>Organizations</strong>
              </FlexItem>
            </Flex>
          </DropdownItem>
          <DropdownItem
            key="org-all"
            onClick={() => handleOrganizationSelect(null)}
            isSelected={!currentOrganization}
          >
            All Organizations
          </DropdownItem>
          {availableOrganizations.map((org) => (
            <DropdownItem
              key={`org-${org.id}`}
              onClick={() => handleOrganizationSelect(org)}
              isSelected={currentOrganization?.id === org.id}
              description={org.description}
            >
              {org.title || org.name}
            </DropdownItem>
          ))}
        </>
      )}

      {/* Divider between organizations and locations */}
      {canViewOrganizations && canViewLocations &&
       availableOrganizations.length > 0 && availableLocations.length > 0 && (
        <Divider key="divider" />
      )}

      {/* Locations Section */}
      {canViewLocations && availableLocations.length > 0 && (
        <>
          <DropdownItem
            key="loc-header"
            isDisabled
            description="Select a location context"
          >
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Icon>
                  <GlobeIcon />
                </Icon>
              </FlexItem>
              <FlexItem>
                <strong>Locations</strong>
              </FlexItem>
            </Flex>
          </DropdownItem>
          <DropdownItem
            key="loc-all"
            onClick={() => handleLocationSelect(null)}
            isSelected={!currentLocation}
          >
            All Locations
          </DropdownItem>
          {availableLocations.map((loc) => (
            <DropdownItem
              key={`loc-${loc.id}`}
              onClick={() => handleLocationSelect(loc)}
              isSelected={currentLocation?.id === loc.id}
              description={loc.description}
            >
              {loc.title || loc.name}
            </DropdownItem>
          ))}
        </>
      )}

      {/* No available contexts */}
      {availableOrganizations.length === 0 && availableLocations.length === 0 && (
        <DropdownItem key="no-context" isDisabled>
          No contexts available
        </DropdownItem>
      )}
    </DropdownList>
  );

  return (
    <div className={className}>
      <Dropdown
        isOpen={isOpen}
        onSelect={() => setIsOpen(false)}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            icon={<CaretDownIcon />}
            variant={isCompact ? 'plain' : 'default'}
          >
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              spaceItems={{ default: 'spaceItemsSm' }}
            >
              {!isCompact && (
                <FlexItem>
                  <Icon>
                    {currentOrganization ? <BuildingIcon /> : <GlobeIcon />}
                  </Icon>
                </FlexItem>
              )}
              <FlexItem>
                {showLabels && !isCompact && (
                  <span style={{ marginRight: '0.5rem', fontWeight: 'normal' }}>
                    Context:
                  </span>
                )}
                <span>{contextText}</span>
              </FlexItem>
            </Flex>
          </MenuToggle>
        )}
      >
        {dropdownItems}
      </Dropdown>
    </div>
  );
};