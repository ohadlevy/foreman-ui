import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionOptions<T extends { id: number }> {
  items: T[];
  initialSelection?: number[];
  totalCount?: number;
  onSelectAllPages?: () => Promise<number[]> | number[];
}

export const useBulkSelection = <T extends { id: number }>({
  items,
  initialSelection = [],
  totalCount,
  onSelectAllPages,
}: UseBulkSelectionOptions<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(initialSelection)
  );

  const selectedIds = useMemo(() => Array.from(selectedItems), [selectedItems]);

  const selectedObjects = useMemo(() =>
    items.filter(item => selectedItems.has(item.id)),
    [items, selectedItems]
  );

  const isSelected = useCallback((id: number) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  const isAllCurrentPageSelected = useMemo(() =>
    items.length > 0 && items.every(item => selectedItems.has(item.id)),
    [items, selectedItems]
  );

  const isAllSelected = useMemo(() => {
    if (totalCount !== undefined) {
      return selectedItems.size === totalCount;
    }
    return isAllCurrentPageSelected;
  }, [selectedItems.size, totalCount, isAllCurrentPageSelected]);

  const isPartiallySelected = useMemo(() =>
    selectedItems.size > 0 && !isAllSelected,
    [selectedItems.size, isAllSelected]
  );

  const toggleItem = useCallback((id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedItems(prev => {
      // Check if all current page items are already selected
      const allCurrentSelected = items.length > 0 && items.every(item => prev.has(item.id));

      if (allCurrentSelected) {
        // Remove all current page items from selection
        const newSelection = new Set(prev);
        items.forEach(item => newSelection.delete(item.id));
        return newSelection;
      } else {
        // Add all current page items to selection
        const newSelection = new Set(prev);
        items.forEach(item => newSelection.add(item.id));
        return newSelection;
      }
    });
  }, [items]);

  const selectAllPages = useCallback(async () => {
    if (onSelectAllPages) {
      try {
        const allIds = await onSelectAllPages();
        setSelectedItems(new Set(allIds));
      } catch (error) {
        console.error('Failed to select all pages:', error);
      }
    }
  }, [onSelectAllPages]);

  const selectItems = useCallback((ids: number[]) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const deselectItems = useCallback((ids: number[]) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map(item => item.id)));
  }, [items]);

  return {
    selectedIds,
    selectedObjects,
    selectedCount: selectedItems.size,
    isSelected,
    isAllSelected,
    isAllCurrentPageSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    selectItems,
    deselectItems,
    clearSelection,
    selectAll,
    selectAllPages,
    totalCount,
  };
};