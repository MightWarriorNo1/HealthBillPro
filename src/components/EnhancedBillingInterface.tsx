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
import AccountsReceivable from './AccountsReceivable';
import MonthlyAccountsReceivable from './MonthlyAccountsReceivable';

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
  const [activePanel, setActivePanel] = useState<'billing' | 'patients' | 'todo' | 'ar' | 'monthly-ar'>('todo');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  // Listen for sidebar month and year selections
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.month) {
        setSelectedMonth(e.detail.month);
        setSelectedYear(e.detail.year || new Date().getFullYear());
      }
      if (e?.detail?.year && !e?.detail?.month) {
        setSelectedYear(e.detail.year);
      }
    };
    window.addEventListener('billing:select-month', handler as EventListener);
    window.addEventListener('billing:select-year', handler as EventListener);
    return () => {
      window.removeEventListener('billing:select-month', handler as EventListener);
      window.removeEventListener('billing:select-year', handler as EventListener);
    };
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
      <div className="mb-4">
        <div className="flex items-center justify-between">
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
        {/* Month pills header */}
        <div className="mt-3 flex flex-wrap gap-2">
          {months.map((name, idx) => {
            const monthIndex = idx + 1;
            const isActive = monthIndex === selectedMonth;
            const color = getMonthColor(idx);
            return (
              <button
                key={name}
                onClick={() => setSelectedMonth(monthIndex)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${isActive ? 'text-white' : 'text-gray-800'}`}
                style={{
                  backgroundColor: isActive ? color : '#ffffff',
                  borderColor: color,
                }}
                title={`${name} ${selectedYear}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
      {/* Tracker for current month (billing only, not A/R) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-black">Claims Not Paid</div>
          <div id="billing-tracker-claims" className="text-2xl font-bold text-gray-800">—</div>
        </div>
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-black">Insurance Collected</div>
          <div id="billing-tracker-ins" className="text-2xl font-bold text-gray-800">$0</div>
        </div>
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-black">Patient Payments</div>
          <div id="billing-tracker-pt" className="text-2xl font-bold text-gray-800">$0</div>
        </div>
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-black">Total Collected</div>
          <div id="billing-tracker-total" className="text-2xl font-bold text-gray-800">$0</div>
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

  const renderAccountsReceivable = () => (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Accounts Receivable</h3>
        <p className="text-sm text-gray-600">Track payments for previous months (separate from current month billing)</p>
      </div>
      <AccountsReceivable
        clinicId={clinicId}
        canEdit={canEdit}
        showMonthlySubcategories={true}
      />
    </div>
  );

  const renderMonthlyAccountsReceivable = () => (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Monthly A/R Subcategories</h3>
        <p className="text-sm text-gray-600">Track payments by service month - payments received in {months[selectedMonth - 1]} for previous months</p>
      </div>
      <MonthlyAccountsReceivable
        clinicId={clinicId}
        canEdit={canEdit}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header (calendar removed for provider view) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Enhanced Billing Interface</h2>
            <p className="text-gray-600">Comprehensive billing management with split-screen functionality</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'single' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            {renderBillingInterface()}
          </div>
          {/* A/R Section - Separate from current month billing */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Accounts Receivable</h3>
              <p className="text-sm text-gray-600">Track payments for previous months (separate from current month billing)</p>
            </div>
            <div className="p-6">
              <AccountsReceivable
                clinicId={clinicId}
                canEdit={canEdit}
                showMonthlySubcategories={true}
              />
            </div>
          </div>
          
          {/* Monthly A/R Subcategories - Track by service month */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Monthly A/R Subcategories</h3>
              <p className="text-sm text-gray-600">Track payments by service month - payments received in {months[selectedMonth - 1]} for previous months</p>
            </div>
            <div className="p-6">
              <MonthlyAccountsReceivable
                clinicId={clinicId}
                canEdit={canEdit}
                currentMonth={selectedMonth}
                currentYear={selectedYear}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Always Billing */}
          <div className="bg-white rounded-lg shadow">
            {renderBillingInterface()}
          </div>

          {/* Right Panel - Mirror side with To-Do and A/R only */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setActivePanel('todo')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    activePanel === 'todo'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <AlertCircle size={16} />
                  <span>Billing To-Do</span>
                </button>
                <button
                  onClick={() => setActivePanel('ar')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    activePanel === 'ar'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <DollarSign size={16} />
                  <span>A/R</span>
                </button>
                <div className="ml-auto">
                  <button
                    onClick={() => setViewMode('single')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                    title="Exit Split View"
                  >
                    <EyeOff size={16} />
                    <span>Exit Split</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {activePanel === 'todo' && renderTodoSystem()}
              {activePanel === 'ar' && renderAccountsReceivable()}
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
