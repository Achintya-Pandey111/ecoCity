import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TreeDeciduous,
  CloudLightning,
  Boxes,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Leaf,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const WARDS = [
  'All',
  'Ward 1 - Green Valley',
  'Ward 2 - Riverdale',
  'Ward 3 - Metro Central',
  'Ward 4 - Sunrise Heights',
  'Ward 5 - Eco Tech Park'
];

export default function Analytics() {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [ward, setWard] = useState('All');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('historical'); // 'historical' | 'reports' | 'tasks'

  useEffect(() => {
    loadAnalytics();
  }, [ward]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics({ ward });
      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await api.exportAnalyticsCSV({ type: exportType, ward });
      if (res.success) {
        success('Export Successful', `Exported ${res.rowCount} records to CSV file.`);
      } else if (!res.canceled) {
        error('Export Failed', res.error || 'Failed to generate CSV export.');
      }
    } catch (e) {
      error('Error', e.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Computing sustainability algorithms...</p>
        </div>
      </div>
    );
  }

  const { summary, sustainability, dailyTrends = [], wardComparison = [], reportsSummary } = data;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and CSV Export Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              City Analytics & Circular Economy Scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Empirical waste diversion metrics, carbon offset estimations, and downloadable datasets for municipal audit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Ward filter dropdown */}
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            {WARDS.map((w) => (
              <option key={w} value={w}>
                {w === 'All' ? 'All Municipal Wards' : w}
              </option>
            ))}
          </select>

          {/* Export Type */}
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="historical">Collection Telemetry CSV</option>
            <option value="reports">Citizen Reports CSV</option>
            <option value="tasks">Collection Tasks CSV</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Sustainability Impact Cards (Clearly documented calculation model) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CO2 Emissions Prevented */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">CO₂e Emissions Prevented</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CloudLightning className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-heading">
              {sustainability.co2PreventedKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg CO₂e</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Estimated methane & incineration offset
            </p>
          </div>
        </div>

        {/* Trees Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Trees Preserved</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <TreeDeciduous className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-300 font-heading">
              {sustainability.treesSaved} <span className="text-xs font-normal text-slate-400">mature trees</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Derived from paper recycling recovery
            </p>
          </div>
        </div>

        {/* Landfill Space Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Landfill Airspace Saved</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-300 font-heading">
              {sustainability.landfillSpaceSavedM3} <span className="text-xs font-normal text-slate-400">m³</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Solid waste diverted from open dumping
            </p>
          </div>
        </div>

        {/* Organic Composted */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Organic Compost Yield</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-heading">
              {summary.compostedKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Distributed to city parks and organic farms
            </p>
          </div>
        </div>
      </div>

      {/* Model Transparency Box */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-200">Environmental Savings Estimation Methodology:</strong>
          <p>{sustainability.calculationNotes.co2Model}</p>
          <p>{sustainability.calculationNotes.treesModel}</p>
          <p>{sustainability.calculationNotes.landfillModel}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Recovery Trends Chart */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                Daily Recycling & Composting Recovery (kg)
              </h3>
              <p className="text-xs text-slate-400">
                14-day chronological diversion progression
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="composted" name="Composted (kg)" stroke="#10B981" fillOpacity={1} fill="url(#compGrad)" />
                <Area type="monotone" dataKey="recycled" name="Recycled (kg)" stroke="#3B82F6" fillOpacity={1} fill="url(#recGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward-wise Recycling Rate Comparison */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                Ward Recycling Efficiency Rate (%)
              </h3>
              <p className="text-xs text-slate-400">
                Percentage of total municipal generation diverted to recycling
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardComparison} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="ward"
                  stroke="#64748B"
                  fontSize={10}
                  tickFormatter={(w) => w.split(' - ')[1] || w}
                />
                <YAxis stroke="#64748B" fontSize={11} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Recycling Rate']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                />
                <Bar dataKey="recycling_rate" name="Recycling Rate (%)" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Citizen Complaint Resolution Efficiency */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-base text-white font-heading">
            Citizen Grievance Redressal Performance
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Citizen reports submitted through EcoCity resolved within target municipal SLA of 48 hours.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <div className="text-xs text-slate-400">Total Filed</div>
            <div className="text-xl font-bold text-white mt-1">{reportsSummary.total}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Resolved</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{reportsSummary.resolved}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Resolution Rate</div>
            <div className="text-2xl font-black text-emerald-400 font-heading mt-1">
              {reportsSummary.resolutionRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
