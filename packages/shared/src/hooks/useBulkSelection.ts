import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionOptions<T extends { id: number }> {
  items: T[];
  initialSelection?: number[];
}

export const useBulkSelection = <T extends { id: number }>({
  items,
  initialSelection = [],
}: UseBulkSelectionOptions<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(initialSelection)
  );

  const selectedIds = useMemo(() => Array.from(selectedItems), [selectedItems]);

  const selectedObjects = useMemo(() =>
    items.filter(item => selectedItems.has(item.id)),
    [items, selectedItems]
  );

  const isSelected = useCallback((id: number) => selectedItems.has(id), [selectedItems]);

  const isAllSelected = useMemo(() =>
    items.length > 0 && items.every(item => selectedItems.has(item.id)),
    [items, selectedItems]
  );

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
      if (prev.size === items.length) {
        return new Set(); // Deselect all
      } else {
        return new Set(items.map(item => item.id)); // Select all
      }
    });
  }, [items]);

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
    isPartiallySelected,
    toggleItem,
    toggleAll,
    selectItems,
    deselectItems,
    clearSelection,
    selectAll,
  };
};