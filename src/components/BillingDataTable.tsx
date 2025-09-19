import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import ExcelTable, { ExcelColumn, ExcelRow } from './ExcelTable';
import MonthlyAccountsReceivable from './MonthlyAccountsReceivable';

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

  // Load data when props change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await refreshBillingEntries(clinicId, providerId, month);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicId, providerId, month, refreshBillingEntries]);

  // Convert billing entries to Excel format
  useEffect(() => {
    const filteredEntries = billingEntries.filter(entry => {
      if (clinicId && entry.clinicId !== clinicId) return false;
      if (providerId && entry.providerId !== providerId) return false;
      return true;
    });

    const excelData: ExcelRow[] = filteredEntries.map((entry, index) => {
      const patient = patients.find(p => p.patientId === entry.patientName.split(' ')[0] + entry.patientName.split(' ')[1]);
      const provider = providers.find(p => p.id === entry.providerId);
      const clinic = clinics.find(c => c.id === entry.clinicId);
      
      return {
        id: entry.id,
        // ADMIN section
        id_field: patient?.patientId || `PAT${index + 1}`,
        first_name: entry.patientName.split(' ')[0],
        last_initial: entry.patientName.split(' ')[1]?.charAt(0) || '',
        ins: patient?.insurance || 'Unknown',
        co_pay: patient?.copay || 0,
        co_ins: patient?.coinsurance || 0,
        date_of_service: entry.date,
        // PROVIDER section
        cpt_code: entry.procedureCode,
        appt_note_status: 'Complete',
        // BILLING section
        claim_status: entry.status,
        most_recent_submit_date: entry.date,
        ins_pay: entry.amount * 0.8, // Assume 80% insurance coverage
        ins_pay_date: entry.status === 'paid' ? entry.date : '',
        pt_res: entry.amount * 0.2, // Assume 20% patient responsibility
        collected_from_pt: entry.status === 'paid' ? entry.amount * 0.2 : 0,
        pt_pay_status: entry.status === 'paid' ? 'Paid' : 'Pending',
        pt_payment_ar_bal_date: entry.status === 'paid' ? entry.date : '',
        total_pay: entry.amount,
        // Notes
        notes: entry.notes || 'No additional notes',
        // ACCOUNTS RECEIVABLE
        ar_id: `AR${entry.id.slice(-4)}`,
        ar_name: entry.patientName,
        ar_date_of_service: entry.date,
        ar_amount: entry.status === 'paid' ? 0 : entry.amount * 0.2,
        ar_date_recorded: entry.date,
        ar_type: entry.status === 'paid' ? 'Payment' : 'Outstanding',
        ar_notes: entry.status === 'paid' ? 'Fully paid' : 'Pending payment'
      };
    });

    setData(excelData);
  }, [billingEntries, patients, providers, clinics, clinicId, providerId]);

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
      options: ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid', 'Self Pay']
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
      type: 'date',
      width: 130,
      editable: canEdit,
      required: true
    },
    
    // PROVIDER section (Orange background)
    {
      id: 'cpt_code',
      label: 'CPT Code',
      type: 'text',
      width: 100,
      editable: canEdit,
      required: true
    },
    {
      id: 'appt_note_status',
      label: 'Appt/Note Status',
      type: 'select',
      width: 150,
      editable: canEdit,
      options: ['Complete', 'PP Complete', 'Charge NS/LC', 'RS No Charge', 'NS No Charge', 'Note not complete']
    },
    
    // BILLING section (Green background)
    {
      id: 'claim_status',
      label: 'Claim Status',
      type: 'select',
      width: 120,
      editable: canEdit,
      options: ['Claim Sent', 'RS', 'IP', 'Paid', 'Deductible', 'N/A', 'PP', 'Denial', 'Rejection', 'No Coverage']
    },
    {
      id: 'most_recent_submit_date',
      label: 'Most Recent Submit Date',
      type: 'date',
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
      type: 'date',
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
      options: ['Paid', 'Pending', 'Overdue', 'Partial', 'None']
    },
    {
      id: 'pt_payment_ar_bal_date',
      label: 'PT Payment AR Bal Date',
      type: 'date',
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
    
    // AUGUST ACCOUNTS RECEIVABLE section (Blue background)
    {
      id: 'ar_id',
      label: 'ID #',
      type: 'text',
      width: 80,
      editable: canEdit
    },
    {
      id: 'ar_name',
      label: 'Name',
      type: 'text',
      width: 120,
      editable: canEdit
    },
    {
      id: 'ar_date_of_service',
      label: 'Date of Service',
      type: 'date',
      width: 130,
      editable: canEdit
    },
    {
      id: 'ar_amount',
      label: 'Amount',
      type: 'currency',
      width: 100,
      editable: canEdit
    },
    {
      id: 'ar_date_recorded',
      label: 'Date Recorded',
      type: 'date',
      width: 130,
      editable: canEdit
    },
    {
      id: 'ar_type',
      label: 'Type',
      type: 'select',
      width: 100,
      editable: canEdit,
      options: ['Payment', 'Adjustment', 'Refund', 'Write-off']
    },
    {
      id: 'ar_notes',
      label: 'Notes',
      type: 'text',
      width: 150,
      editable: canEdit
    }
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
      
      {/* Monthly Accounts Receivable Section */}
      {month && (
        <MonthlyAccountsReceivable
          clinicId={clinicId}
          providerId={providerId}
          month={month}
          canEdit={canEdit}
        />
      )}

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
        title={getTitle()}
        subtitle={getSubtitle()}
      />

      {/* Additional Information */}
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
          <div>
            <h5 className="font-medium text-purple-800 mb-1">AUGUST ACCOUNTS RECEIVABLE:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>ID #: AR record identifier</li>
              <li>Name: Patient name</li>
              <li>Date of Service: Service date</li>
              <li>Amount: Outstanding amount</li>
              <li>Date Recorded: When AR was recorded</li>
              <li>Type: Type of AR entry</li>
              <li>Notes: Additional notes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingDataTable;
