import React, { useState } from 'react';
import { 
  FileText, Calendar, User, Edit, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EnhancedBillingInterface from './EnhancedBillingInterface';
import Header from './Header';
import Sidebar from './Sidebar';

function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('billing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { id: 'billing', label: 'My Billing', icon: FileText },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return (
          <div className="space-y-6">
            {/* Provider Billing - Columns A-G, H-I */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Billing & Appointment Status</h3>
                <p className="text-sm text-gray-600">Update billing and appointment status (Columns A-G, H-I)</p>
              </div>
              <div className="p-6">
                <EnhancedBillingInterface
                  providerId={user?.providerId}
                  clinicId={user?.clinicId}
                  canEdit={user?.role === 'billing_viewer' ? false : true}
                  userRole={user?.role}
                  visibleColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']}
                />
              </div>
            </div>

            {/* Appointment Status Options */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">Appointment Status Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-green-700">
                <div>• Complete</div>
                <div>• PP Complete</div>
                <div>• Charge NS/LC</div>
                <div>• RS No Charge</div>
                <div>• NS No Charge</div>
                <div>• Note not complete</div>
              </div>
            </div>
          </div>
        );
      case 'schedules':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Schedules</h3>
                <p className="text-sm text-gray-600">View and manage your patient schedules</p>
              </div>
              <div className="p-6">
                <EnhancedBillingInterface
                  providerId={user?.providerId}
                  clinicId={user?.clinicId}
                  canEdit={true}
                  userRole={user?.role}
                  visibleColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G']}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        title="Provider Dashboard" 
        subtitle="Manage your billing, schedules, and patient information"
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

export default ProviderDashboard;