import React, { useState } from 'react';
import { 
  Shield, Settings, Users, Palette, Eye, 
  BarChart3, FileText, Clock, DollarSign,
  Building2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSettings from './SuperAdminSettings';
import UserManagement from './UserManagement';
import ReportingSystem from './ReportingSystem';
import InvoiceSystem from './InvoiceSystem';
import TimecardSystem from './TimecardSystem';
import EnhancedBillingInterface from './EnhancedBillingInterface';
import PatientDatabase from './PatientDatabase';
import TodoSystem from './TodoSystem';
import AccountsReceivable from './AccountsReceivable';
import Header from './Header';
import Sidebar from './Sidebar';

function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'billing-codes', label: 'Billing Codes', icon: Palette },
    { id: 'audit-logs', label: 'Audit Logs', icon: Eye },
    { id: 'billing', label: 'Billing Management', icon: FileText },
    { id: 'patients', label: 'Patient Database', icon: Users },
    { id: 'todo', label: 'To-Do Items', icon: AlertCircle },
    { id: 'accounts', label: 'Accounts Receivable', icon: DollarSign },
    { id: 'timecards', label: 'Timecards', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  // Read tab from URL on mount (e.g., /?tab=accounts)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && tabs.find(t => t.id === tab)) {
        setActiveTab(tab);
      }
    } catch (_) {}
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <SuperAdminSettings userId={user?.id} />;
      case 'users':
        return <UserManagement currentUserId={user?.id} />;
      case 'billing-codes':
        return <SuperAdminSettings userId={user?.id} initialTab="billing-codes" />;
      case 'audit-logs':
        return <SuperAdminSettings userId={user?.id} initialTab="audit-logs" />;
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Billing Management</h3>
                <p className="text-sm text-gray-600">Full system access to all billing data (Columns A-S)</p>
              </div>
              <div className="p-6">
                <EnhancedBillingInterface
                  canEdit={true}
                  userRole={user?.role}
                  visibleColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S']}
                />
              </div>
            </div>
          </div>
        );
      case 'patients':
        return (
          <PatientDatabase
            canEdit={true}
          />
        );
      case 'todo':
        return (
          <TodoSystem
            canEdit={true}
          />
        );
      case 'accounts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Accounts Receivable Management</h3>
                <p className="text-sm text-gray-600">Full system access with column locking controls</p>
              </div>
              <div className="p-6">
                <AccountsReceivable
                  canEdit={true}
                  canLock={true}
                  isLocked={false}
                  userRole={user?.role}
                />
              </div>
            </div>
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
            userRole={user?.role || 'super_admin'}
            clinicId={user?.clinicId}
            providerId={user?.providerId}
          />
        );
      case 'invoices':
        return (
          <InvoiceSystem
            userRole={user?.role || 'super_admin'}
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
        title="Super Admin Dashboard" 
        subtitle="Complete system administration and management"
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

export default SuperAdminDashboard;
