import React, { useState } from 'react';
import { 
  BarChart3, Download, FileText, TrendingUp, Calendar, Filter,
  DollarSign, Users, Building2, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface ReportsAnalyticsProps {
  clinicId?: string;
  dateRange?: { start: string; end: string };
}

function ReportsAnalytics({ clinicId, dateRange }: ReportsAnalyticsProps) {
  const { billingEntries, claimIssues, timecardEntries, invoices, clinics, providers } = useData();
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [exportFormat, setExportFormat] = useState('excel');

  // Filter data based on clinic and date range
  const filteredEntries = billingEntries.filter(entry => {
    const matchesClinic = !clinicId || entry.clinicId === clinicId;
    const matchesDate = !dateRange || (
      entry.date >= dateRange.start && entry.date <= dateRange.end
    );
    return matchesClinic && matchesDate;
  });

  const filteredIssues = claimIssues.filter(issue => {
    const matchesClinic = !clinicId || issue.clinicId === clinicId;
    return matchesClinic;
  });

  const filteredTimecards = timecardEntries.filter(entry => {
    const matchesClinic = !clinicId || entry.clinicId === clinicId;
    const matchesDate = !dateRange || (
      entry.date >= dateRange.start && entry.date <= dateRange.end
    );
    return matchesClinic && matchesDate;
  });

  // Calculate comprehensive metrics
  const totalRevenue = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  const pendingRevenue = filteredEntries.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const approvedRevenue = filteredEntries.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const paidRevenue = filteredEntries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const rejectedRevenue = filteredEntries.filter(e => e.status === 'rejected').reduce((sum, e) => sum + e.amount, 0);

  const totalHours = filteredTimecards.reduce((sum, e) => sum + e.hoursWorked, 0);
  const totalPayroll = filteredTimecards.reduce((sum, e) => sum + (e.hoursWorked * e.hourlyRate), 0);

  const openIssues = filteredIssues.filter(i => i.status === 'open').length;
  const inProgressIssues = filteredIssues.filter(i => i.status === 'in_progress').length;
  const resolvedIssues = filteredIssues.filter(i => i.status === 'resolved').length;

  // Revenue by status
  const revenueByStatus = [
    { status: 'Pending', amount: pendingRevenue, count: filteredEntries.filter(e => e.status === 'pending').length },
    { status: 'Approved', amount: approvedRevenue, count: filteredEntries.filter(e => e.status === 'approved').length },
    { status: 'Paid', amount: paidRevenue, count: filteredEntries.filter(e => e.status === 'paid').length },
    { status: 'Rejected', amount: rejectedRevenue, count: filteredEntries.filter(e => e.status === 'rejected').length }
  ];

  // Revenue by clinic
  const revenueByClinic = clinics.map(clinic => {
    const clinicEntries = filteredEntries.filter(e => e.clinicId === clinic.id);
    const clinicRevenue = clinicEntries.reduce((sum, e) => sum + e.amount, 0);
    return {
      clinic: clinic.name,
      revenue: clinicRevenue,
      entries: clinicEntries.length
    };
  });

  // Revenue by provider
  const revenueByProvider = providers.map(provider => {
    const providerEntries = filteredEntries.filter(e => e.providerId === provider.id);
    const providerRevenue = providerEntries.reduce((sum, e) => sum + e.amount, 0);
    const clinic = clinics.find(c => c.id === provider.clinicId);
    return {
      provider: provider.name,
      clinic: clinic?.name || 'Unknown',
      revenue: providerRevenue,
      entries: providerEntries.length
    };
  });

  const exportToExcel = () => {
    const data = {
      'Revenue Summary': [
        ['Metric', 'Value'],
        ['Total Revenue', totalRevenue],
        ['Pending Revenue', pendingRevenue],
        ['Approved Revenue', approvedRevenue],
        ['Paid Revenue', paidRevenue],
        ['Rejected Revenue', rejectedRevenue]
      ],
      'Revenue by Status': [
        ['Status', 'Amount', 'Count'],
        ...revenueByStatus.map(item => [item.status, item.amount, item.count])
      ],
      'Revenue by Clinic': [
        ['Clinic', 'Revenue', 'Entries'],
        ...revenueByClinic.map(item => [item.clinic, item.revenue, item.entries])
      ],
      'Revenue by Provider': [
        ['Provider', 'Clinic', 'Revenue', 'Entries'],
        ...revenueByProvider.map(item => [item.provider, item.clinic, item.revenue, item.entries])
      ],
      'Billing Entries': [
        ['Date', 'Clinic', 'Provider', 'Patient', 'Code', 'Amount', 'Status'],
        ...filteredEntries.map(entry => {
          const clinic = clinics.find(c => c.id === entry.clinicId);
          const provider = providers.find(p => p.id === entry.providerId);
          return [
            entry.date,
            clinic?.name || 'Unknown',
            provider?.name || 'Unknown',
            entry.patientName,
            entry.procedureCode,
            entry.amount,
            entry.status
          ];
        })
      ]
    };

    const workbook = XLSX.utils.book_new();
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, `billing_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Billing System Report', 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Summary
    doc.setFontSize(16);
    doc.text('Revenue Summary', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, 65);
    doc.text(`Pending Revenue: $${pendingRevenue.toFixed(2)}`, 20, 75);
    doc.text(`Approved Revenue: $${approvedRevenue.toFixed(2)}`, 20, 85);
    doc.text(`Paid Revenue: $${paidRevenue.toFixed(2)}`, 20, 95);
    doc.text(`Rejected Revenue: $${rejectedRevenue.toFixed(2)}`, 20, 105);
    
    // Issues Summary
    doc.setFontSize(16);
    doc.text('Issues Summary', 20, 125);
    
    doc.setFontSize(12);
    doc.text(`Open Issues: ${openIssues}`, 20, 140);
    doc.text(`In Progress: ${inProgressIssues}`, 20, 150);
    doc.text(`Resolved: ${resolvedIssues}`, 20, 160);
    
    doc.save(`billing_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = () => {
    if (exportFormat === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Reports & Analytics</h2>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="revenue">Revenue Report</option>
              <option value="issues">Issues Report</option>
              <option value="timecards">Timecard Report</option>
              <option value="invoices">Invoice Report</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Revenue</p>
              <p className="text-2xl font-bold text-blue-600">${paidRevenue.toFixed(2)}</p>
            </div>
            <CheckCircle className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Issues</p>
              <p className="text-2xl font-bold text-red-600">{openIssues}</p>
            </div>
            <AlertTriangle className="text-red-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-purple-600">{totalHours}</p>
            </div>
            <Clock className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Revenue by Status Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Status</h3>
        <div className="space-y-4">
          {revenueByStatus.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${
                  item.status === 'Pending' ? 'bg-yellow-500' :
                  item.status === 'Approved' ? 'bg-green-500' :
                  item.status === 'Paid' ? 'bg-blue-500' :
                  'bg-red-500'
                }`} />
                <span className="font-medium text-gray-900">{item.status}</span>
                <span className="text-sm text-gray-500">({item.count} entries)</span>
              </div>
              <span className="font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Clinic */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Clinic</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Entry</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueByClinic.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.clinic}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.revenue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.entries}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.entries > 0 ? (item.revenue / item.entries).toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Provider */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Provider</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueByProvider.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.clinic}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.revenue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.entries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;
