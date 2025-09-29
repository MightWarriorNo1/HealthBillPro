import { useMemo, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import DataGrid from './DataGrid';

interface TodoGridProps {
  clinicId?: string;
  canEdit?: boolean;
  searchText?: string;
  filterStatus?: string; // 'all' | value
  filterId?: string; // claim_id contains
  showCompleted?: boolean;
  onSelectItem?: (row: any | null) => void;
}

type Row = {
  id: string;
  clinic_id?: string;
  claim_id: string;
  status: string;
  issue: string;
  notes: string;
  flu_notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  completed_at?: string | null;
};

export default function TodoGrid({ canEdit = true, searchText = '', filterStatus = 'all', filterId = '', showCompleted = false }: TodoGridProps) {
  const [rows, setRows] = useState<Row[]>([]);

  const statusValues = ['waiting','in_progress','ip','completed','on_hold'];

  // Map to the same colored button-style used in billing views
  const getTodoStatusClasses = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'ip': return 'bg-purple-100 text-purple-800';
      case 'on_hold': return 'bg-amber-100 text-amber-800';
      case 'waiting': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columnDefs: ColDef[] = useMemo(() => ([
    {
      field: 'claim_id',
      headerName: 'ID',
      editable: canEdit
    },
    {
      field: 'status', 
      headerName: 'Status', 
      editable: canEdit, 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: statusValues
      },
      cellClass: 'ag-cell-with-arrow',
      cellRenderer: (params: any) => {
        const value = String(params.value || '');
        return (
          <div className="px-2 py-1 cursor-default relative flex items-center justify-center">
            <div className={`px-2 py-1 rounded text-center text-sm ${getTodoStatusClasses(value)}`}>{value}</div>
          </div>
        );
      }
    },
    { field: 'issue', headerName: 'Issue', editable: canEdit },
    { field: 'notes', headerName: 'Notes', editable: canEdit, flex: 1 },
    { field: 'flu_notes', headerName: 'Flu Notes', editable: canEdit, flex: 1 },
    { field: 'created_at', headerName: 'Created', editable: false, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '' }
  ]), [canEdit]);

  const filteredRows = useMemo(() => {
    const text = String(searchText || '').toLowerCase();
    const idFilter = String(filterId || '').toLowerCase();
    return rows.filter((r) => {
      const matchesCompleted = showCompleted ? true : !r.completed_at;
      const matchesStatus = filterStatus === 'all'
        ? true
        : String(r.status || '').toLowerCase() === String(filterStatus || '').toLowerCase();
      const matchesId = idFilter ? String(r.claim_id || '').toLowerCase().includes(idFilter) : true;
      const matchesText = text
        ? [r.claim_id, r.status, r.issue, r.notes, r.flu_notes, r.created_by]
            .some((v) => String(v || '').toLowerCase().includes(text))
        : true;
      return matchesCompleted && matchesStatus && matchesId && matchesText;
    });
  }, [rows, searchText, filterStatus, filterId, showCompleted]);

  return (
    <DataGrid<Row>
      columnDefs={columnDefs}
      rowData={filteredRows}
      readOnly={!canEdit}
      onRowsChange={(r) => setRows(r)}
      height={420}
      width={'100%'}
    />
  );
}


