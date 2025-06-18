import React, { useMemo, useState } from 'react';

type MultiSelectListProps<T> = {
  items: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  getKey: (item: T) => string | number;
  renderItem: (item: T, checked: boolean) => React.ReactNode;
  searchPlaceholder?: string;
  filterFn?: (item: T, search: string) => boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export function MultiSelectList<T>({
  items,
  selected,
  onChange,
  getKey,
  renderItem,
  searchPlaceholder = 'Search...',
  filterFn,
  page = 1,
  totalPages = 1,
  onPageChange,
}: MultiSelectListProps<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!filterFn || !search) {
      return items;
    }
    return items.filter(item => filterFn(item, search));
  }, [items, search, filterFn]);

  const paginated = filtered;

  const toggle = (item: T) => {
    const key = getKey(item);
    if (selected.some(s => getKey(s) === key)) {
      onChange(selected.filter(s => getKey(s) !== key));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="w-full">
      <input
        className="mb-2 w-full rounded border px-2 py-1"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (onPageChange) {
            onPageChange(1);
          }
        }}
        type="text"
      />
      <ul className="divide-y divide-gray-200">
        {paginated.map((item) => {
          const key = getKey(item);
          const checked = selected.some(s => getKey(s) === key);
          return (
            <li key={key}>
              <button
                type="button"
                className={`flex w-full items-center px-2 py-1 text-left hover:bg-gray-100 ${checked ? 'bg-blue-50' : ''}`}
                onClick={() => toggle(item)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggle(item);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item)}
                  className="mr-2"
                  tabIndex={-1}
                  readOnly
                />
                {renderItem(item, checked)}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          onClick={() => onPageChange && onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="text-xs">
          Page
          {' '}
          {page}
          {' '}
          /
          {' '}
          {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          onClick={() => onPageChange && onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
