import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, X, Search, 
  FileText, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import DataGrid from './DataGrid';
import { ColDef, GridOptions } from 'ag-grid-community';

interface AccountsReceivableEntry {
  id: string;
  // ADMIN section
  first_name?: string;
  last_initial?: string;
  ins?: string;
  co_pay?: number;
  co_ins?: number;
  date_of_service?: string;
  // PROVIDER section
  cpt_code?: string;
  appt_status?: string;
  // BILLING section
  claim_status?: string;
  most_recent_submit_date?: string;
  ins_pay?: number;
  ins_pay_date?: string;
  pt_res?: number;
  collected_from_pt?: number;
  pt_pay_status?: string;
  pt_payment_ar_ref_date?: string;
  total_pay?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ProviderPayment {
  id: string;
  description: string;
  amount: number;
  notes: string;
  created_at: string;
}

interface AccountsReceivableProps {
  clinicId?: string;
  canEdit?: boolean;
  isLocked?: boolean;
  showMonthlySubcategories?: boolean;
}

function AccountsReceivable({ 
  clinicId, 
  canEdit = true, 
  isLocked = false,
  showMonthlySubcategories = false
}: AccountsReceivableProps) {
  const [arEntries, setArEntries] = useState<AccountsReceivableEntry[]>([]);
  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [currentYear] = useState(new Date().getFullYear());
  const [activePaymentTab, setActivePaymentTab] = useState('all');

  const [newEntry, setNewEntry] = useState({
    first_name: '',
    last_initial: '',
    ins: '',
    co_pay: 0,
    co_ins: 0,
    date_of_service: '',
    cpt_code: '',
    appt_status: '',
    claim_status: '',
    most_recent_submit_date: '',
    ins_pay: 0,
    ins_pay_date: '',
    pt_res: 0,
    collected_from_pt: 0,
    pt_pay_status: '',
    pt_payment_ar_ref_date: '',
    total_pay: 0,
    notes: ''
  });

  const [newPayment, setNewPayment] = useState({
    description: '',
    amount: 0,
    notes: ''
  });

  const apptStatusOptions = ['Scheduled', 'Completed', 'Cancelled', 'No Show', 'Rescheduled'];
  const claimStatusOptions = ['Pending', 'Submitted', 'Paid', 'Denied', 'Under Review', 'Appealed'];
  const ptPayStatusOptions = ['Pending', 'Paid', 'Partial', 'Overdue', 'Waived'];
  
  const paymentDescriptions = [
    'Client Payments',
    'Insurance Payments', 
    'Commission',
    'Provider Pay',
    'A/R from Previous Month',
    'A/R Commission',
    'Claim Fees',
    'Total Provider Pay'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];


  useEffect(() => {
    loadData();
  }, [clinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load AR entries
      let arQuery = supabase
        .from('accounts_receivable')
        .select('*')
        .order('date', { ascending: false });

      if (clinicId) {
        arQuery = arQuery.eq('clinic_id', clinicId);
      }

      const { data: arData, error: arError } = await arQuery;
      if (arError) throw arError;

      // Load provider payments
      let paymentQuery = supabase
        .from('provider_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (clinicId) {
        paymentQuery = paymentQuery.eq('clinic_id', clinicId);
      }

      const { data: paymentData, error: paymentError } = await paymentQuery;
      if (paymentError) throw paymentError;

      setArEntries(arData || []);
      setProviderPayments(paymentData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load accounts receivable data');
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async () => {
    if (!newEntry.first_name || !newEntry.date_of_service) {
      toast.error('Please fill in required fields (First Name and Date of Service)');
      return;
    }

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .insert([{
          ...newEntry,
          clinic_id: clinicId
        }]);

      if (error) throw error;

      toast.success('Billing entry created successfully');
      setShowAddEntry(false);
      setNewEntry({
        first_name: '',
        last_initial: '',
        ins: '',
        co_pay: 0,
        co_ins: 0,
        date_of_service: '',
        cpt_code: '',
        appt_status: '',
        claim_status: '',
        most_recent_submit_date: '',
        ins_pay: 0,
        ins_pay_date: '',
        pt_res: 0,
        collected_from_pt: 0,
        pt_pay_status: '',
        pt_payment_ar_ref_date: '',
        total_pay: 0,
        notes: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating billing entry:', error);
      toast.error(error.message || 'Failed to create billing entry');
    }
  };


  const createPayment = async () => {
    if (!newPayment.description || !newPayment.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_payments')
        .insert([{
          ...newPayment,
          clinic_id: clinicId
        }]);

      if (error) throw error;

      toast.success('Provider payment created successfully');
      setShowAddPayment(false);
      setNewPayment({
        description: '',
        amount: 0,
        notes: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating provider payment:', error);
      toast.error(error.message || 'Failed to create provider payment');
    }
  };






  const filteredEntries = arEntries.filter(entry => {
    const matchesSearch = 
      (entry.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.last_initial?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.ins?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.cpt_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || entry.claim_status === filterType;
    
    return matchesSearch && matchesType;
  });


  // Filter provider payments by month
  const filteredProviderPayments = useMemo(() => {
    if (activePaymentTab === 'all') {
      return providerPayments;
    }
    
    const monthIndex = parseInt(activePaymentTab);
    if (isNaN(monthIndex)) return providerPayments;
    
    return providerPayments.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate.getMonth() === monthIndex - 1 && paymentDate.getFullYear() === currentYear;
    });
  }, [providerPayments, activePaymentTab, currentYear]);

  // Group AR entries by month for subcategory display
  const monthlyArData = useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const grouped: Record<string, { entries: AccountsReceivableEntry[], total: number }> = {};
    
    arEntries.forEach(entry => {
      if (!entry.date_of_service) return; // Skip entries without date_of_service
      
      const entryDate = new Date(entry.date_of_service);
      if (isNaN(entryDate.getTime())) return; // Skip invalid dates
      
      const monthKey = `${entryDate.getFullYear()}-${entryDate.getMonth() + 1}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { entries: [], total: 0 };
      }
      
      grouped[monthKey].entries.push(entry);
      grouped[monthKey].total += (entry.total_pay || 0);
    });
    
    return Object.entries(grouped).map(([monthKey, data]) => ({
      monthKey,
      monthName: months[parseInt(monthKey.split('-')[1]) - 1],
      year: parseInt(monthKey.split('-')[0]),
      ...data
    })).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [arEntries]);

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const arColumns: ColDef[] = useMemo(() => ([
    // ADMIN section
    { field: 'id', headerName: 'ID', editable: canEdit && !isLocked, width: 80 },
    { field: 'first_name', headerName: 'First Name', editable: canEdit && !isLocked, width: 120 },
    { field: 'last_initial', headerName: 'Last Initial', editable: canEdit && !isLocked, width: 100 },
    { field: 'ins', headerName: 'Ins', editable: canEdit && !isLocked, width: 100 },
    { field: 'co_pay', headerName: 'Co-pay', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0, valueFormatter: (p: any) => p.value ? p.value.toFixed(2) : '0.00', width: 100 },
    { field: 'co_ins', headerName: 'Co-ins', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0, valueFormatter: (p: any) => p.value ? p.value.toFixed(2) : '0.00', width: 100 },
    { field: 'date_of_service', headerName: 'Date of Service', editable: canEdit && !isLocked, valueFormatter: (p: any) => {
      if (!p.value) return '';
      const d = new Date(p.value);
      if (isNaN(d.getTime())) return p.value;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}-${dd}-${yy}`;
    }, width: 120 },
    // PROVIDER section
    { field: 'cpt_code', headerName: 'CPT Code', editable: canEdit && !isLocked, width: 100 },
    { field: 'appt_status', headerName: 'Appt Status', editable: canEdit && !isLocked, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: apptStatusOptions }, width: 120 },
    // BILLING section
    { field: 'claim_status', headerName: 'Claim Status', editable: canEdit && !isLocked, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: claimStatusOptions }, width: 120 },
    { field: 'most_recent_submit_date', headerName: 'Most Recent Submit Date', editable: canEdit && !isLocked, valueFormatter: (p: any) => {
      if (!p.value) return '';
      const d = new Date(p.value);
      if (isNaN(d.getTime())) return p.value;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}-${dd}-${yy}`;
    }, width: 150 },
    { field: 'ins_pay', headerName: 'Ins Pay', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0, valueFormatter: (p: any) => p.value ? p.value.toFixed(2) : '0.00', width: 100 },
    { field: 'ins_pay_date', headerName: 'Ins Pay Date', editable: canEdit && !isLocked, valueFormatter: (p: any) => {
      if (!p.value) return '';
      const d = new Date(p.value);
      if (isNaN(d.getTime())) return p.value;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}-${dd}-${yy}`;
    }, width: 120 },
    { field: 'pt_res', headerName: 'PT RES', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0, valueFormatter: (p: any) => p.value ? p.value.toFixed(2) : '0.00', width: 100 },
    { field: 'collected_from_pt', headerName: 'Collected from PT', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0, valueFormatter: (p: any) => p.value ? p.value.toFixed(2) : '0.00', width: 130 },
    { field: 'pt_pay_status', headerName: 'PT Pay Status', editable: canEdit && !isLocked, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ptPayStatusOptions }, width: 120 },
    { field: 'pt_payment_ar_ref_date', headerName: 'PT Payment AR Ref Date', editable: canEdit && !isLocked, valueFormatter: (p: any) => {
      if (!p.value) return '';
      const d = new Date(p.value);
      if (isNaN(d.getTime())) return p.value;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}-${dd}-${yy}`;
    }, width: 150 },
    { field: 'total_pay', headerName: 'Total Pay', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0, valueFormatter: (p: any) => p.value ? p.value.toFixed(2) : '0.00', width: 100 },
    { field: 'notes', headerName: 'Notes', editable: canEdit && !isLocked, width: 200 }
  ]), [canEdit, isLocked]);

  const paymentsColumns: ColDef[] = useMemo(() => ([
    { field: 'description', headerName: 'Description', editable: canEdit && !isLocked },
    { field: 'amount', headerName: 'Amount', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0 },
    { field: 'notes', headerName: 'Notes', editable: canEdit && !isLocked }
  ]), [canEdit, isLocked]);

  const onArCellChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    try {
      const field = String(e.colDef.field);
      const { id } = e.data as any;
      const value = e.newValue;
      await supabase.from('accounts_receivable').update({ [field]: value }).eq('id', id);
      // Refresh totals in header
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update entry');
    }
  };

  const onPaymentCellChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    try {
      const field = String(e.colDef.field);
      const { id } = e.data as any;
      const value = e.newValue;
      await supabase.from('provider_payments').update({ [field]: value }).eq('id', id);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Data</h2>
          <p className="text-gray-600">Manage patient billing, claims, and payments</p>
        </div>
        <div className="flex space-x-2">
          {canEdit && !isLocked && (
            <button
              onClick={() => setShowAddEntry(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Billing Entry</span>
            </button>
          )}
        </div>
        </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search billing entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 select-with-arrow"
        >
          <option value="all">All Claim Statuses</option>
          {claimStatusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Monthly Subcategories or Regular AR Grid */}
      {showMonthlySubcategories ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Monthly A/R Subcategories</h3>
            <p className="text-sm text-blue-700">
              Track payments for previous months. For example, September A/R tracks payments for services from Jan-Aug.
            </p>
          </div>
          
          {monthlyArData.map((monthData) => (
            <div key={monthData.monthKey} className="bg-white rounded-lg shadow">
              <div 
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleMonthExpansion(monthData.monthKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedMonths.has(monthData.monthKey) ? 
                      <ChevronDown className="h-5 w-5 text-gray-500" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    }
                    <h4 className="text-lg font-semibold text-gray-900">
                      {monthData.monthName} {monthData.year}
                    </h4>
                    <span className="text-sm text-gray-500">
                      ({monthData.entries.length} entries)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${monthData.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total A/R</div>
                  </div>
                </div>
              </div>
              
              {expandedMonths.has(monthData.monthKey) && (
                <div className="px-4 py-4">
                  <DataGrid
                    columnDefs={arColumns}
                    rowData={monthData.entries}
                    readOnly={!canEdit || isLocked}
                    onCellValueChanged={onArCellChanged}
                  />
                </div>
              )}
            </div>
          ))}
          
          {monthlyArData.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No A/R data available</h3>
              <p className="mt-1 text-sm text-gray-500">Add some accounts receivable entries to see monthly subcategories.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Billing Data Entries</h3>
          </div>
          <div className="px-4 py-4">
            <DataGrid
              columnDefs={arColumns}
              rowData={filteredEntries}
              readOnly={!canEdit || isLocked}
              onCellValueChanged={onArCellChanged}
            />
          </div>
        </div>
      )}

      {/* Provider Payments Grid with month tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Provider Payments</h3>
            {canEdit && !isLocked && (
              <button
                onClick={() => setShowAddPayment(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                <span>Add Payment</span>
              </button>
            )}
          </div>
          {/* Month tabs (All + months) */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActivePaymentTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${activePaymentTab === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-800 border-gray-300 bg-white'}`}
            >
              All
            </button>
            {months.map((name, idx) => {
              const monthIndex = String(idx + 1);
              const isActive = activePaymentTab === monthIndex;
              return (
                <button
                  key={name}
                  onClick={() => setActivePaymentTab(monthIndex)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-800 border-gray-300 bg-white'}`}
                  title={`${name} ${currentYear}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-4">
          <DataGrid
            columnDefs={paymentsColumns}
            rowData={filteredProviderPayments}
            readOnly={!canEdit || isLocked}
            onCellValueChanged={onPaymentCellChanged}
          />
        </div>
      </div>

      {/* Add AR Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Billing Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* ADMIN Section */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">ADMIN</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newEntry.first_name}
                      onChange={(e) => setNewEntry({ ...newEntry, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Initial
                    </label>
                    <input
                      type="text"
                      value={newEntry.last_initial}
                      onChange={(e) => setNewEntry({ ...newEntry, last_initial: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="D"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ins
                    </label>
                    <input
                      type="text"
                      value={newEntry.ins}
                      onChange={(e) => setNewEntry({ ...newEntry, ins: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Insurance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Co-pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.co_pay}
                      onChange={(e) => setNewEntry({ ...newEntry, co_pay: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Co-ins
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.co_ins}
                      onChange={(e) => setNewEntry({ ...newEntry, co_ins: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Service *
                    </label>
                    <input
                      type="date"
                      value={newEntry.date_of_service}
                      onChange={(e) => setNewEntry({ ...newEntry, date_of_service: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* PROVIDER Section */}
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-800 mb-3">PROVIDER</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPT Code
                    </label>
                    <input
                      type="text"
                      value={newEntry.cpt_code}
                      onChange={(e) => setNewEntry({ ...newEntry, cpt_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="99213"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appt Status
                    </label>
                    <select
                      value={newEntry.appt_status}
                      onChange={(e) => setNewEntry({ ...newEntry, appt_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent select-with-arrow"
                    >
                      <option value="">Select Status</option>
                      {apptStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BILLING Section */}
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-3">BILLING</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Claim Status
                    </label>
                    <select
                      value={newEntry.claim_status}
                      onChange={(e) => setNewEntry({ ...newEntry, claim_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent select-with-arrow"
                    >
                      <option value="">Select Status</option>
                      {claimStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Most Recent Submit Date
                    </label>
                    <input
                      type="date"
                      value={newEntry.most_recent_submit_date}
                      onChange={(e) => setNewEntry({ ...newEntry, most_recent_submit_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ins Pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.ins_pay}
                      onChange={(e) => setNewEntry({ ...newEntry, ins_pay: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ins Pay Date
                    </label>
                    <input
                      type="date"
                      value={newEntry.ins_pay_date}
                      onChange={(e) => setNewEntry({ ...newEntry, ins_pay_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PT RES
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.pt_res}
                      onChange={(e) => setNewEntry({ ...newEntry, pt_res: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collected from PT
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.collected_from_pt}
                      onChange={(e) => setNewEntry({ ...newEntry, collected_from_pt: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PT Pay Status
                    </label>
                    <select
                      value={newEntry.pt_pay_status}
                      onChange={(e) => setNewEntry({ ...newEntry, pt_pay_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent select-with-arrow"
                    >
                      <option value="">Select Status</option>
                      {ptPayStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PT Payment AR Ref Date
                    </label>
                    <input
                      type="date"
                      value={newEntry.pt_payment_ar_ref_date}
                      onChange={(e) => setNewEntry({ ...newEntry, pt_payment_ar_ref_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.total_pay}
                      onChange={(e) => setNewEntry({ ...newEntry, total_pay: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddEntry(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createEntry}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Add Provider Payment</h3>
              <button
                onClick={() => setShowAddPayment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <select
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black select-with-arrow"
                >
                  <option value="">Select Description</option>
                  {paymentDescriptions.map(desc => (
                    <option key={desc} value={desc}>{desc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddPayment(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsReceivable;
