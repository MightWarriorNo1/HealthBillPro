import React, { useState, useEffect, useCallback } from 'react';
import { 
  LogOut, User, Calendar, DollarSign, FileText, Clock, Plus, 
  Edit, Save, X, Search, Filter, Download, Upload, AlertCircle,
  CheckCircle, Eye, EyeOff, Calculator, History, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData, BillingEntry } from '../context/DataContext';
import toast from 'react-hot-toast';
import Logo from './Logo';

interface PatientLookup {
  id: string;
  name: string;
  dob: string;
  insurance: string;
  lastVisit: string;
}

interface ProcedureLookup {
  code: string;
  description: string;
  category: string;
  typicalAmount: number;
}

function ProviderInputPortal() {
  const { user, logout } = useAuth();
  const { billingEntries, addBillingEntry, updateBillingEntry, clinics, providers } = useData();
  const [activeTab, setActiveTab] = useState('entries');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPatientLookup, setShowPatientLookup] = useState(false);
  const [showProcedureLookup, setShowProcedureLookup] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientLookup | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureLookup | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Filter entries for current provider
  const providerEntries = billingEntries.filter(entry => entry.providerId === user?.providerId);
  const currentClinic = clinics.find(c => c.id === user?.clinicId);
  const currentProvider = providers.find(p => p.id === user?.providerId);

  // Mock data for lookups
  const patientDatabase: PatientLookup[] = [
    { id: '1', name: 'John Smith', dob: '1980-05-15', insurance: 'Blue Cross', lastVisit: '2025-01-10' },
    { id: '2', name: 'Jane Doe', dob: '1975-03-22', insurance: 'Aetna', lastVisit: '2025-01-08' },
    { id: '3', name: 'Robert Johnson', dob: '1990-11-30', insurance: 'Cigna', lastVisit: '2025-01-05' },
  ];

  const procedureDatabase: ProcedureLookup[] = [
    { code: '99213', description: 'Office visit, established patient', category: 'E&M', typicalAmount: 150 },
    { code: '99214', description: 'Office visit, established patient, complex', category: 'E&M', typicalAmount: 200 },
    { code: '99215', description: 'Office visit, established patient, comprehensive', category: 'E&M', typicalAmount: 300 },
    { code: '99201', description: 'Office visit, new patient', category: 'E&M', typicalAmount: 180 },
    { code: '99202', description: 'Office visit, new patient, detailed', category: 'E&M', typicalAmount: 250 },
  ];

  // Calculate totals
  const totalPending = providerEntries.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = providerEntries.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = providerEntries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    patientName: '',
    procedureCode: '',
    description: '',
    amount: 0,
    claimNumber: '',
    notes: '',
    patientId: '',
    insurance: '',
    dob: ''
  });

  const [formula, setFormula] = useState('');
  const [showFormula, setShowFormula] = useState(false);

  // Filter entries based on search and status
  const filteredEntries = providerEntries.filter(entry => {
    const matchesSearch = entry.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.procedureCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddEntry = () => {
    if (!user?.providerId || !user?.clinicId) return;
    
    // Validation
    if (!newEntry.patientName || !newEntry.procedureCode || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newEntry.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    addBillingEntry({
      ...newEntry,
      providerId: user.providerId,
      clinicId: user.clinicId,
      status: 'pending'
    });
    
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      patientName: '',
      procedureCode: '',
      description: '',
      amount: 0,
      claimNumber: '',
      notes: '',
      patientId: '',
      insurance: '',
      dob: ''
    });
    setShowAddForm(false);
    setSelectedPatient(null);
    setSelectedProcedure(null);
    toast.success('Billing entry added successfully');
  };

  const handleEditEntry = (id: string, field: keyof BillingEntry, value: any) => {
    updateBillingEntry(id, { [field]: value });
    toast.success('Entry updated successfully');
  };

  const handlePatientSelect = (patient: PatientLookup) => {
    setSelectedPatient(patient);
    setNewEntry(prev => ({
      ...prev,
      patientName: patient.name,
      patientId: patient.id,
      insurance: patient.insurance,
      dob: patient.dob
    }));
    setShowPatientLookup(false);
  };

  const handleProcedureSelect = (procedure: ProcedureLookup) => {
    setSelectedProcedure(procedure);
    setNewEntry(prev => ({
      ...prev,
      procedureCode: procedure.code,
      description: procedure.description,
      amount: procedure.typicalAmount
    }));
    setShowProcedureLookup(false);
  };

  const calculateFormula = (formula: string) => {
    try {
      // Simple formula calculation (can be enhanced)
      const result = eval(formula.replace(/[^0-9+\-*/().]/g, ''));
      return isNaN(result) ? 0 : result;
    } catch {
      return 0;
    }
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    toast.success('Exporting to Excel...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size={32} showText={false} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600">{currentClinic?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/history'}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <History size={18} />
              <span>History</span>
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{providerEntries.filter(e => e.status === 'pending').length} entries</p>
              </div>
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">${totalApproved.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{providerEntries.filter(e => e.status === 'approved').length} entries</p>
              </div>
              <FileText className="text-green-600" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-blue-600">${totalPaid.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{providerEntries.filter(e => e.status === 'paid').length} entries</p>
              </div>
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${(totalPending + totalApproved + totalPaid).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{providerEntries.length} total entries</p>
              </div>
              <Calculator className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Enhanced Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'entries' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Billing Entries
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schedule' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reports' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'entries' && (
              <div>
                {/* Enhanced Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search patients, codes, or descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download size={18} />
                    <span>Export</span>
                  </button>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Billing Entries</h2>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    <span>Add Entry</span>
                  </button>
                </div>

                {/* Enhanced Add Form with Google Sheets-like Interface */}
                {showAddForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Add New Billing Entry</h3>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Patient Lookup */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={newEntry.patientName}
                            onChange={(e) => setNewEntry(prev => ({ ...prev, patientName: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search patient..."
                          />
                          <button
                            onClick={() => setShowPatientLookup(true)}
                            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                          >
                            <Search size={16} />
                          </button>
                        </div>
                        {selectedPatient && (
                          <div className="mt-1 text-xs text-gray-600">
                            DOB: {selectedPatient.dob} | Insurance: {selectedPatient.insurance}
                          </div>
                        )}
                      </div>

                      {/* Procedure Lookup */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Code *</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={newEntry.procedureCode}
                            onChange={(e) => setNewEntry(prev => ({ ...prev, procedureCode: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter code..."
                          />
                          <button
                            onClick={() => setShowProcedureLookup(true)}
                            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                          >
                            <Search size={16} />
                          </button>
                        </div>
                        {selectedProcedure && (
                          <div className="mt-1 text-xs text-gray-600">
                            {selectedProcedure.description} | Typical: ${selectedProcedure.typicalAmount}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input
                          type="date"
                          value={newEntry.date}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                        <div className="flex">
                          <input
                            type="number"
                            step="0.01"
                            value={newEntry.amount}
                            onChange={(e) => setNewEntry(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                          <button
                            onClick={() => setShowFormula(true)}
                            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                            title="Use Formula"
                          >
                            <Calculator size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Claim Number</label>
                        <input
                          type="text"
                          value={newEntry.claimNumber}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, claimNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Auto-generated if empty"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={newEntry.description}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Procedure description..."
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={newEntry.notes}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleAddEntry}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save size={16} />
                        <span>Save Entry</span>
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Enhanced Entries Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.patientName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{entry.procedureCode}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${entry.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setEditingId(editingId === entry.id ? null : entry.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                              title="Edit Entry"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredEntries.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No billing entries found</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'Start by adding your first billing entry.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Management</h3>
                <p className="text-gray-600">Schedule functionality will be integrated with your patient database.</p>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
                <p className="text-gray-600">Comprehensive reporting features coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Lookup Modal */}
      {showPatientLookup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Patient Lookup</h3>
              <button
                onClick={() => setShowPatientLookup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patientDatabase.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="font-medium text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-600">
                    DOB: {patient.dob} | Insurance: {patient.insurance} | Last Visit: {patient.lastVisit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Procedure Lookup Modal */}
      {showProcedureLookup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Procedure Lookup</h3>
              <button
                onClick={() => setShowProcedureLookup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {procedureDatabase.map((procedure) => (
                <div
                  key={procedure.code}
                  onClick={() => handleProcedureSelect(procedure)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{procedure.code}</div>
                      <div className="text-sm text-gray-600">{procedure.description}</div>
                      <div className="text-xs text-gray-500">Category: {procedure.category}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">${procedure.typicalAmount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Formula Modal */}
      {showFormula && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Formula Calculator</h3>
              <button
                onClick={() => setShowFormula(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 150 * 1.1"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Result:</div>
                <div className="text-lg font-semibold text-gray-900">${calculateFormula(formula).toFixed(2)}</div>
              </div>
              <button
                onClick={() => {
                  setNewEntry(prev => ({ ...prev, amount: calculateFormula(formula) }));
                  setShowFormula(false);
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Formula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderInputPortal;
