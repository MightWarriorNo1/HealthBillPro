import React, { useState } from 'react';
import { 
  LogOut, Users, FileText, AlertTriangle, Clock, CheckCircle, XCircle, 
  Search, Filter, Download, Upload, Settings, Bell, Calendar, BarChart3,
  Plus, Edit, Eye, EyeOff, RefreshCw, Archive, Trash2, Send, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import Logo from './Logo';

function EnhancedOfficeStaffDashboard() {
  const { user, logout } = useAuth();
  const { billingEntries, claimIssues, updateClaimIssue, clinics, providers, addClaimIssue } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('all');

  // Filter data for current clinic
  const clinicEntries = billingEntries.filter(entry => entry.clinicId === user?.clinicId);
  const clinicIssues = claimIssues.filter(issue => issue.clinicId === user?.clinicId);
  const currentClinic = clinics.find(c => c.id === user?.clinicId);
  const clinicProviders = providers.filter(p => p.clinicId === user?.clinicId);

  // Calculate comprehensive stats
  const pendingEntries = clinicEntries.filter(e => e.status === 'pending').length;
  const approvedEntries = clinicEntries.filter(e => e.status === 'approved').length;
  const paidEntries = clinicEntries.filter(e => e.status === 'paid').length;
  const rejectedEntries = clinicEntries.filter(e => e.status === 'rejected').length;
  
  const openIssues = clinicIssues.filter(i => i.status === 'open').length;
  const inProgressIssues = clinicIssues.filter(i => i.status === 'in_progress').length;
  const resolvedIssues = clinicIssues.filter(i => i.status === 'resolved').length;
  
  const totalAmount = clinicEntries.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = clinicEntries.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = clinicEntries.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const paidAmount = clinicEntries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

  // Filter entries based on search and status
  const filteredEntries = clinicEntries.filter(entry => {
    const matchesSearch = entry.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.procedureCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesProvider = selectedProvider === 'all' || entry.providerId === selectedProvider;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const [newIssue, setNewIssue] = useState({
    claimNumber: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    dueDate: '',
    providerId: ''
  });

  const handleAddIssue = () => {
    if (!newIssue.claimNumber || !newIssue.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    addClaimIssue({
      ...newIssue,
      clinicId: user?.clinicId || '',
      providerId: newIssue.providerId || clinicProviders[0]?.id || '',
      status: 'open',
      createdDate: new Date().toISOString().split('T')[0]
    });

    setNewIssue({
      claimNumber: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      providerId: ''
    });
    setShowAddIssue(false);
    toast.success('Claim issue added successfully');
  };

  const handleUpdateIssue = (id: string, status: 'open' | 'in_progress' | 'resolved') => {
    updateClaimIssue(id, { status });
    toast.success(`Issue marked as ${status.replace('_', ' ')}`);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIssueStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportData = () => {
    toast.success('Exporting data...');
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
              <p className="text-gray-600">Office Staff - {currentClinic?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/history'}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Clock size={18} />
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
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
            >
              <Bell size={18} />
              {openIssues > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {openIssues}
                </span>
              )}
            </button>
            <button
              onClick={exportData}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Download size={18} />
              <span>Export</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Entries</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingEntries}</p>
                <p className="text-xs text-gray-500">${pendingAmount.toFixed(2)}</p>
              </div>
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{openIssues}</p>
                <p className="text-xs text-gray-500">{inProgressIssues} in progress</p>
              </div>
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Providers</p>
                <p className="text-2xl font-bold text-blue-600">{clinicProviders.length}</p>
                <p className="text-xs text-gray-500">Active providers</p>
              </div>
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{paidAmount.toFixed(2)} paid</p>
              </div>
              <FileText className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Enhanced Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'entries', label: 'Billing Entries', icon: FileText },
                { id: 'issues', label: 'Claim Issues', icon: AlertTriangle },
                { id: 'providers', label: 'Providers', icon: Users },
                { id: 'reports', label: 'Reports', icon: BarChart3 }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === id 
                      ? 'border-teal-500 text-teal-600' 
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
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Approved Entries</p>
                        <p className="text-2xl font-bold text-blue-900">{approvedEntries}</p>
                        <p className="text-xs text-blue-700">${approvedAmount.toFixed(2)}</p>
                      </div>
                      <CheckCircle className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Paid Entries</p>
                        <p className="text-2xl font-bold text-green-900">{paidEntries}</p>
                        <p className="text-xs text-green-700">${paidAmount.toFixed(2)}</p>
                      </div>
                      <FileText className="text-green-600" size={24} />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600">Rejected Entries</p>
                        <p className="text-2xl font-bold text-red-900">{rejectedEntries}</p>
                        <p className="text-xs text-red-700">Need attention</p>
                      </div>
                      <XCircle className="text-red-600" size={24} />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Billing Entries</h3>
                    <div className="space-y-3">
                      {clinicEntries.slice(0, 5).map((entry) => {
                        const provider = providers.find(p => p.id === entry.providerId);
                        return (
                          <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="text-gray-400" size={16} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {provider?.name} - {entry.procedureCode}
                              </p>
                              <p className="text-xs text-gray-600">
                                {entry.patientName} • ${entry.amount.toFixed(2)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Claim Issues</h3>
                    <div className="space-y-3">
                      {clinicIssues.slice(0, 5).map((issue) => {
                        const provider = providers.find(p => p.id === issue.providerId);
                        return (
                          <div key={issue.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <AlertTriangle className="text-gray-400" size={16} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                Claim #{issue.claimNumber}
                              </p>
                              <p className="text-xs text-gray-600">
                                {provider?.name} • {issue.description.substring(0, 50)}...
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getIssueStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'entries' && (
              <div>
                {/* Enhanced Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="all">All Providers</option>
                    {clinicProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing Entries</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEntries.map((entry) => {
                        const provider = providers.find(p => p.id === entry.providerId);
                        return (
                          <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.patientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{entry.procedureCode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${entry.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(entry.status)}`}>
                                {entry.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                className="text-teal-600 hover:text-teal-800 transition-colors p-1 rounded hover:bg-teal-50"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Claim Issues</h2>
                  <button
                    onClick={() => setShowAddIssue(true)}
                    className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus size={18} />
                    <span>Add Issue</span>
                  </button>
                </div>

                {/* Add Issue Form */}
                {showAddIssue && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-medium text-gray-900 mb-4">Add New Claim Issue</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={newIssue.claimNumber}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, claimNumber: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Claim Number"
                      />
                      <select
                        value={newIssue.providerId}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, providerId: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Provider</option>
                        {clinicProviders.map((provider) => (
                          <option key={provider.id} value={provider.id}>{provider.name}</option>
                        ))}
                      </select>
                      <select
                        value={newIssue.priority}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <input
                        type="date"
                        value={newIssue.dueDate}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newIssue.assignedTo}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, assignedTo: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent md:col-span-2"
                        placeholder="Assigned To"
                      />
                      <textarea
                        value={newIssue.description}
                        onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent md:col-span-2"
                        placeholder="Issue Description"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleAddIssue}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={16} />
                        <span>Add Issue</span>
                      </button>
                      <button
                        onClick={() => setShowAddIssue(false)}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <XCircle size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {clinicIssues.map((issue) => {
                    const provider = providers.find(p => p.id === issue.providerId);
                    return (
                      <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-900">Claim #{issue.claimNumber}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(issue.priority)}`}>
                                {issue.priority} priority
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getIssueStatusColor(issue.status)}`}>
                                {issue.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{issue.description}</p>
                            <div className="text-sm text-gray-500">
                              <span>Provider: {provider?.name}</span>
                              <span className="mx-2">•</span>
                              <span>Due: {issue.dueDate}</span>
                              {issue.assignedTo && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Assigned to: {issue.assignedTo}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleUpdateIssue(issue.id, 'in_progress')}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Mark In Progress"
                            >
                              <Clock size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateIssue(issue.id, 'resolved')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark Resolved"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {clinicIssues.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No open issues</h3>
                    <p className="text-gray-600">All claims are processing smoothly.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'providers' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Clinic Providers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clinicProviders.map((provider) => {
                    const providerEntries = clinicEntries.filter(e => e.providerId === provider.id);
                    const totalAmount = providerEntries.reduce((sum, e) => sum + e.amount, 0);
                    const pendingCount = providerEntries.filter(e => e.status === 'pending').length;
                    const approvedCount = providerEntries.filter(e => e.status === 'approved').length;
                    const paidCount = providerEntries.filter(e => e.status === 'paid').length;
                    
                    return (
                      <div key={provider.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-medium text-gray-900">{provider.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            provider.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{provider.email}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Entries:</span>
                            <span className="font-medium">{providerEntries.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-medium">${totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Pending</div>
                              <div className="text-sm font-semibold text-yellow-600">{pendingCount}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Approved</div>
                              <div className="text-sm font-semibold text-green-600">{approvedCount}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Paid</div>
                              <div className="text-sm font-semibold text-blue-600">{paidCount}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
                <p className="text-gray-600">Comprehensive reporting features coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedOfficeStaffDashboard;
