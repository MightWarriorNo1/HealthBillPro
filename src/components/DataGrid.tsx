import React, { useMemo, useRef } from 'react';
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
}

export default function DataGrid<T = any>({
	columnDefs,
	rowData,
	height = 520,
	width = '100%',
	readOnly = false,
	onCellValueChanged,
	className
}: DataGridProps<T>) {
	const gridApiRef = useRef<GridApi | null>(null);

	const defaultColDef: ColDef = useMemo(() => ({
		resizable: true,
		sortable: true,
		filter: true,
		editable: !readOnly
	}), [readOnly]);

	const exportToXlsx = () => {
		const api = gridApiRef.current;
		if (!api) return;
		const rows: any[] = [];
		api.forEachNodeAfterFilterAndSort((node) => { if (node.data) rows.push(node.data); });
		const headers = columnDefs.map((c) => c.headerName || String(c.field || ''));
		const fields = columnDefs.map((c) => String(c.field || ''));
		const data = rows.map((r) => fields.map((f) => (r as any)[f]));
		const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data');
		XLSX.writeFile(wb, 'export.xlsx');
	};

	return (
		<div className={`space-y-2 ${className || ''}`}>
			<div className="flex items-center gap-2">
				<button onClick={exportToXlsx} className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-400 text-sm">Export XLSX</button>
			</div>
			<div className="ag-theme-alpine" style={{ height, width }}>
				<AgGridReact
					columnDefs={columnDefs}
					rowData={rowData}
					undoRedoCellEditing={true}
					clipboardPasteOnFocus={true}
					readOnlyEdit={!!readOnly}
					onGridReady={(p) => { gridApiRef.current = p.api; }}
					onCellValueChanged={onCellValueChanged}
					rowSelection={'multiple'}
					defaultColDef={defaultColDef}
				/>
			</div>
		</div>
	);
}


