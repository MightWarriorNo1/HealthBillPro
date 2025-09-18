import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Plus, Edit, Trash2, 
  DollarSign, Calendar, Building2, Save, X,
  Search, Filter, Eye, Printer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import DataGrid from './DataGrid';
import { ColDef, GridOptions } from 'ag-grid-community';

interface Invoice {
  id: string;
  invoice_number: string;
  clinic_id: string;
  clinic_name: string;
  date: string;
  due_date: string;
  billing_period: string;
  total_insurance_payments: number;
  billing_fee_percentage: number;
  billing_fee_amount: number;
  total_copays_coinsurance: number;
  net_insurance_payments: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceSystemProps {
  userRole: string;
  clinicId?: string;
}

function InvoiceSystem({ userRole, clinicId }: InvoiceSystemProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newInvoice, setNewInvoice] = useState({
    clinic_id: '',
    clinic_name: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billing_period: '',
    total_insurance_payments: 0,
    billing_fee_percentage: 6.25,
    total_copays_coinsurance: 0,
    notes: ''
  });

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0
  });

  useEffect(() => {
    loadInvoices();
  }, [clinicId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceItems = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setInvoiceItems(data || []);
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };

  const createInvoice = async () => {
    if (!newInvoice.clinic_id || !newInvoice.billing_period) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const billingFeeAmount = (newInvoice.total_insurance_payments * newInvoice.billing_fee_percentage) / 100;
      const netInsurancePayments = newInvoice.total_insurance_payments - newInvoice.total_copays_coinsurance;
      const balanceDue = billingFeeAmount;

      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...newInvoice,
          billing_fee_amount: billingFeeAmount,
          net_insurance_payments: netInsurancePayments,
          balance_due: balanceDue,
          status: 'draft'
        }])
        .select();

      if (error) throw error;

      toast.success('Invoice created successfully');
      setShowAddInvoice(false);
      setNewInvoice({
        clinic_id: '',
        clinic_name: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billing_period: '',
        total_insurance_payments: 0,
        billing_fee_percentage: 6.25,
        total_copays_coinsurance: 0,
        notes: ''
      });
      loadInvoices();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const updateInvoice = async () => {
    if (!editingInvoice) return;

    try {
      const billingFeeAmount = (editingInvoice.total_insurance_payments * editingInvoice.billing_fee_percentage) / 100;
      const netInsurancePayments = editingInvoice.total_insurance_payments - editingInvoice.total_copays_coinsurance;
      const balanceDue = billingFeeAmount;

      const { error } = await supabase
        .from('invoices')
        .update({
          clinic_id: editingInvoice.clinic_id,
          clinic_name: editingInvoice.clinic_name,
          date: editingInvoice.date,
          due_date: editingInvoice.due_date,
          billing_period: editingInvoice.billing_period,
          total_insurance_payments: editingInvoice.total_insurance_payments,
          billing_fee_percentage: editingInvoice.billing_fee_percentage,
          total_copays_coinsurance: editingInvoice.total_copays_coinsurance,
          billing_fee_amount: billingFeeAmount,
          net_insurance_payments: netInsurancePayments,
          balance_due: balanceDue,
          status: editingInvoice.status,
          notes: editingInvoice.notes
        })
        .eq('id', editingInvoice.id);

      if (error) throw error;

      toast.success('Invoice updated successfully');
      setEditingInvoice(null);
      loadInvoices();
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast.error(error.message || 'Failed to update invoice');
    }
  };

  const addInvoiceItem = async () => {
    if (!selectedInvoice || !newItem.description) {
      toast.error('Please fill in item description');
      return;
    }

    try {
      const amount = newItem.quantity * newItem.rate;

      const { error } = await supabase
        .from('invoice_items')
        .insert([{
          invoice_id: selectedInvoice.id,
          description: newItem.description,
          quantity: newItem.quantity,
          rate: newItem.rate,
          amount: amount
        }]);

      if (error) throw error;

      toast.success('Invoice item added successfully');
      setNewItem({
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      });
      loadInvoiceItems(selectedInvoice.id);
    } catch (error: any) {
      console.error('Error adding invoice item:', error);
      toast.error(error.message || 'Failed to add invoice item');
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invoice deleted successfully');
      loadInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const exportInvoiceToPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('American Medical Billing & Coding LLC', 20, 20);
    
    // Logo placeholder (you would add actual logo here)
    doc.setFontSize(12);
    doc.text('INVOICE', 150, 20);
    doc.text(`# ${invoice.invoice_number}`, 150, 30);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 150, 35);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 40);
    doc.text(`Balance Due: $${invoice.balance_due.toFixed(2)}`, 150, 45);

    // Bill To
    doc.text('Bill To:', 20, 60);
    doc.text(invoice.clinic_name, 20, 70);

    // Invoice Items Table
    const tableData = [
      ['Item', 'Quantity', 'Rate', 'Amount'],
      [
        `Total Collected From Insurances Only $${invoice.total_insurance_payments.toFixed(2)}`,
        '1',
        '$0.00',
        '$0.00'
      ],
      [
        `Billing Fee: ${invoice.billing_fee_percentage}% of Total Collected`,
        '1',
        `$${invoice.billing_fee_amount.toFixed(2)}`,
        `$${invoice.billing_fee_amount.toFixed(2)}`
      ]
    ];

    (doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 80,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${invoice.billing_fee_amount.toFixed(2)}`, 150, finalY);
    doc.text('Tax (0%): No tax', 150, finalY + 5);
    doc.text(`Total: $${invoice.balance_due.toFixed(2)}`, 150, finalY + 10);

    // Notes
    doc.text('Notes:', 20, finalY + 20);
    doc.text(`Billing for ${invoice.billing_period}`, 20, finalY + 30);
    doc.text(`Total payments including copays, co-insurance: $${(invoice.total_insurance_payments + invoice.total_copays_coinsurance).toFixed(2)}`, 20, finalY + 35);
    doc.text(`Subtracted payments, copays, co-insurance - $${invoice.total_copays_coinsurance.toFixed(2)}`, 20, finalY + 40);
    doc.text(`Payments received from insurance only $${invoice.total_insurance_payments.toFixed(2)}`, 20, finalY + 45);

    doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    toast.success('Invoice exported to PDF successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.billing_period.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const columns: ColDef[] = useMemo(() => ([
    { field: 'invoice_number', headerName: 'Invoice #' },
    { field: 'clinic_name', headerName: 'Clinic' },
    { field: 'billing_period', headerName: 'Billing Period' },
    { field: 'total_insurance_payments', headerName: 'Insurance Payments' },
    { field: 'billing_fee_amount', headerName: 'Billing Fee' },
    { field: 'balance_due', headerName: 'Balance Due' },
    { field: 'status', headerName: 'Status' },
    { field: 'due_date', headerName: 'Due Date' }
  ]), []);

  const onCellChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    try {
      const updated = { ...(e.data as any) } as Invoice;
      // Recalculate derived amounts if inputs changed
      if (['total_insurance_payments', 'billing_fee_percentage', 'total_copays_coinsurance'].includes(String(e.colDef.field))) {
        const billing_fee_amount = (updated.total_insurance_payments * updated.billing_fee_percentage) / 100;
        const net_insurance_payments = updated.total_insurance_payments - updated.total_copays_coinsurance;
        const balance_due = billing_fee_amount;
        updated.billing_fee_amount = billing_fee_amount;
        updated.net_insurance_payments = net_insurance_payments;
        updated.balance_due = balance_due;
      }
      const { id, ...rest } = updated as any;
      await supabase.from('invoices').update(rest).eq('id', updated.id);
      await loadInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice');
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
          <h2 className="text-2xl font-bold text-gray-900">Invoice System</h2>
          <p className="text-gray-600">Generate and manage invoices for billing services</p>
        </div>
        <button
          onClick={() => setShowAddInvoice(true)}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-4">
          <DataGrid
            columnDefs={columns}
            rowData={filteredInvoices}
            readOnly={false}
            onCellValueChanged={onCellChanged}
          />
          {/* Actions row remains outside grid; users can still use buttons in row selection later if needed */}
          <div className="mt-3 text-sm text-gray-600">Use grid to edit values. Use actions from the list below:</div>
          <div className="mt-2 space-y-1">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-end gap-2">
                <button
                  onClick={() => { setSelectedInvoice(invoice); loadInvoiceItems(invoice.id); }}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="View Invoice"
                >
                  View #{invoice.invoice_number}
                </button>
                <button
                  onClick={() => setEditingInvoice(invoice)}
                  className="text-yellow-600 hover:text-yellow-900"
                  title="Edit Invoice"
                >
                  Edit
                </button>
                <button
                  onClick={() => exportInvoiceToPDF(invoice)}
                  className="text-red-600 hover:text-red-900"
                  title="Export PDF"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete Invoice"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Invoice #{selectedInvoice.invoice_number}</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900">American Medical Billing & Coding LLC</h4>
                <p className="text-sm text-gray-600">Medical Billing Services</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Invoice #: {selectedInvoice.invoice_number}</p>
                <p className="text-sm text-gray-600">Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                <p className="font-semibold text-gray-900">Balance Due: ${selectedInvoice.balance_due.toFixed(2)}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
              <p className="text-gray-700">{selectedInvoice.clinic_name}</p>
            </div>

            {/* Invoice Items */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Invoice Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Total Collected From Insurances Only ${selectedInvoice.total_insurance_payments.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">1</td>
                      <td className="px-6 py-4 text-sm text-gray-900">$0.00</td>
                      <td className="px-6 py-4 text-sm text-gray-900">$0.00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Billing Fee: {selectedInvoice.billing_fee_percentage}% of Total Collected
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">1</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${selectedInvoice.billing_fee_amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${selectedInvoice.billing_fee_amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end mb-6">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-900">${selectedInvoice.billing_fee_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Tax (0%):</span>
                  <span className="text-sm text-gray-900">No tax</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-semibold text-gray-900">${selectedInvoice.balance_due.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>Billing for {selectedInvoice.billing_period}</p>
                <p>Total payments including copays, co-insurance: ${(selectedInvoice.total_insurance_payments + selectedInvoice.total_copays_coinsurance).toFixed(2)}</p>
                <p>Subtracted payments, copays, co-insurance - ${selectedInvoice.total_copays_coinsurance.toFixed(2)}</p>
                <p>Payments received from insurance only ${selectedInvoice.total_insurance_payments.toFixed(2)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => exportInvoiceToPDF(selectedInvoice)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create New Invoice</h3>
              <button
                onClick={() => setShowAddInvoice(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    value={newInvoice.clinic_name}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clinic_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="Clinic Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Period *
                  </label>
                  <input
                    type="text"
                    value={newInvoice.billing_period}
                    onChange={(e) => setNewInvoice({ ...newInvoice, billing_period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="e.g., September 2024"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newInvoice.date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Insurance Payments *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.total_insurance_payments}
                    onChange={(e) => setNewInvoice({ ...newInvoice, total_insurance_payments: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Fee Percentage
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.billing_fee_percentage}
                    onChange={(e) => setNewInvoice({ ...newInvoice, billing_fee_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="6.25"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Copays/Coinsurance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvoice.total_copays_coinsurance}
                  onChange={(e) => setNewInvoice({ ...newInvoice, total_copays_coinsurance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddInvoice(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createInvoice}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceSystem;
