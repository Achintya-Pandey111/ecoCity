import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  AlertTriangle,
  Building,
  Bell,
  Sliders,
  CheckCircle2,
  Trash2,
  Database,
  Info,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [settings, setSettings] = useState({
    cityName: 'Metropolis Municipal Corporation',
    divisionName: 'GreenCity Solid Waste Management Directorate',
    binAlertThreshold: '80',
    co2CompostingFactor: '0.52',
    co2RecyclingFactor: '1.45',
    treesSavedPerTonPaper: '17.0',
    notificationEmail: 'alerts@ecocity.gov'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateSettings(settings);
      if (res.success) {
        success('Settings Saved', 'Municipal configuration updated and persisted to SQLite.');
      } else {
        error('Error', res.error || 'Failed to update settings.');
      }
    } catch (err) {
      error('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      setResetting(true);
      const res = await api.resetDemoDatabase();
      if (res.success) {
        success('Database Reset', 'Demo database restored to fresh fictional dataset.');
        setIsResetModalOpen(false);
        loadSettings();
      } else {
        error('Error', res.error || 'Failed to reset database.');
      }
    } catch (err) {
      error('Error', err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <SettingsIcon className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Application & Municipal Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure jurisdiction metadata, sensor fill thresholds, environmental calculation factors, and demo storage.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Municipal Jurisdiction Identity */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-heading">
              Municipal Corporation Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                City / Municipal Corporation Title
              </label>
              <input
                type="text"
                value={settings.cityName}
                onChange={(e) => setSettings({ ...settings, cityName: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Division / Department Name
              </label>
              <input
                type="text"
                value={settings.divisionName}
                onChange={(e) => setSettings({ ...settings, divisionName: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: IoT Smart Bin Telemetry Thresholds */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-sm text-white font-heading">
              Smart Bin Telemetry & Dispatch Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Critical Fill Alert Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={settings.binAlertThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, binAlertThreshold: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Bins exceeding this percentage trigger high-priority dispatch notifications.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Emergency Alert Contact Email
              </label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) =>
                  setSettings({ ...settings, notificationEmail: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Sustainability Calculation Model Parameters */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-white font-heading">
              Environmental Impact Model Factors (EPA WARM Standard)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                CO₂e Factor: Composting (kg CO₂e / kg organic)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.co2CompostingFactor}
                onChange={(e) =>
                  setSettings({ ...settings, co2CompostingFactor: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                CO₂e Factor: Recycling (kg CO₂e / kg recycled)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.co2RecyclingFactor}
                onChange={(e) =>
                  setSettings({ ...settings, co2RecyclingFactor: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mature Trees Saved per Ton of Recycled Paper
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.treesSavedPerTonPaper}
                onChange={(e) =>
                  setSettings({ ...settings, treesSavedPerTonPaper: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Action Button: Save Configuration */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset Demo Database */}
      <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Demo Data Reset Zone</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Restore the local SQLite database to its factory demonstration state. This re-populates all 5 wards, 10 workers, 16 bins, 22 tasks, and 22 citizen complaints.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* RESET CONFIRMATION DIALOG */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white font-heading">
                Confirm Database Reset
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to re-seed the SQLite database? Any new reports or tasks created during this session will be replaced by the default demonstration dataset.
            </p>

            <div className="flex justify-end gap-3">
              <button
                disabled={resetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={resetting}
                onClick={handleResetDemoData}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
