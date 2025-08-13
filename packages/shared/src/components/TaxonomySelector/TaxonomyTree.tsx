import React, { useState, useCallback, useMemo } from 'react';
import {
  TreeView,
  TreeViewDataItem,
  Card,
  CardTitle,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Button,
  Flex,
  FlexItem,
  Badge,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner
} from '@patternfly/react-core';
import { 
  SearchIcon, 
  ExpandIcon, 
  CompressIcon,
  BuildingIcon,
  MapMarkerAltIcon,
  FolderIcon,
  FolderOpenIcon
} from '@patternfly/react-icons';
import { EnhancedOrganization, EnhancedLocation, TaxonomyTreeNode } from '../../types/taxonomy';
import { buildTaxonomyTree } from '../../utils/taxonomyHelpers';

export interface TaxonomyTreeProps {
  /** Type of taxonomy to display */
  type: 'organization' | 'location';
  /** Available taxonomy entities */
  entities: (EnhancedOrganization | EnhancedLocation)[];
  /** Currently selected entity IDs */
  selectedIds?: number[];
  /** Whether the tree is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Callback when selection changes */
  onSelectionChange?: (entityIds: number[]) => void;
  /** Whether to allow multiple selection */
  allowMultiSelect?: boolean;
  /** Whether to show entity counts */
  showCounts?: boolean;
  /** Whether to show search functionality */
  hasSearch?: boolean;
  /** Whether to show expand/collapse all buttons */
  hasExpandControls?: boolean;
  /** Custom title for the tree */
  title?: string;
  /** Whether to render as a card */
  asCard?: boolean;
  /** Maximum height for the tree */
  maxHeight?: string;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Custom filter function */
  onFilter?: (searchValue: string, entities: (EnhancedOrganization | EnhancedLocation)[]) => (EnhancedOrganization | EnhancedLocation)[];
  /** Custom render function for tree items */
  renderItem?: (entity: EnhancedOrganization | EnhancedLocation) => React.ReactNode;
}

/**
 * TaxonomyTree component for hierarchical taxonomy display and selection
 * 
 * Features:
 * - Hierarchical tree view with proper nesting
 * - Single or multiple selection support
 * - Search and filtering capabilities
 * - Expand/collapse all functionality
 * - Entity counts display
 * - Loading and error states
 * - Keyboard navigation support
 * - Accessible design
 */
export const TaxonomyTree: React.FC<TaxonomyTreeProps> = ({
  type,
  entities,
  selectedIds = [],
  isLoading = false,
  error,
  onSelectionChange,
  allowMultiSelect = false,
  showCounts = true,
  hasSearch = true,
  hasExpandControls = true,
  title,
  asCard = true,
  maxHeight = '400px',
  defaultExpanded = false,
  onFilter,
  renderItem
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [allExpanded, setAllExpanded] = useState(defaultExpanded);

  // Filter entities based on search
  const filteredEntities = useMemo(() => {
    if (!searchValue) return entities;
    
    if (onFilter) {
      return onFilter(searchValue, entities);
    }
    
    const lowerSearch = searchValue.toLowerCase();
    return entities.filter(entity => 
      (entity.title || entity.name).toLowerCase().includes(lowerSearch) ||
      entity.name.toLowerCase().includes(lowerSearch) ||
      entity.description?.toLowerCase().includes(lowerSearch)
    );
  }, [entities, searchValue, onFilter]);

  // Build tree structure
  const treeData = useMemo(() => {
    return buildTaxonomyTree(filteredEntities);
  }, [filteredEntities]);

  // Convert tree nodes to TreeView format
  const convertToTreeViewData = useCallback((nodes: TaxonomyTreeNode<EnhancedOrganization | EnhancedLocation>[]): TreeViewDataItem[] => {
    return nodes.map(node => {
      const entity = node.entity;
      const displayName = entity.title || entity.name;
      
      // Generate counts text
      let countsText = '';
      if (showCounts && (entity.hosts_count !== undefined || entity.users_count !== undefined)) {
        const hostCount = entity.hosts_count || 0;
        const userCount = entity.users_count || 0;
        countsText = `${hostCount} hosts, ${userCount} users`;
      }

      // Custom item rendering
      const customContent = renderItem ? renderItem(entity) : null;

      const item: TreeViewDataItem = {
        name: displayName,
        id: entity.id.toString(),
        children: node.children.length > 0 ? convertToTreeViewData(node.children) : undefined,
        icon: node.children.length > 0 ? <FolderIcon /> : (type === 'organization' ? <BuildingIcon /> : <MapMarkerAltIcon />),
        expandedIcon: <FolderOpenIcon />,
        customBadgeContent: countsText ? <Badge isRead>{countsText}</Badge> : undefined,
        // Custom content takes precedence
        ...(customContent && { customContent })
      };

      return item;
    });
  }, [showCounts, type, renderItem]);

  // Get tree view data
  const treeViewData = useMemo(() => {
    return convertToTreeViewData(treeData);
  }, [treeData, convertToTreeViewData]);

  // Handle selection change
  const handleSelectionChange = useCallback((evt: React.MouseEvent, treeViewItem: TreeViewDataItem) => {
    if (!onSelectionChange) return;

    const entityId = parseInt(treeViewItem.id!, 10);
    
    if (allowMultiSelect) {
      const newSelectedIds = selectedIds.includes(entityId)
        ? selectedIds.filter(id => id !== entityId)
        : [...selectedIds, entityId];
      onSelectionChange(newSelectedIds);
    } else {
      onSelectionChange([entityId]);
    }
  }, [selectedIds, allowMultiSelect, onSelectionChange]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    setAllExpanded(true);
  }, []);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setAllExpanded(false);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((_event: React.FormEvent, value: string) => {
    setSearchValue(value);
    
    // Auto-expand when searching
    if (value && !allExpanded) {
      expandAll();
    }
  }, [allExpanded, expandAll]);

  // Render toolbar
  const renderToolbar = () => (
    <Toolbar>
      <ToolbarContent>
        {hasSearch && (
          <ToolbarItem>
            <SearchInput
              placeholder={`Search ${type}s...`}
              value={searchValue}
              onChange={handleSearchChange}
              onClear={() => setSearchValue('')}
            />
          </ToolbarItem>
        )}
        {hasExpandControls && (
          <ToolbarItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Button
                  variant="link"
                  icon={<ExpandIcon />}
                  onClick={expandAll}
                  isDisabled={isLoading}
                >
                  Expand all
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="link"
                  icon={<CompressIcon />}
                  onClick={collapseAll}
                  isDisabled={isLoading}
                >
                  Collapse all
                </Button>
              </FlexItem>
            </Flex>
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );

  // Render tree content
  const renderTreeContent = () => {
    if (isLoading) {
      return (
        <EmptyState>
          <EmptyStateIcon icon={Spinner} />
          <EmptyStateBody>Loading {type}s...</EmptyStateBody>
        </EmptyState>
      );
    }

    if (error) {
      return (
        <EmptyState>
          <EmptyStateBody>Error loading {type}s: {error}</EmptyStateBody>
        </EmptyState>
      );
    }

    if (treeViewData.length === 0) {
      return (
        <EmptyState>
          <EmptyStateIcon icon={SearchIcon} />
          <EmptyStateBody>
            {searchValue 
              ? `No ${type}s match "${searchValue}"`
              : `No ${type}s available`
            }
          </EmptyStateBody>
        </EmptyState>
      );
    }

    return (
      <div 
        style={{ maxHeight, overflowY: 'auto' }}
        role="tree"
        aria-label={`${type} tree`}
      >
        <TreeView
          data={treeViewData}
          activeItems={selectedIds.map(id => {
            const entity = entities.find(e => e.id === id);
            return {
              id: id.toString(),
              name: entity ? (entity.title || entity.name) : id.toString()
            };
          })}
          onSelect={handleSelectionChange}
          allExpanded={allExpanded}
          hasSelectableNodes
          hasBadges={showCounts}
        />
      </div>
    );
  };

  // Render main content
  const mainContent = (
    <>
      {(hasSearch || hasExpandControls) && renderToolbar()}
      {renderTreeContent()}
    </>
  );

  // Render with or without card wrapper
  if (asCard) {
    return (
      <Card>
        {title && <CardTitle>{title}</CardTitle>}
        <CardBody>
          {mainContent}
        </CardBody>
      </Card>
    );
  }

  return mainContent;
};

export default TaxonomyTree;