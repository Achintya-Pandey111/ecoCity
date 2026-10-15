import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Recycle,
  AlertTriangle,
  Truck,
  Trash2,
  BarChart3,
  Bell,
  Users,
  Settings,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ unreadNotificationsCount = 0 }) {
  const { currentUser, setIsDemoModalOpen } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'worker', 'citizen']
    },
    {
      name: 'Segregation Assistant',
      path: '/segregation',
      icon: Recycle,
      badge: 'AI Guide',
      roles: ['admin', 'worker', 'citizen']
    },
    {
      name: 'Waste Reports',
      path: '/reports',
      icon: AlertTriangle,
      roles: ['admin', 'worker', 'citizen']
    },
    {
      name: 'Collection Management',
      path: '/tasks',
      icon: Truck,
      roles: ['admin', 'worker']
    },
    {
      name: 'Smart Bins',
      path: '/bins',
      icon: Trash2,
      badge: 'IoT',
      roles: ['admin', 'worker']
    },
    {
      name: 'Analytics & Impact',
      path: '/analytics',
      icon: BarChart3,
      roles: ['admin']
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badgeCount: unreadNotificationsCount,
      roles: ['admin', 'worker', 'citizen']
    },
    {
      name: 'Users & Workers',
      path: '/workers',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['admin']
    }
  ];

  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(currentUser?.role || 'admin')
  );

  return (
    <aside className="w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col h-screen shrink-0 backdrop-blur-xl select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Recycle className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                EcoCity
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Waste Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Navigation
        </div>

        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-700/80 text-emerald-100'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.badgeCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badgeCount}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Demo Account Switcher Card */}
      <div className="p-3 m-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Demo Role</span>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors underline cursor-pointer"
          >
            Switch
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/40"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser?.role === 'admin'
                    ? 'bg-emerald-400'
                    : currentUser?.role === 'worker'
                    ? 'bg-blue-400'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-300 truncate">
                {currentUser?.role === 'admin'
                  ? 'Administrator'
                  : currentUser?.role === 'worker'
                  ? 'Field Worker'
                  : 'Citizen User'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer"
        >
          <span>Change Role / Persona</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
