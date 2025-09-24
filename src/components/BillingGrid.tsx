import React, { useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridOptions, RowSelectedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

// Register AG Grid Community modules (required from v34+)
ModuleRegistry.registerModules([AllCommunityModule]);

interface BillingGridProps {
  clinicId?: string;
  providerId?: string;
  readOnly?: boolean;
  visibleColumns?: string[];
  dateRange?: { start: string; end: string };
}

type Entry = {
  id: string;
  provider_id: string;
  clinic_id: string;
  date: string;
  patient_name: string;
  procedure_code: string;
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
};

const NUMBER_COLS = new Set(['amount', 'insurance_payment', 'payment_amount', 'copay', 'coinsurance']);

export default function BillingGrid({ clinicId, providerId, readOnly, visibleColumns, dateRange }: BillingGridProps) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [rowData, setRowData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [billingCodes, setBillingCodes] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDate, setBulkDate] = useState<string>('');

  const loadRows = async () => {
    setLoading(true);
    try {
      let q = supabase.from('billing_entries').select('*').order('date', { ascending: false });
      if (clinicId) q = q.eq('clinic_id', clinicId);
      if (providerId) q = q.eq('provider_id', providerId);
      if (dateRange?.start) q = q.gte('date', dateRange.start);
      if (dateRange?.end) q = q.lte('date', dateRange.end);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data as unknown as Entry[]) || [];
      setRowData(rows);
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

  const numberParser = (params: any) => {
    const v = parseFloat(params.newValue);
    return Number.isFinite(v) ? v : 0;
  };

  const columnDefs: ColDef[] = useMemo(() => {
    const defs: Array<[string, ColDef]> = [
      ['patient_name', { headerName: 'Patient Name', editable: !readOnly }],
      ['procedure_code', { headerName: 'Procedure Code', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: billingCodes } }],
      ['description', { headerName: 'Description', editable: !readOnly }],
      ['amount', { headerName: 'Amount', editable: !readOnly, valueParser: numberParser }],
      ['date', { headerName: 'Date', editable: !readOnly, valueFormatter: (p: any) => {
        if (!p.value) return '';
        const d = new Date(p.value);
        if (isNaN(d.getTime())) return p.value;
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${mm}-${dd}-${yy}`;
      }}],
      ['status', { headerName: 'Claim Status', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Claim Sent','RS','IP','Paid','Denial','Rejection','No Coverage','PP','Deductible','N/A','pending','approved','rejected'] } }],
      ['claim_number', { headerName: 'Claim #', editable: !readOnly }],
      ['notes', { headerName: 'Notes', editable: !readOnly }],
      ['appointment_status', { headerName: 'Appt Status', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Complete','PP Complete','Charge NS/LC','RS No Charge','NS No Charge','Note not complete'] } }],
      ['submit_info', { headerName: 'Submit Info', editable: !readOnly, valueFormatter: (p: any) => {
        // If value looks like a date, show MM-DD, else raw
        if (!p.value) return '';
        const d = new Date(p.value);
        if (isNaN(d.getTime())) return p.value;
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${mm}-${dd}`;
      }}],
       ['insurance_payment', { headerName: 'Ins. Payment', editable: !readOnly, valueParser: numberParser, valueFormatter: (p: any) => {
         if (!p.value) return '';
         const d = new Date(p.value);
         if (isNaN(d.getTime())) return p.value;
         const month = d.toLocaleString('en-US', { month: 'short' });
         return month;
       }, cellClass: (p: any) => {
         if (!p.value) return '';
         const d = new Date(p.value);
         if (isNaN(d.getTime())) return '';
         const m = d.getMonth();
         const colors = ['bg-red-50 text-red-700', 'bg-pink-50 text-pink-700', 'bg-orange-50 text-orange-700', 'bg-lime-50 text-lime-700', 'bg-emerald-50 text-emerald-700', 'bg-cyan-50 text-cyan-700', 'bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700', 'bg-violet-50 text-violet-700', 'bg-fuchsia-50 text-fuchsia-700', 'bg-purple-50 text-purple-700', 'bg-slate-50 text-slate-700'];
         return `ag-cell inline-flex items-center justify-center rounded ${colors[m] || ''}`;
       }}],
       ['insurance_notes', { headerName: 'Ins. Notes', editable: !readOnly }],
       ['payment_amount', { headerName: 'Pt Payment', editable: !readOnly, valueParser: numberParser, valueFormatter: (p: any) => {
         if (!p.value) return '';
         const d = new Date(p.value);
         if (isNaN(d.getTime())) return p.value;
         const month = d.toLocaleString('en-US', { month: 'short' });
         return month;
       }, cellClass: (p: any) => {
         if (!p.value) return '';
         const d = new Date(p.value);
         if (isNaN(d.getTime())) return '';
         const m = d.getMonth();
         const colors = ['bg-red-50 text-red-700', 'bg-pink-50 text-pink-700', 'bg-orange-50 text-orange-700', 'bg-lime-50 text-lime-700', 'bg-emerald-50 text-emerald-700', 'bg-cyan-50 text-cyan-700', 'bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700', 'bg-violet-50 text-violet-700', 'bg-fuchsia-50 text-fuchsia-700', 'bg-purple-50 text-purple-700', 'bg-slate-50 text-slate-700'];
         return `ag-cell inline-flex items-center justify-center rounded ${colors[m] || ''}`;
       }}],
      ['payment_status', { headerName: 'Pt Pay Status', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Paid','CC declined','Secondary','Refunded','Payment Plan','Waiting on Claims',''] } }],
      ['month_tag', { headerName: 'Month', editable: !readOnly, valueFormatter: (p: any) => {
        const v = String(p.value || '');
        return v;
      }, cellClass: (p: any) => {
        const m = String(p.value || '').toLowerCase();
        if (!m) return '';
        const colorMap: Record<string, string> = {
          jan: 'bg-red-50 text-red-700', feb: 'bg-pink-50 text-pink-700', mar: 'bg-orange-50 text-orange-700',
          apr: 'bg-lime-50 text-lime-700', may: 'bg-emerald-50 text-emerald-700', jun: 'bg-cyan-50 text-cyan-700',
          jul: 'bg-blue-50 text-blue-700', aug: 'bg-indigo-50 text-indigo-700', sep: 'bg-violet-50 text-violet-700',
          oct: 'bg-fuchsia-50 text-fuchsia-700', nov: 'bg-purple-50 text-purple-700', dec: 'bg-slate-50 text-slate-700'
        };
        const key = m.slice(0,3);
        return `ag-cell inline-flex items-center justify-center rounded ${colorMap[key] || ''}`;
      }}]
    ];

    const cols = defs.map(([field, col]) => ({ field, ...col } as ColDef));

    if (visibleColumns && visibleColumns.length > 0) {
      const map: Record<string, string> = {
        A: 'patient_name',
        B: 'procedure_code',
        C: 'description',
        D: 'amount',
        E: 'date',
        F: 'status',
        G: 'claim_number',
        H: 'notes',
        I: 'appointment_status',
        J: 'status',
        K: 'submit_info',
        L: 'insurance_payment',
        M: 'insurance_notes',
        O: 'payment_amount',
        P: 'payment_status',
        Q: 'month_tag'
      };
      const keep = new Set(visibleColumns.map((c) => map[c] || c));
      return cols.filter((c) => keep.has(String(c.field)));
    }
    return cols;
  }, [visibleColumns, readOnly]);

  const onCellValueChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    const field = String(e.colDef.field);
    const value = NUMBER_COLS.has(field) ? Number(e.newValue || 0) : e.newValue;
    const updates: Record<string, any> = { [field]: value };
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
      await supabase.from('billing_entries').update(updates).eq('id', e.data.id);
    } catch (_) {
      await supabase.from('billing_entries').update(updates).eq('id', e.data.id);
    }
  };

  

  const onPaste = async () => {
    // AG Grid handles multi-row paste natively; this hook exists for batch persist.
    // Save dirty rows after a small delay.
    setTimeout(async () => {
      const api = gridApiRef.current;
      if (!api) return;
      const dirty: Entry[] = [];
      api.forEachNode((n) => {
        if (n.data && n.data.__ag_pasted__) dirty.push(n.data);
      });
      if (dirty.length === 0) return;
      const updates = dirty.map((d) => ({ ...d }));
      for (const u of updates) {
        const { id, ...rest } = u as any;
        await supabase.from('billing_entries').update(rest).eq('id', id);
      }
      await loadRows();
    }, 50);
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

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-200">
            Import XLSX
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && importXlsx(e.target.files[0])} />
          </label>
          <button className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={() => { setShowBulk(true); setBulkDate(new Date().toISOString().split('T')[0]); }}>Paste Patient IDs</button>
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
              })
              .select('*');
            if (inserted && inserted.length) {
              setRowData((prev) => [inserted[0] as any, ...prev]);
            } else {
              await loadRows();
            }
          }}>Add Row</button>
        </div>
      )}
      <div className="ag-theme-alpine" style={{ height: 520, width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          undoRedoCellEditing={true}
          suppressClickEdit={false}
          readOnlyEdit={!!readOnly}
          onGridReady={(p) => { gridApiRef.current = p.api; }}
          onCellValueChanged={onCellValueChanged}
          onPasteEnd={onPaste}
          rowSelection={'multiple'}
          defaultColDef={{ resizable: true, sortable: true, filter: true, editable: !readOnly }}
        />
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
                      month_tag: new Date(bulkDate || Date.now()).toLocaleString('en-US', { month: 'short' })
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


