/**
 * Generic base component for taxonomy selectors (Organizations, Locations, etc.)
 * Eliminates duplication between OrganizationSelector and LocationSelector
 */
import React, { useState } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Icon,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { 
  getHierarchyLevel, 
  renderTaxonomyTreeItem, 
  sortTaxonomyItems,
  getDisplayName,
  TaxonomyItem
} from '../../utils/taxonomyHierarchy';

export interface TaxonomySelectorConfig<T extends TaxonomyItem> {
  // Data
  currentItem: T | null;
  availableItems: T[];
  isLoading: boolean;
  canView: boolean;
  
  // Actions
  setCurrentItem: (item: T | null) => void;
  
  // Labels
  loadingText: string;
  anyItemText: string;
  noItemsText: string;
  labelText?: string;
  
  // UI
  icon: React.ReactElement;
}

export interface TaxonomySelectorBaseProps<T extends TaxonomyItem> {
  config: TaxonomySelectorConfig<T>;
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export function TaxonomySelectorBase<T extends TaxonomyItem>({
  config,
  variant = 'default',
  showLabels = true,
  className,
}: TaxonomySelectorBaseProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentItem,
    availableItems,
    isLoading,
    canView,
    setCurrentItem,
    loadingText,
    anyItemText,
    noItemsText,
    labelText,
    icon,
  } = config;

  const isCompact = variant === 'compact';

  // Don't render if user has no permissions
  if (!canView) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <MenuToggle isDisabled variant={isCompact ? 'plain' : 'default'}>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            <FlexItem>
              <Icon>{icon}</Icon>
            </FlexItem>
            <FlexItem>
              <span>{loadingText}</span>
            </FlexItem>
          </Flex>
        </MenuToggle>
      </div>
    );
  }

  const handleItemSelect = (item: T | null) => {
    setCurrentItem(item);
    setIsOpen(false);
  };

  const displayText = currentItem ? getDisplayName(currentItem) : anyItemText;

  // Sort items by title for natural tree ordering
  const sortedItems = sortTaxonomyItems(availableItems);

  const dropdownItems = (
    <DropdownList style={{ maxHeight: '300px', overflowY: 'auto' }}>
      <DropdownItem
        key="any-item"
        onClick={() => handleItemSelect(null)}
        isSelected={!currentItem}
      >
        {anyItemText}
      </DropdownItem>
      {sortedItems.map((item) => {
        const level = getHierarchyLevel(item);
        return (
          <DropdownItem
            key={`item-${item.id}`}
            onClick={() => handleItemSelect(item)}
            isSelected={currentItem?.id === item.id}
            description={item.description}
          >
            {renderTaxonomyTreeItem(item, level)}
          </DropdownItem>
        );
      })}
      {availableItems.length === 0 && (
        <DropdownItem key="no-items" isDisabled>
          {noItemsText}
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
              <FlexItem>
                <Icon>{icon}</Icon>
              </FlexItem>
              <FlexItem>
                {showLabels && !isCompact && labelText && (
                  <span style={{ marginRight: '0.5rem', fontWeight: 'normal' }}>
                    {labelText}
                  </span>
                )}
                <span>{displayText}</span>
              </FlexItem>
            </Flex>
          </MenuToggle>
        )}
      >
        {dropdownItems}
      </Dropdown>
    </div>
  );
}