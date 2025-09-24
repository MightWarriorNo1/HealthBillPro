import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import ExcelTable, { ExcelColumn, ExcelRow } from './ExcelTable';
import MonthlyAccountsReceivable from './MonthlyAccountsReceivable';
import { supabase } from '../lib/supabase';

interface BillingDataTableProps {
  clinicId?: string;
  providerId?: string;
  month?: string;
  canEdit?: boolean;
  userRole?: string;
}

function BillingDataTable({ 
  clinicId, 
  providerId, 
  month, 
  canEdit = true, 
  userRole = 'admin' 
}: BillingDataTableProps) {
  const { billingEntries, patients, providers, clinics, refreshBillingEntries } = useData();
  const [data, setData] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCodes, setBillingCodes] = useState<Array<{code: string, description: string}>>([]);
  const [activeTab, setActiveTab] = useState<'billing' | 'ar'>('billing');

  // Load data when props change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          refreshBillingEntries(clinicId, providerId, month),
          loadBillingCodes()
        ]);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicId, providerId, month, refreshBillingEntries]);

  const loadBillingCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_codes')
        .select('code, description')
        .order('code', { ascending: true });
      if (error) throw error;
      setBillingCodes(data || []);
    } catch (err) {
      console.error('Failed to load billing codes', err);
    }
  };

  const getPreviousMonth = (month: string): string => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const currentIndex = months.indexOf(month);
    return currentIndex > 0 ? months[currentIndex - 1] : 'December';
  };

  // Calculate billing tracker metrics
  const billingMetrics = useMemo(() => {
    const claimsNotPaid = data.filter(row => 
      row.claim_status && !['Paid', 'IP'].includes(row.claim_status)
    ).length;
    
    const totalCollectedFromIns = data.reduce((sum, row) => 
      sum + (Number(row.ins_pay) || 0), 0
    );
    
    const totalCollectedFromPt = data.reduce((sum, row) => 
      sum + (Number(row.collected_from_pt) || 0), 0
    );
    
    const totalCollected = totalCollectedFromIns + totalCollectedFromPt;
    
    const overdueInvoices = data.filter(row => 
      row.pt_pay_status === 'Overdue'
    ).length;
    
    return {
      claimsNotPaid,
      totalCollectedFromIns,
      totalCollectedFromPt,
      totalCollected,
      overdueInvoices
    };
  }, [data]);

  // Start with a completely blank spreadsheet (200 placeholder rows handled by ExcelTable)
  // Ignore any prefetched demo/mock entries in context
  useEffect(() => {
    setData([]);
  }, [clinicId, providerId, month]);

  // Define columns based on the second image structure
  const columns: ExcelColumn[] = [
    // ADMIN section (Blue background)
    {
      id: 'id_field',
      label: 'ID',
      type: 'text',
      width: 80,
      editable: canEdit,
      required: true
    },
    {
      id: 'first_name',
      label: 'First Name',
      type: 'text',
      width: 120,
      editable: canEdit,
      required: true
    },
    {
      id: 'last_initial',
      label: 'Last Initial',
      type: 'text',
      width: 100,
      editable: canEdit,
      required: true
    },
    {
      id: 'ins',
      label: 'Ins',
      type: 'select',
      width: 120,
      editable: canEdit,
      options: ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid', 'Self Pay'],
      optionColors: {
        'Blue Cross': 'bg-blue-100 text-blue-800',
        'Aetna': 'bg-purple-100 text-purple-800',
        'Cigna': 'bg-green-100 text-green-800',
        'UnitedHealth': 'bg-indigo-100 text-indigo-800',
        'Medicare': 'bg-sky-100 text-sky-800',
        'Medicaid': 'bg-teal-100 text-teal-800',
        'Self Pay': 'bg-orange-100 text-orange-800'
      }
    },
    {
      id: 'co_pay',
      label: 'Co-pay',
      type: 'currency',
      width: 100,
      editable: canEdit
    },
    {
      id: 'co_ins',
      label: 'Co-ins',
      type: 'currency',
      width: 100,
      editable: canEdit
    },
    {
      id: 'date_of_service',
      label: 'Date of Service',
      type: 'date-mmddyy',
      width: 130,
      editable: canEdit,
      required: true
    },
    
    // PROVIDER section (Orange background)
    {
      id: 'cpt_code',
      label: 'CPT Code',
      type: 'multiselect',
      width: 150,
      editable: canEdit,
      required: true,
      options: billingCodes.map(code => code.code),
      optionColors: {
        '99213': 'bg-blue-100 text-blue-800',
        '99214': 'bg-green-100 text-green-800',
        '99215': 'bg-purple-100 text-purple-800',
        '99212': 'bg-yellow-100 text-yellow-800',
        '99211': 'bg-orange-100 text-orange-800'
      }
    },
    {
      id: 'appt_note_status',
      label: 'Appt/Note Status',
      type: 'select',
      width: 150,
      editable: canEdit,
      options: ['Complete', 'PP Complete', 'Charge NS/LC', 'RS No Charge', 'NS No Charge', 'Note not complete'],
      optionColors: {
        'Complete': 'bg-green-100 text-green-800',
        'PP Complete': 'bg-emerald-100 text-emerald-800',
        'Charge NS/LC': 'bg-red-100 text-red-800',
        'RS No Charge': 'bg-yellow-100 text-yellow-800',
        'NS No Charge': 'bg-orange-100 text-orange-800',
        'Note not complete': 'bg-gray-100 text-gray-800'
      }
    },
    
    // BILLING section (Green background)
    {
      id: 'claim_status',
      label: 'Claim Status',
      type: 'select',
      width: 120,
      editable: canEdit,
      options: ['Claim Sent', 'RS', 'IP', 'Paid', 'Deductible', 'N/A', 'PP', 'Denial', 'Rejection', 'No Coverage'],
      optionColors: {
        'Claim Sent': 'bg-blue-100 text-blue-800',
        'RS': 'bg-cyan-100 text-cyan-800',
        'IP': 'bg-yellow-100 text-yellow-800',
        'Paid': 'bg-green-100 text-green-800',
        'Deductible': 'bg-amber-100 text-amber-800',
        'N/A': 'bg-gray-100 text-gray-800',
        'PP': 'bg-indigo-100 text-indigo-800',
        'Denial': 'bg-red-100 text-red-800',
        'Rejection': 'bg-rose-100 text-rose-800',
        'No Coverage': 'bg-slate-100 text-slate-800'
      }
    },
    {
      id: 'most_recent_submit_date',
      label: 'Most Recent Submit Date',
      type: 'date-mmd',
      width: 180,
      editable: canEdit
    },
    {
      id: 'ins_pay',
      label: 'Ins Pay',
      type: 'currency',
      width: 100,
      editable: canEdit
    },
    {
      id: 'ins_pay_date',
      label: 'Ins Pay Date',
      type: 'month',
      width: 130,
      editable: canEdit
    },
    {
      id: 'pt_res',
      label: 'PT RES',
      type: 'currency',
      width: 100,
      editable: canEdit
    },
    {
      id: 'collected_from_pt',
      label: 'Collected from PT',
      type: 'currency',
      width: 140,
      editable: canEdit
    },
    {
      id: 'pt_pay_status',
      label: 'PT Pay Status',
      type: 'select',
      width: 120,
      editable: canEdit,
      options: ['Paid', 'Pending', 'Overdue', 'Partial', 'None'],
      optionColors: {
        'Paid': 'bg-green-100 text-green-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Overdue': 'bg-red-100 text-red-800',
        'Partial': 'bg-purple-100 text-purple-800',
        'None': 'bg-gray-100 text-gray-800'
      }
    },
    {
      id: 'pt_payment_ar_bal_date',
      label: 'PT Payment AR Bal Date',
      type: 'month',
      width: 180,
      editable: canEdit
    },
    {
      id: 'total_pay',
      label: 'Total Pay',
      type: 'currency',
      width: 100,
      editable: canEdit
    },
    
    // Notes section (Purple background)
    {
      id: 'notes',
      label: 'Notes',
      type: 'text',
      width: 200,
      editable: canEdit
    },
    
  ];

  const handleDataChange = (newData: ExcelRow[]) => {
    setData(newData);
    // In real implementation, this would save to your backend
    console.log('Data updated:', newData);
  };

  const handleRowAdd = (row: ExcelRow) => {
    const newData = [...data, row];
    setData(newData);
    console.log('Row added:', row);
  };

  const handleRowDelete = (rowId: string) => {
    const newData = data.filter(row => row.id !== rowId);
    setData(newData);
    console.log('Row deleted:', rowId);
  };

  const handleRowUpdate = (rowId: string, updates: Partial<ExcelRow>) => {
    const newData = data.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    );
    setData(newData);
    console.log('Row updated:', rowId, updates);
  };

  // Generate title based on context
  const getTitle = () => {
    if (month && providerId) {
      return `Provider Billing - ${month}`;
    }
    if (clinicId) {
      return `Clinic Billing Data`;
    }
    return 'Billing Management';
  };

  const getSubtitle = () => {
    if (month && providerId) {
      return `Manage billing entries for the selected provider and month`;
    }
    if (clinicId) {
      return `Manage all billing data for the clinic`;
    }
    return 'Comprehensive billing management with Excel-like functionality';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Tabs header when a month is selected */}
      {month && (
        <div className="bg-white rounded-lg shadow p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'billing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Billing
            </button>
            <button
              onClick={() => setActiveTab('ar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'ar' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Accounts Receivable
            </button>
          </div>
        </div>
      )}

      {/* Billing tab content */}
      {activeTab === 'billing' && (
        <>
          {/* Billing Tracker */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing Sheet Tracker</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                <div className="flex items-center">
                  <div className="p-1.5 bg-red-100 rounded">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Claims Not Paid</p>
                    <p className="text-xl font-bold text-gray-900">{billingMetrics.claimsNotPaid}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Collected from Insurance</p>
                    <p className="text-xl font-bold text-gray-900">${billingMetrics.totalCollectedFromIns.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="p-1.5 bg-green-100 rounded">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Collected from Patients</p>
                    <p className="text-xl font-bold text-gray-900">${billingMetrics.totalCollectedFromPt.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="p-1.5 bg-purple-100 rounded">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Total Collected</p>
                    <p className="text-xl font-bold text-gray-900">${billingMetrics.totalCollected.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
                <div className="flex items-center">
                  <div className="p-1.5 bg-orange-100 rounded">
                    <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Overdue Invoices</p>
                    <p className="text-xl font-bold text-gray-900">{billingMetrics.overdueInvoices}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Headers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm font-medium">
            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded text-center sm:text-left">
              ADMIN (7 columns)
            </div>
            <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded text-center sm:text-left">
              PROVIDER (2 columns)
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-center sm:text-left">
              BILLING (9 columns)
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded text-center sm:text-left">
              NOTES (1 column)
            </div>
          </div>
        </>
      )}

      {/* Monthly Accounts Receivable - shown within AR tab */}
      {month && activeTab === 'ar' && (
        <div className="mt-4">
          <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {month} Accounts Receivable
            </h3>
            <p className="text-sm text-gray-600">
              This section tracks payments collected in {month} for services provided in previous months (Jan-{month === 'January' ? 'Dec' : getPreviousMonth(month)})
            </p>
          </div>
          <MonthlyAccountsReceivable
            clinicId={clinicId}
            canEdit={canEdit}
            currentMonth={(['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(month) + 1) || new Date().getMonth() + 1}
            currentYear={new Date().getFullYear()}
          />
        </div>
      )}

      {/* Excel Table - show in Billing tab */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
            <p className="text-sm text-gray-600">{getSubtitle()}</p>
          </div>
          <div className="p-0">
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
            />
          </div>
        </div>
      )}

      {/* Additional Information - show in Billing tab */}
      {activeTab === 'billing' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Column Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-blue-800 mb-1">ADMIN Section:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>ID: Unique patient identifier</li>
                <li>First Name: Patient's first name</li>
                <li>Last Initial: Patient's last name initial</li>
                <li>Ins: Insurance provider</li>
                <li>Co-pay: Patient copay amount</li>
                <li>Co-ins: Patient coinsurance amount</li>
                <li>Date of Service: When service was provided</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-orange-800 mb-1">PROVIDER Section:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>CPT Code: Procedure code</li>
                <li>Appt/Note Status: Appointment completion status</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-green-800 mb-1">BILLING Section:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Claim Status: Current claim status</li>
                <li>Most Recent Submit Date: Last submission date</li>
                <li>Ins Pay: Insurance payment amount</li>
                <li>Ins Pay Date: Insurance payment date</li>
                <li>PT RES: Patient responsibility</li>
                <li>Collected from PT: Amount collected from patient</li>
                <li>PT Pay Status: Patient payment status</li>
                <li>PT Payment AR Bal Date: AR balance date</li>
                <li>Total Pay: Total payment received</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingDataTable;
