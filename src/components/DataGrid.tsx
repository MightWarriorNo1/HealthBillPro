import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, GridApi, GridOptions, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import * as XLSX from 'xlsx';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps<T = any> {
	columnDefs: ColDef[];
	rowData: T[];
	height?: number | string;
	width?: number | string;
	readOnly?: boolean;
	onCellValueChanged?: GridOptions['onCellValueChanged'];
	className?: string;
  // Optional callback if parent wants to receive updated rows after local add/delete
  onRowsChange?: (rows: T[]) => void;
}

export default function DataGrid<T = any>({
	columnDefs,
	rowData,
	height = 520,
	width = '100%',
	readOnly = false,
	onCellValueChanged,
	className,
  onRowsChange
}: DataGridProps<T>) {
	const gridApiRef = useRef<GridApi | null>(null);
  const MIN_ROWS = 200;
  const [internalRows, setInternalRows] = useState<any[]>([]);

  // Initialize and sync internal rows with provided data
  useEffect(() => {
    const withIds = (rowData || []).map((r: any) => (
      r && typeof r === 'object' ? { __id: r.__id || `row-${cryptoRandom()}`, __placeholder: false, ...r } : r
    ));
    setInternalRows(withIds);
  }, [rowData]);

	const defaultColDef: ColDef = useMemo(() => ({
		resizable: true,
		sortable: false,
		filter: false,
		editable: !readOnly
	}), [readOnly]);

  // Build placeholders to always render 200 rows
  const placeholders = useMemo(() => {
    const count = Math.max(0, MIN_ROWS - internalRows.length);
    const fields = columnDefs.map((c) => String(c.field || ''));
    return Array.from({ length: count }).map((_, i) => {
      const obj: any = { __id: `dg-placeholder-${i}`, __placeholder: true };
      fields.forEach((f) => {
        if (!f) return;
        obj[f] = (undefined as any);
      });
      return obj;
    });
  }, [internalRows.length, columnDefs]);

  const displayRows = useMemo(() => {
    return [...internalRows, ...placeholders];
  }, [internalRows, placeholders]);

	const exportToXlsx = () => {
		const api = gridApiRef.current;
		if (!api) return;
		const rows: any[] = [];
		api.forEachNodeAfterFilterAndSort((node) => { if (node.data && !node.data.__placeholder) rows.push(node.data); });
		const headers = columnDefs.map((c) => c.headerName || String(c.field || ''));
		const fields = columnDefs.map((c) => String(c.field || ''));
		const data = rows.map((r) => fields.map((f) => (r as any)[f]));
		const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data');
		XLSX.writeFile(wb, 'export.xlsx');
	};

  const cryptoRandom = () => {
    // Simple random string without relying on window.crypto for SSR safety
    return Math.random().toString(36).slice(2, 10);
  };

  const addRow = () => {
    const fields = columnDefs.map((c) => String(c.field || ''));
    const newRow: any = { __id: `row-${cryptoRandom()}`, __placeholder: false };
    fields.forEach((f) => { if (f) newRow[f] = ''; });
    const next = [...internalRows, newRow];
    setInternalRows(next);
    onRowsChange && onRowsChange(next as any);
    // Optionally focus first cell
    setTimeout(() => {
      const api = gridApiRef.current;
      if (api) {
        api.setFocusedCell(next.length - 1, columnDefs[0]?.field as any);
        api.startEditingCell({ rowIndex: next.length - 1, colKey: columnDefs[0]?.field as any });
      }
    }, 0);
  };

  const deleteSelected = () => {
    const api = gridApiRef.current;
    if (!api) return;
    const idsToDelete = new Set<string>();
    api.getSelectedNodes().forEach((n) => {
      const d: any = n.data;
      if (d && !d.__placeholder) idsToDelete.add(d.__id);
    });
    if (idsToDelete.size === 0) return;
    const next = internalRows.filter((r: any) => !idsToDelete.has(r.__id));
    setInternalRows(next);
    onRowsChange && onRowsChange(next as any);
  };

	return (
		<div className={`space-y-2 ${className || ''}`}>
			<div className="flex items-center gap-2">
				<button onClick={exportToXlsx} className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-400 text-sm">Export XLSX</button>
				{!readOnly && (
					<>
						<button onClick={addRow} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Add Row</button>
						<button onClick={deleteSelected} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete Selected</button>
					</>
				)}
			</div>
			<div className="ag-theme-alpine" style={{ height, width }}>
				<AgGridReact
					columnDefs={columnDefs}
					rowData={displayRows}
					undoRedoCellEditing={true}
					clipboardPasteOnFocus={true}
					readOnlyEdit={!!readOnly}
					onGridReady={(p) => { gridApiRef.current = p.api; }}
					onCellValueChanged={onCellValueChanged}
					rowSelection={'multiple'}
					defaultColDef={{ 
						...defaultColDef, 
						cellStyle: { 
							borderRight: '1px solid #e5e7eb',
							borderBottom: '1px solid #e5e7eb',
							borderLeft: '1px solid #e5e7eb'
						}, 
						headerClass: 'ag-header-cell ag-header-cell-with-border'
					}}
					headerHeight={36}
					rowHeight={32}
				/>
			</div>
		</div>
	);
}


