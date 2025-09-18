import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Edit, Save, X, Search, Filter, 
  ChevronDown, ChevronRight, Eye, EyeOff, Calendar,
  DollarSign, CreditCard, AlertCircle, Users, Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import BillingInterface from './BillingInterface';
import BillingGrid from './BillingGrid';
import PatientDatabase from './PatientDatabase';
import TodoSystem from './TodoSystem';

interface EnhancedBillingInterfaceProps {
  providerId?: string;
  clinicId?: string;
  canEdit?: boolean;
  visibleColumns?: string[];
  userRole?: string;
}

function EnhancedBillingInterface({ 
  providerId, 
  clinicId, 
  canEdit = true, 
  visibleColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'],
  userRole = 'provider'
}: EnhancedBillingInterfaceProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'single' | 'split'>('single');
  const [activePanel, setActivePanel] = useState<'billing' | 'patients' | 'todo'>('billing');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  // Listen for sidebar month selections
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.month) {
        setSelectedMonth(e.detail.month);
        setSelectedYear(e.detail.year || new Date().getFullYear());
      }
    };
    window.addEventListener('billing:select-month', handler as EventListener);
    return () => window.removeEventListener('billing:select-month', handler as EventListener);
  }, []);

  const getMonthColor = (monthIndex: number) => {
    const colors = [
      '#EF4444', '#EC4899', '#F97316', '#84CC16', '#10B981', '#06B6D4',
      '#3B82F6', '#1D4ED8', '#7C3AED', '#A855F7', '#9333EA', '#6B7280'
    ];
    return colors[monthIndex];
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const computeSelectedMonthDateRange = (year: number, month1Based: number) => {
    const start = new Date(year, month1Based - 1, 1);
    const end = new Date(year, month1Based, 0);
    const startStr = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
    const endStr = `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`;
    return { start: startStr, end: endStr };
  };

  const renderBillingInterface = () => (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Billing Data</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'split' : 'single')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {viewMode === 'single' ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{viewMode === 'single' ? 'Split View' : 'Single View'}</span>
          </button>
        </div>
      </div>
      <BillingGrid
        providerId={providerId}
        clinicId={clinicId}
        readOnly={!canEdit}
        visibleColumns={visibleColumns}
        dateRange={computeSelectedMonthDateRange(selectedYear, selectedMonth)}
      />
    </div>
  );

  const renderPatientDatabase = () => (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Patient Database</h3>
      </div>
      <PatientDatabase
        clinicId={clinicId}
        canEdit={canEdit}
      />
    </div>
  );

  const renderTodoSystem = () => (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">To-Do Items</h3>
      </div>
      <TodoSystem
        clinicId={clinicId}
        canEdit={canEdit}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Month Dropdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Enhanced Billing Interface</h2>
            <p className="text-gray-600">Comprehensive billing management with split-screen functionality</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Month tabs removed per design; month selection now via dropdown above */}
      </div>

      {/* Main Content Area */}
      {viewMode === 'single' ? (
        <div className="bg-white rounded-lg shadow">
          {renderBillingInterface()}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setActivePanel('billing')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    activePanel === 'billing'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={16} />
                  <span>Billing</span>
                </button>
                <button
                  onClick={() => setActivePanel('patients')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    activePanel === 'patients'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users size={16} />
                  <span>Patients</span>
                </button>
                {(userRole === 'billing_staff' || userRole === 'admin' || userRole === 'super_admin') && (
                  <button
                    onClick={() => setActivePanel('todo')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      activePanel === 'todo'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <AlertCircle size={16} />
                    <span>To-Do</span>
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 h-96 overflow-y-auto">
              {activePanel === 'billing' && renderBillingInterface()}
              {activePanel === 'patients' && renderPatientDatabase()}
              {activePanel === 'todo' && renderTodoSystem()}
            </div>
          </div>

          {/* Right Panel - Always Billing */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Billing Overview</h3>
            </div>
            <div className="p-6 h-96 overflow-y-auto">
              <BillingGrid
                providerId={providerId}
                clinicId={clinicId}
                readOnly={true}
                visibleColumns={visibleColumns}
                dateRange={computeSelectedMonthDateRange(selectedYear, selectedMonth)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-blue-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Claim Sent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>RS</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span>IP</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>Denial</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedBillingInterface;
