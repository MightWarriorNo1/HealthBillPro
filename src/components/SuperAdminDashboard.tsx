import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Building2, Users, FileText, 
  Clock, BarChart3, Settings, ChevronRight,
  UserCheck, DollarSign, AlertCircle, Palette
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import PatientDatabase from './PatientDatabase';
import EnhancedBillingInterface from './EnhancedBillingInterface';
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
  const [boxColors, setBoxColors] = useState({
    totalClinics: 'bg-blue-50',
    totalProviders: 'bg-green-50',
    totalPatients: 'bg-purple-50',
    totalRevenue: 'bg-orange-50',
    pendingClaims: 'bg-red-50',
    pendingTodos: 'bg-yellow-50',
    completedTodos: 'bg-indigo-50',
    totalAccountsReceivable: 'bg-pink-50'
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Ensure EnhancedBillingInterface reflects selected year when a provider tab is active
  useEffect(() => {
    if (activeTab.includes('provider-')) {
      let yearNum = currentYear;
      if (activeTab.includes('-year-')) {
        const yearStr = activeTab.split('-year-')[1];
        const parsed = parseInt(yearStr, 10);
        if (!Number.isNaN(parsed)) {
          yearNum = parsed;
        }
      }
      window.dispatchEvent(new CustomEvent('billing:select-year', { detail: { year: yearNum } }));
    }
  }, [activeTab]);

  const colorOptions = [
    { name: 'Blue', class: 'bg-blue-50', textClass: 'text-blue-900', valueClass: 'text-blue-600' },
    { name: 'Green', class: 'bg-green-50', textClass: 'text-green-900', valueClass: 'text-green-600' },
    { name: 'Purple', class: 'bg-purple-50', textClass: 'text-purple-900', valueClass: 'text-purple-600' },
    { name: 'Orange', class: 'bg-orange-50', textClass: 'text-orange-900', valueClass: 'text-orange-600' },
    { name: 'Red', class: 'bg-red-50', textClass: 'text-red-900', valueClass: 'text-red-600' },
    { name: 'Yellow', class: 'bg-yellow-50', textClass: 'text-yellow-900', valueClass: 'text-yellow-600' },
    { name: 'Indigo', class: 'bg-indigo-50', textClass: 'text-indigo-900', valueClass: 'text-indigo-600' },
    { name: 'Pink', class: 'bg-pink-50', textClass: 'text-pink-900', valueClass: 'text-pink-600' },
    { name: 'Teal', class: 'bg-teal-50', textClass: 'text-teal-900', valueClass: 'text-teal-600' },
    { name: 'Cyan', class: 'bg-cyan-50', textClass: 'text-cyan-900', valueClass: 'text-cyan-600' }
  ];

  // Helper function to get text colors for a given background color
  const getTextColors = (bgClass: string) => {
    const colorMap: Record<string, { textClass: string; valueClass: string }> = {
      'bg-blue-50': { textClass: 'text-blue-900', valueClass: 'text-blue-600' },
      'bg-green-50': { textClass: 'text-green-900', valueClass: 'text-green-600' },
      'bg-purple-50': { textClass: 'text-purple-900', valueClass: 'text-purple-600' },
      'bg-orange-50': { textClass: 'text-orange-900', valueClass: 'text-orange-600' },
      'bg-red-50': { textClass: 'text-red-900', valueClass: 'text-red-600' },
      'bg-yellow-50': { textClass: 'text-yellow-900', valueClass: 'text-yellow-600' },
      'bg-indigo-50': { textClass: 'text-indigo-900', valueClass: 'text-indigo-600' },
      'bg-pink-50': { textClass: 'text-pink-900', valueClass: 'text-pink-600' },
      'bg-teal-50': { textClass: 'text-teal-900', valueClass: 'text-teal-600' },
      'bg-cyan-50': { textClass: 'text-cyan-900', valueClass: 'text-cyan-600' }
    };
    return colorMap[bgClass] || { textClass: 'text-gray-900', valueClass: 'text-gray-600' };
  };

  const updateBoxColor = (boxKey: string, colorClass: string) => {
    setBoxColors(prev => ({
      ...prev,
      [boxKey]: colorClass
    }));
    // Don't close the color picker automatically - let users make multiple changes
    // setShowColorPicker(false);
    // setSelectedBox(null);
  };

  const currentYear = new Date().getFullYear();

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
                icon: UserCheck
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
                // Extract provider ID properly for provider-year items
                const parts = item.id.split('-');
                let providerId = '';
                if (parts.length >= 6) {
                  const uuidParts = parts.slice(1, 6);
                  providerId = uuidParts.join('-');
                } else {
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Super Admin Dashboard</h3>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Palette size={16} />
                  <span>Customize Colors</span>
                </button>
              </div>
              
              {showColorPicker && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Choose colors for tracker boxes:</h4>
                    <button
                      onClick={() => setShowColorPicker(false)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(boxColors).map(([key, currentColor]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-xs font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {colorOptions.map(color => (
                            <button
                              key={color.name}
                              onClick={() => updateBoxColor(key, color.class)}
                              className={`w-6 h-6 rounded ${color.class} border-2 ${
                                currentColor === color.class ? 'border-gray-800' : 'border-gray-300'
                              } hover:scale-110 transition-transform`}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className={`${boxColors.totalClinics} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.totalClinics).textClass}`}>Total Clinics</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.totalClinics).valueClass}`}>{clinics.length}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.totalProviders} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.totalProviders).textClass}`}>Total Providers</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.totalProviders).valueClass}`}>{providers.length}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.totalPatients} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.totalPatients).textClass}`}>Total Patients</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.totalPatients).valueClass}`}>{patients.length}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.totalRevenue} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.totalRevenue).textClass}`}>Total Revenue</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.totalRevenue).valueClass}`}>${stats.totalRevenue.toLocaleString()}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.pendingClaims} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.pendingClaims).textClass}`}>Pending Claims</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.pendingClaims).valueClass}`}>{stats.pendingClaims}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.pendingTodos} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.pendingTodos).textClass}`}>Pending Todos</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.pendingTodos).valueClass}`}>{stats.pendingTodos}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.completedTodos} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.completedTodos).textClass}`}>Completed Todos</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.completedTodos).valueClass}`}>{stats.completedTodos}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
                <div className={`${boxColors.totalAccountsReceivable} p-3 rounded-lg relative group`}>
                  <h4 className={`font-medium text-sm ${getTextColors(boxColors.totalAccountsReceivable).textClass}`}>Accounts Receivable</h4>
                  <p className={`text-xl font-bold ${getTextColors(boxColors.totalAccountsReceivable).valueClass}`}>${stats.totalAccountsReceivable.toLocaleString()}</p>
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Palette size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Clinic Breakdowns */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinic Breakdowns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clinics.map(clinic => {
                  const clinicProviders = providers.filter(p => p.clinicId === clinic.id);
                  const clinicPatients = patients.filter(p => p.clinicId === clinic.id);
                  const clinicBillingEntries = billingEntries.filter(entry => entry.clinicId === clinic.id);
                  const clinicTodos = todoItems.filter(item => item.clinicId === clinic.id);
                  const clinicAR = accountsReceivable.filter(ar => ar.clinicId === clinic.id);

                  const paidCount = clinicBillingEntries.filter(e => e.status === 'paid').length;
                  const pendingCount = clinicBillingEntries.filter(e => e.status === 'pending').length;
                  const approvedCount = clinicBillingEntries.filter(e => e.status === 'approved').length;
                  const rejectedCount = clinicBillingEntries.filter(e => e.status === 'rejected').length;
                  const totalRevenue = clinicBillingEntries
                    .filter(e => e.status === 'paid')
                    .reduce((sum, e) => sum + e.amount, 0);
                  const totalAR = clinicAR.reduce((sum, ar) => sum + ar.amountOwed, 0);
                  const openTodos = clinicTodos.filter(t => t.status === 'waiting' || t.status === 'in_progress' || t.status === 'ip' || t.status === 'on_hold').length;

                  return (
                    <div key={clinic.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{clinic.name}</h4>
                        <button
                          onClick={() => {
                            setSelectedClinic(`clinic-${clinic.id}`);
                            setActiveTab(`clinic-${clinic.id}`);
                          }}
                          className="text-sm text-purple-700 hover:underline"
                        >
                          View Clinic
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-blue-900">Providers</div>
                          <div className="text-lg font-semibold text-blue-700">{clinicProviders.length}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-green-900">Patients</div>
                          <div className="text-lg font-semibold text-green-700">{clinicPatients.length}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="text-purple-900">Total Claims</div>
                          <div className="text-lg font-semibold text-purple-700">{clinicBillingEntries.length}</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded">
                          <div className="text-yellow-900">Pending</div>
                          <div className="text-lg font-semibold text-yellow-700">{pendingCount}</div>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded">
                          <div className="text-indigo-900">Approved</div>
                          <div className="text-lg font-semibold text-indigo-700">{approvedCount}</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <div className="text-red-900">Rejected</div>
                          <div className="text-lg font-semibold text-red-700">{rejectedCount}</div>
                        </div>
                        <div className="bg-teal-50 p-3 rounded">
                          <div className="text-teal-900">Paid</div>
                          <div className="text-lg font-semibold text-teal-700">{paidCount}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <div className="text-orange-900">Revenue (Paid)</div>
                          <div className="text-lg font-semibold text-orange-700">${totalRevenue.toLocaleString()}</div>
                        </div>
                        <div className="bg-pink-50 p-3 rounded">
                          <div className="text-pink-900">Accounts Receivable</div>
                          <div className="text-lg font-semibold text-pink-700">${totalAR.toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-900">Open To-Dos</div>
                          <div className="text-lg font-semibold text-gray-700">{openTodos}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 text-sm">Providers</h4>
                  <p className="text-xl font-bold text-blue-600">{clinicProviders.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-900 text-sm">Patients</h4>
                  <p className="text-xl font-bold text-green-600">{clinicPatients.length}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-medium text-purple-900 text-sm">Billing Entries</h4>
                  <p className="text-xl font-bold text-purple-600">{clinicBillingEntries.length}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-medium text-orange-900 text-sm">Todo Items</h4>
                  <p className="text-xl font-bold text-orange-600">{clinicTodos.length}</p>
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

    // Handle provider content (default to current year if no explicit year)
    if (activeTab.includes('provider-')) {
      // Extract provider ID and year properly
      // Possible formats:
      //   provider-{providerId}
      //   provider-{providerId}-year-{YYYY}
      const parts = activeTab.split('-');
      console.log('Provider activeTab parts:', parts);
      
      let providerId = '';
      let year = String(currentYear);
      
      if (parts.length >= 6) {
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidParts = parts.slice(1, 6);
        providerId = uuidParts.join('-');
        if (activeTab.includes('-year-')) {
          year = parts.slice(6).join('-').replace('year-', '');
        }
      } else {
        // Fallback: try to extract from the end
        if (activeTab.includes('-year-')) {
          const lastDashIndex = activeTab.lastIndexOf('-');
          const beforeLastDash = activeTab.substring(0, lastDashIndex);
          providerId = beforeLastDash.replace('provider-', '');
          year = activeTab.substring(lastDashIndex + 1).replace('year-', '');
        } else {
          providerId = activeTab.replace('provider-', '');
        }
      }
      
      console.log('Looking for provider with ID:', providerId);
      console.log('Year:', year);
      const provider = providers.find(p => p.id === providerId);
      
      if (!provider) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Provider Not Found</h3>
            <p className="text-red-700">The selected provider could not be found.</p>
          </div>
        );
      }

      // Calculate totals for this provider scoped to the selected year
      const providerBillingEntries = billingEntries.filter(entry => {
        if (entry.providerId !== providerId) return false;
        const entryYear = new Date(entry.date).getFullYear();
        return String(entryYear) === String(year);
      });
      const totalRevenue = providerBillingEntries
        .filter(entry => entry.status === 'paid')
        .reduce((sum, entry) => sum + entry.amount, 0);
      const totalPendingClaims = providerBillingEntries.filter(entry => entry.status === 'pending').length;
      const totalCompletedTodos = todoItems.filter(item => item.clinicId === provider.clinicId && item.status === 'completed').length;
      const totalPendingTodos = todoItems.filter(item => item.clinicId === provider.clinicId && item.status === 'waiting').length;
      
      // Additional comprehensive metrics
      const totalBillingEntries = providerBillingEntries.length;
      const totalPaidClaims = providerBillingEntries.filter(entry => entry.status === 'paid').length;
      const totalApprovedClaims = providerBillingEntries.filter(entry => entry.status === 'approved').length;
      const totalRejectedClaims = providerBillingEntries.filter(entry => entry.status === 'rejected').length;
      
      // Calculate billing efficiency metrics
      const billingEfficiency = totalBillingEntries > 0 ? Math.round((totalPaidClaims / totalBillingEntries) * 100) : 0;
      const averageRevenuePerClaim = totalPaidClaims > 0 ? Math.round(totalRevenue / totalPaidClaims) : 0;
      
      // Get unique patient count for this provider
      const providerPatients = patients.filter(patient => patient.clinicId === provider.clinicId);
      const uniquePatientCount = providerPatients.length;

      return (
        <div className="space-y-6">
          {/* Provider Total Tracker */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{provider.name} - Comprehensive Overview</h3>
            
            {/* Revenue & Financial Metrics */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Financial Performance</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                  <h5 className="font-medium text-green-900 text-sm">Total Revenue</h5>
                  <p className="text-xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-700">All months combined</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                  <h5 className="font-medium text-blue-900 text-sm">Avg Revenue/Claim</h5>
                  <p className="text-xl font-bold text-blue-600">${averageRevenuePerClaim.toLocaleString()}</p>
                  <p className="text-xs text-blue-700">Per paid claim</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
                  <h5 className="font-medium text-purple-900 text-sm">Billing Efficiency</h5>
                  <p className="text-xl font-bold text-purple-600">{billingEfficiency}%</p>
                  <p className="text-xs text-purple-700">Paid vs total claims</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">
                  <h5 className="font-medium text-indigo-900 text-sm">Total Claims</h5>
                  <p className="text-xl font-bold text-indigo-600">{totalBillingEntries}</p>
                  <p className="text-xs text-indigo-700">All time entries</p>
                </div>
              </div>
            </div>

            {/* Claims Status Breakdown */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Claims Status Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="font-medium text-green-900 text-sm">Paid Claims</h5>
                  <p className="text-lg font-bold text-green-600">{totalPaidClaims}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h5 className="font-medium text-yellow-900 text-sm">Pending Claims</h5>
                  <p className="text-lg font-bold text-yellow-600">{totalPendingClaims}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-900 text-sm">Approved Claims</h5>
                  <p className="text-lg font-bold text-blue-600">{totalApprovedClaims}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <h5 className="font-medium text-red-900 text-sm">Rejected Claims</h5>
                  <p className="text-lg font-bold text-red-600">{totalRejectedClaims}</p>
                </div>
              </div>
            </div>

            {/* Task & Patient Metrics */}
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Tasks & Patient Management</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-900 text-sm">Total Patients</h5>
                  <p className="text-xl font-bold text-blue-600">{uniquePatientCount}</p>
                  <p className="text-xs text-blue-700">Unique patients</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="font-medium text-green-900 text-sm">Completed Tasks</h5>
                  <p className="text-xl font-bold text-green-600">{totalCompletedTodos}</p>
                  <p className="text-xs text-green-700">All time</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h5 className="font-medium text-yellow-900 text-sm">Pending Tasks</h5>
                  <p className="text-xl font-bold text-yellow-600">{totalPendingTodos}</p>
                  <p className="text-xs text-yellow-700">Awaiting completion</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h5 className="font-medium text-purple-900 text-sm">Task Completion Rate</h5>
                  <p className="text-xl font-bold text-purple-600">
                    {totalCompletedTodos + totalPendingTodos > 0 
                      ? Math.round((totalCompletedTodos / (totalCompletedTodos + totalPendingTodos)) * 100) 
                      : 0}%
                  </p>
                  <p className="text-xs text-purple-700">Completed vs total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing for selected year with month pills in header */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {provider.name} - {year} Billing
              </h3>
              <p className="text-sm text-gray-600">
                Select a month in the header of the billing sheet for {year}
              </p>
            </div>
            <div className="p-6">
              <EnhancedBillingInterface
                providerId={providerId}
                clinicId={provider.clinicId}
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
        title="" 
        subtitle=""
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
