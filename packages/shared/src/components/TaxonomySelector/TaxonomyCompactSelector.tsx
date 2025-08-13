import React, { useState, useRef } from 'react';
import {
  Button,
  MenuToggle,
  Popover,
  PopoverPosition,
  Icon,
  Flex,
  FlexItem,
  Text,
  TextVariants,
  Divider
} from '@patternfly/react-core';
import {
  BuildingIcon,
  MapMarkerAltIcon,
  ExchangeAltIcon,
  CogIcon
} from '@patternfly/react-icons';
import { TaxonomySelector } from './TaxonomySelector';
import { useTaxonomy } from '../../hooks/useTaxonomy';
import type { EnhancedOrganization, EnhancedLocation } from '../../types/taxonomy';

export interface TaxonomyCompactSelectorProps {
  /** Whether to show organization selector */
  showOrganization?: boolean;
  /** Whether to show location selector */
  showLocation?: boolean;
  /** Whether to show the quick switch button */
  showQuickSwitch?: boolean;
  /** Callback when context changes */
  onContextChange?: (context: { organization?: EnhancedOrganization; location?: EnhancedLocation }) => void;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Compact taxonomy selector designed for header toolbar integration
 * Shows current context and provides quick switching in a popover
 */
export const TaxonomyCompactSelector: React.FC<TaxonomyCompactSelectorProps> = ({
  showOrganization = true,
  showLocation = true,
  showQuickSwitch = true,
  onContextChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<React.ElementRef<'button'>>(null);
  
  const {
    context,
    permissions,
    isLoading,
    actions,
    organizations,
    locations
  } = useTaxonomy();

  const currentOrg = context.organization;
  const currentLoc = context.location;

  // Handle context selection changes
  const handleSelectionChange = (selection: { organization?: EnhancedOrganization; location?: EnhancedLocation }) => {
    if (selection.organization && selection.organization.id !== currentOrg?.id) {
      actions.setCurrentOrganization(selection.organization);
    }
    if (selection.location && selection.location.id !== currentLoc?.id) {
      actions.setCurrentLocation(selection.location);
    }
    onContextChange?.(selection);
    setIsOpen(false);
  };

  // Handle popover toggle
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Generate display text for current context
  const getDisplayText = () => {
    const parts: string[] = [];
    
    if (showOrganization && currentOrg) {
      parts.push(currentOrg.title || currentOrg.name);
    }
    
    if (showLocation && currentLoc) {
      parts.push(currentLoc.title || currentLoc.name);
    }
    
    if (parts.length === 0) {
      return 'Select Context';
    }
    
    return parts.join(' / ');
  };

  // Check if user can switch context
  const canSwitchContext = permissions.canSwitchContext;

  // Generate accessible description
  const getAriaLabel = () => {
    const context = getDisplayText();
    return `Current taxonomy context: ${context}. Click to change context.`;
  };

  if (!canSwitchContext) {
    // If user can't switch, show read-only indicator
    return (
      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
        {showOrganization && currentOrg && (
          <>
            <Icon size="sm">
              <BuildingIcon />
            </Icon>
            <Text component={TextVariants.small}>
              {currentOrg.title || currentOrg.name}
            </Text>
          </>
        )}
        {showOrganization && showLocation && currentOrg && currentLoc && (
          <Text component={TextVariants.small}>/</Text>
        )}
        {showLocation && currentLoc && (
          <>
            <Icon size="sm">
              <MapMarkerAltIcon />
            </Icon>
            <Text component={TextVariants.small}>
              {currentLoc.title || currentLoc.name}
            </Text>
          </>
        )}
      </Flex>
    );
  }

  const popoverContent = (
    <div style={{ minWidth: '320px', maxWidth: '400px' }}>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
        {/* Header */}
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <Icon>
              <ExchangeAltIcon />
            </Icon>
            <Text component={TextVariants.h6}>
              Switch Context
            </Text>
          </Flex>
        </FlexItem>
        
        <Divider />
        
        {/* Current Context Display */}
        <FlexItem>
          <Text component={TextVariants.small} style={{ color: 'var(--pf-v5-global--Color--200)' }}>
            Current context
          </Text>
          <Text component={TextVariants.p}>
            {getDisplayText()}
          </Text>
        </FlexItem>
        
        <Divider />
        
        {/* Organization Selector */}
        {showOrganization && permissions.canViewOrganizations && (
          <FlexItem>
            <TaxonomySelector
              type="organization"
              selectedId={currentOrg?.id}
              entities={organizations || []}
              onSelectionChange={(orgId) => {
                if (orgId) {
                  const org = organizations?.find(o => o.id === orgId);
                  if (org) {
                    handleSelectionChange({ organization: org, location: currentLoc });
                  }
                }
              }}
              placeholder="Select Organization"
              showCounts={true}
              allowClear={false}
            />
          </FlexItem>
        )}
        
        {/* Location Selector */}
        {showLocation && permissions.canViewLocations && (
          <FlexItem>
            <TaxonomySelector
              type="location"
              selectedId={currentLoc?.id}
              entities={locations || []}
              onSelectionChange={(locId) => {
                if (locId) {
                  const loc = locations?.find(l => l.id === locId);
                  if (loc) {
                    handleSelectionChange({ organization: currentOrg, location: loc });
                  }
                }
              }}
              placeholder="Select Location"
              showCounts={true}
              allowClear={false}
            />
          </FlexItem>
        )}
        
        {/* Quick Switch Options */}
        {showQuickSwitch && (
          <>
            <Divider />
            <FlexItem>
              <Button
                variant="link"
                size="sm"
                icon={<CogIcon />}
                onClick={() => {
                  // Navigate to settings or open preferences
                  setIsOpen(false);
                  // TODO: Implement navigation to taxonomy preferences
                }}
              >
                Manage Preferences
              </Button>
            </FlexItem>
          </>
        )}
      </Flex>
    </div>
  );

  return (
    <Popover
      aria-label="Taxonomy context selector"
      position={PopoverPosition.bottom}
      bodyContent={popoverContent}
      isVisible={isOpen}
      onHidden={() => setIsOpen(false)}
      hasAutoWidth
      withFocusTrap
      triggerRef={toggleRef}
    >
      <MenuToggle
        ref={toggleRef}
        onClick={handleToggle}
        isExpanded={isOpen}
        isDisabled={isLoading}
        className={className}
        aria-label={getAriaLabel()}
        variant="plainText"
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
          {/* Organization indicator */}
          {showOrganization && (
            <Icon size="sm" style={{ color: currentOrg ? 'var(--pf-v5-global--success-color--100)' : 'var(--pf-v5-global--Color--200)' }}>
              <BuildingIcon />
            </Icon>
          )}
          
          {/* Location indicator */}
          {showLocation && (
            <Icon size="sm" style={{ color: currentLoc ? 'var(--pf-v5-global--success-color--100)' : 'var(--pf-v5-global--Color--200)' }}>
              <MapMarkerAltIcon />
            </Icon>
          )}
          
          {/* Context text */}
          <Text 
            component={TextVariants.small}
            style={{ 
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {getDisplayText()}
          </Text>
        </Flex>
      </MenuToggle>
    </Popover>
  );
};