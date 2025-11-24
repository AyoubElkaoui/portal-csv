import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  onSort,
  className = ''
}) => {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const getIcon = () => {
    if (!isActive) return <ChevronsUpDown size={16} className="text-gray-400" />;
    if (direction === 'asc') return <ChevronUp size={16} className="text-blue-600" />;
    if (direction === 'desc') return <ChevronDown size={16} className="text-blue-600" />;
    return <ChevronsUpDown size={16} className="text-gray-400" />;
  };

  return (
    <th
      className={`border border-gray-300 px-6 py-4 text-left font-semibold cursor-pointer hover:bg-blue-50 transition-colors select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <div className="ml-2">{getIcon()}</div>
      </div>
    </th>
  );
};