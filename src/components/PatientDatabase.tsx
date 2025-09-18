import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  insurance: string;
  copay: number;
  coinsurance: number;
  created_at: string;
  updated_at: string;
}

interface PatientDatabaseProps {
  clinicId?: string;
  canEdit?: boolean;
}

function PatientDatabase({ clinicId, canEdit = true }: PatientDatabaseProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [filterInsurance, setFilterInsurance] = useState('all');
  const [effectiveClinicId, setEffectiveClinicId] = useState<string | undefined>(clinicId);

  const [newPatient, setNewPatient] = useState({
    patient_id: '',
    first_name: '',
    last_name: '',
    insurance: '',
    copay: 0,
    coinsurance: 0
  });

  const insuranceOptions = [
    'BCBS', 'Cigna', 'PacificSource', 'Moda', 'Anthem', 'Providence', 'PP', 'Other'
  ];

  useEffect(() => {
    const resolveClinic = async () => {
      try {
        // Prefer prop if provided
        if (clinicId) {
          setEffectiveClinicId(clinicId);
          return;
        }
        // Otherwise, try to derive from current user's profile
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) {
          setEffectiveClinicId(undefined);
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('clinic_id')
          .eq('id', userId)
          .maybeSingle();
        if (profileError) {
          console.error('Failed to resolve user clinic_id:', profileError);
          setEffectiveClinicId(undefined);
          return;
        }
        setEffectiveClinicId(profile?.clinic_id || undefined);
      } catch (err) {
        console.error('Error resolving clinic_id:', err);
        setEffectiveClinicId(undefined);
      }
    };
    resolveClinic().then(() => loadPatients());
  }, [clinicId]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('patients')
        .select('*')
        .order('patient_id', { ascending: true });

      const scopedClinicId = effectiveClinicId || clinicId;
      if (scopedClinicId) {
        query = query.eq('clinic_id', scopedClinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async () => {
    if (!newPatient.patient_id || !newPatient.first_name || !newPatient.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const clinicForInsert = effectiveClinicId || clinicId;
      if (!clinicForInsert) {
        toast.error('Cannot create patient: clinic is not selected for your account.');
        return;
      }
      const { error } = await supabase
        .from('patients')
        .insert([{
          ...newPatient,
          clinic_id: clinicForInsert
        }]);

      if (error) throw error;

      toast.success('Patient created successfully');
      setShowAddPatient(false);
      setNewPatient({
        patient_id: '',
        first_name: '',
        last_name: '',
        insurance: '',
        copay: 0,
        coinsurance: 0
      });
      loadPatients();
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Failed to create patient');
    }
  };

  const updatePatient = async () => {
    if (!editingPatient) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          patient_id: editingPatient.patient_id,
          first_name: editingPatient.first_name,
          last_name: editingPatient.last_name,
          insurance: editingPatient.insurance,
          copay: editingPatient.copay,
          coinsurance: editingPatient.coinsurance
        })
        .eq('id', editingPatient.id);

      if (error) throw error;

      toast.success('Patient updated successfully');
      setEditingPatient(null);
      loadPatients();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'Failed to update patient');
    }
  };

  const deletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Patient deleted successfully');
      loadPatients();
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error(error.message || 'Failed to delete patient');
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.insurance.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesInsurance = filterInsurance === 'all' || patient.insurance === filterInsurance;
    
    return matchesSearch && matchesInsurance;
  });

  const getInsuranceColor = (insurance: string) => {
    switch (insurance) {
      case 'BCBS': return 'bg-blue-100 text-blue-800';
      case 'Cigna': return 'bg-green-100 text-green-800';
      case 'PacificSource': return 'bg-purple-100 text-purple-800';
      case 'Moda': return 'bg-orange-100 text-orange-800';
      case 'Anthem': return 'bg-red-100 text-red-800';
      case 'Providence': return 'bg-indigo-100 text-indigo-800';
      case 'PP': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Database</h2>
          <p className="text-gray-600">Manage patient information and insurance details</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddPatient(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            <span>Add Patient</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterInsurance}
          onChange={(e) => setFilterInsurance(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Insurance</option>
          {insuranceOptions.map(insurance => (
            <option key={insurance} value={insurance}>{insurance}</option>
          ))}
        </select>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Insurance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Copay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coinsurance
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.patient_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInsuranceColor(patient.insurance)}`}>
                      {patient.insurance}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${patient.copay.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.coinsurance.toFixed(2)}%
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingPatient(patient)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Patient"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deletePatient(patient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Patient"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Patient</h3>
              <button
                onClick={() => setShowAddPatient(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={newPatient.patient_id}
                  onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  placeholder="e.g., 3151"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance
                </label>
                <select
                  value={newPatient.insurance}
                  onChange={(e) => setNewPatient({ ...newPatient, insurance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                >
                  <option value="">Select Insurance</option>
                  {insuranceOptions.map(insurance => (
                    <option key={insurance} value={insurance}>{insurance}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copay ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPatient.copay}
                    onChange={(e) => setNewPatient({ ...newPatient, copay: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coinsurance (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPatient.coinsurance}
                    onChange={(e) => setNewPatient({ ...newPatient, coinsurance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    placeholder="10.00"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddPatient(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPatient}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Patient</h3>
              <button
                onClick={() => setEditingPatient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={editingPatient.patient_id}
                  onChange={(e) => setEditingPatient({ ...editingPatient, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editingPatient.first_name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editingPatient.last_name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance
                </label>
                <select
                  value={editingPatient.insurance}
                  onChange={(e) => setEditingPatient({ ...editingPatient, insurance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Insurance</option>
                  {insuranceOptions.map(insurance => (
                    <option key={insurance} value={insurance}>{insurance}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copay ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPatient.copay}
                    onChange={(e) => setEditingPatient({ ...editingPatient, copay: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coinsurance (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPatient.coinsurance}
                    onChange={(e) => setEditingPatient({ ...editingPatient, coinsurance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingPatient(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updatePatient}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDatabase;
