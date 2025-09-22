import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Building2, AlertCircle, Clock, 
  ChevronRight, Users, FileText, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BillingDataTable from './BillingDataTable';
import TodoSystem from './TodoSystem';
import TimecardSystem from './TimecardSystem';
import ReportingSystem from './ReportingSystem';
import Header from './Header';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

function BillingStaffDashboard() {
  const { user } = useAuth();
  const { 
    clinics, 
    providers,
    patients, 
    billingEntries, 
    todoItems, 
    accountsReceivable,
    loading,
    error 
  } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    assignedClinics: 0,
    pendingTodos: 0,
    completedTodos: 0,
    totalBilling: 0
  });

  // Get assigned clinics for billing staff (in real implementation, this would come from user data)
  const assignedClinics = clinics.filter(clinic => 
    // For now, show all clinics - in real implementation, filter by user's assigned clinics
    true
  );

  // Calculate billing staff statistics
  useEffect(() => {
    const clinicTodos = todoItems.filter(item => 
      assignedClinics.some(clinic => clinic.id === item.clinicId)
    );
    
    const clinicBillingEntries = billingEntries.filter(entry => 
      assignedClinics.some(clinic => clinic.id === entry.clinicId)
    );

    const pendingTodos = clinicTodos.filter(item => item.status === 'waiting').length;
    const completedTodos = clinicTodos.filter(item => item.status === 'completed').length;
    const totalBilling = clinicBillingEntries.reduce((sum, entry) => sum + entry.amount, 0);

    setStats({
      assignedClinics: assignedClinics.length,
      pendingTodos,
      completedTodos,
      totalBilling
    });
  }, [assignedClinics, todoItems, billingEntries]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'assigned-clinics',
      label: 'Assigned Clinics',
      icon: Building2,
      children: assignedClinics.map(clinic => ({
        id: `clinic-${clinic.id}`,
        label: clinic.name,
        icon: Building2,
        children: [
          { id: `clinic-${clinic.id}-billing`, label: 'Billing Data', icon: FileText },
          { id: `clinic-${clinic.id}-todo`, label: 'To-Do List', icon: AlertCircle },
          { id: `clinic-${clinic.id}-timecards`, label: 'Timecards', icon: Clock },
          { id: `clinic-${clinic.id}-reports`, label: 'Reports', icon: BarChart3 }
        ]
      }))
    },
    { id: 'global-todo', label: 'Global To-Do List', icon: AlertCircle },
    { id: 'global-timecards', label: 'Global Timecards', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = selectedClinic === item.id;

    return (
      <div key={item.id} className="space-y-1">
        <button
          onClick={() => {
            if (hasChildren) {
              if (item.id.startsWith('clinic-')) {
                setSelectedClinic(selectedClinic === item.id ? null : item.id);
              } else {
                setActiveTab(item.id);
                setSelectedClinic(null);
              }
            } else {
              setActiveTab(item.id);
              setSelectedClinic(null);
            }
            // Only close sidebar on mobile devices
            if (window.innerWidth < 1024) {
              setIsSidebarOpen(false);
            }
          }}
          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left font-medium text-sm transition-colors ${
            isActive
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{item.label}</span>
          {hasChildren && (
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} />
          )}
        </button>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-red-700">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Staff Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Assigned Clinics</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.assignedClinics}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Pending Todos</h4>
                  <p className="text-2xl font-bold text-green-600">{stats.pendingTodos}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Completed Todos</h4>
                  <p className="text-2xl font-bold text-purple-600">{stats.completedTodos}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Total Billing</h4>
                  <p className="text-2xl font-bold text-orange-600">${stats.totalBilling.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('global-todo')}
                  className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-900">To-Do List</p>
                </button>
                <button
                  onClick={() => setActiveTab('global-timecards')}
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900">Timecards</p>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">Reports</p>
                </button>
                <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-900">Billing</p>
                </button>
              </div>
            </div>

            {/* Assigned Clinics Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-medium text-gray-900 mb-4">Assigned Clinics Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedClinics.map(clinic => (
                  <div key={clinic.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h5 className="font-medium text-gray-900 mb-2">{clinic.name}</h5>
                    <p className="text-sm text-gray-600 mb-3">{clinic.address}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setActiveTab(`clinic-${clinic.id}-billing`)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Billing
                      </button>
                      <button
                        onClick={() => setActiveTab(`clinic-${clinic.id}-todo`)}
                        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        To-Do
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'global-todo':
        return (
          <TodoSystem
            clinicId={undefined} // Global todo for all assigned clinics
            canEdit={true}
          />
        );
      case 'global-timecards':
        return (
          <TimecardSystem
            userId={user?.id}
            canEdit={true}
          />
        );
      case 'reports':
        return (
          <ReportingSystem
            userRole="billing_staff"
            clinicId={undefined}
            providerId={undefined}
          />
        );
      default:
        // Handle clinic-specific tabs
        if (activeTab.includes('clinic-') && activeTab.includes('-billing')) {
          const clinicId = activeTab.split('-')[1];
          return (
            <BillingDataTable
              clinicId={clinicId}
              canEdit={true}
              userRole="billing_staff"
            />
          );
        }
        if (activeTab.includes('clinic-') && activeTab.includes('-todo')) {
          const clinicId = activeTab.split('-')[1];
          return (
            <TodoSystem
              clinicId={clinicId}
              canEdit={true}
            />
          );
        }
        if (activeTab.includes('clinic-') && activeTab.includes('-timecards')) {
          const clinicId = activeTab.split('-')[1];
          return (
            <TimecardSystem
              userId={user?.id}
              canEdit={true}
            />
          );
        }
        if (activeTab.includes('clinic-') && activeTab.includes('-reports')) {
          const clinicId = activeTab.split('-')[1];
          return (
            <ReportingSystem
              userRole="billing_staff"
              clinicId={clinicId}
              providerId={undefined}
            />
          );
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        title="Billing Staff Dashboard" 
        subtitle="Manage assigned clinics, billing tasks, and timecards"
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex relative">
        {/* Sidebar */}
        <div className={`
          fixed lg:fixed inset-y-0 left-0 z-40 lg:z-auto
          w-64 bg-white shadow-sm border-r border-gray-200 h-screen
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'}
          lg:top-24
        `}>
          {/* Logo and Title */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">AM</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">American Medical</h1>
                <p className="text-xs text-gray-600">Billing & Coding LLC</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>
        </div>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 p-3 sm:p-4 lg:p-6 overflow-x-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`} style={{ marginTop: '80px' }}>
          <div className="max-w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingStaffDashboard;

