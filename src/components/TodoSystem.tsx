import { useState, useEffect } from 'react';
import { 
  Plus, X, Search, User, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import TodoGrid from './TodoGrid';

interface TodoItem {
  id: string;
  claim_id: string;
  status: string;
  issue: string;
  notes: string;
  flu_notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  completed_at?: string;
}

interface TodoNote {
  id: string;
  todo_item_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface TodoSystemProps {
  clinicId?: string;
  canEdit?: boolean;
}

function TodoSystem({ clinicId, canEdit = true }: TodoSystemProps) {
  const [todoNotes, setTodoNotes] = useState<TodoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [newNote, setNewNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const [newItem, setNewItem] = useState({
    claim_id: '',
    status: '',
    issue: '',
    notes: '',
    flu_notes: ''
  });

  const statusOptions = [
    { value: 'waiting', label: 'Waiting', color: 'bg-red-100 text-red-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ip', label: 'IP', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    // warm up by toggling loading state; data loads within grid
    setLoading(false);
  }, [clinicId]);

  const loadTodoNotes = async (todoItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('todo_notes')
        .select('*')
        .eq('todo_item_id', todoItemId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTodoNotes(data || []);
    } catch (error) {
      console.error('Error loading todo notes:', error);
    }
  };

  const createItem = async () => {
    if (!newItem.claim_id || !newItem.issue) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('todo_items')
        .insert([{
          ...newItem,
          clinic_id: clinicId,
          created_by: 'current_user'
        }]);

      if (error) throw error;

      toast.success('To-Do item created successfully');
      setShowAddItem(false);
      setNewItem({
        claim_id: '',
        status: '',
        issue: '',
        notes: '',
        flu_notes: ''
      });
    } catch (error: any) {
      console.error('Error creating todo item:', error);
      toast.error(error.message || 'Failed to create todo item');
    }
  };

  const addNote = async () => {
    if (!selectedItem || !newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const { error } = await supabase
        .from('todo_notes')
        .insert([{
          todo_item_id: selectedItem.id,
          note: newNote.trim(),
          created_by: 'current_user'
        }]);

      if (error) throw error;

      toast.success('Note added successfully');
      setNewNote('');
      loadTodoNotes(selectedItem.id);
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Failed to add note');
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
          <h2 className="text-2xl font-bold text-gray-900">To-Do Items</h2>
          <p className="text-gray-600">Manage billing follow-ups and claim issues</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search to-do items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 select-with-arrow"
        >
          <option value="all">All Status</option>
          {statusOptions.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Show Completed</span>
        </label>
      </div>

      {/* To-Do Items Grid (Excel-like) */}
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <TodoGrid
          clinicId={clinicId}
          canEdit={canEdit}
          searchText={searchTerm}
          filterStatus={filterStatus}
          showCompleted={showCompleted}
          onSelectItem={(row) => {
            setSelectedItem(row as any);
            if (row?.id) loadTodoNotes(row.id);
          }}
        />
      </div>

      {/* Notes Panel */}
      {selectedItem && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Notes for Claim {selectedItem.claim_id}
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          {canEdit && (
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {todoNotes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{note.created_by}</span>
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-900">{note.note}</p>
              </div>
            ))}
            {todoNotes.length === 0 && (
              <p className="text-gray-500 text-center py-4">No notes yet</p>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New To-Do Item</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim ID *
                </label>
                <input
                  type="text"
                  value={newItem.claim_id}
                  onChange={(e) => setNewItem({ ...newItem, claim_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  placeholder="e.g., 2316"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 select-with-arrow"
                >
                  <option value="">Select Status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue *
                </label>
                <input
                  type="text"
                  value={newItem.issue}
                  onChange={(e) => setNewItem({ ...newItem, issue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  placeholder="e.g., Needs Reprocessing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flu Notes
                </label>
                <textarea
                  value={newItem.flu_notes}
                  onChange={(e) => setNewItem({ ...newItem, flu_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  rows={3}
                  placeholder="Follow-up notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createItem}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoSystem;
