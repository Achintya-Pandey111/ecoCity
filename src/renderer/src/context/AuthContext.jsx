import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEMO_ACCOUNTS = [
  {
    id: 'USR-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@ecocity.gov',
    role: 'admin',
    roleLabel: 'Chief Municipal Officer (Admin)',
    phone: '+1 (555) 234-8901',
    ward: 'Ward 3 - Metro Central',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    description: 'Full municipal oversight: Manage collection tasks, workers, bins, reports, and citywide analytics.'
  },
  {
    id: 'USR-002',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@ecocity.gov',
    role: 'worker',
    roleLabel: 'Senior Collection Worker',
    phone: '+1 (555) 872-4321',
    ward: 'Ward 4 - Sunrise Heights',
    workerId: 'WRK-01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: 'Field operations: View assigned routes, log collected weights, and update collection task status.'
  },
  {
    id: 'USR-003',
    name: 'Elena Rostova',
    email: 'elena.rostova@greencitizen.org',
    role: 'citizen',
    roleLabel: 'Eco-Conscious Citizen',
    phone: '+1 (555) 456-7890',
    ward: 'Ward 1 - Green Valley',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: 'Citizen portal: Report waste issues with photos, track complaints, learn segregation, and take quizzes.'
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ecocity_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEMO_ACCOUNTS[0]; // Default: Sarah Jenkins (Admin)
  });

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ecocity_active_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const switchUser = (account) => {
    setCurrentUser(account);
    setIsDemoModalOpen(false);
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    switch (permission) {
      case 'view_dashboard':
        return true;
      case 'view_segregation':
        return true;
      case 'submit_report':
        return true;
      case 'view_reports':
        return true;
      case 'assign_tasks':
        return currentUser.role === 'admin';
      case 'manage_tasks':
        return currentUser.role === 'admin' || currentUser.role === 'worker';
      case 'complete_task':
        return currentUser.role === 'admin' || currentUser.role === 'worker';
      case 'manage_bins':
        return currentUser.role === 'admin';
      case 'view_bins':
        return currentUser.role === 'admin' || currentUser.role === 'worker';
      case 'view_analytics':
        return currentUser.role === 'admin';
      case 'export_data':
        return currentUser.role === 'admin';
      case 'manage_workers':
        return currentUser.role === 'admin';
      case 'manage_settings':
        return currentUser.role === 'admin';
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        isDemoModalOpen,
        setIsDemoModalOpen,
        hasPermission,
        demoAccounts: DEMO_ACCOUNTS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
