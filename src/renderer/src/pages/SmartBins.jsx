import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Play,
  Pause,
  MapPin,
  Battery,
  Clock,
  Layers,
  Search,
  Truck,
  Plus,
  Info,
  Sparkles,
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

export default function SmartBins() {
  const { currentUser, hasPermission } = useAuth();
  const { success, warning, error, info } = useToast();

  const [bins, setBins] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Live IoT Simulation Mode
  const [isSimulating, setIsSimulating] = useState(false);

  // Modals
  const [selectedBin, setSelectedBin] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [dispatchInstructions, setDispatchInstructions] = useState('');

  useEffect(() => {
    loadBins();
    loadWorkers();
  }, [wardFilter, categoryFilter, statusFilter]);

  // Periodic simulation loop
  useEffect(() => {
    let interval = null;
    if (isSimulating) {
      interval = setInterval(async () => {
        try {
          const res = await api.simulateBinReadings();
          if (res.success) {
            setBins(res.data);
            if (res.alertsGenerated > 0) {
              warning(
                'Critical Fill Alert',
                `${res.alertsGenerated} bin(s) exceeded 90% threshold during live IoT telemetry cycle!`
              );
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  const loadBins = async () => {
    try {
      setLoading(true);
      const res = await api.getBins({
        ward: wardFilter,
        category: categoryFilter,
        status: statusFilter,
        search
      });
      if (res.success) {
        setBins(res.data || []);
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
      if (res.success && res.data?.length > 0) {
        setWorkers(res.data);
        setAssignWorkerId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSimulationStep = async () => {
    try {
      const res = await api.simulateBinReadings();
      if (res.success) {
        setBins(res.data);
        info('Telemetry Refreshed', 'Simulated ultrasonic fill levels updated across all public bins.');
      }
    } catch (e) {
      error('Error', e.message);
    }
  };

  const handleDispatchTask = async (e) => {
    e.preventDefault();
    if (!selectedBin) return;

    try {
      const worker = workers.find((w) => w.id === assignWorkerId);
      const res = await api.createTask({
        title: `Empty ${selectedBin.name} (${selectedBin.fill_percentage}%)`,
        ward: selectedBin.ward,
        location: `${selectedBin.location} (${selectedBin.id})`,
        waste_type: selectedBin.category.includes('Wet')
          ? 'Wet / Biodegradable'
          : selectedBin.category.includes('Recyclable')
          ? 'Dry / Recyclable'
          : selectedBin.category.includes('Hazardous')
          ? 'Hazardous'
          : 'Dry / Recyclable',
        scheduled_date: new Date().toISOString().split('T')[0],
        priority: selectedBin.fill_percentage >= 90 ? 'Urgent' : 'High',
        assigned_worker_id: assignWorkerId,
        related_bin_id: selectedBin.id,
        target_weight_kg: Math.round(selectedBin.fill_percentage * 1.8),
        special_instructions: dispatchInstructions || `Urgent dispatch for smart bin ${selectedBin.id} exceeding alert threshold.`
      });

      if (res.success) {
        success('Task Dispatched', `Collection task ${res.data.id} assigned to ${worker?.name || 'Worker'}.`);
        setIsDispatchModalOpen(false);
        setSelectedBin(null);
      }
    } catch (err) {
      error('Error', err.message);
    }
  };

  // Bin metrics
  const totalBins = bins.length;
  const criticalBins = bins.filter((b) => b.fill_percentage >= 90).length;
  const fullBins = bins.filter((b) => b.fill_percentage >= 80 && b.fill_percentage < 90).length;
  const almostFullBins = bins.filter((b) => b.fill_percentage >= 60 && b.fill_percentage < 80).length;
  const normalBins = bins.filter((b) => b.fill_percentage < 60).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner and IoT Simulation Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trash2 className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Smart Waste Bin Telemetry & Monitoring
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Live ultrasonic sensor fill levels, battery health, and automatic route dispatch for 16 smart public receptacles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualSimulationStep}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Poll Sensors</span>
          </button>

          <button
            onClick={() => {
              setIsSimulating(!isSimulating);
              if (!isSimulating) {
                success('Simulation Mode Active', 'Smart bin sensors will fluctuate every 5s with realistic readings.');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isSimulating
                ? 'bg-rose-500 hover:bg-rose-400 text-white animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Stop Live Simulation' : 'Live IoT Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Sensor Simulation Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Telemetry Mode:</strong> Fill levels, ultrasonic ranges, and battery voltages are simulated for hackathon evaluation and not connected to physical IoT gateways.
          </span>
        </div>
        {isSimulating && (
          <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Simulating</span>
          </span>
        )}
      </div>

      {/* Bin Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-semibold">Total Public Bins</span>
            <span className="text-xl font-bold text-white font-heading">{totalBins}</span>
          </div>
          <Trash2 className="w-5 h-5 text-slate-400" />
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-rose-400 block font-semibold">Collection Required (&gt;90%)</span>
            <span className="text-xl font-bold text-rose-400 font-heading">{criticalBins}</span>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 block font-semibold">Full (&gt;80%)</span>
            <span className="text-xl font-bold text-amber-300 font-heading">{fullBins}</span>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 block font-semibold">Normal / Available</span>
            <span className="text-xl font-bold text-emerald-300 font-heading">{normalBins + almostFullBins}</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bin ID, name, location..."
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
            <option value="Collection Required">Collection Required (&gt;90%)</option>
            <option value="Full">Full (80-89%)</option>
            <option value="Almost Full">Almost Full (60-79%)</option>
            <option value="Normal">Normal (&lt;60%)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
          >
            <option value="All">All Categories</option>
            <option value="Wet Waste">Wet Waste</option>
            <option value="Dry Waste">Dry Waste</option>
            <option value="Recyclables">Recyclables</option>
            <option value="Hazardous">Hazardous</option>
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
        </div>
      </div>

      {/* Bins Grid with Fill Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bins.map((bin) => {
          const fill = bin.fill_percentage;
          const isCritical = fill >= 90;
          const isFull = fill >= 80 && fill < 90;
          const isAlmost = fill >= 60 && fill < 80;

          let colorClass = 'from-emerald-500 to-teal-400';
          let textColor = 'text-emerald-400';
          if (isCritical) {
            colorClass = 'from-rose-500 to-red-600 animate-pulse';
            textColor = 'text-rose-400 font-extrabold';
          } else if (isFull) {
            colorClass = 'from-amber-500 to-orange-500';
            textColor = 'text-amber-400 font-bold';
          } else if (isAlmost) {
            colorClass = 'from-yellow-500 to-amber-400';
            textColor = 'text-yellow-400';
          }

          return (
            <div
              key={bin.id}
              onClick={() => setSelectedBin(bin)}
              className={`p-5 rounded-2xl bg-slate-900/70 border backdrop-blur-md transition-all cursor-pointer flex flex-col justify-between group hover:shadow-xl ${
                isCritical
                  ? 'border-rose-500/60 ring-1 ring-rose-500/40 shadow-rose-950/30'
                  : 'border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {bin.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isFull
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {bin.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {bin.name}
                </h3>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {bin.location}
                </p>

                {/* Fill Percentage Gauge & Bar */}
                <div className="my-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Fill Capacity</span>
                    <span className={`text-base font-mono ${textColor}`}>{fill}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                      style={{ width: `${Math.min(100, fill)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    <span>Battery: {bin.battery_level}%</span>
                  </div>
                  <div className="flex items-center gap-1 truncate text-right justify-end">
                    <span>{bin.category}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Cap: {bin.capacity_liters}L
                </span>

                {fill >= 80 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBin(bin);
                      setIsDispatchModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-950/50 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </button>
                ) : (
                  <span className="text-emerald-400 text-xs font-semibold">Inspect</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BIN DETAILS / DISPATCH MODAL */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {selectedBin.id}
                </span>
                <h3 className="text-xl font-bold text-white font-heading mt-1">
                  {selectedBin.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedBin(null);
                  setIsDispatchModalOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isDispatchModalOpen ? (
              /* Inspection View */
              <div className="space-y-4 my-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Current Fill Level</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {selectedBin.fill_percentage}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedBin.fill_percentage >= 90
                          ? 'bg-rose-500'
                          : selectedBin.fill_percentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${selectedBin.fill_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Location</strong>
                    <span>{selectedBin.location}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Ward</strong>
                    <span>{selectedBin.ward}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Waste Category</strong>
                    <span>{selectedBin.category}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Capacity</strong>
                    <span>{selectedBin.capacity_liters} Liters</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Solar Battery</strong>
                    <span>{selectedBin.battery_level}% (Optimal)</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Last Collection</strong>
                    <span>
                      {selectedBin.last_collection_time
                        ? new Date(selectedBin.last_collection_time).toLocaleDateString()
                        : 'Today'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  {selectedBin.fill_percentage >= 60 && hasPermission('assign_tasks') && (
                    <button
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Dispatch Emptying Truck</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBin(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer ml-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Dispatch Task Form */
              <form onSubmit={handleDispatchTask} className="space-y-4 my-4 text-xs">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  Scheduling collection route for <strong>{selectedBin.name}</strong> ({selectedBin.fill_percentage}% full).
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assign Field Worker *
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
                    Special Routing Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Empty bin, sanitize receptacle liner, inspect optical sensor..."
                    value={dispatchInstructions}
                    onChange={(e) => setDispatchInstructions(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
