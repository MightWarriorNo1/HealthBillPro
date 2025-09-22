import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, X, Search,
  FileText, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import DataGrid from './DataGrid';
import { ColDef, GridOptions } from 'ag-grid-community';

interface MonthlyAREntry {
  id: string;
  patient_id: string;
  date: string;
  amount: number;
  type: string;
  notes: string;
  description: string;
  amount_owed: number;
  service_month: string;
  payment_month: string;
  created_at: string;
  updated_at: string;
}

interface MonthlyAccountsReceivableProps {
  clinicId?: string;
  canEdit?: boolean;
  currentMonth: number;
  currentYear: number;
}

function MonthlyAccountsReceivable({ 
  clinicId, 
  canEdit = true,
  currentMonth,
  currentYear
}: MonthlyAccountsReceivableProps) {
  const [arEntries, setArEntries] = useState<MonthlyAREntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [filterServiceMonth, setFilterServiceMonth] = useState('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const [newEntry, setNewEntry] = useState({
    patient_id: '',
    date: '',
    amount: 0,
    type: '',
    notes: '',
    service_month: '',
    payment_month: ''
  });

  const typeOptions = ['Insurance', 'Patient', 'Clinic'];
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getPreviousMonths = () => {
    const previousMonths = [];
    for (let i = 1; i < currentMonth; i++) {
      previousMonths.push({
        value: i,
        label: months[i - 1],
        short: months[i - 1].substring(0, 3)
      });
    }
    return previousMonths;
  };

  useEffect(() => {
    loadData();
  }, [clinicId, currentMonth, currentYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('created_at', `${currentYear}-01-01`)
        .lte('created_at', `${currentYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map(entry => ({
        ...entry,
        service_month: entry.service_month || months[new Date(entry.date).getMonth()],
        payment_month: months[currentMonth - 1]
      }));

      setArEntries(transformedData);
    } catch (error) {
      console.error('Error loading monthly AR data:', error);
      toast.error('Failed to load monthly AR data');
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
          amount_owed: newEntry.amount,
          service_month: newEntry.service_month,
          payment_month: months[currentMonth - 1]
        }]);

      if (error) throw error;

      toast.success('Monthly AR entry created successfully');
      setShowAddEntry(false);
      setNewEntry({
        patient_id: '',
        date: '',
        amount: 0,
        type: '',
        notes: '',
        service_month: '',
        payment_month: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating monthly AR entry:', error);
      toast.error(error.message || 'Failed to create monthly AR entry');
    }
  };


  const getMonthColor = (month: string) => {
    const monthIndex = months.findIndex(m => m === month);
    const colors = [
      'bg-red-50 text-red-700', 'bg-pink-50 text-pink-700', 'bg-orange-50 text-orange-700',
      'bg-lime-50 text-lime-700', 'bg-emerald-50 text-emerald-700', 'bg-cyan-50 text-cyan-700',
      'bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700', 'bg-violet-50 text-violet-700',
      'bg-fuchsia-50 text-fuchsia-700', 'bg-purple-50 text-purple-700', 'bg-slate-50 text-slate-700'
    ];
    return colors[monthIndex] || 'bg-gray-50 text-gray-700';
  };

  const filteredEntries = arEntries.filter(entry => {
    const matchesSearch = 
      entry.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesServiceMonth = filterServiceMonth === 'all' || entry.service_month === filterServiceMonth;
    
    return matchesSearch && matchesServiceMonth;
  });

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const month = entry.service_month || 'Unknown';
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {} as Record<string, MonthlyAREntry[]>);

  const totalArAmount = arEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const arColumns: ColDef[] = [
    { field: 'patient_id', headerName: 'Patient ID', editable: canEdit },
    { field: 'date', headerName: 'A/R Date Recorded', editable: canEdit, valueFormatter: (p: any) => {
      if (!p.value) return '';
      const d = new Date(p.value);
      if (isNaN(d.getTime())) return p.value;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}-${dd}-${yy}`;
    } },
    { field: 'amount', headerName: 'Amount', editable: canEdit, valueParser: (p: any) => parseFloat(p.newValue) || 0 },
    { field: 'type', headerName: 'A/R Type', editable: canEdit, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: typeOptions } },
    { field: 'description', headerName: 'Description', editable: canEdit },
    { field: 'amount_owed', headerName: 'Amount Owed', editable: canEdit, valueParser: (p: any) => parseFloat(p.newValue) || 0 },
    { field: 'notes', headerName: 'Notes', editable: canEdit }
  ];

  const onArCellChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    try {
      const field = String(e.colDef.field);
      const { id } = e.data as any;
      const value = e.newValue;
      await supabase.from('accounts_receivable').update({ [field]: value }).eq('id', id);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update entry');
    }
  };

  const toggleMonthExpansion = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
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
      <div className="flex justify-between items-center">
          <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Accounts Receivable</h2>
          <p className="text-gray-600">Track payments for previous months received in {months[currentMonth - 1]} {currentYear}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddEntry(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            <span>Add AR Entry</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total A/R for {months[currentMonth - 1]}</p>
            <p className="text-2xl font-bold text-gray-900">${totalArAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

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
          value={filterServiceMonth}
          onChange={(e) => setFilterServiceMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
        >
          <option value="all">All Service Months</option>
          {getPreviousMonths().map(month => (
            <option key={month.value} value={month.label}>{month.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedEntries).map(([serviceMonth, entries]) => {
          const monthTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
          const isExpanded = expandedMonths.has(serviceMonth);
          
          return (
            <div key={serviceMonth} className="bg-white rounded-lg shadow">
              <div 
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleMonthExpansion(serviceMonth)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {serviceMonth} Services - Payments Received in {months[currentMonth - 1]}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMonthColor(serviceMonth)}`}>
                      {serviceMonth}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Collected</p>
                    <p className="text-xl font-bold text-gray-900">${monthTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
              {isExpanded && (
                <div className="p-4">
                  <DataGrid
                    columnDefs={arColumns}
                    rowData={entries}
                    readOnly={!canEdit}
                    onCellValueChanged={onArCellChanged}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {Object.keys(groupedEntries).length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No AR entries found</h3>
            <p className="mt-1 text-sm text-gray-500">Add entries for previous months' services.</p>
          </div>
        )}
        </div>
        
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Monthly AR Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                <input
                  type="text"
                  value={newEntry.patient_id}
                  onChange={(e) => setNewEntry({ ...newEntry, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 3861"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Month *</label>
                <select
                  value={newEntry.service_month}
                  onChange={(e) => setNewEntry({ ...newEntry, service_month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Service Month</option>
                  {getPreviousMonths().map(month => (
                    <option key={month.value} value={month.label}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {typeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
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
    </div>
  );
}

export default MonthlyAccountsReceivable;