import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Square, Plus, Edit, Trash2, Save, X, 
  Search, Filter, Clock, User, Calendar, MessageSquare,
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [todoNotes, setTodoNotes] = useState<TodoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<TodoItem | null>(null);
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
    loadTodoItems();
  }, [clinicId]);

  const loadTodoItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('todo_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTodoItems(data || []);
    } catch (error) {
      console.error('Error loading todo items:', error);
      toast.error('Failed to load todo items');
    } finally {
      setLoading(false);
    }
  };

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
          created_by: 'current_user' // This would be the actual user ID
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
      loadTodoItems();
    } catch (error: any) {
      console.error('Error creating todo item:', error);
      toast.error(error.message || 'Failed to create todo item');
    }
  };

  const updateItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('todo_items')
        .update({
          claim_id: editingItem.claim_id,
          status: editingItem.status,
          issue: editingItem.issue,
          notes: editingItem.notes,
          flu_notes: editingItem.flu_notes,
          completed_at: editingItem.status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('To-Do item updated successfully');
      setEditingItem(null);
      loadTodoItems();
    } catch (error: any) {
      console.error('Error updating todo item:', error);
      toast.error(error.message || 'Failed to update todo item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this to-do item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('todo_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('To-Do item deleted successfully');
      loadTodoItems();
    } catch (error: any) {
      console.error('Error deleting todo item:', error);
      toast.error(error.message || 'Failed to delete todo item');
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
          created_by: 'current_user' // This would be the actual user ID
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

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const filteredItems = todoItems.filter(item => {
    const matchesSearch = 
      item.claim_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.flu_notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCompleted = showCompleted || item.status !== 'completed';
    
    return matchesSearch && matchesStatus && matchesCompleted;
  });

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
        {canEdit && (
          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            <span>Add Item</span>
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
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {/* To-Do Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flu Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedItem?.id === item.id ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setSelectedItem(item);
                      loadTodoNotes(item.id);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.claim_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.issue}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.notes}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.flu_notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Item"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          
          {/* Add Note Form */}
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

          {/* Notes List */}
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
              <h3 className="text-lg font-semibold">Add New To-Do Item</h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit To-Do Item</h3>
              <button
                onClick={() => setEditingItem(null)}
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
                  value={editingItem.claim_id}
                  onChange={(e) => setEditingItem({ ...editingItem, claim_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
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
                  value={editingItem.issue}
                  onChange={(e) => setEditingItem({ ...editingItem, issue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingItem.notes}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flu Notes
                </label>
                <textarea
                  value={editingItem.flu_notes}
                  onChange={(e) => setEditingItem({ ...editingItem, flu_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateItem}
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

export default TodoSystem;
