import { useState, useEffect } from 'react';
import { 
  Eye, EyeOff,
  DollarSign, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BillingGrid from './BillingGrid';
import PatientDatabase from './PatientDatabase';
import TodoSystem from './TodoSystem';
import AccountsReceivable from './AccountsReceivable';
import MonthlyAccountsReceivable from './MonthlyAccountsReceivable';

interface EnhancedBillingInterfaceProps {
  providerId?: string;
  clinicId?: string;
  canEdit?: boolean;
  hideAccountsReceivable?: boolean;
  // Optional: lock specific columns from editing; users can still highlight
  lockedColumns?: string[];
}

function EnhancedBillingInterface({ 
  providerId, 
  clinicId, 
  canEdit = true, 
  hideAccountsReceivable = false,
  lockedColumns
}: EnhancedBillingInterfaceProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'single' | 'split'>('single');
  const [activePanel, setActivePanel] = useState<'billing' | 'patients' | 'todo' | 'ar' | 'monthly-ar'>('todo');
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [showProviderPayment, setShowProviderPayment] = useState(false);
  const [isComputingTotals, setIsComputingTotals] = useState(false);
  const [totals, setTotals] = useState<{ ins: number; pt: number; ar: number }>({ ins: 0, pt: 0, ar: 0 });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  // Define all known editable column ids in BillingGrid, used to lock everything by default when !canEdit
  const ALL_BILLING_COLUMNS = [
    'id','patient_name','last_initial','insurance','copay','coinsurance','date','procedure_code',
    'appointment_status','status','submit_info','insurance_payment','insurance_notes','description',
    'payment_amount','payment_status','claim_number','amount','notes'
  ];
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

  // Load persisted highlight color on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('billing.highlightColor');
      if (saved) setHighlightColor(saved);
    } catch {}
  }, []);

  // Persist highlight color when changed
  useEffect(() => {
    try {
      if (highlightColor) {
        localStorage.setItem('billing.highlightColor', highlightColor);
      } else {
        localStorage.removeItem('billing.highlightColor');
      }
    } catch {}
  }, [highlightColor]);

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

  const computeProviderPaymentTotals = async () => {
    if (!clinicId) { setTotals({ ins: 0, pt: 0, ar: 0 }); return; }
    setIsComputingTotals(true);
    try {
      const { start, end } = computeSelectedMonthDateRange(selectedYear, selectedMonth);
      // Insurance and Patient payments from billing entries in current month
      // Select all fields to be compatible with legacy schemas (e.g., collected_from_pt vs payment_amount)
      const { data: be, error: beErr } = await supabase
        .from('billing_entries')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('date', start)
        .lte('date', end);
      if (beErr) throw beErr;
      const ins = (be || []).reduce((s: number, r: any) => s + (Number(r.insurance_payment) || 0), 0);
      const pt = (be || []).reduce((s: number, r: any) => s + (Number((r as any).payment_amount ?? (r as any).collected_from_pt) || 0), 0);

      // A/R total for payments received in current month (using ins_pay_date as proxy)
      const { data: ar, error: arErr } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('clinic_id', clinicId);
      if (arErr) throw arErr;
      const arInRange = (ar || []).filter((r: any) => {
        const dStr = (r as any).ins_pay_date || (r as any).pt_payment_ar_ref_date || (r as any).date || (r as any).created_at;
        if (!dStr) return false;
        const d = new Date(dStr);
        const ds = new Date(start);
        const de = new Date(end);
        if (isNaN(d.getTime())) return false;
        return d >= ds && d <= de;
      });
      const arTotal = arInRange.reduce((s: number, r: any) => {
        const total = (r as any).total_pay;
        const ins = Number((r as any).ins_pay) || 0;
        const pt = Number((r as any).collected_from_pt) || 0;
        const computed = Number(total ?? (ins + pt)) || 0;
        return s + computed;
      }, 0);

      setTotals({ ins, pt, ar: arTotal });
    } finally {
      setIsComputingTotals(false);
    }
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
            <label className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-50 border text-xs text-gray-700" title="Change month highlight color">
              <span>Highlight</span>
              <input
                type="color"
                value={highlightColor || '#7C3AED'}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
              />
            </label>
          <button
            onClick={async () => { await computeProviderPaymentTotals(); setShowProviderPayment(true); }}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-white hover:shadow text-gray-800"
            title="Create Provider Payment from current month totals"
          >
            <div className="p-1.5 rounded bg-green-100">
              <DollarSign size={16} className="text-green-600" />
            </div>
            <span>Provider Payment</span>
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
                  backgroundColor: isActive ? (highlightColor || color) : '#ffffff',
                  borderColor: isActive && highlightColor ? highlightColor : color,
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
        highlightOnly={!canEdit}
        lockedColumns={lockedColumns && lockedColumns.length > 0 ? lockedColumns : (!canEdit ? ALL_BILLING_COLUMNS : [])}
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

      {/* Main Content Area */}
      {viewMode === 'single' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            {renderBillingInterface()}
          </div>
          {!hideAccountsReceivable && (
            <>
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
            </>
          )}
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

      {/* Provider Payment Modal */}
      {showProviderPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Provider Payment - {months[selectedMonth - 1]} {selectedYear}</h3>
              <button
                onClick={() => setShowProviderPayment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeOff size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded border">
                  <div className="text-sm text-gray-700 flex items-center justify-between">
                    <span>Insurance Payments</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (highlightColor || getMonthColor(selectedMonth - 1)) + '20', color: '#111' }}>{months[selectedMonth - 1]}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">${totals.ins.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded border">
                  <div className="text-sm text-gray-700 flex items-center justify-between">
                    <span>Patient Payments</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (highlightColor || getMonthColor(selectedMonth - 1)) + '20', color: '#111' }}>{months[selectedMonth - 1]}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">${totals.pt.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded border">
                  <div className="text-sm text-gray-700 flex items-center justify-between">
                    <span>Current Month A/R</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (highlightColor || getMonthColor(selectedMonth - 1)) + '20', color: '#111' }}>{months[selectedMonth - 1]}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">${totals.ar.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Totals are auto-calculated for the selected month and clinic.</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowProviderPayment(false)}>Cancel</button>
              <button
                disabled={isComputingTotals}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                onClick={async () => {
                  try {
                    if (!clinicId) { setShowProviderPayment(false); return; }
                    const rows = [
                      { description: 'Insurance Payments', amount: totals.ins, notes: `${months[selectedMonth - 1]} ${selectedYear}`, clinic_id: clinicId },
                      { description: 'Client Payments', amount: totals.pt, notes: `${months[selectedMonth - 1]} ${selectedYear}`, clinic_id: clinicId },
                      { description: 'A/R from Previous Month', amount: totals.ar, notes: `${months[selectedMonth - 1]} ${selectedYear}`, clinic_id: clinicId },
                    ];
                    await supabase.from('provider_payments').insert(rows);
                  } finally {
                    setShowProviderPayment(false);
                  }
                }}
              >
                {isComputingTotals ? 'Calculating…' : 'Create Provider Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedBillingInterface;
