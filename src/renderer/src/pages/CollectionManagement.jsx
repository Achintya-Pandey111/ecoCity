import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  User,
  AlertCircle,
  X,
  Scale,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const WASTE_TYPES = [
  'Wet / Biodegradable',
  'Dry / Recyclable',
  'Hazardous',
  'Mixed / Bulk',
  'E-Waste',
  'Sanitary'
];

const WARDS = [
  'Ward 1 - Green Valley',
  'Ward 2 - Riverdale',
  'Ward 3 - Metro Central',
  'Ward 4 - Sunrise Heights',
  'Ward 5 - Eco Tech Park'
];

export default function CollectionManagement() {
  const { currentUser, hasPermission } = useAuth();
  const { success, error, warning } = useToast();

  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [workerFilter, setWorkerFilter] = useState(
    currentUser?.role === 'worker' ? (currentUser?.workerId || 'WRK-01') : 'All'
  );
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Completion Form State
  const [completionWeight, setCompletionWeight] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // New Task Form
  const [newTask, setNewTask] = useState({
    title: '',
    ward: WARDS[0],
    location: '',
    waste_type: WASTE_TYPES[0],
    scheduled_date: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    assigned_worker_id: '',
    target_weight_kg: 100,
    special_instructions: ''
  });

  useEffect(() => {
    loadTasks();
    loadWorkers();
  }, [statusFilter, wardFilter, workerFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({
        status: statusFilter,
        ward: wardFilter,
        worker_id: workerFilter,
        search
      });
      if (res.success) {
        setTasks(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const res = await api.getWorkers();
      if (res.success) {
        setWorkers(res.data || []);
        if (res.data?.length > 0 && !newTask.assigned_worker_id) {
          setNewTask((prev) => ({ ...prev, assigned_worker_id: res.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTasks();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.location.trim()) {
      warning('Missing Fields', 'Please provide a title and location for the route.');
      return;
    }

    try {
      const res = await api.createTask({
        ...newTask,
        target_weight_kg: Number(newTask.target_weight_kg) || 50
      });
      if (res.success) {
        success('Task Created', `Collection task ${res.data.id} has been dispatched.`);
        setIsCreateOpen(false);
        setNewTask({
          title: '',
          ward: WARDS[0],
          location: '',
          waste_type: WASTE_TYPES[0],
          scheduled_date: new Date().toISOString().split('T')[0],
          priority: 'Medium',
          assigned_worker_id: workers[0]?.id || '',
          target_weight_kg: 100,
          special_instructions: ''
        });
        loadTasks();
      } else {
        error('Error', res.error || 'Failed to create collection task.');
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (newStatus === 'Completed') {
      setSelectedTask(task);
      setCompletionWeight(task.target_weight_kg || 80);
      setIsCompleteModalOpen(true);
      return;
    }

    try {
      const res = await api.updateTaskStatus({
        id: task.id,
        status: newStatus
      });
      if (res.success) {
        success('Task Updated', `Task ${task.id} updated to ${newStatus}.`);
        loadTasks();
        if (selectedTask?.id === task.id) {
          setSelectedTask((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const weight = parseFloat(completionWeight) || 0;
      const res = await api.updateTaskStatus({
        id: selectedTask.id,
        status: 'Completed',
        collected_weight_kg: weight,
        notes: completionNotes || 'Collection completed and verified.'
      });

      if (res.success) {
        success(
          'Collection Recorded!',
          `Task ${selectedTask.id} completed. ${weight} kg added to city recycling & recovery telemetry.`
        );
        setIsCompleteModalOpen(false);
        setSelectedTask(null);
        setCompletionNotes('');
        loadTasks();
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  // Stats calculation
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Truck className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Waste Collection Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Schedule collection routes, dispatch tasks to municipal field staff, and record verified weighbridge collection weights.
          </p>
        </div>

        {hasPermission('assign_tasks') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection Task</span>
          </button>
        )}
      </div>

      {/* Quick Status KPI Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-semibold">Total Tasks</span>
            <span className="text-xl font-bold text-white font-heading">{totalCount}</span>
          </div>
          <Layers className="w-5 h-5 text-slate-400" />
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 block font-semibold">Pending Pickup</span>
            <span className="text-xl font-bold text-amber-300 font-heading">{pendingCount}</span>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-blue-400 block font-semibold">In Progress</span>
            <span className="text-xl font-bold text-blue-300 font-heading">{inProgressCount}</span>
          </div>
          <Truck className="w-5 h-5 text-blue-400" />
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 block font-semibold">Completed</span>
            <span className="text-xl font-bold text-emerald-300 font-heading">{completedCount}</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Filter Toolbar & View Mode Toggle */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search task ID, title, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
          >
            <option value="All">All Field Workers</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.employee_id})
              </option>
            ))}
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
          >
            <option value="All">All Wards</option>
            {WARDS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Table / Card View Toggles */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tasks View: Table or Card Grid */}
      {viewMode === 'table' ? (
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Task ID</th>
                  <th className="py-3.5 px-4">Title & Location</th>
                  <th className="py-3.5 px-4">Waste Stream</th>
                  <th className="py-3.5 px-4">Assigned Worker</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {task.id}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-white truncate">{task.title}</div>
                      <div className="text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{task.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {task.waste_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">
                        {task.worker_name || 'Unassigned'}
                      </div>
                      {task.vehicle_assigned && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {task.vehicle_assigned}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                      {task.scheduled_date}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-300'
                            : task.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : task.status === 'In Progress'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {task.status !== 'Completed' ? (
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {task.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(task, 'In Progress')}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium text-xs cursor-pointer"
                            >
                              Start Route
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(task, 'Completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400">
                          {task.collected_weight_kg || task.target_weight_kg} kg
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {task.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : task.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2">
                  {task.title}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{task.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-300">{task.worker_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{task.scheduled_date}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[10px]">
                  {task.waste_type}
                </span>

                {task.status !== 'Completed' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task, 'Completed');
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    Complete
                  </button>
                ) : (
                  <span className="text-emerald-400 font-bold font-mono text-xs">
                    {task.collected_weight_kg || task.target_weight_kg} kg
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Truck className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-bold text-white font-heading">
                  Create New Waste Collection Task
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 my-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning commercial cardboard sweep - Broadway Blvd"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    City Ward *
                  </label>
                  <select
                    value={newTask.ward}
                    onChange={(e) => setNewTask({ ...newTask, ward: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    {WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Route / Specific Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broadway & 4th Cross Avenue"
                    value={newTask.location}
                    onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Waste Stream Type *
                  </label>
                  <select
                    value={newTask.waste_type}
                    onChange={(e) => setNewTask({ ...newTask, waste_type: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    {WASTE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assign Field Worker *
                  </label>
                  <select
                    value={newTask.assigned_worker_id}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assigned_worker_id: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.ward.split(' - ')[1] || w.ward})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Scheduled Collection Date
                  </label>
                  <input
                    type="date"
                    value={newTask.scheduled_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, scheduled_date: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Estimated Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={newTask.target_weight_kg}
                    onChange={(e) =>
                      setNewTask({ ...newTask, target_weight_kg: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Special Route Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for driver, compactor settings, gate codes, weighbridge routing..."
                  value={newTask.special_instructions}
                  onChange={(e) =>
                    setNewTask({ ...newTask, special_instructions: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS MODAL */}
      {selectedTask && !isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {selectedTask.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                    {selectedTask.priority}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white font-heading mt-1">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs leading-relaxed">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                <div>
                  <span className="text-slate-400 text-[11px] block">Stream</span>
                  <span className="font-semibold text-white">{selectedTask.waste_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Ward</span>
                  <span className="font-semibold text-white">{selectedTask.ward}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span className="font-bold text-emerald-400">{selectedTask.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Target Weight</span>
                  <span className="text-white font-mono">{selectedTask.target_weight_kg} kg</span>
                </div>
              </div>

              <div>
                <strong className="text-white block mb-1">Assigned Route & Destination:</strong>
                <p className="text-slate-300 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                  {selectedTask.location}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div>
                  <span className="text-slate-400 text-[11px] block">Field Worker</span>
                  <span className="font-bold text-white text-sm">
                    {selectedTask.worker_name || 'Unassigned'}
                  </span>
                  {selectedTask.worker_phone && (
                    <span className="text-slate-400 text-[11px] ml-2">({selectedTask.worker_phone})</span>
                  )}
                </div>
                {selectedTask.vehicle_assigned && (
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Vehicle</span>
                    <span className="text-slate-300 font-medium">{selectedTask.vehicle_assigned}</span>
                  </div>
                )}
              </div>

              {selectedTask.special_instructions && (
                <div>
                  <strong className="text-white block mb-1">Special Instructions:</strong>
                  <p className="text-slate-300">{selectedTask.special_instructions}</p>
                </div>
              )}

              {selectedTask.status === 'Completed' && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                  <div className="font-bold flex items-center justify-between">
                    <span>Collection Completed & Weighed</span>
                    <span className="font-mono text-base font-black">
                      {selectedTask.collected_weight_kg} kg
                    </span>
                  </div>
                  {selectedTask.notes && (
                    <p className="mt-1 text-slate-300 text-[11px]">{selectedTask.notes}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <div>
                {selectedTask.status !== 'Completed' && hasPermission('complete_task') && (
                  <button
                    onClick={() => {
                      setCompletionWeight(selectedTask.target_weight_kg || 80);
                      setIsCompleteModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                  >
                    Record Verified Collection
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD COMPLETION MODAL */}
      {isCompleteModalOpen && selectedTask && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Scale className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-white font-heading">
                Record Completed Collection
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Log verified weight collected from task #{selectedTask.id}. This updates city recovery statistics in real-time.
            </p>

            <form onSubmit={handleConfirmCompletion} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Actual Waste Collected (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={completionWeight}
                  onChange={(e) => setCompletionWeight(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Weighbridge / Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Weighbridge Ticket #4912. Batch passed segregation inspection..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
