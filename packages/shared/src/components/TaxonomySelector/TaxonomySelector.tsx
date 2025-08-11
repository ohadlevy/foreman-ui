import React, { useState, useCallback } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Divider,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
  Alert,
  SearchInput
} from '@patternfly/react-core';
import { SearchIcon, ExclamationTriangleIcon, CaretDownIcon } from '@patternfly/react-icons';
import { EnhancedOrganization, EnhancedLocation } from '../../types/taxonomy';

export interface TaxonomySelectorProps {
  /** Type of taxonomy to select */
  type: 'organization' | 'location';
  /** Currently selected taxonomy ID */
  selectedId?: number;
  /** Available taxonomy entities */
  entities: (EnhancedOrganization | EnhancedLocation)[];
  /** Whether the selector is loading */
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
  /** Whether the selector is disabled */
  isDisabled?: boolean;
  /** Custom width for the selector */
  width?: string;
  /** Direction for dropdown */
  direction?: 'up' | 'down';
  /** Maximum height for dropdown */
  maxHeight?: string;
  /** Whether to show hierarchical structure */
  showHierarchy?: boolean;
  /** Custom filter function */
  onFilter?: (filterValue: string, entities: (EnhancedOrganization | EnhancedLocation)[]) => (EnhancedOrganization | EnhancedLocation)[];
}

/**
 * TaxonomySelector component for selecting organizations or locations
 * 
 * Features:
 * - Searchable dropdown with filtering
 * - Optional hierarchy display with indentation
 * - Entity counts display (hosts/users)
 * - Loading and error states
 * - Clear selection option
 * - Keyboard navigation support
 * - Accessible design
 */
export const TaxonomySelector: React.FC<TaxonomySelectorProps> = ({
  type,
  selectedId,
  entities,
  isLoading = false,
  error,
  onSelectionChange,
  showCounts = true,
  allowClear = true,
  placeholder,
  isDisabled = false,
  width = '300px',
  showHierarchy = true,
  onFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('');

  // Get display name for entity
  const getDisplayName = useCallback((entity: EnhancedOrganization | EnhancedLocation): string => {
    return entity.title || entity.name;
  }, []);

  // Get hierarchy level for entity
  const getHierarchyLevel = useCallback((entity: EnhancedOrganization | EnhancedLocation): number => {
    if (!showHierarchy || !entity.parent_id) return 0;
    
    // Calculate level by finding ancestors
    const findLevel = (currentId: number, visited: Set<number> = new Set()): number => {
      if (visited.has(currentId)) return 0; // Prevent cycles
      visited.add(currentId);
      
      const parent = entities.find(e => e.id === currentId);
      if (!parent?.parent_id) return 0;
      
      return 1 + findLevel(parent.parent_id, visited);
    };
    
    return findLevel(entity.id);
  }, [entities, showHierarchy]);

  // Filter entities based on search
  const filteredEntities = React.useMemo(() => {
    if (!filterValue) return entities;
    
    if (onFilter) {
      return onFilter(filterValue, entities);
    }
    
    const lowerFilter = filterValue.toLowerCase();
    return entities.filter(entity => 
      getDisplayName(entity).toLowerCase().includes(lowerFilter) ||
      entity.name.toLowerCase().includes(lowerFilter) ||
      entity.description?.toLowerCase().includes(lowerFilter)
    );
  }, [entities, filterValue, onFilter, getDisplayName]);

  // Get selected entity
  const selectedEntity = selectedId ? entities.find(e => e.id === selectedId) : undefined;

  // Handle selection
  const handleSelect = useCallback((_event?: React.MouseEvent, selection?: string | number) => {
    if (selection === 'clear') {
      onSelectionChange(undefined);
    } else if (selection !== undefined) {
      const entityId = typeof selection === 'string' ? parseInt(selection, 10) : selection;
      onSelectionChange(entityId);
    }
    setIsOpen(false);
    setFilterValue('');
  }, [onSelectionChange]);

  // Render loading state
  if (isLoading) {
    return (
      <div style={{ width }}>
        <MenuToggle isDisabled>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Spinner size="sm" />
            <span>Loading {type}s...</span>
          </div>
        </MenuToggle>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{ width }}>
        <Alert
          variant="danger"
          isInline
          title={`Error loading ${type}s`}
        >
          {error}
        </Alert>
      </div>
    );
  }

  // Generate selection display
  const selectionDisplay = selectedEntity ? getDisplayName(selectedEntity) : undefined;

  return (
    <div style={{ width }}>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            isDisabled={isDisabled}
            icon={<CaretDownIcon />}
            aria-label={`Select ${type}`}
          >
            {selectionDisplay || placeholder || `Select ${type}...`}
          </MenuToggle>
        )}
      >
        <DropdownList>
          {/* Search input for inline filtering */}
          <div style={{ padding: '8px' }}>
            <SearchInput
              placeholder={`Search ${type}s...`}
              value={filterValue}
              onChange={(event, value) => setFilterValue(value)}
              onClear={() => setFilterValue('')}
            />
          </div>
          
          {/* Divider after search */}
          {filteredEntities.length > 0 && <Divider />}
          
          {/* Clear option */}
          {allowClear && selectedId && (
            <>
              <DropdownItem key="clear" onClick={() => handleSelect(undefined, 'clear')}>
                <em>Clear selection</em>
              </DropdownItem>
              <Divider key="divider" />
            </>
          )}
          
          {/* Entity options */}
          {filteredEntities.length === 0 && !isLoading ? (
            <DropdownItem key="empty" isDisabled>
              <EmptyState>
                <EmptyStateIcon icon={filterValue ? SearchIcon : ExclamationTriangleIcon} />
                <EmptyStateBody>
                  {filterValue 
                    ? `No ${type}s match "${filterValue}"`
                    : `No ${type}s available`
                  }
                </EmptyStateBody>
              </EmptyState>
            </DropdownItem>
          ) : (
            filteredEntities.map(entity => {
              const level = getHierarchyLevel(entity);
              const indentation = level * 20;
              const displayName = getDisplayName(entity);
              
              let countsText = '';
              if (showCounts && (entity.hosts_count !== undefined || entity.users_count !== undefined)) {
                const hostCount = entity.hosts_count || 0;
                const userCount = entity.users_count || 0;
                countsText = ` (${hostCount} hosts, ${userCount} users)`;
              }

              return (
                <DropdownItem
                  key={entity.id}
                  onClick={() => handleSelect(undefined, entity.id)}
                  isSelected={selectedId === entity.id}
                  description={entity.description}
                  role="treeitem"
                  aria-level={level + 1}
                >
                  <div style={{ marginLeft: `${indentation}px` }}>
                    <span>{displayName}</span>
                    {countsText && <span className="pf-c-select__menu-item-count">{countsText}</span>}
                  </div>
                </DropdownItem>
              );
            })
          )}
        </DropdownList>
      </Dropdown>
    </div>
  );
};

export default TaxonomySelector;