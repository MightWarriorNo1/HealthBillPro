import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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

interface DataContextType {
  clinics: Clinic[];
  providers: Provider[];
  billingEntries: BillingEntry[];
  claimIssues: ClaimIssue[];
  timecardEntries: TimecardEntry[];
  invoices: Invoice[];
  addBillingEntry: (entry: Omit<BillingEntry, 'id'>) => void;
  updateBillingEntry: (id: string, entry: Partial<BillingEntry>) => void;
  addClaimIssue: (issue: Omit<ClaimIssue, 'id'>) => void;
  updateClaimIssue: (id: string, issue: Partial<ClaimIssue>) => void;
  addTimecardEntry: (entry: Omit<TimecardEntry, 'id'>) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  addClinic: (clinic: Omit<Clinic, 'id'>) => void;
  addProvider: (provider: Omit<Provider, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);


export function DataProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [claimIssues, setClaimIssues] = useState<ClaimIssue[]>([]);
  const [timecardEntries, setTimecardEntries] = useState<TimecardEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load data from Supabase
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load clinics
      const { data: clinicsData } = await supabase
        .from('clinics')
        .select('*')
        .order('name');
      
      console.log("DATA, clinics", clinicsData);
      
      if (clinicsData) {
        const mappedClinics = clinicsData.map(clinic => ({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          active: clinic.active
        }));
        setClinics(mappedClinics);
      }

      // Load providers
      const { data: providersData } = await supabase
        .from('providers')
        .select('*')
        .order('name');
      
      if (providersData) {
        const mappedProviders = providersData.map(provider => ({
          id: provider.id,
          name: provider.name,
          email: provider.email,
          clinicId: provider.clinic_id,
          active: provider.active
        }));
        setProviders(mappedProviders);
      }

      // Load billing entries
      const { data: billingData } = await supabase
        .from('billing_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (billingData) {
        const mappedBilling = billingData.map(entry => ({
          id: entry.id,
          providerId: entry.provider_id,
          clinicId: entry.clinic_id,
          date: entry.date,
          patientName: entry.patient_name,
          procedureCode: entry.procedure_code,
          description: entry.description,
          amount: entry.amount,
          status: entry.status as 'pending' | 'approved' | 'paid' | 'rejected',
          claimNumber: entry.claim_number,
          notes: entry.notes
        }));
        setBillingEntries(mappedBilling);
      }

      // Load claim issues
      const { data: issuesData } = await supabase
        .from('claim_issues')
        .select('*')
        .order('created_date', { ascending: false });
      
      if (issuesData) {
        const mappedIssues = issuesData.map(issue => ({
          id: issue.id,
          clinicId: issue.clinic_id,
          providerId: issue.provider_id,
          claimNumber: issue.claim_number,
          description: issue.description,
          priority: issue.priority as 'low' | 'medium' | 'high',
          status: issue.status as 'open' | 'in_progress' | 'resolved',
          assignedTo: issue.assigned_to,
          dueDate: issue.due_date,
          createdDate: issue.created_date
        }));
        setClaimIssues(mappedIssues);
      }

      // Load timecard entries
      const { data: timecardData } = await supabase
        .from('timecard_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (timecardData) {
        const mappedTimecard = timecardData.map(entry => ({
          id: entry.id,
          employeeId: entry.employee_id,
          clinicId: entry.clinic_id,
          date: entry.date,
          hoursWorked: entry.hours_worked,
          hourlyRate: entry.hourly_rate,
          description: entry.description
        }));
        setTimecardEntries(mappedTimecard);
      }

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });
      
      if (invoicesData) {
        const mappedInvoices = invoicesData.map(invoice => ({
          id: invoice.id,
          clinicId: invoice.clinic_id,
          invoiceNumber: invoice.invoice_number,
          date: invoice.date,
          dueDate: invoice.due_date,
          amount: invoice.amount,
          status: invoice.status as 'draft' | 'sent' | 'paid' | 'overdue',
          items: invoice.items
        }));
        setInvoices(mappedInvoices);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addBillingEntry = (entry: Omit<BillingEntry, 'id'>) => {
    const addEntry = async () => {
      try {
        const { data, error } = await supabase
          .from('billing_entries')
          .insert({
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
          })
          .select();

        if (error) {
          console.error('Error adding billing entry:', error);
          return;
        }

        if (data && data.length > 0) {
          const newEntry = {
            id: data[0].id,
            providerId: data[0].provider_id,
            clinicId: data[0].clinic_id,
            date: data[0].date,
            patientName: data[0].patient_name,
            procedureCode: data[0].procedure_code,
            description: data[0].description,
            amount: data[0].amount,
            status: data[0].status as 'pending' | 'approved' | 'paid' | 'rejected',
            claimNumber: data[0].claim_number,
            notes: data[0].notes
          };
          setBillingEntries(prev => [newEntry, ...prev]);
        }
      } catch (error) {
        console.error('Error adding billing entry:', error);
      }
    };
    addEntry();
  };

  const updateBillingEntry = (id: string, entry: Partial<BillingEntry>) => {
    const updateEntry = async () => {
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

        const { error } = await supabase
          .from('billing_entries')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error updating billing entry:', error);
          return;
        }

        setBillingEntries(prev => prev.map(e => e.id === id ? { ...e, ...entry } : e));
      } catch (error) {
        console.error('Error updating billing entry:', error);
      }
    };
    updateEntry();
  };

  const addClaimIssue = (issue: Omit<ClaimIssue, 'id'>) => {
    const addIssue = async () => {
      try {
        const { data, error } = await supabase
          .from('claim_issues')
          .insert({
            clinic_id: issue.clinicId,
            provider_id: issue.providerId,
            claim_number: issue.claimNumber,
            description: issue.description,
            priority: issue.priority,
            status: issue.status,
            assigned_to: issue.assignedTo,
            due_date: issue.dueDate,
            created_date: issue.createdDate
          })
          .select();

        if (error) {
          console.error('Error adding claim issue:', error);
          return;
        }

        if (data && data.length > 0) {
          const newIssue = {
            id: data[0].id,
            clinicId: data[0].clinic_id,
            providerId: data[0].provider_id,
            claimNumber: data[0].claim_number,
            description: data[0].description,
            priority: data[0].priority as 'low' | 'medium' | 'high',
            status: data[0].status as 'open' | 'in_progress' | 'resolved',
            assignedTo: data[0].assigned_to,
            dueDate: data[0].due_date,
            createdDate: data[0].created_date
          };
          setClaimIssues(prev => [newIssue, ...prev]);
        }
      } catch (error) {
        console.error('Error adding claim issue:', error);
      }
    };
    addIssue();
  };

  const updateClaimIssue = (id: string, issue: Partial<ClaimIssue>) => {
    const updateIssue = async () => {
      try {
        const updateData: any = {};
        if (issue.clinicId) updateData.clinic_id = issue.clinicId;
        if (issue.providerId) updateData.provider_id = issue.providerId;
        if (issue.claimNumber) updateData.claim_number = issue.claimNumber;
        if (issue.description) updateData.description = issue.description;
        if (issue.priority) updateData.priority = issue.priority;
        if (issue.status) updateData.status = issue.status;
        if (issue.assignedTo !== undefined) updateData.assigned_to = issue.assignedTo;
        if (issue.dueDate) updateData.due_date = issue.dueDate;

        const { error } = await supabase
          .from('claim_issues')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error updating claim issue:', error);
          return;
        }

        setClaimIssues(prev => prev.map(i => i.id === id ? { ...i, ...issue } : i));
      } catch (error) {
        console.error('Error updating claim issue:', error);
      }
    };
    updateIssue();
  };

  const addTimecardEntry = (entry: Omit<TimecardEntry, 'id'>) => {
    const addEntry = async () => {
      try {
        const { data, error } = await supabase
          .from('timecard_entries')
          .insert({
            employee_id: entry.employeeId,
            clinic_id: entry.clinicId,
            date: entry.date,
            hours_worked: entry.hoursWorked,
            hourly_rate: entry.hourlyRate,
            description: entry.description
          })
          .select();

        if (error) {
          console.error('Error adding timecard entry:', error);
          return;
        }

        if (data && data.length > 0) {
          const newEntry = {
            id: data[0].id,
            employeeId: data[0].employee_id,
            clinicId: data[0].clinic_id,
            date: data[0].date,
            hoursWorked: data[0].hours_worked,
            hourlyRate: data[0].hourly_rate,
            description: data[0].description
          };
          setTimecardEntries(prev => [newEntry, ...prev]);
        }
      } catch (error) {
        console.error('Error adding timecard entry:', error);
      }
    };
    addEntry();
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const addInv = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .insert({
            clinic_id: invoice.clinicId,
            invoice_number: invoice.invoiceNumber,
            date: invoice.date,
            due_date: invoice.dueDate,
            amount: invoice.amount,
            status: invoice.status,
            items: invoice.items
          })
          .select();

        if (error) {
          console.error('Error adding invoice:', error);
          return;
        }

        if (data && data.length > 0) {
          const newInvoice = {
            id: data[0].id,
            clinicId: data[0].clinic_id,
            invoiceNumber: data[0].invoice_number,
            date: data[0].date,
            dueDate: data[0].due_date,
            amount: data[0].amount,
            status: data[0].status as 'draft' | 'sent' | 'paid' | 'overdue',
            items: data[0].items
          };
          setInvoices(prev => [newInvoice, ...prev]);
        }
      } catch (error) {
        console.error('Error adding invoice:', error);
      }
    };
    addInv();
  };

  const updateInvoice = (id: string, invoice: Partial<Invoice>) => {
    const updateInv = async () => {
      try {
        const updateData: any = {};
        if (invoice.clinicId) updateData.clinic_id = invoice.clinicId;
        if (invoice.invoiceNumber) updateData.invoice_number = invoice.invoiceNumber;
        if (invoice.date) updateData.date = invoice.date;
        if (invoice.dueDate) updateData.due_date = invoice.dueDate;
        if (invoice.amount !== undefined) updateData.amount = invoice.amount;
        if (invoice.status) updateData.status = invoice.status;
        if (invoice.items) updateData.items = invoice.items;

        const { error } = await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error updating invoice:', error);
          return;
        }

        setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));
      } catch (error) {
        console.error('Error updating invoice:', error);
      }
    };
    updateInv();
  };

  const addClinic = (clinic: Omit<Clinic, 'id'>) => {
    const addClin = async () => {
      try {
        const { data, error } = await supabase
          .from('clinics')
          .insert({
            name: clinic.name,
            address: clinic.address,
            phone: clinic.phone,
            active: clinic.active
          })
          .select();

        if (error) {
          console.error('Error adding clinic:', error);
          return;
        }

        if (data && data.length > 0) {
          const newClinic = {
            id: data[0].id,
            name: data[0].name,
            address: data[0].address,
            phone: data[0].phone,
            active: data[0].active
          };
          setClinics(prev => [...prev, newClinic]);
        }
      } catch (error) {
        console.error('Error adding clinic:', error);
      }
    };
    addClin();
  };

  const addProvider = (provider: Omit<Provider, 'id'>) => {
    const addProv = async () => {
      try {
        const { data, error } = await supabase
          .from('providers')
          .insert({
            name: provider.name,
            email: provider.email,
            clinic_id: provider.clinicId,
            active: provider.active
          })
          .select();

        if (error) {
          console.error('Error adding provider:', error);
          return;
        }

        if (data && data.length > 0) {
          const newProvider = {
            id: data[0].id,
            name: data[0].name,
            email: data[0].email,
            clinicId: data[0].clinic_id,
            active: data[0].active
          };
          setProviders(prev => [...prev, newProvider]);
        }
      } catch (error) {
        console.error('Error adding provider:', error);
      }
    };
    addProv();
  };

  return (
    <DataContext.Provider value={{
      clinics,
      providers,
      billingEntries,
      claimIssues,
      timecardEntries,
      invoices,
      addBillingEntry,
      updateBillingEntry,
      addClaimIssue,
      updateClaimIssue,
      addTimecardEntry,
      addInvoice,
      updateInvoice,
      addClinic,
      addProvider
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