import React, { useState } from 'react';
import { 
  CheckCircle, Clock, AlertTriangle, Plus, Edit, Trash2, 
  Filter, Search, Calendar, User, FileText, MessageSquare,
  Bell, Archive, RefreshCw, Eye, EyeOff, Send, X, Play
} from 'lucide-react';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  dueDate: string;
  clinicId: string;
  providerId?: string;
  claimNumber?: string;
  createdDate: string;
  completedDate?: string;
  tags: string[];
}

interface BillingFollowUpSupportProps {
  clinicId?: string;
}

function BillingFollowUpSupport({ clinicId }: BillingFollowUpSupportProps) {
  const { claimIssues, clinics, providers, updateClaimIssue } = useData();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<string | null>(null);

  // Mock todo items - in real app, this would come from database
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: '1',
      title: 'Follow up on denied claim CLM001',
      description: 'Insurance denied claim due to missing prior authorization. Need to resubmit with proper documentation.',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Lisa Williams',
      dueDate: '2025-01-15',
      clinicId: '1',
      providerId: '1',
      claimNumber: 'CLM001',
      createdDate: '2025-01-10',
      tags: ['denied', 'prior-auth', 'resubmit']
    },
    {
      id: '2',
      title: 'Verify patient insurance eligibility',
      description: 'Patient John Smith - need to verify current insurance coverage before next appointment.',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'Mike Johnson',
      dueDate: '2025-01-12',
      clinicId: '1',
      createdDate: '2025-01-08',
      tags: ['eligibility', 'verification']
    },
    {
      id: '3',
      title: 'Update billing codes for new procedures',
      description: 'New procedure codes have been added to the system. Need to update provider reference materials.',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Sarah Davis',
      dueDate: '2025-01-05',
      clinicId: '1',
      createdDate: '2025-01-01',
      completedDate: '2025-01-04',
      tags: ['codes', 'update', 'procedures']
    }
  ]);

  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    dueDate: '',
    clinicId: clinicId || '',
    providerId: '',
    claimNumber: '',
    tags: [] as string[]
  });

  // Filter todos based on search and filters
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesClinic = !clinicId || todo.clinicId === clinicId;
    return matchesSearch && matchesPriority && matchesStatus && matchesClinic;
  });

  // Convert claim issues to todos
  const convertIssueToTodo = (issueId: string) => {
    const issue = claimIssues.find(i => i.id === issueId);
    if (!issue) return;

    const newTodoItem: TodoItem = {
      id: `todo-${Date.now()}`,
      title: `Resolve claim issue: ${issue.claimNumber}`,
      description: issue.description,
      priority: issue.priority,
      status: 'pending',
      assignedTo: issue.assignedTo || 'Unassigned',
      dueDate: issue.dueDate,
      clinicId: issue.clinicId,
      providerId: issue.providerId,
      claimNumber: issue.claimNumber,
      createdDate: new Date().toISOString().split('T')[0],
      tags: ['claim-issue', 'follow-up']
    };

    setTodos(prev => [newTodoItem, ...prev]);
    toast.success('Issue converted to todo item');
  };

  const handleAddTodo = () => {
    if (!newTodo.title || !newTodo.description || !newTodo.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const todoItem: TodoItem = {
      ...newTodo,
      id: `todo-${Date.now()}`,
      status: 'pending',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setTodos(prev => [todoItem, ...prev]);
    setNewTodo({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      clinicId: clinicId || '',
      providerId: '',
      claimNumber: '',
      tags: []
    });
    setShowAddTodo(false);
    toast.success('Todo item added successfully');
  };

  const handleUpdateTodo = (id: string, updates: Partial<TodoItem>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { 
            ...todo, 
            ...updates,
            completedDate: updates.status === 'completed' ? new Date().toISOString().split('T')[0] : todo.completedDate
          }
        : todo
    ));
    toast.success('Todo item updated successfully');
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    toast.success('Todo item deleted successfully');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle size={16} className="text-red-600" />;
      case 'medium': return <Clock size={16} className="text-yellow-600" />;
      case 'low': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  const stats = {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
    overdue: todos.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Follow-up Support</h2>
          <p className="text-gray-600">Manage and track billing-related tasks and issues</p>
        </div>
        <button
          onClick={() => setShowAddTodo(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Todo</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="text-gray-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <RefreshCw className="text-blue-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertTriangle className="text-red-600" size={20} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All Todos', count: stats.total },
              { id: 'pending', label: 'Pending', count: stats.pending },
              { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { id: 'completed', label: 'Completed', count: stats.completed },
              { id: 'overdue', label: 'Overdue', count: stats.overdue }
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </nav>
        </div>

        {/* Todo List */}
        <div className="p-6">
          <div className="space-y-4">
            {filteredTodos.map((todo) => {
              const clinic = clinics.find(c => c.id === todo.clinicId);
              const provider = providers.find(p => p.id === todo.providerId);
              const isOverdue = todo.status !== 'completed' && new Date(todo.dueDate) < new Date();
              
              return (
                <div key={todo.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getPriorityIcon(todo.priority)}
                        <h3 className="font-medium text-gray-900">{todo.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(todo.status)}`}>
                          {todo.status.replace('_', ' ')}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{todo.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Assigned to: {todo.assignedTo}</span>
                        <span>Due: {todo.dueDate}</span>
                        {clinic && <span>Clinic: {clinic.name}</span>}
                        {provider && <span>Provider: {provider.name}</span>}
                        {todo.claimNumber && <span>Claim: {todo.claimNumber}</span>}
                      </div>
                      {todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {todo.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {todo.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateTodo(todo.id, { status: 'in_progress' })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Start Task"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      {todo.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateTodo(todo.id, { status: 'completed' })}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Complete Task"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTodo(todo.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit Task"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTodos.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No todos found</h3>
              <p className="text-gray-600">
                {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first todo item.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Todo Modal */}
      {showAddTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Todo</h3>
              <button
                onClick={() => setShowAddTodo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Todo title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Todo description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
                  <input
                    type="text"
                    value={newTodo.assignedTo}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Assignee name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Claim Number</label>
                  <input
                    type="text"
                    value={newTodo.claimNumber}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, claimNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional claim number"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddTodo}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span>Add Todo</span>
              </button>
              <button
                onClick={() => setShowAddTodo(false)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingFollowUpSupport;
