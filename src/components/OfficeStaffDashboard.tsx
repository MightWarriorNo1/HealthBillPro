import { useState } from 'react';
import { 
  Users, FileText, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PatientDatabase from './PatientDatabase';
import EnhancedBillingInterface from './EnhancedBillingInterface';
import Header from './Header';
import Sidebar from './Sidebar';

function OfficeStaffDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedules');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { id: 'schedules', label: 'Provider Schedules', icon: Calendar },
    { id: 'patients', label: 'Patient Database', icon: Users },
    { id: 'billing', label: 'Billing View', icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedules':
        return (
          <div className="space-y-6">
            {/* Provider Schedules - Columns A-G, O-Q */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Provider Schedules</h3>
                <p className="text-sm text-gray-600">Update schedules and patient information (Columns A-G, O-Q)</p>
              </div>
              <div className="p-6">
                <EnhancedBillingInterface
                  clinicId={user?.clinicId}
                  canEdit={true}
                  userRole={user?.role}
                  visibleColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'O', 'P', 'Q', 'R', 'S', 'T']}
                />
              </div>
            </div>

            {/* Patient Payment Status Options */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Patient Payment Status Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                <div>• Paid</div>
                <div>• CC declined</div>
                <div>• Secondary</div>
                <div>• Refunded</div>
                <div>• Payment Plan</div>
                <div>• Waiting on Claims</div>
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
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Billing Overview</h3>
                <p className="text-sm text-gray-600">View billing information (read-only access)</p>
              </div>
              <div className="p-6">
                <EnhancedBillingInterface
                  clinicId={user?.clinicId}
                  canEdit={false}
                  userRole={user?.role}
                  visibleColumns={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'O', 'P', 'Q']}
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
        title="Office Staff Dashboard" 
        subtitle="Manage schedules, patients, and billing for your clinic"
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

export default OfficeStaffDashboard;