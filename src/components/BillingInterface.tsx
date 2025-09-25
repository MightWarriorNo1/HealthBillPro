import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, X, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BillingEntry {
  id: string;
  provider_id: string;
  clinic_id: string;
  date: string;
  patient_id?: string | null;
  patient_name: string;
  // Auto-filled from patients
  insurance?: string | null;
  copay?: number | null;
  coinsurance?: number | null;
  procedure_code: string;
  description: string;
  amount: number;
  // Claim status (Column J) now uses flexible string values per workflow
  status: string;
  claim_number?: string | null;
  notes?: string | null;
  // Provider appointment status (Column I)
  appointment_status?: string | null;
  // Submit info (Column K)
  submit_info?: string | null;
  // Insurance payment amount (Column L)
  insurance_payment?: number | null;
  // Insurance notes (Column M)
  insurance_notes?: string | null;
  // Payment tracking (Columns O–Q)
  payment_amount?: number | null;
  payment_status?: 'Paid' | 'CC declined' | 'Secondary' | 'Refunded' | 'Payment Plan' | 'Waiting on Claims' | null;
  month_tag?: string | null;
  created_at: string;
  updated_at: string;
}

interface BillingCodeOption {
  id: string;
  code: string;
  description: string;
  color: string;
}

interface BillingInterfaceProps {
  providerId?: string;
  clinicId?: string;
  canEdit?: boolean;
  visibleColumns?: string[];
  dateRange?: { start: string; end: string };
}

function BillingInterface({ 
  providerId, 
  clinicId, 
  canEdit = true, 
  visibleColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  dateRange
}: BillingInterfaceProps) {
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BillingEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [billingCodeOptions, setBillingCodeOptions] = useState<BillingCodeOption[]>([]);

  const [newEntry, setNewEntry] = useState({
    patient_id: '',
    patient_name: '',
    insurance: '',
    copay: 0,
    coinsurance: 0,
    procedure_code: '',
    description: '',
    amount: 0,
    date: '',
    status: '',
    claim_number: '',
    notes: '',
    appointment_status: '',
    submit_info: '',
    insurance_payment: 0,
    insurance_notes: '',
    payment_amount: 0,
    payment_status: '' as '' | 'Paid' | 'CC declined' | 'Secondary' | 'Refunded' | 'Payment Plan' | 'Waiting on Claims',
    month_tag: ''
  });

  // Database-enforced allowed values per CHECK constraint on billing_entries.status
  const statusOptions = [
    'pending',
    'approved',
    'paid',
    'rejected'
  ];

  // Provider Appointment Status (Columns H–I in the sheet; we use I)
  const appointmentStatusOptions = [
    'Complete',
    'PP Complete',
    'Charge NS/LC',
    'RS No Charge',
    'NS No Charge',
    'Note not complete'
  ];

  // Payment status per office staff workflow (Column P)
  const paymentStatusOptions: Array<BillingEntry['payment_status']> = [
    'Paid',
    'CC declined',
    'Secondary',
    'Refunded',
    'Payment Plan',
    'Waiting on Claims'
  ];

  const columnDefinitions = {
    A: { label: 'Patient Name', key: 'patient_name', type: 'text' },
    B: { label: 'Procedure Code', key: 'procedure_code', type: 'select', options: [] as string[] },
    C: { label: 'Description', key: 'description', type: 'text' },
    D: { label: 'Amount', key: 'amount', type: 'number' },
    E: { label: 'Date', key: 'date', type: 'date' },
    F: { label: 'Status', key: 'status', type: 'select', options: statusOptions },
    G: { label: 'Claim Number', key: 'claim_number', type: 'text' },
    H: { label: 'Notes', key: 'notes', type: 'text' },
    I: { label: 'Appointment Status', key: 'appointment_status', type: 'select', options: appointmentStatusOptions },
    J: { label: 'Claim Status', key: 'status', type: 'select', options: statusOptions },
    K: { label: 'Submit Date / Info', key: 'submit_info', type: 'text' },
    L: { label: 'Insurance Payment', key: 'insurance_payment', type: 'number' },
    M: { label: 'Insurance Notes', key: 'insurance_notes', type: 'text' },
    // Payment columns O–Q (kept here but shown only if requested via visibleColumns)
    O: { label: 'Payment Amount', key: 'payment_amount', type: 'number' },
    P: { label: 'Payment Status', key: 'payment_status', type: 'select', options: paymentStatusOptions },
    Q: { label: 'Month', key: 'month_tag', type: 'text' },
    // Patient financials (Office Staff view)
    R: { label: 'Insurance', key: 'insurance', type: 'text' },
    S: { label: 'Copay', key: 'copay', type: 'number' },
    T: { label: 'Coinsurance', key: 'coinsurance', type: 'number' }
  } as const;

  const deriveMonthTag = (isoDate: string): string => {
    if (!isoDate) return '';
    const dateObj = new Date(isoDate);
    if (Number.isNaN(dateObj.getTime())) return '';
    const short = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
    return short[dateObj.getMonth()] || '';
  };

  const performPatientLookup = async (raw: string, setForEditing: boolean) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return;
    // Treat numeric value as patient_id; otherwise skip
    if (!/^\d+$/.test(trimmed)) return;
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('patient_id, first_name, last_name, insurance, copay, coinsurance')
        .eq('patient_id', trimmed)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        if (setForEditing && editingEntry) {
          setEditingEntry({
            ...editingEntry,
            patient_id: data.patient_id,
            patient_name: `${data.first_name} ${data.last_name}`.trim(),
            insurance: data.insurance || '',
            copay: data.copay ?? 0,
            coinsurance: data.coinsurance ?? 0
          });
        } else if (!setForEditing) {
          setNewEntry(prev => ({
            ...prev,
            patient_id: data.patient_id,
            patient_name: `${data.first_name} ${data.last_name}`.trim(),
            insurance: data.insurance || '',
            copay: data.copay ?? 0,
            coinsurance: data.coinsurance ?? 0
          }));
        }
        toast.success('Patient matched from database');
      } else {
        toast.error('No patient found for that ID');
      }
    } catch (err) {
      console.error('Patient lookup failed', err);
      toast.error('Patient lookup failed');
    }
  };

  useEffect(() => {
    loadBillingEntries();
    loadBillingCodes();
  }, [providerId, clinicId, dateRange?.start, dateRange?.end]);

  const loadBillingCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_codes')
        .select('id, code, description, color')
        .order('code', { ascending: true });
      if (error) throw error;
      setBillingCodeOptions(data || []);
    } catch (err) {
      console.error('Failed to load billing codes', err);
    }
  };

  const loadBillingEntries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('billing_entries')
        .select('*')
        .order('date', { ascending: false });

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }
      if (dateRange?.start) {
        query = query.gte('date', dateRange.start);
      }
      if (dateRange?.end) {
        query = query.lte('date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBillingEntries(data || []);
    } catch (error) {
      console.error('Error loading billing entries:', error);
      toast.error('Failed to load billing entries');
    } finally {
      setLoading(false);
    }
  };

  // Only persist fields that exist in the billing_entries table
  const sanitizeBillingEntryForDb = (raw: any) => {
    const allowedKeys = [
      'provider_id',
      'clinic_id',
      'date',
      'patient_name',
      'procedure_code',
      'description',
      'amount',
      'status',
      'claim_number',
      'notes'
    ] as const;

    const sanitized: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (raw[key] !== undefined) sanitized[key] = raw[key];
    }
    return sanitized;
  };

  const createEntry = async () => {
    if (!newEntry.patient_name || !newEntry.date) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const payload = sanitizeBillingEntryForDb({
        ...newEntry,
        provider_id: providerId,
        clinic_id: clinicId
      });

      const { error } = await supabase
        .from('billing_entries')
        .insert([payload]);

      if (error) throw error;

      toast.success('Billing entry created successfully');
      setShowAddEntry(false);
      setNewEntry({
        patient_id: '',
        patient_name: '',
        procedure_code: '',
        description: '',
        amount: 0,
        date: '',
        status: '',
        claim_number: '',
        notes: '',
        appointment_status: '',
        submit_info: '',
        insurance_payment: 0,
        insurance_notes: '',
        payment_amount: 0,
        payment_status: '' as '' | 'Paid' | 'CC declined' | 'Secondary' | 'Refunded' | 'Payment Plan' | 'Waiting on Claims',
        month_tag: ''
      });
      loadBillingEntries();
    } catch (error: any) {
      console.error('Error creating billing entry:', error);
      toast.error(error.message || 'Failed to create billing entry');
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) return;

    try {
      const updates = sanitizeBillingEntryForDb(editingEntry);
      const { error } = await supabase
        .from('billing_entries')
        .update(updates)
        .eq('id', editingEntry.id);

      if (error) throw error;

      toast.success('Billing entry updated successfully');
      setEditingEntry(null);
      loadBillingEntries();
    } catch (error: any) {
      console.error('Error updating billing entry:', error);
      toast.error(error.message || 'Failed to update billing entry');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this billing entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('billing_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Billing entry deleted successfully');
      loadBillingEntries();
    } catch (error: any) {
      console.error('Error deleting billing entry:', error);
      toast.error(error.message || 'Failed to delete billing entry');
    }
  };

  // Column visibility controls were removed per product decision

  const getStatusColor = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      // Legacy labels mapping for color only
      case 'claim sent': return 'bg-gray-100 text-gray-800';
      case 'rs': return 'bg-yellow-100 text-yellow-800';
      case 'ip': return 'bg-purple-100 text-purple-800';
      case 'deductible': return 'bg-indigo-100 text-indigo-800';
      case 'n/a': return 'bg-slate-100 text-slate-800';
      case 'pp': return 'bg-blue-100 text-blue-800';
      case 'denial': return 'bg-red-100 text-red-800';
      case 'rejection': return 'bg-rose-100 text-rose-800';
      case 'no coverage': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'CC declined': return 'bg-red-100 text-red-800';
      case 'Secondary': return 'bg-indigo-100 text-indigo-800';
      case 'Refunded': return 'bg-orange-100 text-orange-800';
      case 'Payment Plan': return 'bg-purple-100 text-purple-800';
      case 'Waiting on Claims': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEntries = billingEntries.filter(entry => {
    const matchesSearch = 
      (entry.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (entry.procedure_code?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (entry.claim_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const renderCell = (entry: BillingEntry, column: string) => {
    const columnDef = columnDefinitions[column as keyof typeof columnDefinitions];
    if (!columnDef) return null;

    const value = entry[columnDef.key as keyof BillingEntry];
    

    if (columnDef.type === 'select') {
      return (
        <td className="px-6 py-4 whitespace-nowrap border border-gray-300">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${columnDef.key === 'payment_status' ? getPaymentStatusColor(String(value || '')) : getStatusColor(String(value || ''))}`}>
            {value as string || '-'}
          </span>
        </td>
      );
    }

    return (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-300">
        {columnDef.type === 'number' ? `$${(value as number)?.toFixed(2) || '0.00'}` :
        columnDef.type === 'date' ? new Date(value as string).toLocaleDateString() :
        (value as string) || '-'}
      </td>
    );
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
          <h2 className="text-2xl font-bold text-gray-900">Billing Interface</h2>
          <p className="text-gray-600">Manage billing entries and claim status</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddEntry(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            <span>Add Entry</span>
          </button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
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
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent select-with-arrow"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      

      {/* Billing Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map(column => {
                  const columnDef = columnDefinitions[column as keyof typeof columnDefinitions];
                  if (!columnDef) return null;
                  
                  return (
                    <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                      <div className="flex items-center space-x-1">
                        <span>{columnDef.label}</span>
                      </div>
                    </th>
                  );
                })}
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  {visibleColumns.map(column => renderCell(entry, column))}
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border border-gray-300">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Entry"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Entry"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Billing Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleColumns.map(column => {
                const columnDef = columnDefinitions[column as keyof typeof columnDefinitions];
                if (!columnDef) return null;

                return (
                  <div key={column}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {columnDef.label}
                    </label>
                    {columnDef.type === 'select' ? (
                      <select
                        value={newEntry[columnDef.key as keyof typeof newEntry] as string || ''}
                        onChange={(e) => setNewEntry({ ...newEntry, [columnDef.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent select-with-arrow"
                      >
                        <option value="">Select...</option>
                        {(columnDef.key === 'procedure_code' ? billingCodeOptions.map(o => o.code) : (columnDef.options || [])).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={columnDef.type === 'number' ? 'number' : columnDef.type === 'date' ? 'date' : 'text'}
                        value={newEntry[columnDef.key as keyof typeof newEntry] as string || ''}
                        onChange={(e) => {
                          const newValue = columnDef.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                          const updated: any = { ...newEntry, [columnDef.key]: newValue };
                          if (columnDef.key === 'date') {
                            updated.month_tag = deriveMonthTag(String(newValue));
                          }
                          setNewEntry(updated);
                          if (columnDef.key === 'patient_name' && /^\d+$/.test(String(newValue))) {
                            performPatientLookup(String(newValue), false);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={columnDef.label}
                      />
                    )}
                  </div>
                );
              })}
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

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Billing Entry</h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleColumns.map(column => {
                const columnDef = columnDefinitions[column as keyof typeof columnDefinitions];
                if (!columnDef) return null;

                return (
                  <div key={column}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {columnDef.label}
                    </label>
                    {columnDef.type === 'select' ? (
                      <select
                        value={editingEntry[columnDef.key as keyof typeof editingEntry] as string || ''}
                        onChange={(e) => setEditingEntry({ ...editingEntry, [columnDef.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        {columnDef.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={columnDef.type === 'number' ? 'number' : columnDef.type === 'date' ? 'date' : 'text'}
                        value={editingEntry[columnDef.key as keyof typeof editingEntry] as string || ''}
                        onChange={(e) => {
                          const newValue = columnDef.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                          setEditingEntry({ ...editingEntry, [columnDef.key]: newValue });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateEntry}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingInterface;
