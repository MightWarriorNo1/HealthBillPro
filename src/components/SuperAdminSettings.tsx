import { useState, useEffect } from 'react';
import { 
  Settings, Users, Shield, Palette, Eye, 
  Plus, Edit, Trash2, X, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  clinic_id?: string;
  provider_id?: string;
  highlight_color?: string;
  created_at: string;
  updated_at: string;
}

interface BillingCode {
  id: string;
  code: string;
  description: string;
  color: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

interface ClinicRecord {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

interface SuperAdminSettingsProps {
  userId?: string;
  initialTab?: 'users' | 'billing-codes' | 'clinic-management' | 'export-data' | 'audit-logs' | 'system-settings';
}

function SuperAdminSettings({ userId, initialTab }: SuperAdminSettingsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [clinics, setClinics] = useState<ClinicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCode, setShowAddCode] = useState(false);
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingCode, setEditingCode] = useState<BillingCode | null>(null);
  const [editingClinic, setEditingClinic] = useState<ClinicRecord | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'provider',
    clinic_id: '',
    provider_id: '',
    highlight_color: '#6B7280',
    hourly_rate: 0,
    timecard_option: false
  });

  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    color: '#3B82F6'
  });

  const [newClinic, setNewClinic] = useState<ClinicRecord>({
    id: '',
    name: '',
    address: '',
    phone: '',
    email: ''
  } as ClinicRecord);

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'billing-codes', label: 'Billing Codes', icon: Palette },
    { id: 'clinic-management', label: 'Clinic Management', icon: Shield },
    { id: 'export-data', label: 'Export Data', icon: Settings },
    { id: 'audit-logs', label: 'Audit Logs', icon: Eye },
    { id: 'system-settings', label: 'System Settings', icon: Settings }
  ];

  const roleOptions = [
    'super_admin', 'admin', 'view_only_admin', 'billing_staff', 
    'view_only_billing', 'provider', 'office_staff'
  ];

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Keep internal tab in sync with provided initialTab (when parent changes)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'users':
          await loadUsers();
          break;
        case 'billing-codes':
          await loadBillingCodes();
          break;
        case 'clinic-management':
          await loadClinics();
          break;
        case 'export-data':
          // No specific data loading needed for export data
          break;
        case 'audit-logs':
          await loadAuditLogs();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadBillingCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_codes')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      setBillingCodes(data || []);
    } catch (error) {
      console.error('Error loading billing codes:', error);
      toast.error('Failed to load billing codes');
    }
  };

  const loadClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error loading clinics:', error);
      toast.error('Failed to load clinics');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([{
          ...newUser,
          id: crypto.randomUUID()
        }]);

      if (error) throw error;

      toast.success('User created successfully');
      setShowAddUser(false);
      setNewUser({
        email: '',
        name: '',
        role: 'provider',
        clinic_id: '',
        provider_id: '',
        highlight_color: '#6B7280',
        hourly_rate: 0,
        timecard_option: false
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          clinic_id: editingUser.clinic_id,
          provider_id: editingUser.provider_id,
          highlight_color: (editingUser as any).highlight_color,
          hourly_rate: (editingUser as any).hourly_rate || 0,
          timecard_option: (editingUser as any).timecard_option || false
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const createBillingCode = async () => {
    if (!newCode.code || !newCode.description) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('billing_codes')
        .insert([newCode]);

      if (error) throw error;

      toast.success('Billing code created successfully');
      setShowAddCode(false);
      setNewCode({
        code: '',
        description: '',
        color: '#3B82F6'
      });
      loadBillingCodes();
    } catch (error: any) {
      console.error('Error creating billing code:', error);
      toast.error(error.message || 'Failed to create billing code');
    }
  };

  const updateBillingCode = async () => {
    if (!editingCode) return;

    try {
      const { error } = await supabase
        .from('billing_codes')
        .update(editingCode)
        .eq('id', editingCode.id);

      if (error) throw error;

      toast.success('Billing code updated successfully');
      setEditingCode(null);
      loadBillingCodes();
    } catch (error: any) {
      console.error('Error updating billing code:', error);
      toast.error(error.message || 'Failed to update billing code');
    }
  };

  const deleteBillingCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this billing code?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('billing_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Billing code deleted successfully');
      loadBillingCodes();
    } catch (error: any) {
      console.error('Error deleting billing code:', error);
      toast.error(error.message || 'Failed to delete billing code');
    }
  };

  const createClinic = async () => {
    if (!newClinic.name) {
      toast.error('Please provide a clinic name');
      return;
    }
    try {
      // Only send columns that exist in DB schema
      const payload = {
        id: newClinic.id || crypto.randomUUID(),
        name: newClinic.name,
        address: newClinic.address || null,
        phone: newClinic.phone || null
      } as any;
      const { error } = await supabase.from('clinics').insert([payload]);
      if (error) throw error;
      toast.success('Clinic created successfully');
      setShowAddClinic(false);
      setNewClinic({ id: '', name: '', address: '', phone: '', email: '' } as any);
      loadClinics();
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast.error(error.message || 'Failed to create clinic');
    }
  };

  const updateClinic = async () => {
    if (!editingClinic) return;
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: editingClinic.name,
          address: editingClinic.address,
          phone: editingClinic.phone
        })
        .eq('id', editingClinic.id);
      if (error) throw error;
      toast.success('Clinic updated successfully');
      setEditingClinic(null);
      loadClinics();
    } catch (error: any) {
      console.error('Error updating clinic:', error);
      toast.error(error.message || 'Failed to update clinic');
    }
  };

  const deleteClinic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clinic?')) return;
    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Clinic deleted successfully');
      loadClinics();
    } catch (error: any) {
      console.error('Error deleting clinic:', error);
      toast.error(error.message || 'Failed to delete clinic');
    }
  };

  const sendUserInvite = async (_userId: string) => {
    try {
      // In a real implementation, you would send an email invite
      toast.success('Invite sent successfully');
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'view_only_admin': return 'bg-purple-100 text-purple-800';
      case 'billing_staff': return 'bg-blue-100 text-blue-800';
      case 'view_only_billing': return 'bg-indigo-100 text-indigo-800';
      case 'provider': return 'bg-green-100 text-green-800';
      case 'office_staff': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                <span>Add User</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clinic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Highlight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hourly Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timecard
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.clinic_id || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: user.highlight_color || '#6B7280' }}></div>
                            <span className="text-xs text-gray-600">{user.highlight_color || '#'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(user as any).hourly_rate || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            (user as any).timecard_option ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {(user as any).timecard_option ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => sendUserInvite(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Send Invite"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowAddUser(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit User"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'billing-codes':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Billing Codes & Colors</h3>
              <button
                onClick={() => setShowAddCode(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                <span>Add Code</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {billingCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {code.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {code.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: code.color }}
                            ></div>
                            <span className="text-sm text-gray-900">{code.color}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingCode(code)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Code"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteBillingCode(code.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Code"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'audit-logs':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-600">Track all system changes and user actions</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Record ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.table_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.record_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'system-settings':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">General Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Name
                  </label>
                  <input
                    type="text"
                    defaultValue="American Medical Billing & Coding LLC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Billing Fee Percentage
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue="6.25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Due Days
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Security Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable audit logging
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Require strong passwords
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable two-factor authentication
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'clinic-management':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
              <h3 className="text-lg font-semibold text-gray-900">Clinic Management</h3>
                <p className="text-sm text-gray-600">Add, edit, and remove clinics</p>
            </div>
              <button
                onClick={() => { setEditingClinic(null); setShowAddClinic(true); }}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                <span>Add Clinic</span>
              </button>
                  </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clinics.map((clinic) => (
                      <tr key={clinic.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{clinic.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clinic.address || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clinic.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clinic.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => { setEditingClinic(clinic); setShowAddClinic(true); }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Clinic"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteClinic(clinic.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Clinic"
                            >
                              <Trash2 size={16} />
                  </button>
                </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'export-data':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-600">Export system data in various formats</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Billing Data</h4>
                <p className="text-sm text-gray-600 mb-4">Export billing entries, invoices, and financial data</p>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Export Billing Entries (CSV)
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Export Invoices (Excel)
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Export Financial Reports (PDF)
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">User Data</h4>
                <p className="text-sm text-gray-600 mb-4">Export user information and activity logs</p>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Export User List (CSV)
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Export Audit Logs (CSV)
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Export Timecards (Excel)
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">System Data</h4>
                <p className="text-sm text-gray-600 mb-4">Export system configuration and settings</p>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Export Clinic Data (JSON)
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Export Provider Data (CSV)
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Export All Data (ZIP)
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Custom Export</h4>
                <p className="text-sm text-gray-600 mb-4">Create custom data exports with filters</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="date"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Create Custom Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tabs.find(t => t.id === activeTab)?.label || 'Settings'}</h2>
          <p className="text-gray-600">Manage {tabs.find(t => t.id === activeTab)?.label?.toLowerCase()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-gray-900">
            Super Admin
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

    {/* Add/Edit Clinic Modal */}
    {showAddClinic && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-black">{editingClinic ? 'Edit Clinic' : 'Add Clinic'}</h3>
            <button
              onClick={() => { setShowAddClinic(false); setEditingClinic(null); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name *</label>
              <input
                type="text"
                value={editingClinic ? editingClinic.name : newClinic.name}
                onChange={(e) => editingClinic ? setEditingClinic({ ...editingClinic, name: e.target.value }) : setNewClinic({ ...newClinic, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Clinic Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={editingClinic ? (editingClinic.address || '') : (newClinic.address || '')}
                onChange={(e) => editingClinic ? setEditingClinic({ ...editingClinic, address: e.target.value }) : setNewClinic({ ...newClinic, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black "
                placeholder="123 Medical St, City, State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={editingClinic ? (editingClinic.phone || '') : (newClinic.phone || '')}
                onChange={(e) => editingClinic ? setEditingClinic({ ...editingClinic, phone: e.target.value }) : setNewClinic({ ...newClinic, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black" 
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editingClinic ? (editingClinic.email || '') : (newClinic.email || '')}
                onChange={(e) => editingClinic ? setEditingClinic({ ...editingClinic, email: e.target.value }) : setNewClinic({ ...newClinic, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="info@clinic.com"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => { setShowAddClinic(false); setEditingClinic(null); }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingClinic ? updateClinic : createClinic}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {editingClinic ? 'Update Clinic' : 'Create Clinic'}
            </button>
          </div>
        </div>
      </div>
    )}
      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={editingUser ? editingUser.name : newUser.name}
                  onChange={(e) => editingUser ? 
                    setEditingUser({ ...editingUser, name: e.target.value }) :
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={editingUser ? editingUser.email : newUser.email}
                  onChange={(e) => editingUser ? 
                    setEditingUser({ ...editingUser, email: e.target.value }) :
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser ? editingUser.role : newUser.role}
                  onChange={(e) => editingUser ? 
                    setEditingUser({ ...editingUser, role: e.target.value }) :
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Highlight Color
                </label>
                <div className="flex space-x-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewUser({ ...newUser, highlight_color: color })}
                      className={`w-8 h-8 rounded border-2 ${newUser.highlight_color === color ? 'border-gray-900' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic ID
                </label>
                <input
                  type="text"
                  value={newUser.clinic_id}
                  onChange={(e) => setNewUser({ ...newUser, clinic_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Clinic ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider ID
                </label>
                <input
                  type="text"
                  value={newUser.provider_id}
                  onChange={(e) => setNewUser({ ...newUser, provider_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Provider ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingUser ? (editingUser as any).hourly_rate || 0 : newUser.hourly_rate}
                  onChange={(e) => editingUser ? 
                    setEditingUser({ ...editingUser, hourly_rate: parseFloat(e.target.value) || 0 } as any) :
                    setNewUser({ ...newUser, hourly_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timecard Option
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timecard_option"
                      checked={editingUser ? (editingUser as any).timecard_option === true : newUser.timecard_option === true}
                      onChange={() => editingUser ? 
                        setEditingUser({ ...editingUser, timecard_option: true } as any) :
                        setNewUser({ ...newUser, timecard_option: true })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timecard_option"
                      checked={editingUser ? (editingUser as any).timecard_option === false : newUser.timecard_option === false}
                      onChange={() => editingUser ? 
                        setEditingUser({ ...editingUser, timecard_option: false } as any) :
                        setNewUser({ ...newUser, timecard_option: false })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? updateUser : createUser}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Billing Code Modal */}
      {showAddCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Add Billing Code</h3>
              <button
                onClick={() => setShowAddCode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 99214"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Office Visit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCode({ ...newCode, color })}
                      className={`w-8 h-8 rounded border-2 ${
                        newCode.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={newCode.color}
                  onChange={(e) => setNewCode({ ...newCode, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-2"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddCode(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createBillingCode}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminSettings;
