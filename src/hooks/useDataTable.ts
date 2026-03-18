import { useState, useMemo, useCallback } from 'react';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  key: string;
  value: any;
  operator?: 'equals' | 'includes' | 'range' | 'boolean';
}

interface UseDataTableOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  initialSort?: SortConfig;
}

export function useDataTable<T extends { id: string }>({
  data,
  searchFields,
  initialSort = { key: 'createdAt', direction: 'desc' },
}: UseDataTableOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 1. Filtering & Searching
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search
      const matchesSearch = searchTerm === '' || searchFields.some((field) => {
        const value = item[field];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });

      if (!matchesSearch) return false;

      // Custom Filters
      return filters.every((filter) => {
        const itemValue = (item as any)[filter.key];
        
        switch (filter.operator) {
          case 'includes':
            return Array.isArray(itemValue) 
              ? itemValue.includes(filter.value)
              : String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'range':
            if (!filter.value || !Array.isArray(filter.value)) return true;
            const [min, max] = filter.value;
            return itemValue >= min && itemValue <= max;
          case 'boolean':
            return !!itemValue === !!filter.value;
          case 'equals':
          default:
            return itemValue === filter.value;
        }
      });
    });
  }, [data, searchTerm, searchFields, filters]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Selection Helpers
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === sortedData.length) return new Set();
      return new Set(sortedData.map((item) => item.id));
    });
  }, [sortedData]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const setFilter = useCallback((key: string, value: any, operator: FilterConfig['operator'] = 'equals') => {
    setFilters((prev) => {
      const existing = prev.findIndex((f) => f.key === key);
      if (value === null || value === undefined || value === '') {
        return prev.filter((f) => f.key !== key);
      }
      const newFilter: FilterConfig = { key, value, operator };
      if (existing >= 0) {
        if (prev[existing].value === value && prev[existing].operator === operator) {
          return prev;
        }
        const next = [...prev];
        next[existing] = newFilter;
        return next;
      }
      return [...prev, newFilter];
    });
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    toggleSort,
    filters,
    setFilter,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    filteredData: sortedData,
    totalCount: data.length,
    filteredCount: sortedData.length,
  };
}
