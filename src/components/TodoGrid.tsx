import { useMemo, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import DataGrid from './DataGrid';

interface TodoGridProps {
  clinicId?: string;
  canEdit?: boolean;
  searchText?: string;
  filterStatus?: string; // 'all' | value
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

export default function TodoGrid({ clinicId, canEdit = true }: TodoGridProps) {
  const [rows, setRows] = useState<Row[]>([]);

  const statusValues = ['waiting','in_progress','ip','completed','on_hold'];

  const columnDefs: ColDef[] = useMemo(() => ([
    { field: 'claim_id', headerName: 'ID', editable: canEdit },
    {
      field: 'status', 
      headerName: 'Status', 
      editable: canEdit, 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: statusValues
      },
      cellClass: 'ag-cell-with-arrow'
    },
    { field: 'issue', headerName: 'Issue', editable: canEdit },
    { field: 'notes', headerName: 'Notes', editable: canEdit, flex: 1 },
    { field: 'flu_notes', headerName: 'Flu Notes', editable: canEdit, flex: 1 },
    { field: 'created_at', headerName: 'Created', editable: false, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '' }
  ]), [canEdit]);

  return (
    <DataGrid<Row>
      columnDefs={columnDefs}
      rowData={rows}
      readOnly={!canEdit}
      onRowsChange={(r) => setRows(r)}
      height={420}
      width={'100%'}
    />
  );
}


