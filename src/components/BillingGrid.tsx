import { useMemo, useState, useEffect } from 'react';
import { DollarSign, ChevronDown, Lock, Unlock } from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

// Custom Multi-Select Cell Editor Component
interface MultiSelectCellEditorProps {
  value: string[] | string;
  options: string[];
  onSave: (value: string[]) => void;
}

function MultiSelectCellEditor({ value, options, onSave }: MultiSelectCellEditorProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      if (Array.isArray(value)) {
        setSelectedValues([...value]);
      } else if (typeof value === 'string') {
        setSelectedValues(value.split(',').map(v => v.trim()).filter(v => v));
      }
    } else {
      setSelectedValues([]);
    }
  }, [value]);

  const handleOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      if (!selectedValues.includes(option)) {
        setSelectedValues([...selectedValues, option]);
      }
    } else {
      setSelectedValues(selectedValues.filter(v => v !== option));
    }
  };

  const handleDone = () => {
    onSave(selectedValues);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        readOnly
        value={selectedValues.length === 0 ? 'Select CPT codes...' : selectedValues.join(', ')}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full border-none outline-none px-2 py-1 cursor-pointer ${selectedValues.length === 0 ? 'text-gray-500' : 'text-black'}`}
      />
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-2 border-blue-500 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="max-h-56 overflow-y-auto">
            {options.map((option) => (
            <div
              key={option}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                onClick={() => handleOptionChange(option, !selectedValues.includes(option))}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                  onChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                  className="m-0"
                />
                <span className="flex-1 text-black">{option}</span>
            </div>
          ))}
          </div>
          <button
            onClick={handleDone}
            className="w-full px-3 py-2 bg-blue-500 text-white text-center font-bold hover:bg-blue-600 rounded-b-md"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

interface BillingGridProps {
  clinicId?: string;
  providerId?: string;
  readOnly?: boolean;
  visibleColumns?: string[];
  dateRange?: { start: string; end: string };
  highlightOnly?: boolean;
  lockedColumns?: string[];
  highlightColor?: string;
  isSuperAdmin?: boolean;
}

type Entry = {
  id: string;
  provider_id: string;
  clinic_id: string;
  date: string;
  patient_name: string;
  procedure_code: string | string[];
  description: string;
  amount: number;
  status: string;
  claim_number?: string | null;
  notes?: string | null;
  appointment_status?: string | null;
  submit_info?: string | null;
  insurance_payment?: number | null;
  insurance_notes?: string | null;
  payment_amount?: number | null;
  payment_status?: string | null;
  month_tag?: string | null;
  // Optional admin fields when available
  insurance?: string | null;
  copay?: number | null;
  coinsurance?: number | null;
  // New fields to match image structure
  last_initial?: string | null;
  // A/R fields
  ar_name?: string | null;
  ar_date_of_service?: string | null;
  ar_amount?: number | null;
  ar_date_recorded?: string | null;
  ar_type?: string | null;
  ar_notes?: string | null;
};

const NUMBER_COLS = new Set(['amount', 'insurance_payment', 'payment_amount', 'copay', 'coinsurance', 'ar_amount']);

export default function BillingGrid({ clinicId, providerId, readOnly, visibleColumns, dateRange, highlightOnly, lockedColumns, highlightColor, isSuperAdmin = false }: BillingGridProps) {
  const [rowData, setRowData] = useState<Entry[]>([]);
  const [, setLoading] = useState(false);
  const [billingCodes, setBillingCodes] = useState<string[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [highlightedRowIds, setHighlightedRowIds] = useState<Set<string>>(new Set());
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDate, setBulkDate] = useState<string>('');
  const [internalLockedColumns, setInternalLockedColumns] = useState<Set<string>>(new Set(lockedColumns || []));
  
  // Load locked columns from database on mount
  useEffect(() => {
    const loadLockedColumns = async () => {
      try {
        if (clinicId) {
          const { data, error } = await supabase
            .from('clinic_settings')
            .select('setting_value')
            .eq('clinic_id', clinicId)
            .eq('setting_key', 'locked_columns')
            .single();
          
          if (!error && data?.setting_value) {
            setInternalLockedColumns(new Set(data.setting_value));
          }
        }
      } catch (error) {
        console.error('Failed to load locked columns:', error);
      }
    };
    
    loadLockedColumns();
  }, [clinicId]);
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [columnSizingInfo, setColumnSizingInfo] = useState<any>({});
  
  const columnHelper = createColumnHelper<Entry>();
  const isColumnLocked = (columnId: string): boolean => {
    return internalLockedColumns.has(columnId);
  };

  const toggleColumnLock = async (columnId: string) => {
    if (!isSuperAdmin) return; // Only super admin can toggle locks
    
    const newSet = new Set(internalLockedColumns);
    if (newSet.has(columnId)) {
      newSet.delete(columnId);
    } else {
      newSet.add(columnId);
    }
    
    setInternalLockedColumns(newSet);
    
    // Save to database for persistence across sessions
    try {
      const columnsArray = Array.from(newSet);
      await supabase
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId,
          setting_key: 'locked_columns',
          setting_value: columnsArray,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'clinic_id,setting_key'
        });
    } catch (error) {
      console.error('Failed to save locked columns to database:', error);
    }
  };
  const canEditCell = (columnId: string): boolean => {
    // Super admin can edit all columns, even locked ones
    if (isSuperAdmin) {
      return !readOnly && !highlightOnly;
    }
    // Regular users cannot edit locked columns
    return !readOnly && !highlightOnly && !isColumnLocked(columnId);
  };

  const getCellStyle = (columnId: string): React.CSSProperties => {
    if (isColumnLocked(columnId) && !isSuperAdmin) {
      return {
        backgroundColor: '#f3f4f6', // gray-100
        color: '#6b7280', // gray-500
        cursor: 'not-allowed'
      };
    }
    return {};
  };

  const getHeaderCellStyle = (columnId: string): React.CSSProperties => {
    // If column is locked, show gray header for ALL users
    if (isColumnLocked(columnId)) {
      return {
        backgroundColor: '#9ca3af', // gray-400
        color: '#ffffff'
      };
    }
    
    // Original colors for unlocked columns
    const styles: Record<string, { bg: string; fg: string }> = {
      // Medium purple (#9966CC) - columns 1-7, 15-17, 19
      id: { bg: '#9966CC', fg: '#FFFFFF' },
      patient_name: { bg: '#9966CC', fg: '#FFFFFF' },
      last_initial: { bg: '#9966CC', fg: '#FFFFFF' },
      insurance: { bg: '#9966CC', fg: '#FFFFFF' },
      copay: { bg: '#9966CC', fg: '#FFFFFF' },
      coinsurance: { bg: '#9966CC', fg: '#FFFFFF' },
      date: { bg: '#9966CC', fg: '#FFFFFF' },
      payment_amount: { bg: '#9966CC', fg: '#FFFFFF' },
      payment_status: { bg: '#9966CC', fg: '#FFFFFF' },
      claim_number: { bg: '#9966CC', fg: '#FFFFFF' },
      notes: { bg: '#9966CC', fg: '#FFFFFF' },
      // Orange (#FF9933) - columns 8-9
      procedure_code: { bg: '#FF9933', fg: '#FFFFFF' },
      appointment_status: { bg: '#FF9933', fg: '#FFFFFF' },
      // Dark green (#336600) - columns 10-11, 18
      status: { bg: '#336600', fg: '#FFFFFF' },
      submit_info: { bg: '#336600', fg: '#FFFFFF' },
      amount: { bg: '#336600', fg: '#FFFFFF' },
      // Light green (#99CC66) - columns 12-14
      insurance_payment: { bg: '#99CC66', fg: '#000000' },
      insurance_notes: { bg: '#99CC66', fg: '#000000' },
      description: { bg: '#99CC66', fg: '#000000' },
    };
    const s = styles[columnId];
    if (!s) return {};
    return {
      backgroundColor: s.bg,
      color: s.fg,
    } as React.CSSProperties;
  };

  // Allow native browser Find (Ctrl/Cmd+F) to work by exiting edit mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isFind = (e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F');
      if (isFind) {
        // End any active cell editing so visible text can be searched
        if (editingCell) setEditingCell(null);
        // Do not preventDefault; let browser handle Find
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingCell]);

  // Color maps for select options
  const getOptionColor = (fieldId: string, option: string): string => {
    const lower = String(option || '').toLowerCase();
    if (fieldId === 'status') {
      if (lower === 'approved' || lower === 'paid') return '#16a34a'; // green-600
      if (lower === 'rejected') return '#dc2626'; // red-600
      if (lower === 'pending') return '#d97706'; // amber-600
    }
    if (fieldId === 'payment_status') {
      if (lower === 'paid') return '#16a34a';
      if (lower === 'cc declined') return '#dc2626';
      if (lower === 'secondary') return '#2563eb';
      if (lower === 'payment plan') return '#7c3aed';
      if (lower === 'collections') return '#b91c1c';
      if (lower === 'refunded') return '#0ea5e9';
      if (lower === 'waiting on claims') return '#d97706';
    }
    if (fieldId === 'appointment_status') {
      if (lower === 'scheduled') return '#2563eb';
      if (lower === 'complete' || lower === 'pp complete') return '#16a34a';
      if (lower.includes('no charge')) return '#6b7280';
      if (lower === 'charge ns/lc') return '#b91c1c';
      if (lower === 'note not complete') return '#d97706';
    }
    // Months (insurance_notes, claim_number when used as month)
    // Shared month colors to match Billing Date chips
    const monthPalette: Record<string, string> = {
      january: '#ef4444',   // red-500
      february: '#3b82f6',  // blue-500
      march: '#f59e0b',     // amber-500
      april: '#22c55e',     // green-500
      may: '#10b981',       // emerald-500
      june: '#0ea5e9',      // sky-500
      july: '#2563eb',      // indigo/blue-600
      august: '#38bdf8',    // sky-400
      september: '#7c3aed', // violet-600
      october: '#a855f7',   // purple-500
      november: '#9333ea',  // purple-600
      december: '#6b7280',  // gray-500
    };
    if (fieldId === 'insurance_notes' || fieldId === 'claim_number') {
      return monthPalette[lower] || '#111827';
    }
    return '#111827'; // default gray-900
  };

  const getOptionBgStyle = (fieldId: string, option: string): { backgroundColor: string; color: string } => {
    const lower = String(option || '').toLowerCase();
    let bg = '#E5E7EB';
    let fg = '#111827';
    if (fieldId === 'status') {
      if (lower === 'approved' || lower === 'paid') { bg = '#16a34a'; fg = '#ffffff'; }
      else if (lower === 'rejected') { bg = '#dc2626'; fg = '#ffffff'; }
      else if (lower === 'pending') { bg = '#f59e0b'; fg = '#111827'; }
    } else if (fieldId === 'payment_status') {
      if (lower === 'paid') { bg = '#16a34a'; fg = '#ffffff'; }
      else if (lower === 'cc declined') { bg = '#dc2626'; fg = '#ffffff'; }
      else if (lower === 'secondary') { bg = '#2563eb'; fg = '#ffffff'; }
      else if (lower === 'payment plan') { bg = '#7c3aed'; fg = '#ffffff'; }
      else if (lower === 'collections') { bg = '#b91c1c'; fg = '#ffffff'; }
      else if (lower === 'refunded') { bg = '#0ea5e9'; fg = '#0b1c26'; }
      else if (lower === 'waiting on claims') { bg = '#f59e0b'; fg = '#111827'; }
    }
    return { backgroundColor: bg, color: fg };
  };

  // Removed unused hexToRgba helper

  // Reserved for future styling; remove if unused

  const loadRows = async () => {
    setLoading(true);
    try {
      let q = supabase.from('billing_entries').select('*').order('date', { ascending: false }).limit(200);
      if (clinicId) q = q.eq('clinic_id', clinicId);
      if (providerId) q = q.eq('provider_id', providerId);
      if (dateRange?.start) q = q.gte('date', dateRange.start);
      if (dateRange?.end) q = q.lte('date', dateRange.end);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data as unknown as Entry[]) || [];
      
      // Process rows to handle procedure_code arrays
      const processedRows = rows.map(row => ({
        ...row,
        procedure_code: row.procedure_code && typeof row.procedure_code === 'string' && row.procedure_code.includes(',') 
          ? row.procedure_code.split(',').map(code => code.trim()).filter(code => code.length > 0)
          : row.procedure_code
      }));
      
      // Pad with placeholders to always render 200 rows
      const padded: Entry[] = processedRows.slice(0);
      for (let i = rows.length; i < 200; i++) {
        padded.push({
          id: `placeholder-${i}`,
          provider_id: providerId || '',
          clinic_id: clinicId || '',
          date: '',
          patient_name: '',
          procedure_code: '',
          description: '',
          amount: 0,
          status: '',
          claim_number: null,
          notes: '',
          appointment_status: '',
          submit_info: '',
          insurance_payment: null,
          insurance_notes: '',
          payment_amount: null,
          payment_status: '',
          month_tag: '',
          insurance: null,
          copay: null,
          coinsurance: null,
          last_initial: null,
          ar_name: null,
          ar_date_of_service: null,
          ar_amount: null,
          ar_date_recorded: null,
          ar_type: null,
          ar_notes: null
        } as unknown as Entry);
      }
      setRowData(padded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [clinicId, providerId, dateRange?.start, dateRange?.end]);

  // Update billing tracker when data changes
  useEffect(() => {
    const updateTracker = () => {
      const claimsNotPaid = rowData.filter(r => r.status && !['Paid', 'paid'].includes(r.status)).length;
      const insuranceCollected = rowData.reduce((sum, r) => sum + (Number(r.insurance_payment) || 0), 0);
      const patientPayments = rowData.reduce((sum, r) => sum + (Number(r.payment_amount) || 0), 0);
      const totalCollected = insuranceCollected + patientPayments;
      
      const claimsEl = document.getElementById('billing-tracker-claims');
      const insEl = document.getElementById('billing-tracker-ins');
      const ptEl = document.getElementById('billing-tracker-pt');
      const totalEl = document.getElementById('billing-tracker-total');
      
      if (claimsEl) claimsEl.textContent = claimsNotPaid.toString();
      if (insEl) insEl.textContent = `$${insuranceCollected.toLocaleString()}`;
      if (ptEl) ptEl.textContent = `$${patientPayments.toLocaleString()}`;
      if (totalEl) totalEl.textContent = `$${totalCollected.toLocaleString()}`;
    };
    
    updateTracker();
  }, [rowData]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('billing_codes')
          .select('code')
          .order('code', { ascending: true });
        if (error) throw error;
        setBillingCodes((data || []).map((r: any) => r.code));
      } catch (_) {
        setBillingCodes([]);
      }
    })();
  }, []);

  const updateCellValue = async (rowId: string, columnId: string, value: any) => {
    if (String(rowId).startsWith('placeholder-')) return;
    if (highlightOnly) return;
    // Only prevent saving locked columns for non-super admin users
    if (isColumnLocked(columnId) && !isSuperAdmin) return;
    
    const field = columnId;
    let processedValue = NUMBER_COLS.has(field) ? Number(value || 0) : value;
    
    // Handle procedure_code field for multiple selections
    if (field === 'procedure_code' && Array.isArray(value)) {
      processedValue = value.filter(v => v && v.trim()).join(', ');
    }
    
    const updates: Record<string, any> = { [field]: processedValue };
    
    // Handle payment_status field specifically
    if (field === 'payment_status') {
      updates.payment_status = value || null;
    }
    
    // Auto-lookup by patient ID when user pastes/types numeric ID in patient_name
    try {
      if (field === 'patient_name' && /^\d+$/.test(String(value || ''))) {
        const { data: p } = await supabase
          .from('patients')
          .select('patient_id, first_name, last_name, insurance, copay, coinsurance')
          .eq('patient_id', String(value))
          .maybeSingle();
        if (p) {
          updates.patient_name = `${p.first_name} ${p.last_name}`.trim();
          updates.insurance = p.insurance || null;
          updates.copay = p.copay ?? null;
          updates.coinsurance = p.coinsurance ?? null;
        }
      }
      
      const { error } = await supabase.from('billing_entries').update(updates).eq('id', rowId);
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      // Update local state (normalize id equality for string/number ids)
      setRowData(prev => prev.map(row => String(row.id) === String(rowId) ? { ...row, ...updates } : row));
    } catch (error) {
      console.error('Failed to update billing entry:', error);
    }
  };

  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="text"
              defaultValue={value || ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {value}
            </div>
          );
        },
      }),
      columnHelper.accessor('patient_name', {
        header: 'First Name',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="text"
              defaultValue={value || ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {value}
            </div>
          );
        },
      }),
      columnHelper.accessor('last_initial', {
        header: 'Last Initial',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="text"
              defaultValue={value || ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {value}
            </div>
          );
        },
      }),
      columnHelper.accessor('insurance', {
        header: 'Ins',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="text"
              defaultValue={value || ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {value}
            </div>
          );
        },
      }),
      columnHelper.accessor('copay', {
        header: 'Co-pay',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value || 0}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, parseFloat(e.target.value) || 0);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, parseFloat(e.currentTarget.value) || 0);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1 text-right" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {(value && typeof value === 'number') ? value.toFixed(2) : '0.00'}
            </div>
          );
        },
      }),
      columnHelper.accessor('coinsurance', {
        header: 'Co-ins',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value || 0}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, parseFloat(e.target.value) || 0);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, parseFloat(e.currentTarget.value) || 0);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1 text-right" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {(value && typeof value === 'number') ? value.toFixed(2) : '0.00'}
            </div>
          );
        },
      }),
      columnHelper.accessor('date', {
        header: 'Date of Service',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          const formattedValue = value ? (() => {
            const d = new Date(value);
            if (isNaN(d.getTime())) return value;
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            return `${mm}-${dd}-${yy}`;
          })() : '';
          
          return isEditing && canEditCell(id) ? (
            <input
              type="date"
              defaultValue={value ? new Date(value).toISOString().split('T')[0] : ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {formattedValue}
            </div>
          );
        },
      }),
      columnHelper.accessor('procedure_code', {
        header: 'CPT Code',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          
          if (isEditing && canEditCell(id)) {
            return (
              <div className="relative">
                <MultiSelectCellEditor
                  value={value}
                  options={billingCodes}
                  onSave={async (newValue) => {
                    await updateCellValue(row.original.id, id, newValue);
                    setEditingCell(null);
                  }}
                />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            );
          }
          
          const displayValue = Array.isArray(value) 
            ? value.join(', ')
            : (typeof value === 'string' && value.includes(',')) 
              ? value 
              : value || '';
              
          return (
            <div 
              className="px-2 py-1 cursor-pointer relative" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {displayValue}
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          );
        },
      }),
      columnHelper.accessor('appointment_status', {
        header: 'Appt Status',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          const options = ['Scheduled','Complete','PP Complete','Charge NS/LC','RS No Charge','NS No Charge','Note not complete'];
          
          return isEditing && canEditCell(id) ? (
            <div className="relative">
              <select
                defaultValue={value || ''}
                className="w-full h-full border-none outline-none px-2 py-1 bg-white appearance-none pr-6"
                onBlur={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                onChange={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(option => (
                  <option key={option} value={option} style={{ color: getOptionColor('appointment_status', option) }}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <div 
              className="px-2 py-1 cursor-pointer relative" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              <span style={{ color: getOptionColor('appointment_status', value) }}>{value}</span>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Claim Status',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          const options = ['pending','approved','paid','rejected'];
          
          return isEditing && canEditCell(id) ? (
            <div className="relative">
              <select
                defaultValue={value || ''}
                className="w-full h-full border-none outline-none px-2 py-1 appearance-none pr-6 rounded"
                style={getOptionBgStyle('status', value)}
                onBlur={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                onChange={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(option => (
                  <option key={option} value={option} style={getOptionBgStyle('status', option)}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-200 pointer-events-none" />
            </div>
          ) : (
            <div 
              className="px-2 py-1 cursor-pointer relative" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              <div className="px-2 py-1 rounded text-center" style={getOptionBgStyle('status', value)}>{value || ''}</div>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            </div>
          );
        },
      }),
      // Inserted to match image: Most Recent Submit Date after Claim Status
      columnHelper.accessor('submit_info', {
        header: 'Most Recent Submit Date',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="text"
              defaultValue={value || ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {value || ''}
            </div>
          );
        },
      }),
      columnHelper.accessor('insurance_payment', {
        header: 'Ins Pay',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value || 0}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, parseFloat(e.target.value) || 0);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, parseFloat(e.currentTarget.value) || 0);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1 text-right" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {(value && typeof value === 'number') ? value.toFixed(2) : '0.00'}
            </div>
          );
        },
      }),
      columnHelper.accessor('insurance_notes', {
        header: 'Ins Pay Date',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          const options = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          
          return isEditing && canEditCell(id) ? (
            <div className="relative">
              <select
                defaultValue={value || ''}
                className="w-full h-full border-none outline-none px-2 py-1 bg-white appearance-none pr-6"
                onBlur={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                onChange={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(option => (
                  <option key={option} value={option} style={{ color: getOptionColor('insurance_notes', option) }}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <div 
              className="px-2 py-1 cursor-pointer relative" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              <span style={{ color: getOptionColor('insurance_notes', value) }}>{value}</span>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          );
        },
      }),
      columnHelper.accessor('description', {
        header: 'PT RES',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value || 0}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, parseFloat(e.target.value) || 0);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, parseFloat(e.currentTarget.value) || 0);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1 text-right" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {(value && typeof value === 'number') ? value.toFixed(2) : '0.00'}
            </div>
          );
        },
      }),
      columnHelper.accessor('payment_amount', {
        header: 'Collected from PT',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value || 0}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, parseFloat(e.target.value) || 0);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, parseFloat(e.currentTarget.value) || 0);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1 text-right" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {(value && typeof value === 'number') ? value.toFixed(2) : '0.00'}
            </div>
          );
        },
      }),
      columnHelper.accessor('payment_status', {
        header: 'PT Pay Status',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          const options = ['Paid','CC declined','Secondary','Payment Plan','Collections','Refunded','Waiting on Claims'];
          
          return isEditing && canEditCell(id) ? (
            <div className="relative">
              <select
                defaultValue={value || ''}
                className="w-full h-full border-none outline-none px-2 py-1 appearance-none pr-6 rounded"
                style={getOptionBgStyle('payment_status', value)}
                onBlur={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                onChange={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(option => (
                  <option key={option} value={option} style={getOptionBgStyle('payment_status', option)}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-200 pointer-events-none" />
            </div>
          ) : (
            <div 
              className="px-2 py-1 cursor-pointer relative" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              <div className="px-2 py-1 rounded text-center" style={getOptionBgStyle('payment_status', value)}>{value || ''}</div>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            </div>
          );
        },
      }),
      columnHelper.accessor('claim_number', {
        header: 'PT Payment AR Ref Date',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          const options = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          
          return isEditing && canEditCell(id) ? (
            <div className="relative">
              <select
                defaultValue={value || ''}
                className="w-full h-full border-none outline-none px-2 py-1 bg-white appearance-none pr-6"
                onBlur={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                onChange={async (e) => {
                  await updateCellValue(row.original.id, id, e.target.value);
                  setEditingCell(null);
                }}
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(option => (
                  <option key={option} value={option} style={{ color: getOptionColor('claim_number', option) }}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <div 
              className="px-2 py-1 cursor-pointer relative" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              <span style={{ color: getOptionColor('claim_number', value) }}>{value}</span>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          );
        },
      }),
      columnHelper.accessor('amount', {
        header: 'Total Pay',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value || 0}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, parseFloat(e.target.value) || 0);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, parseFloat(e.currentTarget.value) || 0);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1 text-right" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {(value && typeof value === 'number') ? value.toFixed(2) : '0.00'}
            </div>
          );
        },
      }),
      columnHelper.accessor('notes', {
        header: 'Notes',
        cell: ({ getValue, row, column: { id } }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === id;
          const value = getValue() as any;
          return isEditing && canEditCell(id) ? (
            <input
              type="text"
              defaultValue={value || ''}
              className="w-full h-full border-none outline-none px-2 py-1"
              onBlur={async (e) => {
                await updateCellValue(row.original.id, id, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellValue(row.original.id, id, e.currentTarget.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="px-2 py-1" 
              style={getCellStyle(id)}
              onClick={() => canEditCell(id) && setEditingCell({ rowId: row.original.id, columnId: id })}
            >
              {value}
            </div>
          );
        },
      }),
    ];

    // Apply visible columns filter if specified
    if (visibleColumns && visibleColumns.length > 0) {
      const map: Record<string, string> = {
        A: 'id',
        B: 'patient_name',
        C: 'last_initial',
        D: 'insurance',
        E: 'copay',
        F: 'coinsurance',
        G: 'date',
        H: 'procedure_code',
        I: 'appointment_status',
        J: 'status',
        K: 'submit_info',
        L: 'insurance_payment',
        M: 'insurance_notes',
        N: 'description',
        O: 'payment_amount',
        P: 'payment_status',
        Q: 'claim_number',
        R: 'amount',
        S: 'notes'
      };
      const keep = new Set(visibleColumns.map((c) => map[c] || c));
      return cols.filter((col) => keep.has(col.id || ''));
    }

    return cols;
  }, [billingCodes, editingCell, readOnly, highlightOnly, lockedColumns]);

  const table = useReactTable({
    data: rowData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      columnSizingInfo,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    columnResizeMode: 'onChange',
    onRowSelectionChange: (updaterOrValue) => {
      const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue({}) : updaterOrValue;
      const selectedIds = new Set<string>();
      rowData.forEach((row, index) => {
        if (newSelection[index]) {
          selectedIds.add(row.id);
        }
      });
      setSelectedRowIds(selectedIds);
    },
  });


  // Paste functionality simplified for TanStack Table
  const copySelection = () => {
    const selectedRows = rowData.filter(row => selectedRowIds.has(row.id));
    const copiedText = selectedRows.map(row => 
      Object.values(row).join('\t')
    ).join('\n');
    navigator.clipboard.writeText(copiedText);
  };

  const addRowRelative = async (position: 'above' | 'below') => {
    const firstSelectedId = Array.from(selectedRowIds)[0];
    const selected = rowData.find(r => r.id === firstSelectedId) || null;
    const baseDate = selected?.date || null;
    const { data: inserted } = await supabase
      .from('billing_entries')
      .insert({
        clinic_id: clinicId || null,
        provider_id: providerId || null,
        date: baseDate,
        patient_name: '',
        procedure_code: '',
        description: '',
        amount: 0,
        status: 'pending',
        claim_number: null,
        notes: null,
        last_initial: null,
        ar_name: null,
        ar_date_of_service: null,
        ar_amount: null,
        ar_date_recorded: null,
        ar_type: null,
        ar_notes: null
      })
      .select('*');
    const newRow = (inserted && inserted[0]) as any;
    if (!newRow) { await loadRows(); return; }
    const idx = selected ? rowData.findIndex(r => r.id === selected.id) : 0;
    const insertAt = Math.max(0, position === 'above' ? idx : idx + 1);
    setRowData(prev => {
      const clone = prev.slice(0);
      clone.splice(insertAt, 0, newRow);
      return clone.slice(0, 200);
    });
      setSelectedRowIds(new Set([newRow.id]));
  };

  const deleteSelectedRows = async () => {
    if (selectedRowIds.size === 0) return;
    const ids = Array.from(selectedRowIds);
    await supabase.from('billing_entries').delete().in('id', ids);
    await loadRows();
    setSelectedRowIds(new Set());
  };

  const toggleHighlightSelected = () => {
    if (selectedRowIds.size === 0) return;
    setHighlightedRowIds(prev => {
      const next = new Set(prev);
      const ids = Array.from(selectedRowIds);
      const shouldHighlight = ids.some(id => !next.has(id));
      for (const id of ids) {
        if (shouldHighlight) next.add(id); else next.delete(id);
      }
      return next;
    });
  };


  const importXlsx = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
      if (!rows.length) return;
      // Map columns by best-effort header match
      const mapped = rows.map((r: any) => ({
        clinic_id: clinicId || null,
        provider_id: providerId || null,
        date: r.Date || r.date || r.DATE || '',
        patient_name: r['Patient Name'] || r.patient || r.Patient || '',
        procedure_code: r['Procedure Code'] || r.code || '',
        description: r.Description || r.desc || '',
        amount: Number(r.Amount || r.amount || 0),
        status: r.Status || r.status || 'pending',
        claim_number: r['Claim #'] || r.claim || null,
        notes: r.Notes || r.notes || null
      }));
      await supabase.from('billing_entries').insert(mapped);
      await loadRows();
    };
    reader.readAsArrayBuffer(file);
  };

  const totals = useMemo(() => {
    const insuranceCollected = rowData.reduce((sum, r) => sum + (Number(r.insurance_payment) || 0), 0);
    const patientPayments = rowData.reduce((sum, r) => sum + (Number(r.payment_amount) || 0), 0);
    const totalPayments = rowData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { insuranceCollected, patientPayments, totalPayments };
  }, [rowData]);

  return (
    <div className="space-y-3">
      {(!readOnly || highlightOnly) && (
        <div className="flex items-center gap-2">
          {!highlightOnly && (
            <>
              <label className="px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-200">
                Import XLSX
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && importXlsx(e.target.files[0])} />
              </label>
              <button className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={() => { setShowBulk(true); setBulkDate(new Date().toISOString().split('T')[0]); }}>Paste Patient IDs</button>
              <div className="mx-2 h-6 w-px bg-gray-300" />
            </>
          )}
          {!highlightOnly && (
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={async () => {
            const { data: inserted } = await supabase
              .from('billing_entries')
              .insert({
                clinic_id: clinicId || null,
                provider_id: providerId || null,
                date: null,
                patient_name: '',
                procedure_code: '',
                description: '',
                amount: 0,
                status: 'pending',
                claim_number: null,
                notes: null,
                last_initial: null,
                ar_name: null,
                ar_date_of_service: null,
                ar_amount: null,
                ar_date_recorded: null,
                ar_type: null,
                ar_notes: null
              })
              .select('*');
            if (inserted && inserted.length) {
              setRowData((prev) => [inserted[0] as any, ...prev].slice(0, 200));
            } else {
              await loadRows();
            }
          }}>Add Row</button>
          )}
          {!highlightOnly && (
            <>
              <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={() => addRowRelative('above')}>Add Row Above</button>
              <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={() => addRowRelative('below')}>Add Row Below</button>
              <button className="px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200" onClick={deleteSelectedRows}>Delete Row(s)</button>
              <div className="mx-2 h-6 w-px bg-gray-300" />
            </>
          )}
          <button className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200" onClick={toggleHighlightSelected}>Highlight</button>
          {isSuperAdmin && (
            <>
              <div className="mx-2 h-6 w-px bg-gray-300" />
              <button 
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1" 
                onClick={async () => {
                  const allColumns = table.getAllLeafColumns().map(col => col.id);
                  setInternalLockedColumns(new Set(allColumns));
                  
                  // Save to database
                  try {
                    await supabase
                      .from('clinic_settings')
                      .upsert({
                        clinic_id: clinicId,
                        setting_key: 'locked_columns',
                        setting_value: allColumns,
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'clinic_id,setting_key'
                      });
                  } catch (error) {
                    console.error('Failed to save locked columns to database:', error);
                  }
                }}
                title="Lock all columns"
              >
                <Lock size={14} />
                Lock All
              </button>
              <button 
                className="px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 flex items-center gap-1" 
                onClick={async () => {
                  setInternalLockedColumns(new Set());
                  
                  // Save to database
                  try {
                    await supabase
                      .from('clinic_settings')
                      .upsert({
                        clinic_id: clinicId,
                        setting_key: 'locked_columns',
                        setting_value: [],
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'clinic_id,setting_key'
                      });
                  } catch (error) {
                    console.error('Failed to save locked columns to database:', error);
                  }
                }}
                title="Unlock all columns"
              >
                <Unlock size={14} />
                Unlock All
              </button>
            </>
          )}
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={copySelection}>Copy</button>
          <span className="text-xs text-gray-500">Paste with Ctrl+V</span>

        </div>
      )}
      {/* Column visibility toolbar below actions, above table */}
      {(!readOnly || highlightOnly) && (
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="text-xs text-gray-500">Columns:</span>
          {table.getAllLeafColumns().map((col) => {
            const headerLabel = String((col.columnDef as any).header || col.id || '');
            const visible = col.getIsVisible();
            return (
              <button
                key={col.id}
                className={`px-2 py-1 rounded text-xs border ${visible ? 'bg-white text-gray-800 hover:bg-gray-100' : 'bg-gray-100 text-gray-500 line-through'}`}
                title={`Toggle ${headerLabel}`}
                onClick={() => col.toggleVisibility(!visible)}
              >
                {headerLabel}
              </button>
            );
          })}
          <button
            className="px-2 py-1 rounded text-xs border bg-white text-gray-800 hover:bg-gray-100"
            onClick={() => {
              const next: Record<string, boolean> = {};
              table.getAllLeafColumns().forEach(c => { next[c.id] = false; });
              setColumnVisibility(next);
            }}
          >
            Hide All
          </button>
          <button
            className="px-2 py-1 rounded text-xs border bg-white text-gray-800 hover:bg-gray-100"
            onClick={() => {
              const next: Record<string, boolean> = {};
              table.getAllLeafColumns().forEach(c => { next[c.id] = true; });
              setColumnVisibility(next);
            }}
          >
            Show All
          </button>
        </div>
      )}
      <div className="overflow-auto border border-gray-300" style={{ height: 520, width: '100%' }}>
        <table className="w-full table-auto bg-white" style={{ width: table.getTotalSize() }}>
          <thead className="bg-gray-50 border-b select-none">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 relative"
                    style={{ ...getHeaderCellStyle(header.column.id), width: header.getSize() }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex-1 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'asc' ? '↑' :
                              header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                          </span>
                        )}
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleColumnLock(header.column.id);
                          }}
                          className="ml-2 p-1 rounded hover:bg-gray-200 text-white hover:text-gray-800"
                          title={isColumnLocked(header.column.id) ? 'Unlock column' : 'Lock column'}
                        >
                          {isColumnLocked(header.column.id) ? (
                            <Lock size={14} />
                          ) : (
                            <Unlock size={14} />
                          )}
                        </button>
                      )}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-transparent hover:bg-gray-300 ${header.column.getIsResizing() ? 'bg-gray-400' : ''}`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 ${
                  selectedRowIds.has(row.original.id)
                    ? 'bg-blue-50'
                    : highlightedRowIds.has(row.original.id)
                    ? ''
                    : ''
                }`}
                style={{
                  backgroundColor: highlightedRowIds.has(row.original.id) 
                    ? (highlightColor ? `${highlightColor}20` : '#FEF3C7') 
                    : undefined
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Totals Footer */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center mt-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div>
            <p className="text-sm font-medium text-gray-600">Insurance Payments</p>
            <p className="text-xl font-bold text-gray-900">${totals.insuranceCollected.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Patient Payments</p>
            <p className="text-xl font-bold text-gray-900">${totals.patientPayments.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Payment</p>
            <p className="text-xl font-bold text-gray-900">${totals.totalPayments.toLocaleString()}</p>
          </div>
        </div>
      </div>
      {showBulk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="text-lg font-semibold mb-2 text-black">Bulk Add by Patient IDs</div>
            <div className="text-sm text-gray-600 mb-4">Paste 20-50 patient IDs (one per line). We'll auto-fill names and insurance and create rows.</div>
            <div className="grid grid-cols-1 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Service</label>
                <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-black rounded" />
              </div>
              <textarea className="w-full h-40 px-3 py-2 border border-gray-300 text-black rounded" placeholder="3861\n4092\n..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowBulk(false)}>Cancel</button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={async () => {
                const ids = Array.from(new Set(bulkText.split(/\r?\n/).map(s => s.trim()).filter(s => /^\d+$/.test(s))));
                if (ids.length === 0) { setShowBulk(false); return; }
                const inserts: any[] = [];
                for (const pid of ids) {
                  try {
                    const { data: p } = await supabase
                      .from('patients')
                      .select('patient_id, first_name, last_name, insurance, copay, coinsurance')
                      .eq('patient_id', pid)
                      .maybeSingle();
                    inserts.push({
                      clinic_id: clinicId || null,
                      provider_id: providerId || null,
                      date: bulkDate || new Date().toISOString().split('T')[0],
                      patient_name: p ? `${p.first_name} ${p.last_name}`.trim() : pid,
                      procedure_code: '',
                      description: '',
                      amount: 0,
                      status: 'pending',
                      claim_number: null,
                      notes: null,
                      insurance: p?.insurance || null,
                      copay: p?.copay ?? null,
                      coinsurance: p?.coinsurance ?? null,
                      month_tag: new Date(bulkDate || Date.now()).toLocaleString('en-US', { month: 'short' }),
                      last_initial: null,
                      ar_name: null,
                      ar_date_of_service: null,
                      ar_amount: null,
                      ar_date_recorded: null,
                      ar_type: null,
                      ar_notes: null
                    });
                  } catch {}
                }
                if (inserts.length > 0) {
                  await supabase.from('billing_entries').insert(inserts);
                  await loadRows();
                }
                setShowBulk(false);
                setBulkText('');
              }}>Create Rows</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

