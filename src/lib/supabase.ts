import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          phone: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          phone?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          name: string;
          email: string;
          clinic_id: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          clinic_id: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          clinic_id?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      billing_entries: {
        Row: {
          id: string;
          provider_id: string;
          clinic_id: string;
          date: string;
          patient_name: string;
          procedure_code: string;
          description: string;
          amount: number;
          status: 'pending' | 'approved' | 'paid' | 'rejected';
          claim_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          clinic_id: string;
          date: string;
          patient_name: string;
          procedure_code: string;
          description: string;
          amount: number;
          status?: 'pending' | 'approved' | 'paid' | 'rejected';
          claim_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          clinic_id?: string;
          date?: string;
          patient_name?: string;
          procedure_code?: string;
          description?: string;
          amount?: number;
          status?: 'pending' | 'approved' | 'paid' | 'rejected';
          claim_number?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      claim_issues: {
        Row: {
          id: string;
          clinic_id: string;
          provider_id: string;
          claim_number: string;
          description: string;
          priority: 'low' | 'medium' | 'high';
          status: 'open' | 'in_progress' | 'resolved';
          assigned_to: string | null;
          due_date: string;
          created_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          provider_id: string;
          claim_number: string;
          description: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'open' | 'in_progress' | 'resolved';
          assigned_to?: string | null;
          due_date: string;
          created_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          provider_id?: string;
          claim_number?: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'open' | 'in_progress' | 'resolved';
          assigned_to?: string | null;
          due_date?: string;
          updated_at?: string;
        };
      };
      timecard_entries: {
        Row: {
          id: string;
          employee_id: string;
          clinic_id: string;
          date: string;
          hours_worked: number;
          hourly_rate: number;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          clinic_id: string;
          date: string;
          hours_worked: number;
          hourly_rate: number;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          clinic_id?: string;
          date?: string;
          hours_worked?: number;
          hourly_rate?: number;
          description?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          clinic_id: string;
          invoice_number: string;
          date: string;
          due_date: string;
          amount: number;
          status: 'draft' | 'sent' | 'paid' | 'overdue';
          items: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          invoice_number: string;
          date: string;
          due_date: string;
          amount: number;
          status?: 'draft' | 'sent' | 'paid' | 'overdue';
          items: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          invoice_number?: string;
          date?: string;
          due_date?: string;
          amount?: number;
          status?: 'draft' | 'sent' | 'paid' | 'overdue';
          items?: any;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'provider' | 'office_staff' | 'admin' | 'billing_staff' | 'billing_viewer' | 'super_admin';
          clinic_id: string | null;
          provider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'provider' | 'office_staff' | 'admin' | 'billing_staff' | 'billing_viewer' | 'super_admin';
          clinic_id?: string | null;
          provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'provider' | 'office_staff' | 'admin' | 'billing_staff' | 'billing_viewer' | 'super_admin';
          clinic_id?: string | null;
          provider_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}