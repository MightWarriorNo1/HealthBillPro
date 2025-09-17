import React, { useState, useEffect } from 'react';
import { 
  Clock, Play, Pause, Calendar, DollarSign, 
  LogIn, LogOut, History, User, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface TimecardEntry {
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
  paid?: boolean;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface TimecardSystemProps {
  userId?: string;
  canEdit?: boolean;
}

function TimecardSystem({ userId, canEdit = true }: TimecardSystemProps) {
  const [timecards, setTimecards] = useState<TimecardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEntry, setCurrentEntry] = useState<TimecardEntry | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimecardEntry | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekStart, setWeekStart] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [hourlyRate, setHourlyRate] = useState(0);

  const [newEntry, setNewEntry] = useState({
    clock_in: '',
    clock_out: '',
    break_start: '',
    break_end: '',
    notes: '',
    hourly_rate: 0
  });

  useEffect(() => {
    loadTimecards();
    loadCurrentEntry();
  }, [userId, filterDate, weekStart, viewMode]);

  const getWeekRange = (inputISO: string) => {
    const d = new Date(inputISO);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];
    return { startISO, endISO };
  };

  const loadTimecards = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('timecard_entries')
        .select('*')
        .order('clock_in', { ascending: false });

      // If a specific userId is provided, scope results to that user.
      // Otherwise, show all entries (admin/office views).
      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (viewMode === 'day') {
        query = query.gte('date', filterDate).lte('date', filterDate);
      } else {
        const { startISO, endISO } = getWeekRange(weekStart);
        query = query.gte('date', startISO).lte('date', endISO);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimecards(data || []);
    } catch (error) {
      console.error('Error loading timecards:', error);
      toast.error('Failed to load timecards');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('timecard_entries')
        .select('*')
        .eq('user_id', userId)
        .is('clock_out', null)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentEntry(data);
        setIsClockedIn(true);
      } else {
        setCurrentEntry(null);
        setIsClockedIn(false);
      }
    } catch (error) {
      console.error('Error loading current entry:', error);
    }
  };

  const clockIn = async () => {
    try {
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const { data, error } = await supabase
        .from('timecard_entries')
        .insert([{
          user_id: userId,
          clock_in: now,
          date: today,
          hourly_rate: hourlyRate,
          total_hours: 0,
          total_pay: 0
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentEntry(data[0]);
        setIsClockedIn(true);
      }
      toast.success('Clocked in successfully');
      loadTimecards();
    } catch (error: any) {
      console.error('Error clocking in:', error);
      toast.error(error.message || 'Failed to clock in');
    }
  };

  const clockOut = async () => {
    if (!currentEntry) return;

    try {
      const now = new Date().toISOString();
      const clockInTime = new Date(currentEntry.clock_in);
      const clockOutTime = new Date(now);
      const totalMs = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);
      const totalPay = totalHours * currentEntry.hourly_rate;

      const { error } = await supabase
        .from('timecard_entries')
        .update({
          clock_out: now,
          total_hours: totalHours,
          total_pay: totalPay
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      setCurrentEntry(null);
      setIsClockedIn(false);
      toast.success('Clocked out successfully');
      loadTimecards();
    } catch (error: any) {
      console.error('Error clocking out:', error);
      toast.error(error.message || 'Failed to clock out');
    }
  };

  const createManualEntry = async () => {
    if (!newEntry.clock_in || !newEntry.clock_out) {
      toast.error('Please fill in clock in and clock out times');
      return;
    }

    try {
      const clockInTime = new Date(newEntry.clock_in);
      const clockOutTime = new Date(newEntry.clock_out);
      const totalMs = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);
      const totalPay = totalHours * newEntry.hourly_rate;

      const { error } = await supabase
        .from('timecard_entries')
        .insert([{
          user_id: userId,
          clock_in: newEntry.clock_in,
          clock_out: newEntry.clock_out,
          break_start: newEntry.break_start || null,
          break_end: newEntry.break_end || null,
          notes: newEntry.notes,
          hourly_rate: newEntry.hourly_rate,
          total_hours: totalHours,
          total_pay: totalPay,
          date: newEntry.clock_in.split('T')[0]
        }]);

      if (error) throw error;

      toast.success('Timecard entry created successfully');
      setShowAddEntry(false);
      setNewEntry({
        clock_in: '',
        clock_out: '',
        break_start: '',
        break_end: '',
        notes: '',
        hourly_rate: 0
      });
      loadTimecards();
    } catch (error: any) {
      console.error('Error creating timecard entry:', error);
      toast.error(error.message || 'Failed to create timecard entry');
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) return;

    try {
      const clockInTime = new Date(editingEntry.clock_in);
      const clockOutTime = editingEntry.clock_out ? new Date(editingEntry.clock_out) : new Date();
      const totalMs = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);
      const totalPay = totalHours * editingEntry.hourly_rate;

      const { error } = await supabase
        .from('timecard_entries')
        .update({
          clock_in: editingEntry.clock_in,
          clock_out: editingEntry.clock_out,
          break_start: editingEntry.break_start,
          break_end: editingEntry.break_end,
          notes: editingEntry.notes,
          hourly_rate: editingEntry.hourly_rate,
          total_hours: totalHours,
          total_pay: totalPay
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      toast.success('Timecard entry updated successfully');
      setEditingEntry(null);
      loadTimecards();
    } catch (error: any) {
      console.error('Error updating timecard entry:', error);
      toast.error(error.message || 'Failed to update timecard entry');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timecard entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('timecard_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Timecard entry deleted successfully');
      loadTimecards();
    } catch (error: any) {
      console.error('Error deleting timecard entry:', error);
      toast.error(error.message || 'Failed to delete timecard entry');
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const totalHours = timecards.reduce((sum, entry) => sum + entry.total_hours, 0);
  const totalPay = timecards.reduce((sum, entry) => sum + entry.total_pay, 0);
  const unpaidTotal = timecards.filter(e => !e.paid).reduce((sum, e) => sum + e.total_pay, 0);

  const markPeriodAsPaid = async () => {
    try {
      const { startISO, endISO } =
        viewMode === 'day' ? { startISO: filterDate, endISO: filterDate } : getWeekRange(weekStart);
      const { error } = await supabase
        .from('timecard_entries')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('user_id', userId)
        .gte('date', startISO)
        .lte('date', endISO)
        .is('paid', false);
      if (error) throw error;
      toast.success('Marked selected period as paid');
      loadTimecards();
    } catch (err: any) {
      console.error('Error marking as paid', err);
      toast.error(err.message || 'Failed to mark as paid');
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
          <h2 className="text-2xl font-bold text-gray-900">Timecard System</h2>
          <p className="text-gray-600">Track your work hours and calculate pay</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Hourly Rate</p>
            <input
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="$0.00"
            />
          </div>
        </div>
      </div>

      {/* Clock In/Out Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentEntry ? formatTime(currentEntry.clock_in) : '--:--'}
              </div>
              <div className="text-sm text-gray-600">Clock In</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentEntry ? 'Active' : '--:--'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
          <div className="flex space-x-3">
            {!isClockedIn ? (
              <button
                onClick={clockIn}
                disabled={!canEdit || hourlyRate <= 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <LogIn size={20} />
                <span>Clock In</span>
              </button>
            ) : (
              <button
                onClick={clockOut}
                disabled={!canEdit}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <LogOut size={20} />
                <span>Clock Out</span>
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setShowAddEntry(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Calendar size={20} />
                <span>Add Entry</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pay Today</p>
              <p className="text-2xl font-bold text-gray-900">${totalPay.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entries Today</p>
              <p className="text-2xl font-bold text-gray-900">{timecards.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">View:</label>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'day' | 'week')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
        </select>
        {viewMode === 'day' ? (
          <>
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </>
        ) : (
          <>
            <label className="text-sm font-medium text-gray-700">Week of:</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="ml-4 text-sm text-gray-600">
              {(() => { const { startISO, endISO } = getWeekRange(weekStart); return `Range: ${startISO} to ${endISO}`; })()}
            </div>
          </>
        )}
        <div className="ml-auto flex items-center space-x-3">
          <div className="text-sm text-gray-700">Unpaid: ${unpaidTotal.toFixed(2)}</div>
          <button
            onClick={markPeriodAsPaid}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Mark {viewMode === 'day' ? 'Day' : 'Week'} Paid
          </button>
        </div>
      </div>

      {/* Timecard Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timecards.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(entry.clock_in)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.clock_out ? formatTime(entry.clock_out) : 'Active'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(entry.total_hours)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${entry.hourly_rate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${entry.total_pay.toFixed(2)}
                    {entry.paid ? (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
                    ) : (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unpaid</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.notes || '-'}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Entry"
                        >
                          <Calendar size={16} />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Entry"
                        >
                          <History size={16} />
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

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Manual Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock In *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEntry.clock_in}
                    onChange={(e) => setNewEntry({ ...newEntry, clock_in: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock Out *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEntry.clock_out}
                    onChange={(e) => setNewEntry({ ...newEntry, clock_out: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Break Start
                  </label>
                  <input
                    type="datetime-local"
                    value={newEntry.break_start}
                    onChange={(e) => setNewEntry({ ...newEntry, break_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Break End
                  </label>
                  <input
                    type="datetime-local"
                    value={newEntry.break_end}
                    onChange={(e) => setNewEntry({ ...newEntry, break_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.hourly_rate}
                  onChange={(e) => setNewEntry({ ...newEntry, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddEntry(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createManualEntry}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Entry</h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock In *
                  </label>
                  <input
                    type="datetime-local"
                    value={editingEntry.clock_in}
                    onChange={(e) => setEditingEntry({ ...editingEntry, clock_in: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock Out
                  </label>
                  <input
                    type="datetime-local"
                    value={editingEntry.clock_out || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, clock_out: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingEntry.hourly_rate}
                  onChange={(e) => setEditingEntry({ ...editingEntry, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingEntry.notes || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateEntry}
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

export default TimecardSystem;
