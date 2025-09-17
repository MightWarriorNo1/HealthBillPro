import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, Download, Calendar, Clock, 
  User, DollarSign, FileText, AlertTriangle, CheckCircle, 
  XCircle, Eye, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

interface HistoryEntry {
  id: string;
  type: 'billing' | 'invoice' | 'timecard' | 'claim_issue' | 'user_action';
  action: string;
  description: string;
  user: string;
  timestamp: Date;
  amount?: number;
  status?: string;
  details?: any;
}

function HistoryPage() {
  const { user } = useAuth();
  const { 
    billingEntries, invoices, timecardEntries, claimIssues, 
    clinics, providers 
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Generate history entries from various data sources
  const generateHistoryEntries = (): HistoryEntry[] => {
    const entries: HistoryEntry[] = [];

    // Billing entries history
    billingEntries.forEach(entry => {
      entries.push({
        id: `billing-${entry.id}`,
        type: 'billing',
        action: 'Billing Entry',
        description: `${entry.patientName} - ${entry.procedureCode}`,
        user: entry.providerId || 'Unknown',
        timestamp: new Date(entry.date),
        amount: entry.amount,
        status: entry.status,
        details: entry
      });
    });

    // Invoice history
    invoices.forEach(invoice => {
      entries.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice',
        action: 'Invoice',
        description: `Invoice #${invoice.id} - ${invoice.status}`,
        user: 'System',
        timestamp: new Date(invoice.date),
        amount: invoice.items.reduce((sum, item) => sum + item.amount, 0),
        status: invoice.status,
        details: invoice
      });
    });

    // Timecard entries history
    timecardEntries.forEach(entry => {
      entries.push({
        id: `timecard-${entry.id}`,
        type: 'timecard',
        action: 'Timecard Entry',
        description: `${entry.hoursWorked} hours - ${entry.date}`,
        user: entry.employeeId || 'Unknown',
        timestamp: new Date(entry.date),
        amount: entry.hoursWorked * entry.hourlyRate,
        status: entry.status,
        details: entry
      });
    });

    // Claim issues history
    claimIssues.forEach(issue => {
      entries.push({
        id: `issue-${issue.id}`,
        type: 'claim_issue',
        action: 'Claim Issue',
        description: `${issue.claimNumber} - ${issue.description}`,
        user: issue.assignedTo || 'Unassigned',
        timestamp: new Date(issue.createdAt),
        status: issue.status,
        details: issue
      });
    });

    return entries;
  };

  const historyEntries = generateHistoryEntries();

  // Filter and sort entries
  const filteredEntries = historyEntries
    .filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.user.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || entry.type === filterType;
      
      let matchesDate = true;
      if (filterDateRange !== 'all') {
        const now = new Date();
        const entryDate = new Date(entry.timestamp);
        
        switch (filterDateRange) {
          case 'today':
            matchesDate = entryDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = entryDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = entryDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'user':
          comparison = a.user.localeCompare(b.user);
          break;
        case 'action':
          comparison = a.action.localeCompare(b.action);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'billing':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'timecard':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'claim_issue':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportHistory = () => {
    const csvContent = [
      ['Date', 'Type', 'Action', 'Description', 'User', 'Amount', 'Status'],
      ...filteredEntries.map(entry => [
        format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        entry.type,
        entry.action,
        entry.description,
        entry.user,
        entry.amount?.toFixed(2) || '',
        entry.status || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">History</h1>
                <p className="text-sm text-gray-500">View system activity and audit logs</p>
              </div>
            </div>
            <button
              onClick={exportHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="billing">Billing</option>
              <option value="invoice">Invoices</option>
              <option value="timecard">Timecards</option>
              <option value="claim_issue">Claim Issues</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            {/* Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="timestamp">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="user">Sort by User</option>
                <option value="action">Sort by Action</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* History Entries */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity History ({filteredEntries.length} entries)
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredEntries.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No history found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTypeIcon(entry.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{entry.action}</h3>
                          {getStatusIcon(entry.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{entry.user}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(entry.timestamp, 'MMM dd, yyyy')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(entry.timestamp, 'HH:mm')}</span>
                          </span>
                          {entry.amount && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>${entry.amount.toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleExpanded(entry.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedEntries.has(entry.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedEntries.has(entry.id) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
