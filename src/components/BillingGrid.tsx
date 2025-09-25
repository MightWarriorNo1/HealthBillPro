import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, GridApi, GridOptions, RowSelectedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
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

export default function BillingGrid({ clinicId, providerId, readOnly, visibleColumns, dateRange }: BillingGridProps) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [rowData, setRowData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [billingCodes, setBillingCodes] = useState<string[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [highlightedRowIds, setHighlightedRowIds] = useState<Set<string>>(new Set());
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDate, setBulkDate] = useState<string>('');

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
      // Pad with placeholders to always render 200 rows
      const padded: Entry[] = rows.slice(0);
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

  const numberParser = (params: any) => {
    const v = parseFloat(params.newValue);
    return Number.isFinite(v) ? v : 0;
  };

  const columnDefs: Array<ColDef | ColGroupDef> = useMemo(() => {
    const defs: Array<[string, ColDef]> = [
      ['patient_name', { headerName: 'Patient Name', editable: !readOnly }],
      ['procedure_code', { 
        headerName: 'Procedure Code', 
        editable: !readOnly, 
        cellEditor: 'agSelectCellEditor', 
        cellEditorParams: { 
          values: billingCodes,
          cellEditorPopup: true
        },
        cellClass: 'ag-cell-with-arrow'
      }],
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
      ['status', { 
        headerName: 'Claim Status', 
        editable: !readOnly, 
        cellEditor: 'agSelectCellEditor', 
        cellEditorParams: { 
          values: ['Claim Sent','RS','IP','Paid','Denial','Rejection','No Coverage','PP','Deductible','N/A','pending','approved','rejected'],
          cellEditorPopup: true
        },
        cellClass: 'ag-cell-with-arrow'
      }],
      ['claim_number', { headerName: 'Claim #', editable: !readOnly }],
      ['notes', { headerName: 'Notes', editable: !readOnly }],
      ['appointment_status', { 
        headerName: 'Appt Status', 
        editable: !readOnly, 
        cellEditor: 'agSelectCellEditor', 
        cellEditorParams: { 
          values: ['Complete','PP Complete','Charge NS/LC','RS No Charge','NS No Charge','Note not complete'],
          cellEditorPopup: true
        },
        cellClass: 'ag-cell-with-arrow'
      }],
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

    const baseCols = defs.map(([field, col]) => ({ field, ...col } as ColDef));

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
      return baseCols.filter((c) => keep.has(String((c as ColDef).field)));
    }
    // Grouped headers to match the exact structure from the image
    const adminChildren: ColDef[] = [
      { field: 'id', headerName: 'ID', headerClass: 'bg-purple-100', editable: !readOnly },
      { field: 'patient_name', headerName: 'First Name', headerClass: 'bg-purple-100', editable: !readOnly },
      { field: 'last_initial', headerName: 'Last Initial', headerClass: 'bg-purple-100', editable: !readOnly },
      { field: 'insurance', headerName: 'Ins', headerClass: 'bg-purple-100', editable: !readOnly },
      { field: 'copay', headerName: 'Co-pay', headerClass: 'bg-purple-100', editable: !readOnly, valueParser: numberParser },
      { field: 'coinsurance', headerName: 'Co-ins', headerClass: 'bg-purple-100', editable: !readOnly, valueParser: numberParser },
      { field: 'date', headerName: 'Date of Service', headerClass: 'bg-purple-100', editable: !readOnly }
    ];
    const providerChildren: ColDef[] = [
      { field: 'procedure_code', headerName: 'CPT Code', headerClass: 'bg-orange-100', cellEditor: 'agSelectCellEditor', cellEditorParams: { values: billingCodes }, editable: !readOnly },
      { field: 'appointment_status', headerName: 'Appt Status', headerClass: 'bg-orange-100', editable: !readOnly }
    ];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const billingChildren: ColDef[] = [
      { field: 'status', headerName: 'Claim Status', headerClass: 'bg-green-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Claim Sent','RS','IP','Paid','Denial','Rejection','No Coverage','PP','Deductible','N/A','pending','approved','rejected'] } },
      { field: 'submit_info', headerName: 'Most Recent Submit Date', headerClass: 'bg-green-100', editable: !readOnly },
      { field: 'insurance_payment', headerName: 'Ins Pay', headerClass: 'bg-green-100', valueParser: numberParser, editable: !readOnly },
      { field: 'insurance_notes', headerName: 'Ins Pay Date', headerClass: 'bg-green-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: months }, cellClass: 'ag-cell-with-arrow' },
      { field: 'description', headerName: 'PT RES', headerClass: 'bg-green-100', editable: !readOnly },
      { field: 'payment_amount', headerName: 'Collected from PT', headerClass: 'bg-green-100', valueParser: numberParser, editable: !readOnly },
      { field: 'payment_status', headerName: 'PT Pay Status', headerClass: 'bg-green-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Paid','CC declined','Secondary','Refunded','Payment Plan','Waiting on Claims',''] } },
      { field: 'claim_number', headerName: 'PT Payment AR Ref Date', headerClass: 'bg-green-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: months }, cellClass: 'ag-cell-with-arrow' },
      { field: 'amount', headerName: 'Total Pay', headerClass: 'bg-green-100', valueParser: numberParser, editable: !readOnly },
      { field: 'notes', headerName: 'Notes', headerClass: 'bg-green-100', editable: !readOnly }
    ];
    const arChildren: ColDef[] = [
      { field: 'ar_name', headerName: 'Name', headerClass: 'bg-lime-100', editable: !readOnly },
      { field: 'ar_date_of_service', headerName: 'Date of Service', headerClass: 'bg-lime-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: months }, cellClass: 'ag-cell-with-arrow' },
      { field: 'ar_amount', headerName: 'Amount', headerClass: 'bg-lime-100', valueParser: numberParser, editable: !readOnly },
      { field: 'ar_date_recorded', headerName: 'Date Recorded', headerClass: 'bg-lime-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: months }, cellClass: 'ag-cell-with-arrow' },
      { field: 'ar_type', headerName: 'Type', headerClass: 'bg-lime-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Insurance Payment', 'Patient Payment', 'Refund', 'Adjustment', 'Other'] }, cellClass: 'ag-cell-with-arrow' },
      { field: 'ar_notes', headerName: 'Notes', headerClass: 'bg-lime-100', editable: !readOnly }
    ];
    const blueChildren: ColDef[] = [
      { field: 'description', headerName: 'Description', headerClass: 'bg-blue-100', editable: !readOnly, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Service Fee', 'Consultation', 'Procedure', 'Follow-up', 'Other'] }, cellClass: 'ag-cell-with-arrow' },
      { field: 'amount', headerName: 'Amount', headerClass: 'bg-blue-100', valueParser: numberParser, editable: !readOnly },
      { field: 'notes', headerName: 'Notes', headerClass: 'bg-blue-100', editable: !readOnly }
    ];

    const grouped: Array<ColDef | ColGroupDef> = [
      { headerName: 'ADMIN', marryChildren: true, headerClass: 'bg-purple-500 text-white', children: adminChildren },
      { headerName: 'PROVIDER', marryChildren: true, headerClass: 'bg-orange-500 text-white', children: providerChildren },
      { headerName: 'BILLING', marryChildren: true, headerClass: 'bg-green-600 text-white', children: billingChildren },
      { headerName: 'ACCOUNTS RECEIVABLE', marryChildren: true, headerClass: 'bg-lime-500 text-white', children: arChildren },
      { headerName: '', marryChildren: true, headerClass: 'bg-blue-500 text-white', children: blueChildren }
    ];
    return grouped;
  }, [visibleColumns, readOnly, billingCodes]);

  const rowClassRules = useMemo(() => ({
    'bg-yellow-50': (params: any) => highlightedRowIds.has(params.data?.id)
  }), [highlightedRowIds]);

  const onCellValueChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    if (String((e.data as any).id || '').startsWith('placeholder-')) return;
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
      const updates = dirty.filter(d => !String(d.id || '').startsWith('placeholder-')).map((d) => ({ ...d }));
      for (const u of updates) {
        const { id, ...rest } = u as any;
        await supabase.from('billing_entries').update(rest).eq('id', id);
      }
      await loadRows();
    }, 50);
  };

  const addRowRelative = async (position: 'above' | 'below') => {
    const api = gridApiRef.current;
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
    setTimeout(() => {
      api?.deselectAll();
      setSelectedRowIds(new Set([newRow.id]));
    }, 0);
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

  const copySelection = () => {
    const api = gridApiRef.current as any;
    if (!api) return;
    if (api.copySelectedRangeToClipboard) api.copySelectedRangeToClipboard();
    else if (api.copySelectedRowsToClipboard) api.copySelectedRowsToClipboard();
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
      {!readOnly && (
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-200">
            Import XLSX
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && importXlsx(e.target.files[0])} />
          </label>
          <button className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={() => { setShowBulk(true); setBulkDate(new Date().toISOString().split('T')[0]); }}>Paste Patient IDs</button>
          <div className="mx-2 h-6 w-px bg-gray-300" />
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
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={() => addRowRelative('above')}>Add Row Above</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={() => addRowRelative('below')}>Add Row Below</button>
          <button className="px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200" onClick={deleteSelectedRows}>Delete Row(s)</button>
          <div className="mx-2 h-6 w-px bg-gray-300" />
          <button className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200" onClick={toggleHighlightSelected}>Highlight</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200" onClick={copySelection}>Copy</button>
          <span className="text-xs text-gray-500">Paste with Ctrl+V</span>
        </div>
      )}
      <div className="ag-theme-alpine" style={{ height: 520, width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          rowClassRules={rowClassRules}
          undoRedoCellEditing={true}
          suppressClickEdit={false}
          readOnlyEdit={!!readOnly}
          onGridReady={(p) => { gridApiRef.current = p.api; }}
          onSelectionChanged={(e) => {
            const ids = new Set<string>();
            e.api.getSelectedNodes().forEach(n => { if (n.data?.id) ids.add(n.data.id); });
            setSelectedRowIds(ids);
          }}
          onCellValueChanged={onCellValueChanged}
          onPasteEnd={onPaste}
          rowSelection={'multiple'}
          defaultColDef={{ 
            resizable: true, 
            sortable: false, 
            filter: false, 
            editable: !readOnly,
            cellStyle: { 
              borderRight: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
              borderLeft: '1px solid #e5e7eb'
            },
            headerClass: 'ag-header-cell ag-header-cell-with-border'
          }}
        />
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


