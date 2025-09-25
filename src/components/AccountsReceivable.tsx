import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Plus, Edit, Save, X, Search, Filter, 
  Lock, Unlock, AlertCircle, CheckCircle, Calendar,
  FileText, CreditCard, Building2, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import DataGrid from './DataGrid';
import { ColDef, GridOptions } from 'ag-grid-community';

interface AccountsReceivableEntry {
  id: string;
  patient_id: string;
  date: string;
  amount: number;
  type: string;
  notes: string;
  description: string;
  amount_owed: number;
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
  canLock?: boolean;
  isLocked?: boolean;
  showMonthlySubcategories?: boolean;
}

function AccountsReceivable({ 
  clinicId, 
  canEdit = true, 
  canLock = false,
  isLocked = false,
  showMonthlySubcategories = false
}: AccountsReceivableProps) {
  const [arEntries, setArEntries] = useState<AccountsReceivableEntry[]>([]);
  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountsReceivableEntry | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ProviderPayment | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [lockedColumns, setLockedColumns] = useState<string[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activePaymentTab, setActivePaymentTab] = useState('all');

  const [newEntry, setNewEntry] = useState({
    patient_id: '',
    date: '',
    amount: 0,
    type: '',
    notes: ''
  });

  const [newPayment, setNewPayment] = useState({
    description: '',
    amount: 0,
    notes: ''
  });

  const typeOptions = ['Insurance', 'Patient', 'Clinic'];
  
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

  const lockableColumns = ['L', 'O', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AC', 'AD', 'AE'];

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
    if (!newEntry.patient_id || !newEntry.date || !newEntry.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .insert([{
          ...newEntry,
          clinic_id: clinicId,
          description: `${newEntry.type} Payment - ${newEntry.patient_id}`,
          amount_owed: newEntry.amount
        }]);

      if (error) throw error;

      toast.success('AR entry created successfully');
      setShowAddEntry(false);
      setNewEntry({
        patient_id: '',
        date: '',
        amount: 0,
        type: '',
        notes: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating AR entry:', error);
      toast.error(error.message || 'Failed to create AR entry');
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          patient_id: editingEntry.patient_id,
          date: editingEntry.date,
          amount: editingEntry.amount,
          type: editingEntry.type,
          notes: editingEntry.notes,
          description: editingEntry.description,
          amount_owed: editingEntry.amount_owed
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      toast.success('AR entry updated successfully');
      setEditingEntry(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating AR entry:', error);
      toast.error(error.message || 'Failed to update AR entry');
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

  const updatePayment = async () => {
    if (!editingPayment) return;

    try {
      const { error } = await supabase
        .from('provider_payments')
        .update(editingPayment)
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast.success('Provider payment updated successfully');
      setEditingPayment(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating provider payment:', error);
      toast.error(error.message || 'Failed to update provider payment');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entry deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast.error(error.message || 'Failed to delete entry');
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Payment deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error(error.message || 'Failed to delete payment');
    }
  };

  const toggleColumnLock = (column: string) => {
    if (!canLock) return;
    
    setLockedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Insurance': return 'bg-blue-100 text-blue-800';
      case 'Patient': return 'bg-green-100 text-green-800';
      case 'Clinic': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEntries = arEntries.filter(entry => {
    const matchesSearch = 
      entry.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || entry.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const totalArAmount = arEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalProviderPay = providerPayments.reduce((sum, payment) => sum + payment.amount, 0);

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
      const entryDate = new Date(entry.date);
      const monthKey = `${entryDate.getFullYear()}-${entryDate.getMonth() + 1}`;
      const monthName = months[entryDate.getMonth()];
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { entries: [], total: 0 };
      }
      
      grouped[monthKey].entries.push(entry);
      grouped[monthKey].total += entry.amount;
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
    { field: 'patient_id', headerName: 'Patient ID', editable: canEdit && !isLocked },
    { field: 'date', headerName: 'A/R Date Recorded', editable: canEdit && !isLocked, valueFormatter: (p: any) => {
      if (!p.value) return '';
      const d = new Date(p.value);
      if (isNaN(d.getTime())) return p.value;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}-${dd}-${yy}`;
    } },
    { field: 'amount', headerName: 'Amount', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0 },
    { field: 'type', headerName: 'A/R Type', editable: canEdit && !isLocked, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: typeOptions } },
    { field: 'description', headerName: 'Description', editable: canEdit && !isLocked },
    { field: 'amount_owed', headerName: 'Amount Owed', editable: canEdit && !isLocked, valueParser: (p: any) => parseFloat(p.newValue) || 0 },
    { field: 'notes', headerName: 'Notes', editable: canEdit && !isLocked }
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
      const { id, ...rest } = e.data as any;
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
      const { id, ...rest } = e.data as any;
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
          <h2 className="text-2xl font-bold text-gray-900">Accounts Receivable</h2>
          <p className="text-gray-600">Manage late payments and provider payments</p>
        </div>
        <div className="flex space-x-2">
          {canLock && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLockedColumns([])}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Unlock size={14} />
                <span>Unlock All</span>
              </button>
              <button
                onClick={() => setLockedColumns(lockableColumns)}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Lock size={14} />
                <span>Lock All</span>
              </button>
            </div>
          )}
          {canEdit && !isLocked && (
            <button
              onClick={() => setShowAddEntry(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add AR Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total A/R</p>
              <p className="text-2xl font-bold text-gray-900">${totalArAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Provider Pay</p>
              <p className="text-2xl font-bold text-gray-900">${totalProviderPay.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p className="text-2xl font-bold text-gray-900">${(totalArAmount - totalProviderPay).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

  

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search AR entries..."
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
          <option value="all">All Types</option>
          {typeOptions.map(type => (
            <option key={type} value={type}>{type}</option>
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
            <h3 className="text-lg font-semibold text-gray-900">Accounts Receivable Entries</h3>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add AR Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={newEntry.patient_id}
                  onChange={(e) => setNewEntry({ ...newEntry, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 3861"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent select-with-arrow"
                >
                  <option value="">Select Type</option>
                  {typeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
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
