import React from 'react';
import { X, ShieldCheck, Truck, Users, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function DemoUserModal() {
  const { currentUser, switchUser, isDemoModalOpen, setIsDemoModalOpen, demoAccounts } = useAuth();
  const { success } = useToast();

  if (!isDemoModalOpen) return null;

  const handleSelect = (account) => {
    switchUser(account);
    success('Role Switched', `Now logged in as ${account.name} (${account.roleLabel})`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Background gradient accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white font-heading">
                Select Demonstration Persona
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Switch roles to evaluate role-specific workflows and permission boundaries.
            </p>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="my-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span>
            <strong>Hackathon Demo Mode:</strong> Demonstrates role permissions without password friction. Seeded with fictional municipal data.
          </span>
        </div>

        {/* Persona Options */}
        <div className="space-y-3 my-4">
          {demoAccounts.map((account) => {
            const isSelected = currentUser?.id === account.id;

            return (
              <div
                key={account.id}
                onClick={() => handleSelect(account)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{account.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          account.role === 'admin'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : account.role === 'worker'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {account.roleLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">
                      {account.description}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Assigned Ward: {account.ward}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isSelected ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md">
                      <CheckCircle className="w-4 h-4" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors">
                      Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
