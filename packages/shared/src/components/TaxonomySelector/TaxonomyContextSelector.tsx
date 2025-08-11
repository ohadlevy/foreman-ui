import React, { useCallback } from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Grid,
  GridItem,
  Form,
  FormGroup,
  Button,
  Flex,
  FlexItem,
  Alert,
  Skeleton
} from '@patternfly/react-core';
import { SyncAltIcon, BuildingIcon, MapMarkerAltIcon } from '@patternfly/react-icons';
import { TaxonomySelector } from './TaxonomySelector';
import { EnhancedOrganization, EnhancedLocation, TaxonomySelection } from '../../types/taxonomy';

export interface TaxonomyContextSelectorProps {
  /** Current taxonomy selection */
  selection: TaxonomySelection;
  /** Available organizations */
  organizations: EnhancedOrganization[];
  /** Available locations */
  locations: EnhancedLocation[];
  /** Whether organizations are loading */
  organizationsLoading?: boolean;
  /** Whether locations are loading */
  locationsLoading?: boolean;
  /** Organization loading error */
  organizationsError?: string;
  /** Location loading error */
  locationsError?: string;
  /** Callback when selection changes */
  onSelectionChange: (selection: TaxonomySelection) => void;
  /** Whether to show the switch button */
  showSwitchButton?: boolean;
  /** Whether to show entity counts */
  showCounts?: boolean;
  /** Whether to allow clearing selections */
  allowClear?: boolean;
  /** Custom title for the card */
  title?: string;
  /** Whether to render as a card */
  asCard?: boolean;
  /** Whether selectors are disabled */
  isDisabled?: boolean;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Callback when switch context is triggered */
  onSwitchContext?: () => void;
}

/**
 * TaxonomyContextSelector component for managing organization and location context
 * 
 * Features:
 * - Dual selectors for organization and location
 * - Context switching functionality
 * - Loading and error states for both taxonomies
 * - Flexible layout options (horizontal/vertical)
 * - Optional card wrapper
 * - Accessible design with proper labeling
 * - Integration with taxonomy stores and APIs
 */
export const TaxonomyContextSelector: React.FC<TaxonomyContextSelectorProps> = ({
  selection,
  organizations,
  locations,
  organizationsLoading = false,
  locationsLoading = false,
  organizationsError,
  locationsError,
  onSelectionChange,
  showSwitchButton = true,
  showCounts = true,
  allowClear = true,
  title = 'Taxonomy Context',
  asCard = true,
  isDisabled = false,
  orientation = 'vertical',
  onSwitchContext
}) => {
  // Handle organization selection change
  const handleOrganizationChange = useCallback((organizationId: number | undefined) => {
    onSelectionChange({
      ...selection,
      organizationId
    });
  }, [selection, onSelectionChange]);

  // Handle location selection change
  const handleLocationChange = useCallback((locationId: number | undefined) => {
    onSelectionChange({
      ...selection,
      locationId
    });
  }, [selection, onSelectionChange]);

  // Handle context switch
  const handleSwitchContext = useCallback(() => {
    if (onSwitchContext) {
      onSwitchContext();
    } else {
      // Default behavior: swap organization and location
      onSelectionChange({
        organizationId: selection.locationId,
        locationId: selection.organizationId
      });
    }
  }, [selection, onSelectionChange, onSwitchContext]);

  // Get selected entities for display
  const selectedOrganization = selection.organizationId 
    ? organizations.find(org => org.id === selection.organizationId)
    : undefined;
  
  const selectedLocation = selection.locationId 
    ? locations.find(loc => loc.id === selection.locationId)
    : undefined;

  // Render loading skeleton
  const renderSkeleton = () => (
    <Skeleton width="300px" height="36px" />
  );

  // Render selector form content
  const renderContent = () => (
    <>
      {/* Current context display */}
      {(selectedOrganization || selectedLocation) && (
        <Alert
          variant="info"
          isInline
          title="Current Context"
          style={{ marginBottom: '16px' }}
        >
          <div>
            {selectedOrganization && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BuildingIcon />
                <strong>Organization:</strong> {selectedOrganization.title || selectedOrganization.name}
              </div>
            )}
            {selectedLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapMarkerAltIcon />
                <strong>Location:</strong> {selectedLocation.title || selectedLocation.name}
              </div>
            )}
          </div>
        </Alert>
      )}

      <Form aria-label="Taxonomy context selection form">
        {orientation === 'horizontal' ? (
          <Grid hasGutter>
            <GridItem span={showSwitchButton ? 5 : 6}>
              <FormGroup
                label="Organization"
                fieldId="organization-selector"
                labelIcon={<BuildingIcon />}
              >
                {organizationsLoading ? (
                  renderSkeleton()
                ) : (
                  <TaxonomySelector
                    type="organization"
                    selectedId={selection.organizationId}
                    entities={organizations}
                    error={organizationsError}
                    onSelectionChange={handleOrganizationChange}
                    showCounts={showCounts}
                    allowClear={allowClear}
                    isDisabled={isDisabled}
                    placeholder="Select organization..."
                  />
                )}
              </FormGroup>
            </GridItem>

            {showSwitchButton && (
              <GridItem span={2} style={{ display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                <Button
                  variant="plain"
                  aria-label="Switch organization and location"
                  onClick={handleSwitchContext}
                  isDisabled={isDisabled || (!selection.organizationId && !selection.locationId)}
                  style={{ marginBottom: '8px' }}
                >
                  <SyncAltIcon />
                </Button>
              </GridItem>
            )}

            <GridItem span={showSwitchButton ? 5 : 6}>
              <FormGroup
                label="Location"
                fieldId="location-selector"
                labelIcon={<MapMarkerAltIcon />}
              >
                {locationsLoading ? (
                  renderSkeleton()
                ) : (
                  <TaxonomySelector
                    type="location"
                    selectedId={selection.locationId}
                    entities={locations}
                    error={locationsError}
                    onSelectionChange={handleLocationChange}
                    showCounts={showCounts}
                    allowClear={allowClear}
                    isDisabled={isDisabled}
                    placeholder="Select location..."
                  />
                )}
              </FormGroup>
            </GridItem>
          </Grid>
        ) : (
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem>
              <FormGroup
                label="Organization"
                fieldId="organization-selector"
                labelIcon={<BuildingIcon />}
              >
                {organizationsLoading ? (
                  renderSkeleton()
                ) : (
                  <TaxonomySelector
                    type="organization"
                    selectedId={selection.organizationId}
                    entities={organizations}
                    error={organizationsError}
                    onSelectionChange={handleOrganizationChange}
                    showCounts={showCounts}
                    allowClear={allowClear}
                    isDisabled={isDisabled}
                    placeholder="Select organization..."
                  />
                )}
              </FormGroup>
            </FlexItem>

            {showSwitchButton && (
              <FlexItem style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="plain"
                  aria-label="Switch organization and location"
                  onClick={handleSwitchContext}
                  isDisabled={isDisabled || (!selection.organizationId && !selection.locationId)}
                >
                  <SyncAltIcon style={{ transform: 'rotate(90deg)' }} />
                </Button>
              </FlexItem>
            )}

            <FlexItem>
              <FormGroup
                label="Location"
                fieldId="location-selector"
                labelIcon={<MapMarkerAltIcon />}
              >
                {locationsLoading ? (
                  renderSkeleton()
                ) : (
                  <TaxonomySelector
                    type="location"
                    selectedId={selection.locationId}
                    entities={locations}
                    error={locationsError}
                    onSelectionChange={handleLocationChange}
                    showCounts={showCounts}
                    allowClear={allowClear}
                    isDisabled={isDisabled}
                    placeholder="Select location..."
                  />
                )}
              </FormGroup>
            </FlexItem>
          </Flex>
        )}
      </Form>
    </>
  );

  // Render with or without card wrapper
  if (asCard) {
    return (
      <Card>
        <CardTitle>{title}</CardTitle>
        <CardBody>
          {renderContent()}
        </CardBody>
      </Card>
    );
  }

  return renderContent();
};

export default TaxonomyContextSelector;