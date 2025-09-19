import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  clinicId: string;
  active: boolean;
}

export interface BillingEntry {
  id: string;
  providerId: string;
  clinicId: string;
  date: string;
  patientName: string;
  procedureCode: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  claimNumber?: string;
  notes?: string;
}

export interface ClaimIssue {
  id: string;
  clinicId: string;
  providerId: string;
  claimNumber: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo?: string;
  dueDate: string;
  createdDate: string;
}

export interface TimecardEntry {
  id: string;
  employeeId: string;
  clinicId: string;
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  description: string;
}

export interface Invoice {
  id: string;
  clinicId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  insurance: string;
  copay: number;
  coinsurance: number;
  clinicId: string;
}

export interface TodoItem {
  id: string;
  claimId: string;
  status: 'waiting' | 'in_progress' | 'ip' | 'completed' | 'on_hold';
  issue: string;
  notes?: string;
  fluNotes?: string;
  clinicId: string;
  createdBy: string;
  completedAt?: string;
}

export interface AccountsReceivable {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  type: 'Insurance' | 'Patient' | 'Clinic';
  notes?: string;
  description?: string;
  amountOwed: number;
  clinicId: string;
}

interface DataContextType {
  clinics: Clinic[];
  providers: Provider[];
  patients: Patient[];
  billingEntries: BillingEntry[];
  todoItems: TodoItem[];
  accountsReceivable: AccountsReceivable[];
  timecardEntries: TimecardEntry[];
  invoices: Invoice[];
  claimIssues: ClaimIssue[];
  loading: boolean;
  error: string | null;
  
  // Patients
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  
  // Billing entries
  addBillingEntry: (entry: Omit<BillingEntry, 'id'>) => Promise<void>;
  updateBillingEntry: (id: string, entry: Partial<BillingEntry>) => Promise<void>;
  deleteBillingEntry: (id: string) => Promise<void>;
  
  // Todo items
  addTodoItem: (item: Omit<TodoItem, 'id'>) => Promise<void>;
  updateTodoItem: (id: string, item: Partial<TodoItem>) => Promise<void>;
  deleteTodoItem: (id: string) => Promise<void>;
  
  // Accounts receivable
  addAccountsReceivable: (ar: Omit<AccountsReceivable, 'id'>) => Promise<void>;
  updateAccountsReceivable: (id: string, ar: Partial<AccountsReceivable>) => Promise<void>;
  deleteAccountsReceivable: (id: string) => Promise<void>;
  
  // Timecard entries
  addTimecardEntry: (entry: Omit<TimecardEntry, 'id'>) => Promise<void>;
  updateTimecardEntry: (id: string, entry: Partial<TimecardEntry>) => Promise<void>;
  deleteTimecardEntry: (id: string) => Promise<void>;
  
  // Refresh data
  refreshData: () => Promise<void>;
  refreshBillingEntries: (clinicId?: string, providerId?: string, month?: string) => Promise<void>;
  refreshTodoItems: (clinicId?: string) => Promise<void>;
  refreshAccountsReceivable: (clinicId?: string, month?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);


export function DataProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([]);
  const [timecardEntries, setTimecardEntries] = useState<TimecardEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claimIssues, setClaimIssues] = useState<ClaimIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        clinicsData,
        providersData,
        patientsData,
        billingData,
        todoData,
        arData,
        timecardData,
        invoicesData,
        issuesData
      ] = await Promise.all([
        dataService.getClinics(),
        dataService.getProviders(),
        dataService.getPatients(),
        dataService.getBillingEntries(),
        dataService.getTodoItems(),
        dataService.getAccountsReceivable(),
        dataService.getTimecardEntries(),
        dataService.getInvoices(),
        dataService.getClaimIssues()
      ]);

      // Map database data to context interfaces
      setClinics(clinicsData.map(clinic => ({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          active: clinic.active
      })));

      setProviders(providersData.map(provider => ({
          id: provider.id,
          name: provider.name,
          email: provider.email,
          clinicId: provider.clinic_id,
          active: provider.active
      })));

      setPatients(patientsData.map(patient => ({
        id: patient.id,
        patientId: patient.patient_id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        insurance: patient.insurance,
        copay: patient.copay,
        coinsurance: patient.coinsurance,
        clinicId: patient.clinic_id
      })));

      setBillingEntries(billingData.map(entry => ({
          id: entry.id,
          providerId: entry.provider_id,
          clinicId: entry.clinic_id,
          date: entry.date,
          patientName: entry.patient_name,
          procedureCode: entry.procedure_code,
          description: entry.description,
          amount: entry.amount,
        status: entry.status,
          claimNumber: entry.claim_number,
          notes: entry.notes
      })));

      setTodoItems(todoData.map(item => ({
        id: item.id,
        claimId: item.claim_id,
        status: item.status,
        issue: item.issue,
        notes: item.notes,
        fluNotes: item.flu_notes,
        clinicId: item.clinic_id,
        createdBy: item.created_by,
        completedAt: item.completed_at
      })));

      setAccountsReceivable(arData.map(ar => ({
        id: ar.id,
        patientId: ar.patient_id,
        date: ar.date,
        amount: ar.amount,
        type: ar.type,
        notes: ar.notes,
        description: ar.description,
        amountOwed: ar.amount_owed,
        clinicId: ar.clinic_id
      })));

      setTimecardEntries(timecardData.map(entry => ({
        id: entry.id,
        employeeId: entry.user_id,
        clinicId: '', // Not directly available in timecard_entries
        date: entry.date,
        hoursWorked: entry.total_hours,
        hourlyRate: entry.hourly_rate,
        description: entry.notes || ''
      })));

      setInvoices(invoicesData.map(invoice => ({
        id: invoice.id,
        clinicId: invoice.clinic_id,
        invoiceNumber: invoice.invoice_number,
        date: invoice.date,
        dueDate: invoice.due_date,
        amount: invoice.balance_due,
        status: invoice.status,
        items: [] // Would need separate query for invoice items
      })));

      setClaimIssues(issuesData.map(issue => ({
          id: issue.id,
          clinicId: issue.clinic_id,
          providerId: issue.provider_id,
          claimNumber: issue.claim_number,
          description: issue.description,
        priority: issue.priority,
        status: issue.status,
          assignedTo: issue.assigned_to,
          dueDate: issue.due_date,
          createdDate: issue.created_date
      })));

    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Patients
  const addPatient = async (patient: Omit<Patient, 'id'>) => {
    try {
      const dbPatient = await dataService.createPatient({
        patient_id: patient.patientId,
        first_name: patient.firstName,
        last_name: patient.lastName,
        insurance: patient.insurance,
        copay: patient.copay,
        coinsurance: patient.coinsurance,
        clinic_id: patient.clinicId
      });

      const newPatient: Patient = {
        id: dbPatient.id,
        patientId: dbPatient.patient_id,
        firstName: dbPatient.first_name,
        lastName: dbPatient.last_name,
        insurance: dbPatient.insurance,
        copay: dbPatient.copay,
        coinsurance: dbPatient.coinsurance,
        clinicId: dbPatient.clinic_id
      };

      setPatients(prev => [newPatient, ...prev]);
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };

  const updatePatient = async (id: string, patient: Partial<Patient>) => {
    try {
      const updateData: any = {};
      if (patient.patientId) updateData.patient_id = patient.patientId;
      if (patient.firstName) updateData.first_name = patient.firstName;
      if (patient.lastName) updateData.last_name = patient.lastName;
      if (patient.insurance) updateData.insurance = patient.insurance;
      if (patient.copay !== undefined) updateData.copay = patient.copay;
      if (patient.coinsurance !== undefined) updateData.coinsurance = patient.coinsurance;
      if (patient.clinicId) updateData.clinic_id = patient.clinicId;

      await dataService.updatePatient(id, updateData);
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patient } : p));
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await dataService.deletePatient(id);
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  };

  // Billing entries
  const addBillingEntry = async (entry: Omit<BillingEntry, 'id'>) => {
    try {
      const dbEntry = await dataService.createBillingEntry({
            provider_id: entry.providerId,
            clinic_id: entry.clinicId,
            date: entry.date,
            patient_name: entry.patientName,
            procedure_code: entry.procedureCode,
            description: entry.description,
            amount: entry.amount,
            status: entry.status,
            claim_number: entry.claimNumber,
            notes: entry.notes
      });

      const newEntry: BillingEntry = {
        id: dbEntry.id,
        providerId: dbEntry.provider_id,
        clinicId: dbEntry.clinic_id,
        date: dbEntry.date,
        patientName: dbEntry.patient_name,
        procedureCode: dbEntry.procedure_code,
        description: dbEntry.description,
        amount: dbEntry.amount,
        status: dbEntry.status,
        claimNumber: dbEntry.claim_number,
        notes: dbEntry.notes
      };

          setBillingEntries(prev => [newEntry, ...prev]);
      } catch (error) {
        console.error('Error adding billing entry:', error);
      throw error;
      }
  };

  const updateBillingEntry = async (id: string, entry: Partial<BillingEntry>) => {
      try {
        const updateData: any = {};
        if (entry.providerId) updateData.provider_id = entry.providerId;
        if (entry.clinicId) updateData.clinic_id = entry.clinicId;
        if (entry.date) updateData.date = entry.date;
        if (entry.patientName) updateData.patient_name = entry.patientName;
        if (entry.procedureCode) updateData.procedure_code = entry.procedureCode;
        if (entry.description) updateData.description = entry.description;
        if (entry.amount !== undefined) updateData.amount = entry.amount;
        if (entry.status) updateData.status = entry.status;
        if (entry.claimNumber !== undefined) updateData.claim_number = entry.claimNumber;
        if (entry.notes !== undefined) updateData.notes = entry.notes;

      await dataService.updateBillingEntry(id, updateData);
        setBillingEntries(prev => prev.map(e => e.id === id ? { ...e, ...entry } : e));
      } catch (error) {
        console.error('Error updating billing entry:', error);
      throw error;
    }
  };

  const deleteBillingEntry = async (id: string) => {
    try {
      await dataService.deleteBillingEntry(id);
      setBillingEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting billing entry:', error);
      throw error;
    }
  };

  // Todo items
  const addTodoItem = async (item: Omit<TodoItem, 'id'>) => {
    try {
      const dbItem = await dataService.createTodoItem({
        claim_id: item.claimId,
        status: item.status,
        issue: item.issue,
        notes: item.notes,
        flu_notes: item.fluNotes,
        clinic_id: item.clinicId,
        created_by: item.createdBy,
        completed_at: item.completedAt
      });

      const newItem: TodoItem = {
        id: dbItem.id,
        claimId: dbItem.claim_id,
        status: dbItem.status,
        issue: dbItem.issue,
        notes: dbItem.notes,
        fluNotes: dbItem.flu_notes,
        clinicId: dbItem.clinic_id,
        createdBy: dbItem.created_by,
        completedAt: dbItem.completed_at
      };

      setTodoItems(prev => [newItem, ...prev]);
      } catch (error) {
      console.error('Error adding todo item:', error);
      throw error;
      }
  };

  const updateTodoItem = async (id: string, item: Partial<TodoItem>) => {
      try {
        const updateData: any = {};
      if (item.claimId) updateData.claim_id = item.claimId;
      if (item.status) updateData.status = item.status;
      if (item.issue) updateData.issue = item.issue;
      if (item.notes !== undefined) updateData.notes = item.notes;
      if (item.fluNotes !== undefined) updateData.flu_notes = item.fluNotes;
      if (item.clinicId) updateData.clinic_id = item.clinicId;
      if (item.createdBy) updateData.created_by = item.createdBy;
      if (item.completedAt !== undefined) updateData.completed_at = item.completedAt;

      await dataService.updateTodoItem(id, updateData);
      setTodoItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
      } catch (error) {
      console.error('Error updating todo item:', error);
      throw error;
    }
  };

  const deleteTodoItem = async (id: string) => {
    try {
      await dataService.deleteTodoItem(id);
      setTodoItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting todo item:', error);
      throw error;
    }
  };

  // Accounts receivable
  const addAccountsReceivable = async (ar: Omit<AccountsReceivable, 'id'>) => {
    try {
      // This would need to be implemented in dataService
      console.log('Add accounts receivable:', ar);
    } catch (error) {
      console.error('Error adding accounts receivable:', error);
      throw error;
    }
  };

  const updateAccountsReceivable = async (id: string, ar: Partial<AccountsReceivable>) => {
    try {
      // This would need to be implemented in dataService
      console.log('Update accounts receivable:', id, ar);
      } catch (error) {
      console.error('Error updating accounts receivable:', error);
      throw error;
    }
  };

  const deleteAccountsReceivable = async (id: string) => {
    try {
      // This would need to be implemented in dataService
      console.log('Delete accounts receivable:', id);
    } catch (error) {
      console.error('Error deleting accounts receivable:', error);
      throw error;
    }
  };

  // Timecard entries
  const addTimecardEntry = async (entry: Omit<TimecardEntry, 'id'>) => {
    try {
      const dbEntry = await dataService.createTimecardEntry({
        user_id: entry.employeeId,
        clock_in: new Date().toISOString(),
        clock_out: undefined,
        break_start: undefined,
        break_end: undefined,
        total_hours: entry.hoursWorked,
        hourly_rate: entry.hourlyRate,
        total_pay: entry.hoursWorked * entry.hourlyRate,
        notes: entry.description,
        date: entry.date
      });

      const newEntry: TimecardEntry = {
        id: dbEntry.id,
        employeeId: dbEntry.user_id,
        clinicId: entry.clinicId,
        date: dbEntry.date,
        hoursWorked: dbEntry.total_hours,
        hourlyRate: dbEntry.hourly_rate,
        description: dbEntry.notes || ''
      };

      setTimecardEntries(prev => [newEntry, ...prev]);
      } catch (error) {
      console.error('Error adding timecard entry:', error);
      throw error;
      }
  };

  const updateTimecardEntry = async (id: string, entry: Partial<TimecardEntry>) => {
      try {
        const updateData: any = {};
      if (entry.employeeId) updateData.user_id = entry.employeeId;
      if (entry.hoursWorked !== undefined) updateData.total_hours = entry.hoursWorked;
      if (entry.hourlyRate !== undefined) updateData.hourly_rate = entry.hourlyRate;
      if (entry.description !== undefined) updateData.notes = entry.description;
      if (entry.date) updateData.date = entry.date;

      await dataService.updateTimecardEntry(id, updateData);
      setTimecardEntries(prev => prev.map(e => e.id === id ? { ...e, ...entry } : e));
      } catch (error) {
      console.error('Error updating timecard entry:', error);
      throw error;
    }
  };

  const deleteTimecardEntry = async (id: string) => {
    try {
      await dataService.deleteTimecardEntry(id);
      setTimecardEntries(prev => prev.filter(e => e.id !== id));
      } catch (error) {
      console.error('Error deleting timecard entry:', error);
      throw error;
    }
  };

  // Refresh functions
  const refreshData = async () => {
    await loadData();
  };

  const refreshBillingEntries = useCallback(async (clinicId?: string, providerId?: string, month?: string) => {
    try {
      const data = await dataService.getBillingEntriesByMonth(clinicId, providerId, month);
      setBillingEntries(data.map(entry => ({
        id: entry.id,
        providerId: entry.provider_id,
        clinicId: entry.clinic_id,
        date: entry.date,
        patientName: entry.patient_name,
        procedureCode: entry.procedure_code,
        description: entry.description,
        amount: entry.amount,
        status: entry.status,
        claimNumber: entry.claim_number,
        notes: entry.notes
      })));
    } catch (error) {
      console.error('Error refreshing billing entries:', error);
    }
  }, []);

  const refreshTodoItems = useCallback(async (clinicId?: string) => {
    try {
      const data = clinicId ? await dataService.getTodoItemsByClinic(clinicId) : await dataService.getTodoItems();
      setTodoItems(data.map(item => ({
        id: item.id,
        claimId: item.claim_id,
        status: item.status,
        issue: item.issue,
        notes: item.notes,
        fluNotes: item.flu_notes,
        clinicId: item.clinic_id,
        createdBy: item.created_by,
        completedAt: item.completed_at
      })));
      } catch (error) {
      console.error('Error refreshing todo items:', error);
    }
  }, []);

  const refreshAccountsReceivable = useCallback(async (clinicId?: string, month?: string) => {
    try {
      const data = await dataService.getAccountsReceivableByMonth(clinicId, month);
      setAccountsReceivable(data.map(ar => ({
        id: ar.id,
        patientId: ar.patient_id,
        date: ar.date,
        amount: ar.amount,
        type: ar.type,
        notes: ar.notes,
        description: ar.description,
        amountOwed: ar.amount_owed,
        clinicId: ar.clinic_id
      })));
    } catch (error) {
      console.error('Error refreshing accounts receivable:', error);
    }
  }, []);

  return (
    <DataContext.Provider value={{
      clinics,
      providers,
      patients,
      billingEntries,
      todoItems,
      accountsReceivable,
      timecardEntries,
      invoices,
      claimIssues,
      loading,
      error,
      addPatient,
      updatePatient,
      deletePatient,
      addBillingEntry,
      updateBillingEntry,
      deleteBillingEntry,
      addTodoItem,
      updateTodoItem,
      deleteTodoItem,
      addAccountsReceivable,
      updateAccountsReceivable,
      deleteAccountsReceivable,
      addTimecardEntry,
      updateTimecardEntry,
      deleteTimecardEntry,
      refreshData,
      refreshBillingEntries,
      refreshTodoItems,
      refreshAccountsReceivable
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}