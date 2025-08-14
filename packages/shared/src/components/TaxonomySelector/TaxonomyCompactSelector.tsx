import React, { useState, useRef } from 'react';
import {
  MenuToggle,
  Popover,
  PopoverPosition,
  Icon,
  Flex,
  FlexItem,
  Content,
  ContentVariants,
  Divider,
  Spinner,
  Alert,
  Tooltip
} from '@patternfly/react-core';
import {
  BuildingIcon,
  MapMarkerAltIcon,
  InfoCircleIcon
} from '@patternfly/react-icons';
import { TaxonomyTree } from './TaxonomyTree';
import { useGlobalState } from '../../hooks/useGlobalState';
import { useTaxonomyStore } from '../../stores/taxonomyStore';
import type { EnhancedOrganization, EnhancedLocation } from '../../types/taxonomy';
import './TaxonomyResponsive.css';

export interface TaxonomyCompactSelectorProps {
  /** Whether to show organization selector */
  showOrganization?: boolean;
  /** Whether to show location selector */
  showLocation?: boolean;
  /** Whether to show the quick switch button */
  _showQuickSwitch?: boolean;
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
  onContextChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<React.ElementRef<'button'>>(null);
  
  // Get global state data (already fetched by AuthProvider)
  const globalState = useGlobalState();
  
  // Get taxonomy store state and actions directly
  const {
    context,
    permissions,
    setCurrentOrganization,
    setCurrentLocation
  } = useTaxonomyStore();
  
  // Use global state data directly to prevent redundant calls
  const taxonomyData = {
    organizations: globalState.organizations || [],
    locations: globalState.locations || [],
    isLoading: globalState.isLoading,
    error: globalState.isError ? 'Failed to load data' : null,
    isError: globalState.isError
  };

  const currentOrg = context.organization;
  const currentLoc = context.location;

  // Handle context selection changes
  const handleSelectionChange = (selection: { organization?: EnhancedOrganization; location?: EnhancedLocation }) => {
    // Handle organization changes (including unsetting to undefined)
    if ('organization' in selection && selection.organization?.id !== currentOrg?.id) {
      setCurrentOrganization(selection.organization);
    }
    // Handle location changes (including unsetting to undefined)  
    if ('location' in selection && selection.location?.id !== currentLoc?.id) {
      setCurrentLocation(selection.location);
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
    
    if (showOrganization) {
      parts.push(currentOrg ? (currentOrg.title || currentOrg.name) : 'All Organizations');
    }
    
    if (showLocation) {
      parts.push(currentLoc ? (currentLoc.title || currentLoc.name) : 'All Locations');
    }
    
    if (parts.length === 0) {
      return 'Select Context';
    }
    
    // Use different separator for org/location context vs hierarchy within entities
    return parts.join(' • ');
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
        {showOrganization && (
          <>
            <Icon size="sm">
              <BuildingIcon />
            </Icon>
            <Content component={ContentVariants.small}>
              {currentOrg ? (currentOrg.title || currentOrg.name) : 'All Organizations'}
            </Content>
          </>
        )}
        {showOrganization && showLocation && (
          <Content component={ContentVariants.small}> • </Content>
        )}
        {showLocation && (
          <>
            <Icon size="sm">
              <MapMarkerAltIcon />
            </Icon>
            <Content component={ContentVariants.small}>
              {currentLoc ? (currentLoc.title || currentLoc.name) : 'All Locations'}
            </Content>
          </>
        )}
      </Flex>
    );
  }

  const popoverContent = (
    <div style={{ minWidth: '320px', maxWidth: '400px' }}>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
        {/* Current Context Display */}
        <FlexItem>
          <Content component={ContentVariants.small} style={{ color: 'var(--pf-v6-global--Color--200)' }}>
            Current context
          </Content>
          <Content component={ContentVariants.p} style={{ fontWeight: 'bold' }}>
            {getDisplayText()}
          </Content>
        </FlexItem>
        
        <Divider />
        
        {/* Error State */}
        {(taxonomyData.error || taxonomyData.isError) && (
          <FlexItem>
            <Alert variant="danger" isInline title="Error loading taxonomy data">
              {taxonomyData.error || 'Failed to load data'}
            </Alert>
          </FlexItem>
        )}
        
        {/* Loading State */}
        {taxonomyData.isLoading && !taxonomyData.error && !taxonomyData.isError && (
          <FlexItem style={{ textAlign: 'center', padding: '16px' }}>
            <Spinner size="md" />
            <Content component={ContentVariants.small} style={{ marginTop: '8px' }}>
              Loading taxonomy data...
            </Content>
          </FlexItem>
        )}
        
        {/* Organization Tree Selector */}
        {!taxonomyData.isLoading && !taxonomyData.error && !taxonomyData.isError && showOrganization && permissions.canViewOrganizations && (
          <FlexItem>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
              <Content component={ContentVariants.h6} style={{ fontWeight: 'bold' }}>
                Organization
              </Content>
              
              {/* All Organizations Option */}
              <div 
                style={{ 
                  padding: '8px 16px', 
                  cursor: 'pointer',
                  backgroundColor: !currentOrg ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                  color: !currentOrg ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--link-color)',
                  borderRadius: '4px',
                  fontWeight: !currentOrg ? 'bold' : 'normal',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => handleSelectionChange({ organization: undefined, location: currentLoc })}
              >
                <Icon size="sm">
                  <BuildingIcon />
                </Icon>
                All Organizations
              </div>
              
              <TaxonomyTree
                type="organization"
                entities={taxonomyData.organizations}
                selectedIds={currentOrg ? [currentOrg.id] : []}
                onSelectionChange={(orgIds) => {
                  if (orgIds.length > 0) {
                    const org = taxonomyData.organizations.find(o => o.id === orgIds[0]);
                    if (org) {
                      handleSelectionChange({ organization: org, location: currentLoc });
                    }
                  } else {
                    // Handle deselection - unset organization context
                    handleSelectionChange({ organization: undefined, location: currentLoc });
                  }
                }}
                allowMultiSelect={false}
                showCounts={false}
                hasSearch={false}
                hasExpandControls={false}
                asCard={false}
                maxHeight="120px"
                defaultExpanded={true}
              />
            </Flex>
          </FlexItem>
        )}
        
        {/* Location Tree Selector */}
        {!taxonomyData.isLoading && !taxonomyData.error && !taxonomyData.isError && showLocation && permissions.canViewLocations && (
          <FlexItem>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
              <Content component={ContentVariants.h6} style={{ fontWeight: 'bold' }}>
                Location
              </Content>
              
              {/* All Locations Option */}
              <div 
                style={{ 
                  padding: '8px 16px', 
                  cursor: 'pointer',
                  backgroundColor: !currentLoc ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                  color: !currentLoc ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--link-color)',
                  borderRadius: '4px',
                  fontWeight: !currentLoc ? 'bold' : 'normal',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => handleSelectionChange({ organization: currentOrg, location: undefined })}
              >
                <Icon size="sm">
                  <MapMarkerAltIcon />
                </Icon>
                All Locations
              </div>
              
              <TaxonomyTree
                type="location"
                entities={taxonomyData.locations}
                selectedIds={currentLoc ? [currentLoc.id] : []}
                onSelectionChange={(locIds) => {
                  if (locIds.length > 0) {
                    const loc = taxonomyData.locations.find(l => l.id === locIds[0]);
                    if (loc) {
                      handleSelectionChange({ organization: currentOrg, location: loc });
                    }
                  } else {
                    // Handle deselection - unset location context
                    handleSelectionChange({ organization: currentOrg, location: undefined });
                  }
                }}
                allowMultiSelect={false}
                showCounts={false}
                hasSearch={false}
                hasExpandControls={false}
                asCard={false}
                maxHeight="120px"
                defaultExpanded={true}
              />
            </Flex>
          </FlexItem>
        )}
        
      </Flex>
    </div>
  );

  return (
    <Popover
      aria-label="Taxonomy context selector"
      position={PopoverPosition.bottomStart}
      bodyContent={popoverContent}
      isVisible={isOpen}
      onHidden={() => setIsOpen(false)}
      hasAutoWidth={false}
      withFocusTrap
      triggerRef={toggleRef}
      flipBehavior={['bottom-start', 'bottom', 'top-start', 'top']}
    >
      <MenuToggle
        ref={toggleRef}
        onClick={handleToggle}
        isExpanded={isOpen}
        isDisabled={taxonomyData.isLoading || taxonomyData.error !== null || taxonomyData.isError}
        className={['foreman-taxonomy-selector', className].filter(Boolean).join(' ')}
        aria-label={getAriaLabel()}
        variant="secondary"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pf-v6-global--spacer--xs)' }}>
          {/* Loading indicator */}
          {taxonomyData.isLoading && (
            <Spinner size="sm" />
          )}
          
          {/* Error indicator */}
          {(taxonomyData.error || taxonomyData.isError) && (
            <Icon size="sm" style={{ color: 'var(--pf-v6-global--danger-color--100)' }}>
              <InfoCircleIcon />
            </Icon>
          )}
          
          {/* Organization indicator */}
          {!taxonomyData.isLoading && !taxonomyData.error && !taxonomyData.isError && showOrganization && (
            <Icon size="sm" style={{ color: currentOrg ? 'var(--pf-v6-global--success-color--100)' : 'var(--pf-v6-global--Color--200)' }}>
              <BuildingIcon />
            </Icon>
          )}
          
          {/* Location indicator */}
          {!taxonomyData.isLoading && !taxonomyData.error && !taxonomyData.isError && showLocation && (
            <Icon size="sm" style={{ color: currentLoc ? 'var(--pf-v6-global--success-color--100)' : 'var(--pf-v6-global--Color--200)' }}>
              <MapMarkerAltIcon />
            </Icon>
          )}
          
          {/* Context text with tooltip for truncated content */}
          <Tooltip
            content={(taxonomyData.error || taxonomyData.isError) ? 'Error loading data' : (taxonomyData.isLoading ? 'Loading...' : getDisplayText())}
            isVisible={!taxonomyData.isLoading && !taxonomyData.error && !taxonomyData.isError && getDisplayText().length > 20 ? undefined : false}
          >
            <Content 
              component={ContentVariants.small}
              className="foreman-taxonomy-selector-text"
              style={{
                maxWidth: '280px',
                minWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: (taxonomyData.error || taxonomyData.isError) ? 'var(--pf-v6-global--danger-color--100)' : undefined
              }}
            >
              {(taxonomyData.error || taxonomyData.isError) ? 'Error loading data' : (taxonomyData.isLoading ? 'Loading...' : getDisplayText())}
            </Content>
          </Tooltip>
        </div>
      </MenuToggle>
    </Popover>
  );
};