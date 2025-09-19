import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Building2, Users, FileText, 
  BarChart3, ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BillingDataTable from './BillingDataTable';
import PatientDatabase from './PatientDatabase';
import TodoSystem from './TodoSystem';
import ReportingSystem from './ReportingSystem';
import Header from './Header';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

function AdminDashboard() {
  const { user } = useAuth();
  const { 
    clinics, 
    providers, 
    patients, 
    billingEntries, 
    todoItems, 
    loading,
    error 
  } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalProviders: 0,
    pendingClaims: 0,
    monthlyRevenue: 0
  });

  const userClinic = clinics.find(c => c.id === user?.clinicId);
  const clinicProviders = providers.filter(p => p.clinicId === user?.clinicId);

  // Calculate admin statistics
  useEffect(() => {
    if (!user?.clinicId) return;

    const clinicPatients = patients.filter(p => p.clinicId === user.clinicId);
    const clinicBillingEntries = billingEntries.filter(entry => entry.clinicId === user.clinicId);
    
    const monthlyRevenue = clinicBillingEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    const pendingClaims = clinicBillingEntries.filter(entry => entry.status === 'pending').length;

    setStats({
      totalPatients: clinicPatients.length,
      totalProviders: clinicProviders.length,
      pendingClaims,
      monthlyRevenue
    });
  }, [user, patients, billingEntries, clinicProviders]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'clinic-dashboard',
      label: 'Clinic Dashboard',
      icon: Building2,
      children: [
        { id: 'clinic-overview', label: 'Overview', icon: Building2 },
        { id: 'clinic-billing', label: 'Billing Data', icon: FileText },
        { id: 'clinic-patients', label: 'Patient Database', icon: Users },
        { id: 'clinic-todo', label: 'To-Do List', icon: AlertCircle },
        { id: 'clinic-reports', label: 'Reports', icon: BarChart3 }
      ]
    },
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
              setSelectedClinic(selectedClinic === item.id ? null : item.id);
            } else {
              setActiveTab(item.id);
              setSelectedClinic(null);
            }
            setIsSidebarOpen(false);
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Total Patients</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Providers</h4>
                  <p className="text-2xl font-bold text-green-600">{stats.totalProviders}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Pending Claims</h4>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingClaims}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Monthly Revenue</h4>
                  <p className="text-2xl font-bold text-orange-600">${stats.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* Clinic Information */}
            {userClinic && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-medium text-gray-900 mb-4">Clinic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Clinic Details</h5>
                    <p className="text-sm text-gray-600"><strong>Name:</strong> {userClinic.name}</p>
                    <p className="text-sm text-gray-600"><strong>Address:</strong> {userClinic.address}</p>
                    <p className="text-sm text-gray-600"><strong>Phone:</strong> {userClinic.phone}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Providers</h5>
                    <div className="space-y-1">
                      {clinicProviders.map(provider => (
                        <p key={provider.id} className="text-sm text-gray-600">• {provider.name}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'clinic-overview':
        if (!userClinic) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">No Clinic Assigned</h3>
              <p className="text-red-700">You are not assigned to any clinic.</p>
            </div>
          );
        }

        const clinicPatients = patients.filter(p => p.clinicId === user?.clinicId);
        const clinicBillingEntries = billingEntries.filter(entry => entry.clinicId === user?.clinicId);
        const clinicTodos = todoItems.filter(item => item.clinicId === user?.clinicId);

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{userClinic.name} - Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Providers</h4>
                  <p className="text-2xl font-bold text-blue-600">{clinicProviders.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Patients</h4>
                  <p className="text-2xl font-bold text-green-600">{clinicPatients.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Billing Entries</h4>
                  <p className="text-2xl font-bold text-purple-600">{clinicBillingEntries.length}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Todo Items</h4>
                  <p className="text-2xl font-bold text-orange-600">{clinicTodos.length}</p>
                </div>
              </div>
            </div>

            {/* Clinic Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-medium text-gray-900 mb-4">Clinic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Contact Details</h5>
                  <p className="text-sm text-gray-600"><strong>Name:</strong> {userClinic.name}</p>
                  <p className="text-sm text-gray-600"><strong>Address:</strong> {userClinic.address}</p>
                  <p className="text-sm text-gray-600"><strong>Phone:</strong> {userClinic.phone}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Providers</h5>
                  <div className="space-y-1">
                    {clinicProviders.map(provider => (
                      <p key={provider.id} className="text-sm text-gray-600">• {provider.name}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'clinic-billing':
        return (
          <BillingDataTable
            clinicId={user?.clinicId}
            canEdit={true}
            userRole={user?.role}
          />
        );
      case 'clinic-patients':
        return (
          <PatientDatabase
            clinicId={user?.clinicId}
            canEdit={true}
          />
        );
      case 'clinic-todo':
        return (
          <TodoSystem
            clinicId={user?.clinicId}
            canEdit={true}
          />
        );
      case 'clinic-reports':
      case 'reports':
        return (
          <ReportingSystem
            userRole={user?.role || 'admin'}
            clinicId={user?.clinicId}
            providerId={user?.providerId}
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
        subtitle="Manage clinic operations, billing, and administrative functions"
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex relative">
        {/* Sidebar */}
        <div className={`
          fixed lg:fixed inset-y-0 left-0 z-40 lg:z-auto
          w-64 bg-white shadow-sm border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:top-24
        `}>

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