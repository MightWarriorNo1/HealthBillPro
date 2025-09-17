import React, { useState } from 'react';
import { 
  FileText, Users, Building2, DollarSign, 
  Lock, Unlock, AlertCircle, CheckCircle,
  Clock, BarChart3, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EnhancedBillingInterface from './EnhancedBillingInterface';
import PatientDatabase from './PatientDatabase';
import TodoSystem from './TodoSystem';
import AccountsReceivable from './AccountsReceivable';
import TimecardSystem from './TimecardSystem';
import ReportingSystem from './ReportingSystem';
import InvoiceSystem from './InvoiceSystem';
import Header from './Header';
import Sidebar from './Sidebar';

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('billing');
  const [isLocked, setIsLocked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { id: 'billing', label: 'Billing Management', icon: FileText },
    { id: 'patients', label: 'Patient Database', icon: Users },
    { id: 'todo', label: 'To-Do Items', icon: AlertCircle },
    { id: 'accounts', label: 'Accounts Receivable', icon: DollarSign },
    { id: 'timecards', label: 'Timecards', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return (
          <div className="space-y-6">
            {/* Billing Management - Columns A-S */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Billing Management</h3>
                <p className="text-sm text-gray-600">Manage claims, insurance payments, and patient payments (Columns A-S)</p>
              </div>
              <div className="p-6">
                <EnhancedBillingInterface
                  clinicId={user?.clinicId}
                  canEdit={true}
                  userRole={user?.role}
                  visibleColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S']}
                />
              </div>
            </div>

            {/* Claim Status Options */}
            <div className="bg-light-blue-50 border border-light-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-light-blue-800 mb-2">Claim Status Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-light-blue-700">
                <div>• Claim Sent</div>
                <div>• RS</div>
                <div>• IP</div>
                <div>• Paid</div>
                <div>• Deductible</div>
                <div>• N/A</div>
                <div>• PP</div>
                <div>• Denial</div>
                <div>• Rejection</div>
                <div>• No Coverage</div>
              </div>
            </div>
          </div>
        );
      case 'patients':
        return (
          <PatientDatabase
            clinicId={user?.clinicId}
            canEdit={true}
          />
        );
      case 'todo':
        return (
          <TodoSystem
            clinicId={user?.clinicId}
            canEdit={true}
          />
        );
      case 'accounts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Accounts Receivable Management</h3>
                <p className="text-sm text-gray-600">Log late payments and calculate amounts owed to providers</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded text-sm ${
                    isLocked
                      ? 'bg-light-red-100 text-light-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>
            </div>
            <AccountsReceivable
              clinicId={user?.clinicId}
              canEdit={true}
              canLock={true}
              isLocked={isLocked}
            />
          </div>
        );
      case 'timecards':
        return (
          <TimecardSystem
            userId={user?.id}
            canEdit={true}
          />
        );
      case 'reports':
        return (
          <ReportingSystem
            userRole={user?.role || 'admin'}
            clinicId={user?.clinicId}
            providerId={user?.providerId}
          />
        );
      case 'invoices':
        return (
          <InvoiceSystem
            userRole={user?.role || 'admin'}
            clinicId={user?.clinicId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        title="Admin Dashboard" 
        subtitle="Manage billing, patients, and administrative functions"
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex relative">
        {/* Sidebar */}
        <Sidebar 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-auto lg:ml-64" style={{ marginTop: '80px' }}>
          <div className="max-w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;