import { supabase } from '../lib/supabase';

export interface DatabaseClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProvider {
  id: string;
  name: string;
  email: string;
  clinic_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabasePatient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  insurance: string;
  copay: number;
  coinsurance: number;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBillingEntry {
  id: string;
  provider_id: string;
  clinic_id: string;
  date: string;
  patient_name: string;
  procedure_code: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  claim_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTodoItem {
  id: string;
  claim_id: string;
  status: 'waiting' | 'in_progress' | 'ip' | 'completed' | 'on_hold';
  issue: string;
  notes?: string;
  flu_notes?: string;
  clinic_id: string;
  created_by: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAccountsReceivable {
  id: string;
  patient_id: string;
  date: string;
  amount: number;
  type: 'Insurance' | 'Patient' | 'Clinic';
  notes?: string;
  description?: string;
  amount_owed: number;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTimecardEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  hourly_rate: number;
  total_pay: number;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInvoice {
  id: string;
  invoice_number: string;
  clinic_id: string;
  clinic_name: string;
  date: string;
  due_date: string;
  billing_period: string;
  total_insurance_payments: number;
  billing_fee_percentage: number;
  billing_fee_amount: number;
  total_copays_coinsurance: number;
  net_insurance_payments: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseClaimIssue {
  id: string;
  clinic_id: string;
  provider_id: string;
  claim_number: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  assigned_to?: string;
  due_date: string;
  created_date: string;
  updated_at: string;
}

class DataService {
  // Clinics
  async getClinics(): Promise<DatabaseClinic[]> {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getClinicById(id: string): Promise<DatabaseClinic | null> {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Providers
  async getProviders(): Promise<DatabaseProvider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getProvidersByClinic(clinicId: string): Promise<DatabaseProvider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getProviderById(id: string): Promise<DatabaseProvider | null> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Patients
  async getPatients(): Promise<DatabasePatient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('last_name, first_name');
    
    if (error) throw error;
    return data || [];
  }

  async getPatientsByClinic(clinicId: string): Promise<DatabasePatient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('last_name, first_name');
    
    if (error) throw error;
    return data || [];
  }

  async getPatientById(id: string): Promise<DatabasePatient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createPatient(patient: Omit<DatabasePatient, 'id' | 'created_at' | 'updated_at'>): Promise<DatabasePatient> {
    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updatePatient(id: string, updates: Partial<DatabasePatient>): Promise<DatabasePatient> {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deletePatient(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Billing Entries
  async getBillingEntries(): Promise<DatabaseBillingEntry[]> {
    const { data, error } = await supabase
      .from('billing_entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getBillingEntriesByClinic(clinicId: string): Promise<DatabaseBillingEntry[]> {
    const { data, error } = await supabase
      .from('billing_entries')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getBillingEntriesByProvider(providerId: string): Promise<DatabaseBillingEntry[]> {
    const { data, error } = await supabase
      .from('billing_entries')
      .select('*')
      .eq('provider_id', providerId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getBillingEntriesByMonth(clinicId?: string, providerId?: string, month?: string): Promise<DatabaseBillingEntry[]> {
    let query = supabase
      .from('billing_entries')
      .select('*');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    if (month) {
      const [monthName, year] = month.split(' ');
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      const startDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${monthNumber.toString().padStart(2, '0')}-31`;
      
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createBillingEntry(entry: Omit<DatabaseBillingEntry, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseBillingEntry> {
    const { data, error } = await supabase
      .from('billing_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBillingEntry(id: string, updates: Partial<DatabaseBillingEntry>): Promise<DatabaseBillingEntry> {
    const { data, error } = await supabase
      .from('billing_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteBillingEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('billing_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Todo Items
  async getTodoItems(): Promise<DatabaseTodoItem[]> {
    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getTodoItemsByClinic(clinicId: string): Promise<DatabaseTodoItem[]> {
    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createTodoItem(item: Omit<DatabaseTodoItem, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseTodoItem> {
    const { data, error } = await supabase
      .from('todo_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTodoItem(id: string, updates: Partial<DatabaseTodoItem>): Promise<DatabaseTodoItem> {
    const { data, error } = await supabase
      .from('todo_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTodoItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Accounts Receivable
  async getAccountsReceivable(): Promise<DatabaseAccountsReceivable[]> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getAccountsReceivableByClinic(clinicId: string): Promise<DatabaseAccountsReceivable[]> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getAccountsReceivableByMonth(clinicId?: string, month?: string): Promise<DatabaseAccountsReceivable[]> {
    let query = supabase
      .from('accounts_receivable')
      .select('*');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    if (month) {
      const [monthName, year] = month.split(' ');
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      const startDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${monthNumber.toString().padStart(2, '0')}-31`;
      
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Timecard Entries
  async getTimecardEntries(): Promise<DatabaseTimecardEntry[]> {
    const { data, error } = await supabase
      .from('timecard_entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getTimecardEntriesByUser(userId: string): Promise<DatabaseTimecardEntry[]> {
    const { data, error } = await supabase
      .from('timecard_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createTimecardEntry(entry: Omit<DatabaseTimecardEntry, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseTimecardEntry> {
    const { data, error } = await supabase
      .from('timecard_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTimecardEntry(id: string, updates: Partial<DatabaseTimecardEntry>): Promise<DatabaseTimecardEntry> {
    const { data, error } = await supabase
      .from('timecard_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTimecardEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('timecard_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Invoices
  async getInvoices(): Promise<DatabaseInvoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getInvoicesByClinic(clinicId: string): Promise<DatabaseInvoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Claim Issues
  async getClaimIssues(): Promise<DatabaseClaimIssue[]> {
    const { data, error } = await supabase
      .from('claim_issues')
      .select('*')
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getClaimIssuesByClinic(clinicId: string): Promise<DatabaseClaimIssue[]> {
    const { data, error } = await supabase
      .from('claim_issues')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Statistics
  async getDashboardStats(clinicId?: string, providerId?: string) {
    const [
      clinics,
      providers,
      patients,
      billingEntries,
      todoItems,
      accountsReceivable
    ] = await Promise.all([
      this.getClinics(),
      clinicId ? this.getProvidersByClinic(clinicId) : this.getProviders(),
      clinicId ? this.getPatientsByClinic(clinicId) : this.getPatients(),
      clinicId ? this.getBillingEntriesByClinic(clinicId) : this.getBillingEntries(),
      clinicId ? this.getTodoItemsByClinic(clinicId) : this.getTodoItems(),
      clinicId ? this.getAccountsReceivableByClinic(clinicId) : this.getAccountsReceivable()
    ]);

    const totalRevenue = billingEntries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const pendingClaims = billingEntries.filter(entry => entry.status === 'pending').length;
    const completedTodos = todoItems.filter(item => item.status === 'completed').length;
    const pendingTodos = todoItems.filter(item => item.status === 'waiting').length;

    const totalAccountsReceivable = accountsReceivable.reduce((sum, ar) => sum + ar.amount_owed, 0);

    return {
      totalClinics: clinics.length,
      totalProviders: providers.length,
      totalPatients: patients.length,
      totalRevenue,
      pendingClaims,
      completedTodos,
      pendingTodos,
      totalAccountsReceivable
    };
  }
}

export const dataService = new DataService();

