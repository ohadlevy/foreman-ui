/**
 * Shared utilities for handling taxonomy hierarchy (Organizations and Locations)
 */
import React from 'react';
import { Flex } from '@patternfly/react-core';

export interface TaxonomyItem {
  id: number;
  name: string;
  title?: string;
  description?: string;
}

/**
 * Helper function to parse hierarchical titles and calculate nesting level
 * Works with both › and / separators (e.g., "USA › Texas › Dallas" or "USA/Texas/Dallas")
 */
export const getHierarchyLevel = (item: TaxonomyItem): number => {
  const title = item.title || item.name;
  // Count separators for both › and / formats
  const arrowSeparators = title.match(/›/g);
  const slashSeparators = title.match(/\//g);

  if (arrowSeparators) {
    return arrowSeparators.length;
  } else if (slashSeparators) {
    return slashSeparators.length;
  }

  return 0;
};

/**
 * Extract the display name from a hierarchical title
 * Examples: "USA › Texas › Dallas" -> "Dallas", "Europe/Germany/Berlin" -> "Berlin"
 */
export const getDisplayName = (item: TaxonomyItem): string => {
  const title = item.title || item.name;
  
  // If it contains hierarchy separators, extract just the last part
  if (title.includes(' › ')) {
    return title.split(' › ').pop() || title;
  } else if (title.includes('/')) {
    return title.split('/').pop() || title;
  }
  
  return title;
};

/**
 * Render a tree-like display for hierarchical taxonomy items
 * Shows indentation and tree connectors for nested items
 */
export const renderTaxonomyTreeItem = (item: TaxonomyItem, level: number = 0): React.ReactElement => {
  const indentStyle = level > 0 ? { paddingLeft: `${level * 1.5}rem` } : {};
  const displayName = getDisplayName(item);

  return React.createElement('div', {
    style: indentStyle,
    className: 'taxonomy-tree-item',
    key: `tree-item-${item.id}`
  }, 
    React.createElement(Flex, {
      alignItems: { default: 'alignItemsCenter' },
      spaceItems: { default: 'spaceItemsSm' }
    }, [
      level > 0 && React.createElement('span', {
        key: 'connector',
        style: { 
          color: 'var(--pf-v5-global--Color--200)', 
          marginRight: '0.5rem', 
          fontSize: '0.75rem' 
        }
      }, '└'),
      React.createElement('span', { key: 'name' }, displayName)
    ])
  );
};

/**
 * Sort taxonomy items for natural tree ordering
 * Sorts by title/name for hierarchical display
 */
export const sortTaxonomyItems = <T extends TaxonomyItem>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const titleA = a.title || a.name;
    const titleB = b.title || b.name;
    return titleA.localeCompare(titleB);
  });
};

/**
 * Get the full hierarchy path as an array
 * Example: "USA › Texas › Dallas" -> ["USA", "Texas", "Dallas"]
 */
export const getHierarchyPath = (item: TaxonomyItem): string[] => {
  const title = item.title || item.name;
  
  if (title.includes(' › ')) {
    return title.split(' › ');
  } else if (title.includes('/')) {
    return title.split('/');
  }
  
  return [title];
};