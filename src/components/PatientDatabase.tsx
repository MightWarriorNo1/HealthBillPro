import { useState, useEffect, useMemo } from 'react';
import type { ColDef, GridOptions } from 'ag-grid-community';
import DataGrid from './DataGrid';
import { 
  Plus, Search, X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  insurance: string;
  copay: number;
  coinsurance: number;
  clinicId: string;
}

interface PatientDatabaseProps {
  clinicId?: string;
  canEdit?: boolean;
}

function PatientDatabase({ clinicId, canEdit = true }: PatientDatabaseProps) {
  const { patients: contextPatients, loading: contextLoading, addPatient: contextAddPatient, updatePatient: contextUpdatePatient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [filterInsurance, setFilterInsurance] = useState('all');
  const [effectiveClinicId, setEffectiveClinicId] = useState<string | undefined>(clinicId);

  const [newPatient, setNewPatient] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
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
    resolveClinic();
  }, [clinicId]);

  // Filter patients from context based on clinic
  const patients = contextPatients.filter(patient => {
    const scopedClinicId = effectiveClinicId || clinicId;
    return !scopedClinicId || patient.clinicId === scopedClinicId;
  });

  const createPatient = async () => {
    if (!newPatient.patientId || !newPatient.firstName || !newPatient.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const clinicForInsert = effectiveClinicId || clinicId;
      if (!clinicForInsert) {
        toast.error('Cannot create patient: clinic is not selected for your account.');
        return;
      }
      
      await contextAddPatient({
        patientId: newPatient.patientId,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        insurance: newPatient.insurance,
        copay: newPatient.copay,
        coinsurance: newPatient.coinsurance,
        clinicId: clinicForInsert
      });

      toast.success('Patient created successfully');
      setShowAddPatient(false);
      setNewPatient({
        patientId: '',
        firstName: '',
        lastName: '',
        insurance: '',
        copay: 0,
        coinsurance: 0
      });
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Failed to create patient');
    }
  };

  const updatePatient = async () => {
    if (!editingPatient) return;

    try {
      await contextUpdatePatient(editingPatient.id, {
        patientId: editingPatient.patientId,
        firstName: editingPatient.firstName,
        lastName: editingPatient.lastName,
        insurance: editingPatient.insurance,
        copay: editingPatient.copay,
        coinsurance: editingPatient.coinsurance
      });

      toast.success('Patient updated successfully');
      setEditingPatient(null);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'Failed to update patient');
    }
  };

  // Note: row-level delete moved out of the main grid UI for now

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.insurance.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesInsurance = filterInsurance === 'all' || patient.insurance === filterInsurance;
    
    return matchesSearch && matchesInsurance;
  });

  const numberParser = (params: any) => {
    const v = parseFloat(params.newValue);
    return Number.isFinite(v) ? v : 0;
  };

  const columnDefs: ColDef[] = useMemo(() => [
    { field: 'patientId', headerName: 'Patient ID', editable: !!canEdit },
    { field: 'firstName', headerName: 'First Name', editable: !!canEdit },
    { field: 'lastName', headerName: 'Last Name', editable: !!canEdit },
    { field: 'insurance', headerName: 'Insurance', editable: !!canEdit },
    { field: 'copay', headerName: 'Copay', editable: !!canEdit, valueParser: numberParser },
    { field: 'coinsurance', headerName: 'Coinsurance', editable: !!canEdit, valueParser: numberParser }
  ], [canEdit]);

  const onCellValueChanged: GridOptions['onCellValueChanged'] = async (e) => {
    if (!e.data || !e.colDef.field) return;
    const field = String(e.colDef.field);
    const value = field === 'copay' || field === 'coinsurance' ? Number(e.newValue || 0) : e.newValue;
    
    try {
      await contextUpdatePatient((e.data as any).id, { [field]: value });
    } catch (err) {
      console.error('Failed to update patient', err);
      toast.error('Failed to save change');
    }
  };

  // Note: badge colors not used in grid view; retained logic removed to keep file lean

  if (contextLoading) {
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

      {/* Patients Grid (Excel-like) */}
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <DataGrid
          columnDefs={columnDefs}
          rowData={filteredPatients}
          readOnly={!canEdit}
          onCellValueChanged={onCellValueChanged}
        />
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
                  value={newPatient.patientId}
                  onChange={(e) => setNewPatient({ ...newPatient, patientId: e.target.value })}
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
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
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
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
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
                  value={editingPatient.patientId}
                  onChange={(e) => setEditingPatient({ ...editingPatient, patientId: e.target.value })}
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
                    value={editingPatient.firstName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editingPatient.lastName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
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
