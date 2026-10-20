import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  X,
  FileText,
  User,
  Truck,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PROBLEM_CATEGORIES = [
  'Overflowing garbage bins',
  'Illegal dumping',
  'Missed waste collection',
  'Mixed waste',
  'Hazardous waste',
  'Damaged public bins',
  'Other waste-related issues'
];

const WARDS = [
  'Ward 1 - Green Valley',
  'Ward 2 - Riverdale',
  'Ward 3 - Metro Central',
  'Ward 4 - Sunrise Heights',
  'Ward 5 - Eco Tech Park'
];

export default function WasteReports() {
  const { currentUser, hasPermission } = useAuth();
  const { success, error, warning } = useToast();

  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    problem_category: PROBLEM_CATEGORIES[0],
    description: '',
    ward: WARDS[0],
    address: '',
    priority: 'Medium',
    photo_url: null,
    reporter_name: currentUser?.name || 'Citizen Reporter',
    reporter_contact: currentUser?.phone || ''
  });

  // Assign task form state
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [taskInstructions, setTaskInstructions] = useState('');

  // Status update note state
  const [statusUpdateVal, setStatusUpdateVal] = useState('Resolved');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    loadReports();
    loadWorkers();
  }, [statusFilter, priorityFilter, wardFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports({
        status: statusFilter,
        priority: priorityFilter,
        ward: wardFilter,
        search
      });
      if (res.success) {
        setReports(res.data || []);
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
        if (res.data?.length > 0) {
          setAssignWorkerId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReports();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        warning('Image Too Large', 'Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      warning('Missing Fields', 'Please provide a title and detailed description.');
      return;
    }

    try {
      const res = await api.createReport({
        ...formData,
        reporter_name: currentUser?.name || formData.reporter_name,
        reporter_contact: currentUser?.phone || formData.reporter_contact
      });

      if (res.success) {
        success('Report Submitted', `Your report ID is ${res.data.id}. Municipal teams have been notified.`);
        setIsCreateOpen(false);
        setFormData({
          title: '',
          problem_category: PROBLEM_CATEGORIES[0],
          description: '',
          ward: WARDS[0],
          address: '',
          priority: 'Medium',
          photo_url: null,
          reporter_name: currentUser?.name || '',
          reporter_contact: currentUser?.phone || ''
        });
        loadReports();
      } else {
        error('Error', res.error || 'Failed to submit report.');
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport) return;
    try {
      const res = await api.updateReportStatus({
        id: selectedReport.id,
        status: statusUpdateVal,
        resolution_notes: resolutionNote
      });
      if (res.success) {
        success('Status Updated', `Report ${selectedReport.id} marked as ${statusUpdateVal}.`);
        setSelectedReport(null);
        setResolutionNote('');
        loadReports();
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  const handleCreateTaskFromReport = async () => {
    if (!selectedReport) return;
    try {
      const worker = workers.find((w) => w.id === assignWorkerId);
      const res = await api.createTask({
        title: `Resolve: ${selectedReport.title}`,
        ward: selectedReport.ward,
        location: selectedReport.address || selectedReport.ward,
        waste_type: selectedReport.problem_category.includes('Hazardous')
          ? 'Hazardous'
          : selectedReport.problem_category.includes('Wet')
          ? 'Wet / Biodegradable'
          : 'Dry / Recyclable',
        scheduled_date: new Date().toISOString().split('T')[0],
        priority: selectedReport.priority,
        assigned_worker_id: assignWorkerId,
        related_report_id: selectedReport.id,
        target_weight_kg: 80.0,
        special_instructions: taskInstructions || `Follow up on citizen report ${selectedReport.id}`
      });

      if (res.success) {
        success('Task Dispatched', `Collection task ${res.data.id} assigned to ${worker?.name || 'Worker'}.`);
        setIsAssignTaskOpen(false);
        setSelectedReport(null);
        loadReports();
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Citizen Waste Reporting & Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Report overflowing bins, illegal dumping, mixed waste violations, and missed pickups with optional photo evidence.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report Waste Problem</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search report ID, title, description, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs focus:outline-none"
          >
            <option value="All">All Wards</option>
            {WARDS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Report ID</th>
                <th className="py-3.5 px-4">Issue & Description</th>
                <th className="py-3.5 px-4">Ward / Address</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reporter</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="py-4 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {report.id}
                  </td>
                  <td className="py-4 px-4 max-w-xs">
                    <div className="font-bold text-white truncate">{report.title}</div>
                    <div className="text-slate-400 text-[11px] truncate mt-0.5">
                      {report.problem_category}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.ward}</span>
                    </div>
                    {report.address && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {report.address}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        report.priority === 'Urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : report.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : report.priority === 'Medium'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-700/40 text-slate-300'
                      }`}
                    >
                      {report.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
                        report.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : report.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-300'
                          : report.status === 'Assigned'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                    <div>{report.reporter_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(report);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No reports match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE REPORT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-bold text-white font-heading">
                  Report Waste Management Problem
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 my-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overflowing garbage bin outside community center"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Problem Category *
                  </label>
                  <select
                    value={formData.problem_category}
                    onChange={(e) =>
                      setFormData({ ...formData, problem_category: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {PROBLEM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Low">Low (Routine maintenance)</option>
                    <option value="Medium">Medium (Within 24 hours)</option>
                    <option value="High">High (Health & pest hazard)</option>
                    <option value="Urgent">Urgent (Immediate hazardous spill)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    City Ward *
                  </label>
                  <select
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
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
                    Specific Street / Landmark Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Gate 3, Central Park Promenade"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description of Issue *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the waste problem, estimated volume, odors, or risks to pedestrians..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Attach Photo Evidence (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer font-medium">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Upload Picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {formData.photo_url && (
                    <div className="flex items-center gap-2">
                      <img
                        src={formData.photo_url}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo_url: null })}
                        className="text-rose-400 hover:text-rose-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT DETAILS MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {selectedReport.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedReport.priority === 'Urgent'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {selectedReport.priority}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white font-heading mt-1">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs leading-relaxed">
              {/* Photo preview if present */}
              {selectedReport.photo_url && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-64">
                  <img
                    src={selectedReport.photo_url}
                    alt="Report photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                <div>
                  <span className="text-slate-400 text-[11px] block">Problem Type</span>
                  <span className="font-semibold text-white">{selectedReport.problem_category}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Ward</span>
                  <span className="font-semibold text-white">{selectedReport.ward}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span className="font-bold text-emerald-400">{selectedReport.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Reported At</span>
                  <span className="text-white">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <strong className="text-white block mb-1">Description:</strong>
                <p className="text-slate-300 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.address && (
                <div>
                  <strong className="text-white block mb-1">Location Details:</strong>
                  <p className="text-slate-300">{selectedReport.address}</p>
                </div>
              )}

              <div>
                <strong className="text-white block mb-1">Reporter Details:</strong>
                <p className="text-slate-400">
                  {selectedReport.reporter_name}
                  {selectedReport.reporter_contact && ` • ${selectedReport.reporter_contact}`}
                </p>
              </div>

              {selectedReport.assigned_worker_name && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] block text-purple-300">Assigned Field Worker</span>
                    <span className="font-bold">{selectedReport.assigned_worker_name}</span>
                  </div>
                </div>
              )}

              {selectedReport.resolution_notes && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <strong className="block mb-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolution Verification Notes:</span>
                  </strong>
                  <p>{selectedReport.resolution_notes}</p>
                </div>
              )}

              {/* Status Update & Task Assignment Controls (for Admin & Worker) */}
              {hasPermission('manage_tasks') && selectedReport.status !== 'Resolved' && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs">
                    Administrative Action & Dispatch
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIsAssignTaskOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Collection Task to Worker</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={statusUpdateVal}
                        onChange={(e) => setStatusUpdateVal(e.target.value)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="In Progress">Mark In Progress</option>
                        <option value="Resolved">Mark Resolved</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Resolution summary or action taken..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                      <button
                        onClick={handleStatusUpdate}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH TASK SUB-MODAL */}
      {isAssignTaskOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white font-heading mb-3">
              Dispatch Collection Task
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create an official collection task for report #{selectedReport?.id}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assign Worker
                </label>
                <select
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.ward}) - {w.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring extra containers for heavy organic waste..."
                  value={taskInstructions}
                  onChange={(e) => setTaskInstructions(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setIsAssignTaskOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTaskFromReport}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
