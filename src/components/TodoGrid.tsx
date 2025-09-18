import { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, GridApi, GridOptions, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { supabase } from '../lib/supabase';

ModuleRegistry.registerModules([AllCommunityModule]);

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

export default function TodoGrid({ clinicId, canEdit = true, searchText = '', filterStatus = 'all', showCompleted = true, onSelectItem }: TodoGridProps) {
  const apiRef = useRef<GridApi | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    try {
      let q = supabase.from('todo_items').select('*').order('created_at', { ascending: false });
      if (clinicId) q = q.eq('clinic_id', clinicId);
      const { data, error } = await q;
      if (error) throw error;
      setRows((data as unknown as Row[]) || []);
    } catch {
      // noop
    }
  };

  useEffect(() => { load(); }, [clinicId]);

  const statusValues = ['waiting','in_progress','ip','completed','on_hold'];

  const columnDefs: ColDef[] = useMemo(() => ([
    { field: 'claim_id', headerName: 'ID', editable: canEdit },
    {
      field: 'status', headerName: 'Status', editable: canEdit, cellEditor: 'agSelectCellEditor', cellEditorParams: {
        values: statusValues
      }
    },
    { field: 'issue', headerName: 'Issue', editable: canEdit },
    { field: 'notes', headerName: 'Notes', editable: canEdit, flex: 1 },
    { field: 'flu_notes', headerName: 'Flu Notes', editable: canEdit, flex: 1 },
    { field: 'created_at', headerName: 'Created', editable: false, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '' }
  ]), [canEdit]);

  const onCellValueChanged: GridOptions['onCellValueChanged'] = async (e) => {
    const row = e.data as Row;
    const updates: any = { [String(e.colDef.field)]: e.newValue };
    if (String(e.colDef.field) === 'status') {
      updates.completed_at = e.newValue === 'completed' ? new Date().toISOString() : null;
    }
    await supabase.from('todo_items').update(updates).eq('id', row.id);
  };

  // Apply quick filter and additional filters when inputs change
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.setGridOption('quickFilterText', searchText);
    api.onFilterChanged();
  }, [searchText]);

  const doesExternalFilterPass = (node: any) => {
    const r: Row = node.data;
    const statusOk = filterStatus === 'all' || r.status === filterStatus;
    const completedOk = showCompleted || r.status !== 'completed';
    return statusOk && completedOk;
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 420, width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rows}
        defaultColDef={{ resizable: true, sortable: true, filter: true, editable: canEdit }}
        onGridReady={(p) => { apiRef.current = p.api; p.api.setGridOption('isExternalFilterPresent', () => true); p.api.setGridOption('doesExternalFilterPass', doesExternalFilterPass); }}
        onCellValueChanged={onCellValueChanged}
        rowSelection={'single'}
        onSelectionChanged={(e) => {
          const sel = e.api.getSelectedRows?.()[0] as Row | undefined;
          onSelectItem && onSelectItem(sel || null);
        }}
      />
    </div>
  );
}


