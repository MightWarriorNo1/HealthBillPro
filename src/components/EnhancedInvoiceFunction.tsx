import React, { useState } from 'react';
import { 
  DollarSign, Plus, Edit, Trash2, Send, Download, Eye, 
  FileText, Calendar, Building2, User, CheckCircle, AlertTriangle,
  Search, Filter, BarChart3, TrendingUp, Clock, RefreshCw, X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface EnhancedInvoice {
  id: string;
  invoiceNumber: string;
  clinicId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
  createdBy: string;
  sentDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
}

interface EnhancedInvoiceFunctionProps {
  clinicId?: string;
}

function EnhancedInvoiceFunction({ clinicId }: EnhancedInvoiceFunctionProps) {
  const { invoices, addInvoice, updateInvoice, clinics, providers, billingEntries } = useData();
  const [activeTab, setActiveTab] = useState('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Enhanced invoice data with additional fields
  const [enhancedInvoices, setEnhancedInvoices] = useState<EnhancedInvoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      clinicId: '1',
      date: '2025-01-01',
      dueDate: '2025-01-31',
      amount: 2500.00,
      status: 'sent',
      items: [
        {
          description: 'Billing services - January 2025',
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        }
      ],
      notes: 'Monthly billing services',
      createdBy: 'Admin',
      sentDate: '2025-01-02',
      subtotal: 2500.00,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      totalAmount: 2500.00
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-002',
      clinicId: '2',
      date: '2025-01-05',
      dueDate: '2025-02-04',
      amount: 1800.00,
      status: 'draft',
      items: [
        {
          description: 'Claims processing services',
          quantity: 1,
          rate: 1800.00,
          amount: 1800.00
        }
      ],
      notes: 'Claims processing for Q1 2025',
      createdBy: 'Admin',
      subtotal: 1800.00,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      totalAmount: 1800.00
    }
  ]);

  const [newInvoice, setNewInvoice] = useState({
    clinicId: clinicId || '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{
      description: 'Billing services',
      quantity: 1,
      rate: 0,
      amount: 0
    }],
    notes: '',
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    totalAmount: 0
  });

  // Filter invoices based on search and filters
  const filteredInvoices = enhancedInvoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesClinic = !clinicId || invoice.clinicId === clinicId;
    const matchesDateRange = invoice.date >= filterDateRange.start && invoice.date <= filterDateRange.end;
    
    return matchesSearch && matchesStatus && matchesClinic && matchesDateRange;
  });

  // Calculate statistics
  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingAmount = filteredInvoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.totalAmount, 0);
  const overdueAmount = filteredInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.totalAmount, 0);

  const handleCreateInvoice = () => {
    if (!newInvoice.clinicId || !newInvoice.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(enhancedInvoices.length + 1).padStart(3, '0')}`;
    const subtotal = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (newInvoice.taxRate / 100);
    const discountAmount = subtotal * (newInvoice.discountRate / 100);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice: EnhancedInvoice = {
      ...newInvoice,
      id: `invoice-${Date.now()}`,
      invoiceNumber,
      status: 'draft',
      createdBy: 'Current User',
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    };

    setEnhancedInvoices(prev => [invoice, ...prev]);
    setNewInvoice({
      clinicId: clinicId || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [{
        description: 'Billing services',
        quantity: 1,
        rate: 0,
        amount: 0
      }],
      notes: '',
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      totalAmount: 0
    });
    setShowCreateInvoice(false);
    toast.success('Invoice created successfully');
  };

  const handleUpdateInvoice = (id: string, updates: Partial<EnhancedInvoice>) => {
    setEnhancedInvoices(prev => prev.map(invoice => 
      invoice.id === id 
        ? { 
            ...invoice, 
            ...updates,
            sentDate: updates.status === 'sent' ? new Date().toISOString().split('T')[0] : invoice.sentDate,
            paidDate: updates.status === 'paid' ? new Date().toISOString().split('T')[0] : invoice.paidDate
          }
        : invoice
    ));
    toast.success('Invoice updated successfully');
  };

  const handleDeleteInvoice = (id: string) => {
    setEnhancedInvoices(prev => prev.filter(invoice => invoice.id !== id));
    toast.success('Invoice deleted successfully');
  };

  const handleSendInvoice = (id: string) => {
    handleUpdateInvoice(id, { status: 'sent' });
    toast.success('Invoice sent successfully');
  };

  const handleMarkPaid = (id: string) => {
    handleUpdateInvoice(id, { status: 'paid' });
    toast.success('Invoice marked as paid');
  };

  const generateInvoicePDF = (invoice: EnhancedInvoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 30);
    
    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${invoice.date}`, 20, 60);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, 70);
    
    // Clinic details
    const clinic = clinics.find(c => c.id === invoice.clinicId);
    if (clinic) {
      doc.text(`Bill To: ${clinic.name}`, 20, 90);
      doc.text(clinic.address, 20, 100);
      doc.text(`Phone: ${clinic.phone}`, 20, 110);
    }
    
    // Items table
    doc.text('Description', 20, 130);
    doc.text('Qty', 120, 130);
    doc.text('Rate', 140, 130);
    doc.text('Amount', 170, 130);
    
    let yPosition = 140;
    invoice.items.forEach((item, index) => {
      doc.text(item.description, 20, yPosition);
      doc.text(item.quantity.toString(), 120, yPosition);
      doc.text(`$${item.rate.toFixed(2)}`, 140, yPosition);
      doc.text(`$${item.amount.toFixed(2)}`, 170, yPosition);
      yPosition += 10;
    });
    
    // Totals
    yPosition += 10;
    doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 140, yPosition);
    if (invoice.taxAmount > 0) {
      yPosition += 10;
      doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}`, 140, yPosition);
    }
    if (invoice.discountAmount > 0) {
      yPosition += 10;
      doc.text(`Discount (${invoice.discountRate}%): -$${invoice.discountAmount.toFixed(2)}`, 140, yPosition);
    }
    yPosition += 10;
    doc.text(`Total: $${invoice.totalAmount.toFixed(2)}`, 140, yPosition);
    
    // Notes
    if (invoice.notes) {
      yPosition += 20;
      doc.text('Notes:', 20, yPosition);
      yPosition += 10;
      doc.text(invoice.notes, 20, yPosition);
    }
    
    doc.save(`invoice_${invoice.invoiceNumber}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={16} className="text-gray-600" />;
      case 'sent': return <Send size={16} className="text-blue-600" />;
      case 'paid': return <CheckCircle size={16} className="text-green-600" />;
      case 'overdue': return <AlertTriangle size={16} className="text-red-600" />;
      case 'cancelled': return <X size={16} className="text-gray-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const exportInvoices = () => {
    // Implementation for Excel export
    toast.success('Exporting invoices to Excel...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Management</h2>
          <p className="text-gray-600">Create, manage, and track invoices for billing services</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportInvoices}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowCreateInvoice(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-600">{totalInvoices}</p>
            </div>
            <FileText className="text-blue-600" size={24} />
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
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600">${overdueAmount.toFixed(2)}</p>
            </div>
            <AlertTriangle className="text-red-600" size={24} />
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
              placeholder="Search invoices..."
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
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
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
              { id: 'invoices', label: 'Invoices', icon: FileText },
              { id: 'templates', label: 'Templates', icon: FileText },
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
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const clinic = clinics.find(c => c.id === invoice.clinicId);
                const isOverdue = invoice.status === 'sent' && new Date(invoice.dueDate) < new Date();
                
                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(invoice.status)}
                          <h3 className="font-medium text-gray-900">{invoice.invoiceNumber}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span>Date: {invoice.date}</span>
                          <span>Due: {invoice.dueDate}</span>
                          {clinic && <span>Clinic: {clinic.name}</span>}
                          <span>Amount: ${invoice.totalAmount.toFixed(2)}</span>
                        </div>
                        {invoice.notes && (
                          <p className="text-gray-600 text-sm">{invoice.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {invoice.items.map((item, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {item.description} (${item.amount.toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => generateInvoicePDF(invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleSendInvoice(invoice.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send Invoice"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {invoice.status === 'sent' && (
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingInvoice(invoice.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredInvoices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Start by creating your first invoice.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Templates</h3>
              <p className="text-gray-600">Invoice template management features coming soon.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Reports</h3>
              <p className="text-gray-600">Comprehensive invoice reporting features coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Invoice</h3>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic *</label>
                  <select
                    value={newInvoice.clinicId}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, clinicId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Invoice Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Items</label>
                <div className="space-y-2">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...newInvoice.items];
                          newItems[index].description = e.target.value;
                          setNewInvoice(prev => ({ ...prev, items: newItems }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...newInvoice.items];
                          newItems[index].quantity = parseInt(e.target.value) || 0;
                          newItems[index].amount = newItems[index].quantity * newItems[index].rate;
                          setNewInvoice(prev => ({ ...prev, items: newItems }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => {
                          const newItems = [...newInvoice.items];
                          newItems[index].rate = parseFloat(e.target.value) || 0;
                          newItems[index].amount = newItems[index].quantity * newItems[index].rate;
                          setNewInvoice(prev => ({ ...prev, items: newItems }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Rate"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        readOnly
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Amount"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateInvoice}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span>Create Invoice</span>
              </button>
              <button
                onClick={() => setShowCreateInvoice(false)}
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

export default EnhancedInvoiceFunction;
