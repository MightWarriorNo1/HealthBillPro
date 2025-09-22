import { useState, useEffect } from 'react';
import { 
  FileText, Download,
  Users, Building2, DollarSign, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DataGrid from './DataGrid';
import { ColDef } from 'ag-grid-community';

interface ReportData {
  provider?: string;
  clinic?: string;
  month: string;
  quarter: string;
  year: number;
  insurancePayments: number;
  patientPayments: number;
  accountsReceivable: number;
  totalAmount: number;
  outstandingClaims: number;
  patientInvoices: number;
  invoiceAmount: number;
  // Optional detailed fields
  claimSent?: number;
  rs?: number;
  ip?: number;
  rejected?: number;
  denial?: number;
  ccDeclined?: number;
  paymentPlan?: number;
}

interface ReportingSystemProps {
  userRole: string;
  clinicId?: string;
  providerId?: string;
}

function ReportingSystem({ clinicId }: ReportingSystemProps) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('provider');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterClinic, setFilterClinic] = useState<string>('all');
  const [filterProvider] = useState<string>('all');
  const [monthClosed, setMonthClosed] = useState<boolean>(false);

  const reportTypes = [
    { id: 'provider', label: 'By Provider', icon: Users },
    { id: 'clinic', label: 'By Clinic', icon: Building2 },
    { id: 'claim', label: 'By Claim', icon: FileText },
    { id: 'patient', label: 'By Patient Invoices', icon: Users },
    { id: 'invoice', label: 'By Invoices', icon: DollarSign }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const quarters = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

  const isUuid = (value: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  };

  useEffect(() => {
    if (selectedReport) {
      generateReport();
    }
  }, [selectedReport, selectedPeriod, selectedMonth, selectedQuarter, selectedYear, filterClinic, filterProvider]);

  // Prefill filters from URL on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const clinicParam = params.get('clinicId');
      const monthParam = params.get('month'); // YYYY-MM
      if (clinicParam) {
        setFilterClinic(clinicParam);
      } else if (clinicId) {
        setFilterClinic(clinicId);
      }
      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split('-');
        setSelectedPeriod('month');
        setSelectedYear(parseInt(y));
        setSelectedMonth(parseInt(m));
      }
    } catch (_) {}
  }, []);

  // Check if the selected month is closed for the selected/effective clinic
  useEffect(() => {
    (async () => {
      try {
        const effectiveClinic = filterClinic !== 'all' ? filterClinic : clinicId;
        if (!effectiveClinic) { setMonthClosed(false); return; }
        const monthTag = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
        const { data } = await supabase
          .from('ar_month_closures')
          .select('is_closed')
          .eq('clinic_id', effectiveClinic)
          .eq('month_tag', monthTag)
          .maybeSingle();
        setMonthClosed(Boolean(data?.is_closed));
      } catch (_) {
        setMonthClosed(false);
      }
    })();
  }, [filterClinic, clinicId, selectedYear, selectedMonth]);

  const generateReport = async () => {
    try {
      setLoading(true);
      
      let startDate: string;
      let endDate: string;

      if (selectedPeriod === 'month') {
        startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
        endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;
      } else if (selectedPeriod === 'quarter') {
        const quarterStartMonth = (selectedQuarter - 1) * 3 + 1;
        startDate = `${selectedYear}-${quarterStartMonth.toString().padStart(2, '0')}-01`;
        endDate = `${selectedYear}-${(quarterStartMonth + 2).toString().padStart(2, '0')}-${new Date(selectedYear, quarterStartMonth + 2, 0).getDate()}`;
      } else { // YTD
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
      }

      const reportData = await fetchReportData(selectedReport, startDate, endDate);
      setReports(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (reportType: string, startDate: string, endDate: string): Promise<ReportData[]> => {
    const rows: ReportData[] = [];

    switch (reportType) {
      case 'provider':
        try {
          const { data, error } = await supabase
            .from('billing_entries')
            .select('provider_id, amount, insurance_payment, status')
            .gte('date', startDate)
            .lte('date', endDate);
          if (error) throw error;
          const byProv: Record<string, { total: number; ins: number; claimsOpen: number }> = {};
          (data || []).forEach(r => {
            const key = r.provider_id || 'unknown';
            if (!byProv[key]) byProv[key] = { total: 0, ins: 0, claimsOpen: 0 };
            byProv[key].total += Number(r.amount || 0);
            byProv[key].ins += Number(r.insurance_payment || 0);
            if (String(r.status || '').toLowerCase() !== 'paid') byProv[key].claimsOpen += 1;
          });
          // Fetch provider names
          const providerIds = Object.keys(byProv).filter(isUuid);
          if (providerIds.length > 0) {
            const { data: provData } = await supabase
              .from('providers')
              .select('id, name')
              .in('id', providerIds);
            const idToName: Record<string, string> = {};
            (provData || []).forEach(p => { idToName[p.id] = p.name; });
            providerIds.forEach(id => {
              const rec = byProv[id];
              rows.push({
                provider: idToName[id] || id,
                month: months[selectedMonth - 1],
                quarter: quarters[selectedQuarter - 1],
                year: selectedYear,
                insurancePayments: rec.ins,
                patientPayments: 0,
                accountsReceivable: Math.max(rec.total - rec.ins, 0),
                totalAmount: rec.total,
                outstandingClaims: rec.claimsOpen,
                patientInvoices: 0,
                invoiceAmount: 0
              });
            });
          }
          if (rows.length === 0) {
            rows.push({ provider: '—', month: months[selectedMonth - 1], quarter: quarters[selectedQuarter - 1], year: selectedYear, insurancePayments: 0, patientPayments: 0, accountsReceivable: 0, totalAmount: 0, outstandingClaims: 0, patientInvoices: 0, invoiceAmount: 0 });
          }
        } catch (e) {
          console.error('Provider report failed', e);
          toast.error('Failed to load provider data');
        }
        break;
      case 'clinic':
        try {
          const { data, error } = await supabase
            .from('billing_entries')
            .select('clinic_id, amount, insurance_payment, status')
            .gte('date', startDate)
            .lte('date', endDate);
          if (error) throw error;
          const byClinic: Record<string, { total: number; ins: number; claimsOpen: number }> = {};
          (data || []).forEach(r => {
            const key = r.clinic_id || 'unknown';
            if (!byClinic[key]) byClinic[key] = { total: 0, ins: 0, claimsOpen: 0 };
            byClinic[key].total += Number(r.amount || 0);
            byClinic[key].ins += Number(r.insurance_payment || 0);
            if (String(r.status || '').toLowerCase() !== 'paid') byClinic[key].claimsOpen += 1;
          });
          // Fetch clinic names
          const clinicIds = Object.keys(byClinic).filter(isUuid);
          if (clinicIds.length > 0) {
            const { data: clinicData } = await supabase
              .from('clinics')
              .select('id, name')
              .in('id', clinicIds);
            const idToName: Record<string, string> = {};
            (clinicData || []).forEach(c => { idToName[c.id] = c.name; });
            clinicIds.forEach(id => {
              const rec = byClinic[id];
              rows.push({
                clinic: idToName[id] || id,
                month: months[selectedMonth - 1],
                quarter: quarters[selectedQuarter - 1],
                year: selectedYear,
                insurancePayments: rec.ins,
                patientPayments: 0,
                accountsReceivable: Math.max(rec.total - rec.ins, 0),
                totalAmount: rec.total,
                outstandingClaims: rec.claimsOpen,
                patientInvoices: 0,
                invoiceAmount: 0
              });
            });
          }
          if (rows.length === 0) {
            rows.push({ clinic: '—', month: months[selectedMonth - 1], quarter: quarters[selectedQuarter - 1], year: selectedYear, insurancePayments: 0, patientPayments: 0, accountsReceivable: 0, totalAmount: 0, outstandingClaims: 0, patientInvoices: 0, invoiceAmount: 0 });
          }
        } catch (e) {
          console.error('Clinic report failed', e);
          toast.error('Failed to load clinic data');
        }
        break;
      case 'claim':
        try {
          const wanted = ['Claim Sent','RS','IP','Denial','Rejection','Paid','No Coverage','PP','Deductible','N/A'];
          const { data, error } = await supabase
            .from('billing_entries')
            .select('status')
            .gte('date', startDate)
            .lte('date', endDate);
          if (error) throw error;
          const counts: Record<string, number> = {};
          wanted.forEach(w => { counts[w] = 0; });
          (data || []).forEach(r => { const s = r.status || 'N/A'; counts[s] = (counts[s] || 0) + 1; });
          rows.push({ clinic: 'All', month: months[selectedMonth - 1], quarter: quarters[selectedQuarter - 1], year: selectedYear, insurancePayments: 0, patientPayments: 0, accountsReceivable: 0, totalAmount: 0, outstandingClaims: (data || []).filter(r => r.status !== 'Paid').length, patientInvoices: 0, invoiceAmount: 0 });
        } catch (e) {
          console.error('Claim report failed', e);
          toast.error('Failed to load claim data');
        }
        break;
      case 'patient':
        try {
          // Attempt to use patient payment fields if they exist
          const { data, error } = await supabase
            .from('billing_entries')
            .select('clinic_id, payment_amount, payment_status')
            .gte('date', startDate)
            .lte('date', endDate);
          if (error) throw error;
          const byClinic: Record<string, { count: number; amount: number; ccDeclined: number; payPlan: number }> = {};
          (data as any[] | null || []).forEach((r: any) => {
            const key = r.clinic_id || 'unknown';
            const status = (r.payment_status || '').toString();
            const isOutstanding = status !== 'Paid' && status !== '';
            if (!byClinic[key]) byClinic[key] = { count: 0, amount: 0, ccDeclined: 0, payPlan: 0 };
            if (isOutstanding) {
              byClinic[key].count += 1;
              byClinic[key].amount += Number(r.payment_amount || 0);
            }
            if (status === 'CC declined') byClinic[key].ccDeclined += 1;
            if (status === 'Payment Plan') byClinic[key].payPlan += 1;
          });
          let idToClinic: Record<string, string> = {};
          const clinicIds = Object.keys(byClinic);
          if (clinicIds.length > 0) {
            const { data: clinicRows } = await supabase
              .from('clinics')
              .select('id, name')
              .in('id', clinicIds);
            (clinicRows || []).forEach(c => { idToClinic[c.id] = c.name; });
          }
          clinicIds.forEach(cid => {
            const agg = byClinic[cid];
            rows.push({
              clinic: idToClinic[cid] || cid,
              month: months[selectedMonth - 1],
              quarter: quarters[selectedQuarter - 1],
              year: selectedYear,
              insurancePayments: 0,
              patientPayments: 0,
              accountsReceivable: 0,
              totalAmount: 0,
              outstandingClaims: 0,
              patientInvoices: agg.count,
              laborHours: 0,
              laborPay: 0,
              invoiceAmount: agg.amount,
              ccDeclined: agg.ccDeclined,
              paymentPlan: agg.payPlan
            });
          });
          if (rows.length === 0) {
            rows.push({ clinic: '—', month: months[selectedMonth - 1], quarter: quarters[selectedQuarter - 1], year: selectedYear, insurancePayments: 0, patientPayments: 0, accountsReceivable: 0, totalAmount: 0, outstandingClaims: 0, patientInvoices: 0, invoiceAmount: 0 });
          }
        } catch (e: any) {
          // Fallback if columns don't exist: derive patient invoices from invoices table
          if (e?.code === '42703') {
            try {
              const { data: inv, error: invErr } = await supabase
                .from('invoices')
                .select('clinic_id, balance_due, status')
                .gte('date', startDate)
                .lte('date', endDate);
              if (invErr) throw invErr;
              const byClinic: Record<string, { count: number; amount: number }> = {};
              (inv || []).forEach(r => {
                const key = r.clinic_id || 'unknown';
                const isOutstanding = (r.status || '').toString().toLowerCase() !== 'paid';
                if (!byClinic[key]) byClinic[key] = { count: 0, amount: 0 };
                if (isOutstanding) {
                  byClinic[key].count += 1;
                  byClinic[key].amount += Number(r.balance_due || 0);
                }
              });
              let idToClinic: Record<string, string> = {};
              const clinicIds = Object.keys(byClinic);
              if (clinicIds.length > 0) {
                const { data: clinicRows } = await supabase
                  .from('clinics')
                  .select('id, name')
                  .in('id', clinicIds);
                (clinicRows || []).forEach(c => { idToClinic[c.id] = c.name; });
              }
              clinicIds.forEach(cid => {
                const agg = byClinic[cid];
                rows.push({
                  clinic: idToClinic[cid] || cid,
                  month: months[selectedMonth - 1],
                  quarter: quarters[selectedQuarter - 1],
                  year: selectedYear,
                  insurancePayments: 0,
                  patientPayments: 0,
                  accountsReceivable: 0,
                  totalAmount: 0,
                  outstandingClaims: 0,
                  patientInvoices: agg.count,
                  laborHours: 0,
                  laborPay: 0,
                  invoiceAmount: agg.amount
                });
              });
              if (rows.length === 0) {
                rows.push({ clinic: '—', month: months[selectedMonth - 1], quarter: quarters[selectedQuarter - 1], year: selectedYear, insurancePayments: 0, patientPayments: 0, accountsReceivable: 0, totalAmount: 0, outstandingClaims: 0, patientInvoices: 0, invoiceAmount: 0 });
              }
            } catch (fallbackErr) {
              console.error('Patient invoices fallback failed', fallbackErr);
              toast.error('Failed to load patient invoices');
            }
          } else {
            console.error('Patient invoices report failed', e);
            toast.error('Failed to load patient invoices');
          }
        }
        break;
      case 'invoice':
        try {
          const { data, error } = await supabase
            .from('invoices')
            .select('clinic_name, balance_due, billing_period, date')
            .gte('date', startDate)
            .lte('date', endDate);
          if (error) throw error;
          const byClinic: Record<string, number> = {};
          (data || []).forEach(r => {
            const key = r.clinic_name || 'Unknown Clinic';
            byClinic[key] = (byClinic[key] || 0) + Number(r.balance_due || 0);
          });
          Object.keys(byClinic).forEach(clinicName => {
            rows.push({
              clinic: clinicName,
              month: months[selectedMonth - 1],
              quarter: quarters[selectedQuarter - 1],
              year: selectedYear,
              insurancePayments: 0,
              patientPayments: 0,
              accountsReceivable: 0,
              totalAmount: 0,
              outstandingClaims: 0,
              patientInvoices: 0,
              laborHours: 0,
              laborPay: 0,
              invoiceAmount: byClinic[clinicName]
            });
          });
          if (rows.length === 0) {
            rows.push({
              clinic: '—',
              month: months[selectedMonth - 1],
              quarter: quarters[selectedQuarter - 1],
              year: selectedYear,
              insurancePayments: 0,
              patientPayments: 0,
              accountsReceivable: 0,
              totalAmount: 0,
              outstandingClaims: 0,
              patientInvoices: 0,
              laborHours: 0,
              laborPay: 0,
              invoiceAmount: 0
            });
          }
        } catch (e) {
          console.error('Invoice report failed', e);
          toast.error('Failed to load invoice data');
        }
        break;
    }

    return rows;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const reportType = reportTypes.find(r => r.id === selectedReport);
    
    // Header
    doc.setFontSize(20);
    doc.text(`${reportType?.label} Report`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Period: ${selectedPeriod === 'month' ? months[selectedMonth - 1] : selectedPeriod === 'quarter' ? quarters[selectedQuarter - 1] : 'YTD'} ${selectedYear}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

    // Table data
    const tableData = reports.map(report => {
      const row = [];
      if (report.provider) row.push(report.provider);
      if (report.clinic) row.push(report.clinic);
      row.push(report.insurancePayments.toFixed(2));
      row.push(report.patientPayments.toFixed(2));
      row.push(report.accountsReceivable.toFixed(2));
      row.push(report.totalAmount.toFixed(2));
      row.push(report.outstandingClaims.toString());
      if (selectedReport === 'claim') {
        row.push(String(report.claimSent ?? 0));
        row.push(String(report.rs ?? 0));
        row.push(String(report.ip ?? 0));
        row.push(String(report.rejected ?? 0));
        row.push(String(report.denial ?? 0));
      }
      if (selectedReport === 'patient') {
        row.push(String(report.ccDeclined ?? 0));
        row.push(String(report.paymentPlan ?? 0));
      }
      row.push(report.patientInvoices.toString());
      row.push(report.invoiceAmount.toFixed(2));
      return row;
    });

    const headers = [] as any[];
    if (selectedReport === 'provider') headers.push('Provider');
    if (selectedReport === 'clinic') headers.push('Clinic');
    headers.push('Insurance Payments', 'Patient Payments', 'A/R', 'Total', 'Outstanding Claims');
    if (selectedReport === 'claim') {
      headers.push('Claim Sent', 'RS', 'IP', 'Rejected', 'Denial');
    }
    if (selectedReport === 'patient') {
      headers.push('CC Declined', 'Payment Plan');
    }
    headers.push('Patient Invoices', 'Invoice Amount');

    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 45,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`${reportType?.label.replace(' ', '_')}_Report_${selectedYear}.pdf`);
    toast.success('Report exported to PDF successfully');
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or date range.</p>
        </div>
      );
    }

    const columns: ColDef[] = [
      ...(selectedReport === 'provider' ? [{ field: 'provider', headerName: 'Provider' } as ColDef] : []),
      ...(selectedReport === 'clinic' ? [{ field: 'clinic', headerName: 'Clinic' } as ColDef] : []),
      { field: 'insurancePayments', headerName: 'Insurance Payments' },
      { field: 'patientPayments', headerName: 'Patient Payments' },
      { field: 'accountsReceivable', headerName: 'A/R' },
      { field: 'totalAmount', headerName: 'Total' },
      { field: 'outstandingClaims', headerName: 'Outstanding Claims' },
      { field: 'patientInvoices', headerName: 'Patient Invoices' },
      { field: 'invoiceAmount', headerName: 'Invoice Amount' }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Insurance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${reports.reduce((sum, r) => sum + r.insurancePayments, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patient</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${reports.reduce((sum, r) => sum + r.patientPayments, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.reduce((sum, r) => sum + r.outstandingClaims, 0)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Report Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4">
            <DataGrid columnDefs={columns} rowData={reports as any[]} readOnly={true} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          
          <h2 className="text-2xl font-bold text-gray-900">Reporting System</h2>
          <p className="text-gray-600">Generate and export comprehensive reports</p>
        </div>
        {monthClosed && (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            Month Closed
          </span>
        )}
        <button
          onClick={exportToPDF}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Download size={16} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-colors ${
                  selectedReport === report.id
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Icon size={24} />
                <span className="text-sm font-medium">{report.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          {selectedPeriod === 'month' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          )}

          {selectedPeriod === 'quarter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarter
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              >
                {quarters.map((quarter, index) => (
                  <option key={index} value={index + 1}>{quarter}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
}

export default ReportingSystem;
