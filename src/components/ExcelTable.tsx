import { useState, useMemo, useCallback } from 'react';
import { 
  ChevronUp, ChevronDown, Search, 
  Edit3, Save, X, Plus, Trash2, Download, Upload
} from 'lucide-react';
import { formatDateMMDDYY, formatDateMMDD, formatDateToMonth, getMonthColor, parseDateInput } from '../utils/dateUtils';

export interface ExcelColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'currency' | 'date-mmddyy' | 'date-mmd' | 'month';
  width?: number;
  options?: string[];
  optionColors?: Record<string, string>; // tailwind class for display badge
  editable?: boolean;
  required?: boolean;
}

export interface ExcelRow {
  id: string;
  [key: string]: any;
}

interface ExcelTableProps {
  columns: ExcelColumn[];
  data: ExcelRow[];
  onDataChange?: (data: ExcelRow[]) => void;
  onRowAdd?: (row: ExcelRow) => void;
  onRowDelete?: (rowId: string) => void;
  onRowUpdate?: (rowId: string, updates: Partial<ExcelRow>) => void;
  canEdit?: boolean;
  canAdd?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  title?: string;
  subtitle?: string;
}

function ExcelTable({
  columns,
  data,
  onDataChange,
  onRowAdd,
  onRowDelete,
  onRowUpdate,
  canEdit = true,
  canAdd = true,
  canDelete = true,
  canExport = true,
  canImport = true,
  title,
  subtitle
}: ExcelTableProps) {
  const MIN_ROWS = 200;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const isPlaceholderRow = useCallback((rowId: string) => rowId.startsWith('placeholder-'), []);

  // Build placeholder rows to always show a 200-row grid
  const placeholderRows = useMemo(() => {
    const count = Math.max(0, MIN_ROWS - data.length);
    return Array.from({ length: count }).map((_, index) => {
      const placeholder: ExcelRow = {
        id: `placeholder-${index}`
      };
      columns.forEach(col => {
        placeholder[col.id] = col.type === 'number' || col.type === 'currency' ? 0 : '';
      });
      return placeholder;
    });
  }, [data.length, columns]);

  // Data used for rendering/filtering/sorting (real data + placeholders)
  const displayData = useMemo(() => {
    return [...data, ...placeholderRows];
  }, [data, placeholderRows]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = displayData.filter(row => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = columns.some(col => {
          const value = String(row[col.id] || '').toLowerCase();
          return value.includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Apply column filters
      return columns.every(col => {
        const filterValue = filters[col.id];
        if (!filterValue) return true;
        
        const cellValue = String(row[col.id] || '').toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      });
    });

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [displayData, filters, searchTerm, sortColumn, sortDirection, columns]);

  const handleSort = useCallback((columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleFilterChange = useCallback((columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
  }, []);

  const handleCellEdit = useCallback((rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, columnId });
    const column = columns.find(col => col.id === columnId);
    if (column?.type === 'multiselect') {
      // For multi-select, ensure we have a proper comma-separated string
      const value = String(currentValue || '');
      setEditingValue(value);
    } else {
      setEditingValue(String(currentValue || ''));
    }
  }, [columns]);

  const handleCellSave = useCallback(() => {
    if (!editingCell) return;

    const { rowId, columnId } = editingCell;
    const column = columns.find(col => col.id === columnId);
    
    if (!column) return;

    let processedValue: any = editingValue;
    
    // Process value based on column type
    switch (column.type) {
      case 'number':
      case 'currency':
        processedValue = parseFloat(editingValue) || 0;
        break;
      case 'date':
      case 'date-mmddyy':
      case 'date-mmd':
      case 'month':
        processedValue = parseDateInput(editingValue);
        break;
      default:
        processedValue = editingValue;
    }

    // If editing a placeholder row, convert to a real row
    if (isPlaceholderRow(rowId)) {
      const newRow: ExcelRow = {
        id: `new-${Date.now()}`,
        ...columns.reduce((acc, col) => {
          acc[col.id] = col.id === columnId ? processedValue : (col.type === 'number' || col.type === 'currency' ? 0 : '');
          return acc;
        }, {} as Record<string, any>)
      };
      if (onRowAdd) {
        onRowAdd(newRow);
      } else if (onDataChange) {
        onDataChange([...data, newRow]);
      }
    } else {
      if (onRowUpdate) {
        onRowUpdate(rowId, { [columnId]: processedValue });
      }
    }

    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, editingValue, columns, onRowUpdate, isPlaceholderRow, onRowAdd, onDataChange, data]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  const handleAddRow = useCallback(() => {
    if (!onRowAdd) return;

    const newRow: ExcelRow = {
      id: `new-${Date.now()}`,
      ...columns.reduce((acc, col) => {
        acc[col.id] = col.type === 'number' || col.type === 'currency' ? 0 : '';
        return acc;
      }, {} as Record<string, any>)
    };

    onRowAdd(newRow);
  }, [onRowAdd, columns]);

  const handleDeleteRow = useCallback((rowId: string) => {
    if (onRowDelete) {
      onRowDelete(rowId);
    }
  }, [onRowDelete]);

  const handleSelectRow = useCallback((rowId: string) => {
    if (isPlaceholderRow(rowId)) return;
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, [isPlaceholderRow]);

  const handleSelectAll = useCallback(() => {
    const selectableIds = filteredAndSortedData.filter(r => !isPlaceholderRow(r.id)).map(r => r.id);
    if (selectedRows.size === selectableIds.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(selectableIds));
    }
  }, [selectedRows, filteredAndSortedData, isPlaceholderRow]);

  const handleExport = useCallback(() => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...filteredAndSortedData
        .filter(row => !isPlaceholderRow(row.id))
        .map(row => 
        columns.map(col => {
          const value = row[col.id] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [columns, filteredAndSortedData, title, isPlaceholderRow]);

  const handleBulkImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('File must contain at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1);

        // Validate headers match our columns
        const columnIds = columns.map(col => col.id);
        const missingColumns = columnIds.filter(id => !headers.includes(id));
        
        if (missingColumns.length > 0) {
          alert(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        // Parse and add rows
        const newRows: ExcelRow[] = dataRows.map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: ExcelRow = { id: `bulk-${Date.now()}-${index}` };
          
          headers.forEach((header, i) => {
            const column = columns.find(col => col.id === header);
            if (column) {
              let value: any = values[i] || '';
              
              // Convert based on column type
              switch (column.type) {
                case 'number':
                case 'currency':
                  value = parseFloat(value) || 0;
                  break;
                case 'date':
                case 'date-mmddyy':
                case 'date-mmd':
                case 'month':
                  value = parseDateInput(value);
                  break;
                default:
                  value = String(value);
              }
              
              row[header] = value;
            }
          });
          
          return row;
        });

        // Add all rows
        if (onDataChange) {
          onDataChange([...data, ...newRows]);
        }

        alert(`Successfully imported ${newRows.length} rows`);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [columns, data, onDataChange]);

  const renderCell = (row: ExcelRow, column: ExcelColumn) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
    const value = row[column.id];

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          {column.type === 'select' ? (
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            >
              <option value="">Select...</option>
              {column.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : column.type === 'multiselect' ? (
            <div className="w-full">
              <select
                multiple
                value={Array.isArray(editingValue) ? editingValue : (editingValue ? editingValue.split(',') : [])}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setEditingValue(selected.join(','));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCellSave();
                  }
                  if (e.key === 'Escape') {
                    handleCellCancel();
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                autoFocus
                size={Math.min(column.options?.length || 5, 8)}
              >
                {column.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple, then press Enter</div>
            </div>
          ) : (
            <input
              type={column.type === 'number' || column.type === 'currency' ? 'number' : 
                    column.type === 'date' || column.type === 'date-mmddyy' || column.type === 'date-mmd' || column.type === 'month' ? 'text' : 'text'}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder={column.type === 'date-mmddyy' ? 'MM-DD-YY' : 
                         column.type === 'date-mmd' ? 'MM-DD' : 
                         column.type === 'month' ? 'Month' : ''}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
            />
          )}
          <button
            onClick={handleCellSave}
            className="p-1 text-green-600 hover:text-green-800"
          >
            <Save size={14} />
          </button>
          <button
            onClick={handleCellCancel}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <X size={14} />
          </button>
        </div>
      );
    }

    let displayValue = '';
    
    switch (column.type) {
      case 'currency':
        if (value === null || value === undefined || Number(value) === 0) {
          displayValue = '';
        } else {
          displayValue = `$${Number(value).toFixed(2)}`;
        }
        break;
      case 'date-mmddyy':
        displayValue = formatDateMMDDYY(value);
        break;
      case 'date-mmd':
        displayValue = formatDateMMDD(value);
        break;
      case 'month':
        displayValue = formatDateToMonth(value);
        break;
      default:
        displayValue = value || '';
    }

    const badge = (text: string, cls: string) => (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
        {text}
      </span>
    );

    return (
      <div className="flex items-center justify-between group">
        {column.type === 'month' && displayValue ? (
          badge(displayValue, getMonthColor(displayValue))
        ) : column.type === 'select' && displayValue ? (
          badge(displayValue, column.optionColors?.[displayValue] || 'bg-gray-100 text-gray-800')
        ) : column.type === 'multiselect' ? (
          displayValue && displayValue.trim() ? (
            <div className="flex flex-wrap gap-1">
              {displayValue.split(',').filter(item => item.trim()).map((item, index) => (
                <span key={index} className={`px-2 py-1 rounded text-xs ${column.optionColors?.[item.trim()] || 'bg-gray-100 text-gray-800'}`}>
                  {item.trim()}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No codes selected</span>
          )
        ) : (
          <span className="text-sm">{displayValue}</span>
        )}
        {canEdit && column.editable !== false && (
          <button
            onClick={() => handleCellEdit(row.id, column.id, value)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit3 size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left Section - Search and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {canAdd && (
                <>
                  <button
                    onClick={handleAddRow}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Row</span>
                  </button>
                  {canImport && (
                    <button
                      onClick={handleBulkImport}
                      className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      <Upload size={14} />
                      <span>Bulk Import</span>
                    </button>
                  )}
                </>
              )}
              
              {canExport && (
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              )}

              {canDelete && selectedRows.size > 0 && (
                <button
                  onClick={() => {
                    selectedRows.forEach(rowId => handleDeleteRow(rowId));
                    setSelectedRows(new Set());
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Delete ({selectedRows.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Row Count */}
          <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
            <span className="font-medium">{filteredAndSortedData.filter(r => !isPlaceholderRow(r.id)).length}</span> of <span className="font-medium">{MIN_ROWS}</span> rows
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-max table-fixed border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {/* Select All Checkbox */}
              <th className="px-4 py-3 text-left w-12 border-b border-gray-200">
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">All</span>
                </div>
              </th>
              
              {/* Column Headers */}
              {columns.map(column => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left font-medium text-gray-900 whitespace-nowrap border-b border-gray-200"
                  style={{ width: column.width ? `${column.width}px` : 'auto' }}
                >
                  <div className="flex flex-col space-y-2">
                    {/* Column Header with Sort */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleSort(column.id)}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span className="text-sm font-medium">{column.label}</span>
                        {sortColumn === column.id && (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </div>
                    
                    {/* Filter Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={`Filter ${column.label}...`}
                        value={filters[column.id] || ''}
                        onChange={(e) => handleFilterChange(column.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {filters[column.id] && (
                        <button
                          onClick={() => handleFilterChange(column.id, '')}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedData.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {/* Row Checkbox */}
                <td className="px-4 py-3 w-12 border-r border-gray-200">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      disabled={isPlaceholderRow(row.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </td>
                
                {/* Data Cells */}
                {columns.map(column => (
                  <td
                    key={column.id}
                    className="px-4 py-3 text-sm text-gray-900 min-w-0 border-r border-gray-200"
                    style={{ width: column.width ? `${column.width}px` : 'auto' }}
                  >
                    <div className="truncate">
                      {renderCell(row, column)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-12 bg-gray-50">
          <div className="text-gray-500">
            {data.length === 0 ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-lg font-medium">No data available</div>
                <div className="text-sm">Start by adding your first row</div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-lg font-medium">No rows match your filters</div>
                <div className="text-sm">Try adjusting your search or filter criteria</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelTable;

