import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import EnhancedBillingInterface from './EnhancedBillingInterface';
import Header from './Header';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

function ProviderDashboard() {
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    myPatients: 0,
    monthlyBilling: 0,
    pendingClaims: 0,
    totalRevenue: 0
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Calculate provider-specific statistics
  useEffect(() => {
    if (!user?.providerId) return;

    const myPatients = patients.filter(p => p.clinicId === user.clinicId).length;
    const myBillingEntries = billingEntries.filter(entry => entry.providerId === user.providerId);
    const monthlyBilling = myBillingEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      })
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const pendingClaims = myBillingEntries.filter(entry => entry.status === 'pending').length;
    const totalRevenue = myBillingEntries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);

    setStats({
      myPatients,
      monthlyBilling,
      pendingClaims,
      totalRevenue
    });
  }, [user, patients, billingEntries]);

  const userClinic = clinics.find(c => c.id === user?.clinicId);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'years',
      label: 'Years',
      icon: Calendar,
      children: years.map(y => ({ id: `year-${y}`, label: `${y}`, icon: Calendar }))
    }
  ];

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = selectedMonth === item.id;

    return (
      <div key={item.id} className="space-y-1">
        <button
          onClick={() => {
            if (hasChildren) {
              setSelectedMonth(selectedMonth === item.id ? null : item.id);
            } else {
              setActiveTab(item.id);
              // When selecting a year item, dispatch to update header month pills
              if (item.id.startsWith('year-')) {
                const yearNum = parseInt(item.id.replace('year-', ''), 10);
                if (yearNum) {
                  window.dispatchEvent(new CustomEvent('billing:select-year', { detail: { year: yearNum } }));
                }
              }
              // Keep submenu expanded by not changing selectedMonth here
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">My Patients</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.myPatients}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">This Month's Billing</h4>
                  <p className="text-2xl font-bold text-green-600">${stats.monthlyBilling.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Pending Claims</h4>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingClaims}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Total Revenue</h4>
                  <p className="text-2xl font-bold text-orange-600">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              </div>
            </div>

            {/* Quick Actions (limited for providers) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    const now = new Date();
                    const monAbbr = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
                    const year = now.getFullYear();
                    const id = `month-${monAbbr}-${year}`;
                    setActiveTab(id);
                    const monthMap: Record<string, number> = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
                    const monthNum = monthMap[monAbbr];
                    window.dispatchEvent(new CustomEvent('billing:select-month', { detail: { month: monthNum, year } }));
                  }}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">Current Month</p>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        // Handle month-specific tabs
        if (activeTab.startsWith('month-')) {
          const month = activeTab.replace('month-', '').replace('-', ' ');
          // Ensure data view is synced if user navigated directly (e.g., deep link)
          const payload = activeTab.replace('month-', '');
          const [monAbbr, yearStr] = payload.split('-');
          const monthMap: Record<string, number> = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
          const monthNum = monthMap[monAbbr as keyof typeof monthMap];
          const yearNum = parseInt(yearStr || `${new Date().getFullYear()}`, 10);
          if (monthNum && yearNum) {
            window.dispatchEvent(new CustomEvent('billing:select-month', { detail: { month: monthNum, year: yearNum } }));
          }
          
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {month} Billing Data
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your billing entries for {month}
                  </p>
              </div>
              <div className="p-6">
                  <EnhancedBillingInterface
                    clinicId={user?.clinicId}
                    providerId={user?.providerId}
                    canEdit={true}
                    userRole={user?.role}
                    visibleColumns={[
                      'A','B','C','D','E','F','G','H','I'
                    ]}
                  />
                </div>
            </div>
          </div>
        );
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        title="Provider Dashboard" 
        subtitle="Manage your patients, billing, and monthly data"
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

export default ProviderDashboard;