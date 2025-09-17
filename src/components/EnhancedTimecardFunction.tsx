import React, { useState } from 'react';
import { 
  Clock, Plus, Edit, Trash2, Save, X, Calendar, User, 
  Building2, DollarSign, FileText, Download, Upload,
  CheckCircle, AlertTriangle, Filter, Search, BarChart3
} from 'lucide-react';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

interface TimecardEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  clinicId: string;
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  totalAmount: number;
}

interface EnhancedTimecardFunctionProps {
  clinicId?: string;
  employeeId?: string;
}

function EnhancedTimecardFunction({ clinicId, employeeId }: EnhancedTimecardFunctionProps) {
  const { timecardEntries, addTimecardEntry, clinics, providers } = useData();
  const [activeTab, setActiveTab] = useState('timesheet');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Mock employee data - in real app, this would come from database
  const employees = [
    { id: '1', name: 'John Smith', role: 'Billing Specialist', hourlyRate: 25.00, active: true },
    { id: '2', name: 'Sarah Johnson', role: 'Claims Processor', hourlyRate: 22.50, active: true },
    { id: '3', name: 'Mike Davis', role: 'Billing Manager', hourlyRate: 30.00, active: true },
  ];

  // Enhanced timecard entries with additional fields
  const [enhancedEntries, setEnhancedEntries] = useState<TimecardEntry[]>([
    {
      id: '1',
      employeeId: '1',
      employeeName: 'John Smith',
      clinicId: '1',
      date: '2025-01-10',
      hoursWorked: 8,
      hourlyRate: 25.00,
      description: 'Billing and administrative tasks',
      status: 'approved',
      submittedDate: '2025-01-10',
      approvedDate: '2025-01-11',
      approvedBy: 'Manager',
      totalAmount: 200.00
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Sarah Johnson',
      clinicId: '1',
      date: '2025-01-11',
      hoursWorked: 7.5,
      hourlyRate: 22.50,
      description: 'Claims processing and follow-up',
      status: 'submitted',
      submittedDate: '2025-01-11',
      totalAmount: 168.75
    }
  ]);

  const [newEntry, setNewEntry] = useState({
    employeeId: employeeId || '',
    clinicId: clinicId || '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    hourlyRate: 0,
    description: ''
  });

  // Filter entries based on search and filters
  const filteredEntries = enhancedEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesClinic = !clinicId || entry.clinicId === clinicId;
    const matchesEmployee = !employeeId || entry.employeeId === employeeId;
    const matchesDateRange = entry.date >= filterDateRange.start && entry.date <= filterDateRange.end;
    
    return matchesSearch && matchesStatus && matchesClinic && matchesEmployee && matchesDateRange;
  });

  // Calculate statistics
  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hoursWorked, 0);
  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const pendingEntries = filteredEntries.filter(e => e.status === 'submitted').length;
  const approvedEntries = filteredEntries.filter(e => e.status === 'approved').length;
  const rejectedEntries = filteredEntries.filter(e => e.status === 'rejected').length;

  const handleAddEntry = () => {
    if (!newEntry.employeeId || !newEntry.clinicId || !newEntry.hoursWorked || !newEntry.hourlyRate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const employee = employees.find(e => e.id === newEntry.employeeId);
    const totalAmount = newEntry.hoursWorked * newEntry.hourlyRate;

    const entry: TimecardEntry = {
      ...newEntry,
      id: `entry-${Date.now()}`,
      employeeName: employee?.name || 'Unknown',
      status: 'draft',
      totalAmount
    };

    setEnhancedEntries(prev => [entry, ...prev]);
    setNewEntry({
      employeeId: employeeId || '',
      clinicId: clinicId || '',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 0,
      hourlyRate: 0,
      description: ''
    });
    setShowAddEntry(false);
    toast.success('Timecard entry added successfully');
  };

  const handleUpdateEntry = (id: string, updates: Partial<TimecardEntry>) => {
    setEnhancedEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { 
            ...entry, 
            ...updates,
            totalAmount: updates.hoursWorked && updates.hourlyRate 
              ? updates.hoursWorked * updates.hourlyRate
              : entry.totalAmount
          }
        : entry
    ));
    toast.success('Timecard entry updated successfully');
  };

  const handleDeleteEntry = (id: string) => {
    setEnhancedEntries(prev => prev.filter(entry => entry.id !== id));
    toast.success('Timecard entry deleted successfully');
  };

  const handleSubmitEntry = (id: string) => {
    handleUpdateEntry(id, { 
      status: 'submitted', 
      submittedDate: new Date().toISOString().split('T')[0] 
    });
  };

  const handleApproveEntry = (id: string) => {
    handleUpdateEntry(id, { 
      status: 'approved', 
      approvedDate: new Date().toISOString().split('T')[0],
      approvedBy: 'Current User'
    });
  };

  const handleRejectEntry = (id: string) => {
    handleUpdateEntry(id, { status: 'rejected' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={16} className="text-gray-600" />;
      case 'submitted': return <Clock size={16} className="text-yellow-600" />;
      case 'approved': return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const exportTimecards = () => {
    // Implementation for Excel export
    toast.success('Exporting timecards to Excel...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timecard Management</h2>
          <p className="text-gray-600">Track and manage employee timecards for billing staff</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportTimecards}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddEntry(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingEntries}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedEntries}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employees or descriptions..."
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
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="date"
            value={filterDateRange.start}
            onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={filterDateRange.end}
            onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'timesheet', label: 'Timesheet', icon: Clock },
              { id: 'approvals', label: 'Approvals', icon: CheckCircle },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'timesheet' && (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const clinic = clinics.find(c => c.id === entry.clinicId);
                return (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(entry.status)}
                          <h3 className="font-medium text-gray-900">{entry.employeeName}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                          <span className="text-sm text-gray-500">{entry.date}</span>
                        </div>
                        <p className="text-gray-600 mb-2">{entry.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Hours: {entry.hoursWorked}</span>
                          <span>Rate: ${entry.hourlyRate.toFixed(2)}/hr</span>
                          <span>Total: ${entry.totalAmount.toFixed(2)}</span>
                          {clinic && <span>Clinic: {clinic.name}</span>}
                        </div>
                        {entry.submittedDate && (
                          <div className="text-xs text-gray-400 mt-1">
                            Submitted: {entry.submittedDate}
                            {entry.approvedDate && ` • Approved: ${entry.approvedDate}`}
                            {entry.approvedBy && ` by ${entry.approvedBy}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {entry.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitEntry(entry.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Submit Entry"
                          >
                            <Upload size={16} />
                          </button>
                        )}
                        {entry.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleApproveEntry(entry.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Entry"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectEntry(entry.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Entry"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditingEntry(entry.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Entry"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No timecard entries found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Start by adding your first timecard entry.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Approval Management</h3>
              <p className="text-gray-600">Enhanced approval workflow features coming soon.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Timecard Reports</h3>
              <p className="text-gray-600">Comprehensive reporting features coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Timecard Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={newEntry.employeeId}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.25"
                    value={newEntry.hoursWorked}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.hourlyRate}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the work performed..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddEntry}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span>Add Entry</span>
              </button>
              <button
                onClick={() => setShowAddEntry(false)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedTimecardFunction;
