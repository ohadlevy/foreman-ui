import React, { useState, useCallback } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  SearchInput,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Bullseye,
  Divider
} from '@patternfly/react-core';
import { CaretDownIcon, SearchIcon, BuildingIcon, MapMarkerAltIcon } from '@patternfly/react-icons';
import { EnhancedOrganization, EnhancedLocation } from '../../types/taxonomy';

export interface TaxonomyDropdownProps {
  /** Type of taxonomy to select */
  type: 'organization' | 'location';
  /** Currently selected taxonomy ID */
  selectedId?: number;
  /** Available taxonomy entities */
  entities: (EnhancedOrganization | EnhancedLocation)[];
  /** Whether the dropdown is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Callback when selection changes */
  onSelectionChange: (entityId: number | undefined) => void;
  /** Whether to show entity counts */
  showCounts?: boolean;
  /** Whether to allow clearing selection */
  allowClear?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the dropdown is disabled */
  isDisabled?: boolean;
  /** Custom toggle text */
  toggleText?: string;
  /** Whether to show search input */
  hasSearch?: boolean;
  /** Maximum height for dropdown menu */
  maxHeight?: string;
  /** Custom icon for the toggle */
  toggleIcon?: React.ComponentType;
}

/**
 * TaxonomyDropdown component for simple taxonomy selection
 * 
 * Features:
 * - Simple dropdown interface
 * - Optional search filtering
 * - Loading and error states
 * - Clear selection option
 * - Keyboard navigation support
 * - Lightweight alternative to TaxonomySelector
 */
export const TaxonomyDropdown: React.FC<TaxonomyDropdownProps> = ({
  type,
  selectedId,
  entities,
  isLoading = false,
  error,
  onSelectionChange,
  showCounts = false,
  allowClear = true,
  placeholder,
  isDisabled = false,
  toggleText,
  hasSearch = true,
  maxHeight = '300px',
  toggleIcon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Get display name for entity
  const getDisplayName = useCallback((entity: EnhancedOrganization | EnhancedLocation): string => {
    return entity.title || entity.name;
  }, []);

  // Filter entities based on search
  const filteredEntities = React.useMemo(() => {
    if (!searchValue) return entities;
    
    const lowerSearch = searchValue.toLowerCase();
    return entities.filter(entity => 
      getDisplayName(entity).toLowerCase().includes(lowerSearch) ||
      entity.name.toLowerCase().includes(lowerSearch) ||
      entity.description?.toLowerCase().includes(lowerSearch)
    );
  }, [entities, searchValue, getDisplayName]);

  // Get selected entity
  const selectedEntity = selectedId ? entities.find(e => e.id === selectedId) : undefined;

  // Handle selection
  const handleSelect = useCallback((entityId: number | undefined) => {
    onSelectionChange(entityId);
    setIsOpen(false);
    setSearchValue('');
  }, [onSelectionChange]);

  // Handle toggle
  const handleToggle = useCallback((isOpen: boolean) => {
    setIsOpen(isOpen);
    if (!isOpen) {
      setSearchValue('');
    }
  }, []);

  // Generate toggle content
  const getToggleContent = () => {
    if (toggleText) return toggleText;
    
    if (selectedEntity) {
      return getDisplayName(selectedEntity);
    }
    
    return placeholder || `Select ${type}...`;
  };

  // Get toggle icon
  const ToggleIcon = toggleIcon || (type === 'organization' ? BuildingIcon : MapMarkerAltIcon);

  // Render entity item
  const renderEntityItem = useCallback((entity: EnhancedOrganization | EnhancedLocation) => {
    const displayName = getDisplayName(entity);
    
    let countsText = '';
    if (showCounts && (entity.hosts_count !== undefined || entity.users_count !== undefined)) {
      const hostCount = entity.hosts_count || 0;
      const userCount = entity.users_count || 0;
      countsText = ` (${hostCount} hosts, ${userCount} users)`;
    }

    const isCurrentlySelected = entity.id === selectedId;
    
    return (
      <DropdownItem
        key={entity.id}
        onClick={() => handleSelect(entity.id)}
        description={entity.description}
        isSelected={isCurrentlySelected}
        style={isCurrentlySelected ? {
          backgroundColor: 'var(--pf-v6-global--active-color--100)',
          borderLeft: '3px solid var(--pf-v6-global--primary-color--100)',
          fontWeight: 'var(--pf-v6-global--FontWeight--semi-bold)'
        } : undefined}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={isCurrentlySelected ? { color: 'var(--pf-v6-global--primary-color--100)' } : undefined}>
            {displayName}
          </span>
          {countsText && (
            <span style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
              {countsText}
            </span>
          )}
        </div>
      </DropdownItem>
    );
  }, [getDisplayName, showCounts, handleSelect, selectedId]);

  // Render dropdown items
  const renderDropdownItems = () => (
    <DropdownList style={{ maxHeight, overflowY: 'auto' }}>
      {/* Search input */}
      {hasSearch && !isLoading && (
        <div key="search" style={{ padding: '8px' }}>
          <SearchInput
            placeholder={`Search ${type}s...`}
            value={searchValue}
            onChange={(event, value) => setSearchValue(value)}
            onClear={() => setSearchValue('')}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <DropdownItem key="loading" isDisabled>
          <Bullseye>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size="sm" />
              <span>Loading {type}s...</span>
            </div>
          </Bullseye>
        </DropdownItem>
      )}

      {/* Error state */}
      {error && (
        <DropdownItem key="error" isDisabled>
          <div style={{ color: 'var(--pf-v6-global--danger-color--100)' }}>
            Error: {error}
          </div>
        </DropdownItem>
      )}

      {/* Only show content if not loading and no error */}
      {!isLoading && !error && (
        <>
          {/* Clear option */}
          {allowClear && selectedId && (
            <>
              {hasSearch && <Divider key="separator-search" />}
              <DropdownItem key="clear" onClick={() => handleSelect(undefined)}>
                <em>Clear selection</em>
              </DropdownItem>
              <Divider key="separator-clear" />
            </>
          )}
          {!allowClear && hasSearch && filteredEntities.length > 0 && (
            <Divider key="separator-search" />
          )}

          {/* Entity items */}
          {filteredEntities.length === 0 ? (
            <DropdownItem key="empty" isDisabled>
              <EmptyState
                titleText={searchValue ? `No ${type}s match` : `No ${type}s available`}
                icon={SearchIcon}
                variant="xs"
              >
                <EmptyStateBody>
                  {searchValue
                    ? `No ${type}s match "${searchValue}"`
                    : `No ${type}s available`
                  }
                </EmptyStateBody>
              </EmptyState>
            </DropdownItem>
          ) : (
            filteredEntities.map(entity => renderEntityItem(entity))
          )}
        </>
      )}
    </DropdownList>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          id={`${type}-dropdown-toggle`}
          onClick={() => handleToggle(!isOpen)}
          isExpanded={isOpen}
          isDisabled={isDisabled}
          icon={<CaretDownIcon />}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ToggleIcon />
          <span>{getToggleContent()}</span>
        </MenuToggle>
      )}
    >
      {renderDropdownItems()}
    </Dropdown>
  );
};

export default TaxonomyDropdown;