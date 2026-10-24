import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  Shield,
  Phone,
  Mail,
  MapPin,
  Truck,
  Star,
  CheckCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const WARDS = [
  'Ward 1 - Green Valley',
  'Ward 2 - Riverdale',
  'Ward 3 - Metro Central',
  'Ward 4 - Sunrise Heights',
  'Ward 5 - Eco Tech Park'
];

export default function UsersWorkers() {
  const { currentUser, demoAccounts } = useAuth();
  const { success, error, warning } = useToast();

  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    email: '',
    ward: WARDS[0],
    shift: 'Morning (06:00 - 14:00)',
    vehicle_assigned: 'Electric Tipper #12'
  });

  useEffect(() => {
    loadData();
  }, [wardFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersRes, usersRes] = await Promise.all([
        api.getWorkers({ ward: wardFilter, status: statusFilter, search }),
        api.getUsers()
      ]);
      if (workersRes.success) setWorkers(workersRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorker.name.trim()) {
      warning('Validation', 'Worker name is required.');
      return;
    }

    try {
      const res = await api.createWorker(newWorker);
      if (res.success) {
        success('Worker Onboarded', `${newWorker.name} registered with Employee ID ${res.data.employee_id}.`);
        setIsAddWorkerOpen(false);
        setNewWorker({
          name: '',
          phone: '',
          email: '',
          ward: WARDS[0],
          shift: 'Morning (06:00 - 14:00)',
          vehicle_assigned: 'Electric Tipper #12'
        });
        loadData();
      } else {
        error('Error', res.error || 'Failed to add worker.');
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and Add Worker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Municipal Workforce & User Directory
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Manage frontline collection personnel, fleet assignment, duty shifts, and demonstration accounts.
          </p>
        </div>

        <button
          onClick={() => setIsAddWorkerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Worker</span>
        </button>
      </div>

      {/* Demonstration Personas Banner */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active System Demonstration Roles
          </span>
          <span className="text-[11px] text-emerald-400 font-medium">
            Enforced in Logic & Route Guards
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {demoAccounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3"
            >
              <img
                src={acc.avatar}
                alt={acc.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-600 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate">{acc.name}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{acc.roleLabel}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.ward}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workers Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search worker by name, employee ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Duty</option>
            <option value="On Route">On Route</option>
            <option value="Off Duty">Off Duty</option>
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
          >
            <option value="All">All Municipal Wards</option>
            {WARDS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {worker.employee_id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    worker.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : worker.status === 'On Route'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  {worker.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{worker.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{worker.ward}</span>
              </p>

              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{worker.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{worker.vehicle_assigned}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Shift: {worker.shift}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{worker.rating}</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                {worker.tasks_completed} Tasks Completed
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD WORKER MODAL */}
      {isAddWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white font-heading">
                Onboard Waste Collection Worker
              </h3>
              <button
                onClick={() => setIsAddWorkerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-4 my-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Henderson"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="worker@ecocity.gov"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assigned Municipal Ward
                </label>
                <select
                  value={newWorker.ward}
                  onChange={(e) => setNewWorker({ ...newWorker, ward: e.target.value })}
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
                  Assigned Collection Vehicle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electric Tipper #14 (Eco-Clean)"
                  value={newWorker.vehicle_assigned}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, vehicle_assigned: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWorkerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
