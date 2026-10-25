import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import DemoUserModal from './components/common/DemoUserModal';
import { api } from './services/api';

// Pages
import Dashboard from './pages/Dashboard';
import SegregationAssistant from './pages/SegregationAssistant';
import WasteReports from './pages/WasteReports';
import CollectionManagement from './pages/CollectionManagement';
import SmartBins from './pages/SmartBins';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import UsersWorkers from './pages/UsersWorkers';
import Settings from './pages/Settings';

// Protected Route Component
function ProtectedRoute({ permission, children }) {
  const { hasPermission } = useAuth();
  if (permission && !hasPermission(permission)) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-bold text-rose-400">Restricted Module</h3>
        <p className="text-xs text-slate-400 mt-2">
          Your active demonstration persona does not have access to this municipal module.
        </p>
      </div>
    );
  }
  return children;
}

function MainLayout() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Executive Operations Dashboard', subtitle: 'Live municipal solid waste stream telemetry' };
      case '/segregation':
        return { title: 'Waste Segregation Assistant', subtitle: 'Citizen disposal directory and interactive educational skills quiz' };
      case '/reports':
        return { title: 'Waste Grievance Reporting', subtitle: 'Digital citizen reports and complaint lifecycle tracking' };
      case '/tasks':
        return { title: 'Collection Task Management', subtitle: 'Municipal collection routes, worker dispatches, and weighbridge logs' };
      case '/bins':
        return { title: 'Smart Bin Telemetry', subtitle: 'Real-time public bin ultrasonic level tracking and auto-dispatch' };
      case '/analytics':
        return { title: 'Analytics & Sustainability Scorecard', subtitle: 'Circular economy metrics, EPA WARM models, and CSV reports' };
      case '/notifications':
        return { title: 'Operational Event Feed', subtitle: 'Urgent alerts, collection status changes, and dispatch notices' };
      case '/workers':
        return { title: 'Workforce & Personas', subtitle: 'Field staff roster, shift assignments, and demonstration accounts' };
      case '/settings':
        return { title: 'Application Settings', subtitle: 'Jurisdiction metadata, alert rules, and demo database reset' };
      default:
        return { title: 'EcoCity Platform', subtitle: 'Smart Urban Waste Management System' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar unreadNotificationsCount={unreadCount} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        />

        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/segregation" element={<SegregationAssistant />} />
            <Route path="/reports" element={<WasteReports />} />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute permission="manage_tasks">
                  <CollectionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bins"
              element={
                <ProtectedRoute permission="view_bins">
                  <SmartBins />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute permission="view_analytics">
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <Notifications onRefreshNotifications={loadNotifications} />
              }
            />
            <Route
              path="/workers"
              element={
                <ProtectedRoute permission="manage_workers">
                  <UsersWorkers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute permission="manage_settings">
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <DemoUserModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <MainLayout />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
