import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Building2, Users, FileText, 
  Clock, BarChart3, Settings, ChevronRight,
  UserCheck, Calendar, DollarSign, AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import BillingDataTable from './BillingDataTable';
import PatientDatabase from './PatientDatabase';
import TodoSystem from './TodoSystem';
import TimecardSystem from './TimecardSystem';
import ReportingSystem from './ReportingSystem';
import InvoiceSystem from './InvoiceSystem';
import SuperAdminSettings from './SuperAdminSettings';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

function SuperAdminDashboard() {
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
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingClaims: 0,
    completedTodos: 0,
    pendingTodos: 0,
    totalAccountsReceivable: 0
  });

  const months = [
    'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 
    'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025',
    'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'
  ];

  // Calculate statistics
  useEffect(() => {
    const totalRevenue = billingEntries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const pendingClaims = billingEntries.filter(entry => entry.status === 'pending').length;
    const completedTodos = todoItems.filter(item => item.status === 'completed').length;
    const pendingTodos = todoItems.filter(item => item.status === 'waiting').length;
    const totalAccountsReceivable = accountsReceivable.reduce((sum, ar) => sum + ar.amountOwed, 0);

    setStats({
      totalRevenue,
      pendingClaims,
      completedTodos,
      pendingTodos,
      totalAccountsReceivable
    });
  }, [billingEntries, todoItems, accountsReceivable]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'clinics',
      label: 'Clinics',
      icon: Building2,
      children: clinics.map(clinic => {
        console.log('Creating menu item for clinic:', clinic.id, clinic.name);
        return {
          id: `clinic-${clinic.id}`,
          label: clinic.name,
          icon: Building2,
          children: [
            { id: `clinic-${clinic.id}-patients`, label: 'Patient Info', icon: Users },
            { id: `clinic-${clinic.id}-todo`, label: 'Billing To-Do', icon: AlertCircle },
            ...providers
              .filter(p => p.clinicId === clinic.id)
              .map(provider => ({
                id: `provider-${provider.id}`,
                label: provider.name,
                icon: UserCheck,
                children: months.map(month => ({
                  id: `provider-${provider.id}-${month.toLowerCase().replace(' ', '-')}`,
                  label: month,
                  icon: Calendar
                }))
              }))
          ]
        };
      })
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'timecards', label: 'Timecards', icon: Clock },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      children: [
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'billing-codes', label: 'Billing Codes', icon: FileText },
        { id: 'clinic-management', label: 'Clinic Management', icon: Building2 },
        { id: 'export-data', label: 'Export Data', icon: DollarSign },
        { id: 'audit-logs', label: 'Audit logs', icon: FileText }
      ]
    }
  ];

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = selectedClinic === item.id || selectedProvider === item.id || 
                      (item.id === 'clinics' && selectedClinic) || 
                      (item.id === 'settings' && activeTab.startsWith('user-management'));

    return (
      <div key={item.id} className="space-y-1">
        <button
          onClick={() => {
            if (hasChildren) {
              if (item.id === 'clinics') {
                // Toggle clinics expansion
                setSelectedClinic(selectedClinic ? null : 'clinics');
                setSelectedProvider(null);
                setActiveTab('clinics');
              } else if (item.id === 'settings') {
                // Toggle settings expansion
                setActiveTab(activeTab.startsWith('user-management') ? 'settings' : 'user-management');
                setSelectedClinic(null);
                setSelectedProvider(null);
              } else if (item.id.startsWith('clinic-')) {
                console.log('Selecting clinic:', item.id);
                setSelectedClinic(selectedClinic === item.id ? null : item.id);
                setSelectedProvider(null);
                setActiveTab(item.id);
              } else if (item.id.startsWith('provider-')) {
                setSelectedProvider(selectedProvider === item.id ? null : item.id);
                setActiveTab(item.id);
              } else {
                setActiveTab(item.id);
                setSelectedClinic(null);
                setSelectedProvider(null);
              }
            } else {
              setActiveTab(item.id);
              if (item.id.includes('provider-') && item.id.includes('-')) {
                // Extract provider ID properly for provider-month items
                const parts = item.id.split('-');
                let providerId = '';
                
                if (parts.length >= 6) {
                  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                  const uuidParts = parts.slice(1, 6); // Get parts 1-5 for UUID
                  providerId = uuidParts.join('-');
                } else {
                  // Fallback: try to extract from the end
                  const lastDashIndex = item.id.lastIndexOf('-');
                  const beforeLastDash = item.id.substring(0, lastDashIndex);
                  providerId = beforeLastDash.replace('provider-', '');
                }
                
                setSelectedProvider(`provider-${providerId}`);
              } else if (item.id.includes('clinic-') && (item.id.includes('-patients') || item.id.includes('-todo'))) {
                // Handle clinic sub-items (Patient Info, Billing To-Do)
                // Extract the clinic ID from the item.id
                const clinicId = item.id.replace('clinic-', '').replace('-patients', '').replace('-todo', '');
                setSelectedClinic(`clinic-${clinicId}`);
                console.log('Setting selectedClinic to:', `clinic-${clinicId}`);
              } else {
                setSelectedClinic(null);
                setSelectedProvider(null);
              }
            }
            // Only close sidebar on mobile devices
            if (window.innerWidth < 1024) {
              setIsSidebarOpen(false);
            }
          }}
          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left font-medium text-sm transition-colors ${
            isActive || (item.id === 'clinics' && selectedClinic) || (item.id === 'settings' && activeTab.startsWith('user-management'))
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

    // Handle main dashboard tabs
    switch (activeTab) {
      case 'clinics':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Clinics</h3>
              <p className="text-gray-600 mb-6">Select a clinic from the sidebar to view detailed information.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clinics.map(clinic => {
                  const clinicProviders = providers.filter(p => p.clinicId === clinic.id);
                  const clinicPatients = patients.filter(p => p.clinicId === clinic.id);
                  const clinicBillingEntries = billingEntries.filter(entry => entry.clinicId === clinic.id);
                  
                  return (
                    <div key={clinic.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900 mb-2">{clinic.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{clinic.address}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Providers:</span>
                          <span className="ml-1 font-medium">{clinicProviders.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Patients:</span>
                          <span className="ml-1 font-medium">{clinicPatients.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Billing Entries:</span>
                          <span className="ml-1 font-medium">{clinicBillingEntries.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-1 font-medium">{clinic.phone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Super Admin Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Total Clinics</h4>
                  <p className="text-2xl font-bold text-blue-600">{clinics.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Total Providers</h4>
                  <p className="text-2xl font-bold text-green-600">{providers.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Total Patients</h4>
                  <p className="text-2xl font-bold text-purple-600">{patients.length}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Total Revenue</h4>
                  <p className="text-2xl font-bold text-orange-600">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900">Pending Claims</h4>
                  <p className="text-2xl font-bold text-red-600">{stats.pendingClaims}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Pending Todos</h4>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingTodos}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-indigo-900">Completed Todos</h4>
                  <p className="text-2xl font-bold text-indigo-600">{stats.completedTodos}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="font-medium text-pink-900">Accounts Receivable</h4>
                  <p className="text-2xl font-bold text-pink-600">${stats.totalAccountsReceivable.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <ReportingSystem
            userRole="super_admin"
            clinicId={selectedClinic?.replace('clinic-', '')}
            providerId={selectedProvider?.replace('provider-', '')}
          />
        );
      case 'timecards':
        return (
          <TimecardSystem
            userId={user?.id}
            canEdit={true}
          />
        );
      case 'invoices':
        return (
          <InvoiceSystem
            userRole="super_admin"
            clinicId={selectedClinic?.replace('clinic-', '')}
          />
        );
      case 'user-management':
        return <SuperAdminSettings initialTab="users" />;
      case 'billing-codes':
        return <SuperAdminSettings initialTab="billing-codes" />;
      case 'clinic-management':
        return <SuperAdminSettings initialTab={'clinic-management' as const} />;
      case 'export-data':
        return <SuperAdminSettings initialTab={'export-data' as const} />;
      case 'audit-logs':
        return <SuperAdminSettings initialTab="audit-logs" />;
    }

    // Handle clinic sub-items FIRST (before general clinic content)
    if (activeTab.includes('clinic-') && activeTab.includes('-patients')) {
      // Use the selected clinic ID from state instead of parsing from activeTab
      const clinicId = selectedClinic ? selectedClinic.replace('clinic-', '') : null;
      console.log('Clinic sub-item - patients, activeTab:', activeTab);
      console.log('Clinic sub-item - patients, selectedClinic:', selectedClinic);
      console.log('Clinic sub-item - patients, clinicId:', clinicId);
      
      if (!clinicId) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">No Clinic Selected</h3>
            <p className="text-red-700">Please select a clinic first.</p>
          </div>
        );
      }
      
      // Verify the clinic exists
      const clinic = clinics.find(c => c.id === clinicId);
      if (!clinic) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Clinic Not Found</h3>
            <p className="text-red-700">The selected clinic could not be found.</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Available clinics:</p>
              <ul className="mt-2 text-sm text-gray-600">
                {clinics.map(c => (
                  <li key={c.id}>• {c.name} (ID: {c.id})</li>
                ))}
              </ul>
              <p className="text-sm text-gray-600 mt-2">Looking for clinic ID: {clinicId}</p>
            </div>
          </div>
        );
      }
      
      return (
        <PatientDatabase
          clinicId={clinicId}
          canEdit={true}
        />
      );
    }
    
    if (activeTab.includes('clinic-') && activeTab.includes('-todo')) {
      // Use the selected clinic ID from state instead of parsing from activeTab
      const clinicId = selectedClinic ? selectedClinic.replace('clinic-', '') : null;
      console.log('Clinic sub-item - todo, activeTab:', activeTab);
      console.log('Clinic sub-item - todo, selectedClinic:', selectedClinic);
      console.log('Clinic sub-item - todo, clinicId:', clinicId);
      
      if (!clinicId) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">No Clinic Selected</h3>
            <p className="text-red-700">Please select a clinic first.</p>
          </div>
        );
      }
      
      // Verify the clinic exists
      const clinic = clinics.find(c => c.id === clinicId);
      if (!clinic) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Clinic Not Found</h3>
            <p className="text-red-700">The selected clinic could not be found.</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Available clinics:</p>
              <ul className="mt-2 text-sm text-gray-600">
                {clinics.map(c => (
                  <li key={c.id}>• {c.name} (ID: {c.id})</li>
                ))}
              </ul>
              <p className="text-sm text-gray-600 mt-2">Looking for clinic ID: {clinicId}</p>
            </div>
          </div>
        );
      }
      
      return (
        <TodoSystem
          clinicId={clinicId}
          canEdit={true}
        />
      );
    }

    // Handle general clinic-specific content (clinic overview)
    if (activeTab.includes('clinic-') && !activeTab.includes('-patients') && !activeTab.includes('-todo')) {
      // Extract the full clinic ID by removing 'clinic-' prefix
      const clinicId = activeTab.replace('clinic-', '');
      console.log('Looking for clinic with ID:', clinicId);
      console.log('Available clinics:', clinics.map(c => ({ id: c.id, name: c.name })));
      const clinic = clinics.find(c => c.id === clinicId);
      
      if (!clinic) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Clinic Not Found</h3>
            <p className="text-red-700">The selected clinic could not be found.</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Available clinics:</p>
              <ul className="mt-2 text-sm text-gray-600">
                {clinics.map(c => (
                  <li key={c.id}>• {c.name} (ID: {c.id})</li>
                ))}
              </ul>
              <p className="text-sm text-gray-600 mt-2">Looking for clinic ID: {clinicId}</p>
            </div>
          </div>
        );
      }

      // Show clinic overview when clinic is selected
      if (activeTab === `clinic-${clinicId}`) {
        const clinicProviders = providers.filter(p => p.clinicId === clinicId);
        const clinicPatients = patients.filter(p => p.clinicId === clinicId);
        const clinicBillingEntries = billingEntries.filter(entry => entry.clinicId === clinicId);
        const clinicTodos = todoItems.filter(item => item.clinicId === clinicId);

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{clinic.name} - Overview</h3>
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
                  <p className="text-sm text-gray-600"><strong>Name:</strong> {clinic.name}</p>
                  <p className="text-sm text-gray-600"><strong>Address:</strong> {clinic.address}</p>
                  <p className="text-sm text-gray-600"><strong>Phone:</strong> {clinic.phone}</p>
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
      }

    }

    // Handle provider-month content
    if (activeTab.includes('provider-') && activeTab.includes('-')) {
      // Extract provider ID and month properly
      // Format: provider-{providerId}-{month}
      const parts = activeTab.split('-');
      console.log('Provider-month activeTab parts:', parts);
      
      // Find where the provider ID ends and month begins
      // Provider ID is a UUID, so we need to find the pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      let providerId = '';
      let month = '';
      
      if (parts.length >= 6) {
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        // So parts[1] to parts[5] should be the UUID parts
        const uuidParts = parts.slice(1, 6); // Get parts 1-5 for UUID
        providerId = uuidParts.join('-');
        month = parts.slice(6).join('-').replace(/-/g, ' '); // Join remaining parts for month
      } else {
        // Fallback: try to extract from the end
        const lastDashIndex = activeTab.lastIndexOf('-');
        const beforeLastDash = activeTab.substring(0, lastDashIndex);
        providerId = beforeLastDash.replace('provider-', '');
        month = activeTab.substring(lastDashIndex + 1).replace(/-/g, ' ');
      }
      
      console.log('Looking for provider with ID:', providerId);
      console.log('Month:', month);
      const provider = providers.find(p => p.id === providerId);
      
      if (!provider) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Provider Not Found</h3>
            <p className="text-red-700">The selected provider could not be found.</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {provider.name} - {month} Billing
              </h3>
              <p className="text-sm text-gray-600">
                Manage billing entries for {provider.name} in {month}
              </p>
            </div>
            <div className="p-6">
              <BillingDataTable
                providerId={providerId}
                clinicId={provider.clinicId}
                month={month}
                canEdit={true}
                userRole="super_admin"
              />
            </div>
          </div>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Super Admin Panel</h3>
        <p className="text-gray-600">Select a clinic, provider, or month to view detailed information.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Super Admin Dashboard" 
        subtitle="Manage all clinics, providers, and system settings"
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      <div className="flex relative">
        <div className={`
          fixed lg:fixed inset-y-0 left-0 z-40 lg:z-auto
          w-64 bg-white shadow-sm border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'}
          lg:top-24
        `}>
          <nav className="p-4 space-y-2 h-full overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              menuItems.map(item => renderMenuItem(item))
            )}
          </nav>
        </div>

        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={`flex-1 p-3 sm:p-4 lg:p-6 overflow-x-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} min-h-screen`} style={{ marginTop: '80px' }}>
          <div className="max-w-full w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
