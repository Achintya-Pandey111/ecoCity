import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Recycle,
  CheckCircle2,
  AlertTriangle,
  Users,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, setIsDemoModalOpen } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading municipal waste telemetry...</p>
        </div>
      </div>
    );
  }

  const {
    totalWasteCollectedKg = 0,
    segregationRate = 0,
    recyclingRate = 0,
    pendingRequests = 0,
    activeWorkers = 0,
    overflowingBins = 0,
    weeklyTrend = [],
    composition = [],
    wardPerformance = [],
    tasksSummary = {},
    recentReports = [],
    upcomingTasks = []
  } = stats || {};

  const totalTons = (totalWasteCollectedKg / 1000).toFixed(1);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner / Welcome card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live City Operations
              </span>
              <span className="text-xs text-slate-400">
                Synchronized with Local SQLite Database
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-heading mt-1">
              Solid Waste Management Directorate
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Monitoring segregation fidelity, smart bin telemetry, active field collection routes, and circular recycling diversion across 5 municipal wards.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Demo Persona</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Waste */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Collected</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-heading">{totalTons} <span className="text-xs font-normal text-slate-400">tons</span></div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>{totalWasteCollectedKg.toLocaleString()} kg diverted</span>
            </div>
          </div>
        </div>

        {/* Card 2: Segregation Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Segregated Correctly</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-300 font-heading">{segregationRate}%</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>City compliance goal: 85%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Recycling Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recycling Rate</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-300 font-heading">{recyclingRate}%</div>
            <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
              <span>Diverted from landfills</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Requests */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Reports</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-heading">{pendingRequests}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Awaiting resolution</span>
            </div>
          </div>
        </div>

        {/* Card 5: Active Workers */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Workers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-heading">{activeWorkers}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>On active collection shifts</span>
            </div>
          </div>
        </div>

        {/* Card 6: Overflowing Bins */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overflowing Bins</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400 font-heading">{overflowingBins}</div>
            <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <span>&gt;80% capacity alert</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                7-Day Waste Collection Trends
              </h3>
              <p className="text-xs text-slate-400">
                Daily municipal tonnage by waste category (kg)
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
              Last 7 Days
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="recycGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="wet" name="Wet / Organic" stroke="#10B981" fillOpacity={1} fill="url(#wetGrad)" />
                <Area type="monotone" dataKey="dry" name="Dry Waste" stroke="#3B82F6" fillOpacity={1} fill="url(#dryGrad)" />
                <Area type="monotone" dataKey="recyclable" name="Recyclables" stroke="#F59E0B" fillOpacity={1} fill="url(#recycGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Composition Donut Chart (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white font-heading">
              Waste Composition Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Citywide generation by stream
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={composition}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {composition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} kg`, 'Weight']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {composition.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-300 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ward Performance Bar Chart & Completion Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Performance Bar Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                Ward-Wise Waste Generation & Recycling
              </h3>
              <p className="text-xs text-slate-400">
                Total collection vs. recycling diversion across the 5 fictional municipal wards
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="ward"
                  stroke="#64748B"
                  fontSize={10}
                  tickFormatter={(w) => w.split(' - ')[1] || w}
                />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="total_collected" name="Total Collected (kg)" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_recycled" name="Recycled (kg)" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Efficiency Card (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white font-heading">
              Collection Completion Efficiency
            </h3>
            <p className="text-xs text-slate-400">
              Active cycle route execution status
            </p>
          </div>

          <div className="my-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Overall Task Completion Rate</span>
                <span className="text-emerald-400">{tasksSummary.completionRate || 0}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${tasksSummary.completionRate || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800">
              <div className="p-2.5 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400">Pending</div>
                <div className="text-base font-bold text-amber-400 mt-1">{tasksSummary.pending || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400">In Progress</div>
                <div className="text-base font-bold text-blue-400 mt-1">{tasksSummary.inProgress || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400">Completed</div>
                <div className="text-base font-bold text-emerald-400 mt-1">{tasksSummary.completed || 0}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Manage All Collection Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Columns: Recent Citizen Reports & Upcoming Collection Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Citizen Reports */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                Recent Citizen Reports
              </h3>
              <p className="text-xs text-slate-400">
                Digital complaints submitted across city wards
              </p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {recentReports.slice(0, 4).map((report) => (
              <div key={report.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate">
                      {report.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        report.priority === 'Urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : report.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700/40 text-slate-300'
                      }`}
                    >
                      {report.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {report.ward}
                    </span>
                    <span>Reporter: {report.reporter_name}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Collection Tasks */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                Upcoming Collection Tasks
              </h3>
              <p className="text-xs text-slate-400">
                Scheduled routes pending or in progress
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {upcomingTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate">
                      {task.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {task.waste_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {task.location}
                    </span>
                    <span>Assigned: {task.worker_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
                      task.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
