import { LucideIcon, ChevronRight } from 'lucide-react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface SidebarProps {
  tabs: Array<{ id: string; label: string; icon: LucideIcon }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

function Sidebar({ tabs, activeTab, onTabChange, isOpen = true, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { clinics, providers } = useData();
  const userClinic = clinics.find(c => c.id === user?.clinicId);
  const clinicProviders = providers.filter(p => p.clinicId === user?.clinicId);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:fixed inset-y-0 left-0 z-40 lg:z-auto
        w-64 bg-white shadow-sm border-r border-gray-200 h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:top-24
      `}>
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div key={tab.id} className="space-y-1">
                <button
                  onClick={() => {
                    onTabChange(tab.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>

                {/* Hierarchy: Clinic > Providers > Months */}
                {tab.id === 'schedules' && userClinic && (
                  <div className="ml-6 text-sm text-gray-700">
                    <div className="font-semibold mb-1">{userClinic.name}</div>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {clinicProviders.map((p) => (
                        <details key={p.id} className="group">
                          <summary className="flex items-center cursor-pointer select-none text-gray-600 hover:text-gray-900">
                            <ChevronRight className="h-4 w-4 mr-1 group-open:rotate-90 transition-transform" />
                            {p.name}
                          </summary>
                          <ul className="ml-5 mt-1 space-y-1">
                            {months.map((m, idx) => (
                              <li
                                key={idx}
                                className="text-gray-500 hover:text-gray-900 cursor-pointer"
                                onClick={() => {
                                  const year = new Date().getFullYear();
                                  window.dispatchEvent(
                                    new CustomEvent('billing:select-month', {
                                      detail: { month: idx + 1, year }
                                    })
                                  );
                                  if (onClose) onClose();
                                }}
                              >
                                {m}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
