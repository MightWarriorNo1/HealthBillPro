import React, { useState } from 'react';
import { Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import ExcelTable, { ExcelColumn, ExcelRow } from './ExcelTable';

interface MonthlyAccountsReceivableProps {
  clinicId?: string;
  providerId?: string;
  month: string;
  canEdit?: boolean;
}

function MonthlyAccountsReceivable({ 
  clinicId, 
  providerId, 
  month, 
  canEdit = true 
}: MonthlyAccountsReceivableProps) {
  const [data, setData] = useState<ExcelRow[]>([
    // Sample data for the specific month
    {
      id: '1',
      ar_id: 'AR001',
      ar_name: 'John Doe',
      ar_date_of_service: '2025-01-15',
      ar_amount: 150.00,
      ar_date_recorded: '2025-01-25',
      ar_type: 'Payment',
      ar_notes: 'Insurance payment received',
      status: 'Paid'
    },
    {
      id: '2',
      ar_id: 'AR002',
      ar_name: 'Jane Smith',
      ar_date_of_service: '2025-01-20',
      ar_amount: 75.00,
      ar_date_recorded: '2025-01-30',
      ar_type: 'Payment',
      ar_notes: 'Patient copay',
      status: 'Paid'
    },
    {
      id: '3',
      ar_id: 'AR003',
      ar_name: 'Bob Johnson',
      ar_date_of_service: '2025-01-25',
      ar_amount: 200.00,
      ar_date_recorded: '2025-02-01',
      ar_type: 'Outstanding',
      ar_notes: 'Pending insurance payment',
      status: 'Pending'
    }
  ]);

  // Define columns for monthly accounts receivable
  const columns: ExcelColumn[] = [
    {
      id: 'ar_id',
      label: 'ID #',
      type: 'text',
      width: 80,
      editable: canEdit,
      required: true
    },
    {
      id: 'ar_name',
      label: 'Name',
      type: 'text',
      width: 120,
      editable: canEdit,
      required: true
    },
    {
      id: 'ar_date_of_service',
      label: 'Date of Service',
      type: 'date',
      width: 130,
      editable: canEdit,
      required: true
    },
    {
      id: 'ar_amount',
      label: 'Amount',
      type: 'currency',
      width: 100,
      editable: canEdit,
      required: true
    },
    {
      id: 'ar_date_recorded',
      label: 'Date Recorded',
      type: 'date',
      width: 130,
      editable: canEdit,
      required: true
    },
    {
      id: 'ar_type',
      label: 'Type',
      type: 'select',
      width: 100,
      editable: canEdit,
      options: ['Payment', 'Adjustment', 'Refund', 'Write-off', 'Outstanding']
    },
    {
      id: 'ar_notes',
      label: 'Notes',
      type: 'text',
      width: 150,
      editable: canEdit
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      width: 100,
      editable: canEdit,
      options: ['Paid', 'Pending', 'Overdue', 'Disputed']
    }
  ];

  const handleDataChange = (newData: ExcelRow[]) => {
    setData(newData);
    console.log('Monthly AR data updated:', newData);
  };

  const handleRowAdd = (row: ExcelRow) => {
    const newData = [...data, row];
    setData(newData);
    console.log('Monthly AR row added:', row);
  };

  const handleRowDelete = (rowId: string) => {
    const newData = data.filter(row => row.id !== rowId);
    setData(newData);
    console.log('Monthly AR row deleted:', rowId);
  };

  const handleRowUpdate = (rowId: string, updates: Partial<ExcelRow>) => {
    const newData = data.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    );
    setData(newData);
    console.log('Monthly AR row updated:', rowId, updates);
  };

  // Calculate summary statistics
  const totalAmount = data.reduce((sum, row) => sum + (Number(row.ar_amount) || 0), 0);
  const paidAmount = data
    .filter(row => row.status === 'Paid')
    .reduce((sum, row) => sum + (Number(row.ar_amount) || 0), 0);
  const pendingAmount = data
    .filter(row => row.status === 'Pending')
    .reduce((sum, row) => sum + (Number(row.ar_amount) || 0), 0);
  const overdueAmount = data
    .filter(row => row.status === 'Overdue')
    .reduce((sum, row) => sum + (Number(row.ar_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {month} Accounts Receivable
            </h3>
            <p className="text-sm text-blue-700">
              Manage accounts receivable for {month}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-lg font-semibold text-gray-900">${paidAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-gray-900">${pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-lg font-semibold text-gray-900">${overdueAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Excel Table */}
      <ExcelTable
        columns={columns}
        data={data}
        onDataChange={handleDataChange}
        onRowAdd={handleRowAdd}
        onRowDelete={handleRowDelete}
        onRowUpdate={handleRowUpdate}
        canEdit={canEdit}
        canAdd={canEdit}
        canDelete={canEdit}
        canExport={true}
        canImport={true}
        title={`${month} Accounts Receivable`}
        subtitle={`Manage accounts receivable entries for ${month}`}
      />

      {/* Additional Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Monthly AR Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Month:</strong> {month}</p>
          <p><strong>Total Records:</strong> {data.length}</p>
          <p><strong>Collection Rate:</strong> {totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : 0}%</p>
          <p><strong>Outstanding Balance:</strong> ${(totalAmount - paidAmount).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default MonthlyAccountsReceivable;

