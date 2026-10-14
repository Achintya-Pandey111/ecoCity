/**
 * Safe client API wrapper for Electron IPC.
 */

const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    if (electronAPI?.getDashboardStats) {
      return await electronAPI.getDashboardStats();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Reports
  getReports: async (filters = {}) => {
    if (electronAPI?.getReports) {
      return await electronAPI.getReports(filters);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  getReportById: async (id) => {
    if (electronAPI?.getReportById) {
      return await electronAPI.getReportById(id);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  createReport: async (reportData) => {
    if (electronAPI?.createReport) {
      return await electronAPI.createReport(reportData);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  updateReportStatus: async (params) => {
    if (electronAPI?.updateReportStatus) {
      return await electronAPI.updateReportStatus(params);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Tasks
  getTasks: async (filters = {}) => {
    if (electronAPI?.getTasks) {
      return await electronAPI.getTasks(filters);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  getTaskById: async (id) => {
    if (electronAPI?.getTaskById) {
      return await electronAPI.getTaskById(id);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  createTask: async (taskData) => {
    if (electronAPI?.createTask) {
      return await electronAPI.createTask(taskData);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  updateTaskStatus: async (params) => {
    if (electronAPI?.updateTaskStatus) {
      return await electronAPI.updateTaskStatus(params);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Bins
  getBins: async (filters = {}) => {
    if (electronAPI?.getBins) {
      return await electronAPI.getBins(filters);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  updateBinFill: async (params) => {
    if (electronAPI?.updateBinFill) {
      return await electronAPI.updateBinFill(params);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  simulateBinReadings: async () => {
    if (electronAPI?.simulateBinReadings) {
      return await electronAPI.simulateBinReadings();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Workers
  getWorkers: async (filters = {}) => {
    if (electronAPI?.getWorkers) {
      return await electronAPI.getWorkers(filters);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  createWorker: async (workerData) => {
    if (electronAPI?.createWorker) {
      return await electronAPI.createWorker(workerData);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Notifications
  getNotifications: async () => {
    if (electronAPI?.getNotifications) {
      return await electronAPI.getNotifications();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  markNotificationRead: async (id) => {
    if (electronAPI?.markNotificationRead) {
      return await electronAPI.markNotificationRead(id);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  markAllNotificationsRead: async () => {
    if (electronAPI?.markAllNotificationsRead) {
      return await electronAPI.markAllNotificationsRead();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  deleteNotification: async (id) => {
    if (electronAPI?.deleteNotification) {
      return await electronAPI.deleteNotification(id);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Analytics & CSV Export
  getAnalytics: async (options = {}) => {
    if (electronAPI?.getAnalytics) {
      return await electronAPI.getAnalytics(options);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  exportAnalyticsCSV: async (options = {}) => {
    if (electronAPI?.exportAnalyticsCSV) {
      return await electronAPI.exportAnalyticsCSV(options);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Settings
  getSettings: async () => {
    if (electronAPI?.getSettings) {
      return await electronAPI.getSettings();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  updateSettings: async (settingsMap) => {
    if (electronAPI?.updateSettings) {
      return await electronAPI.updateSettings(settingsMap);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  resetDemoDatabase: async () => {
    if (electronAPI?.resetDemoDatabase) {
      return await electronAPI.resetDemoDatabase();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Users
  getUsers: async () => {
    if (electronAPI?.getUsers) {
      return await electronAPI.getUsers();
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  // Quiz
  saveQuizResult: async (resultData) => {
    if (electronAPI?.saveQuizResult) {
      return await electronAPI.saveQuizResult(resultData);
    }
    return { success: false, error: 'Electron API unavailable' };
  },

  getQuizHistory: async () => {
    if (electronAPI?.getQuizHistory) {
      return await electronAPI.getQuizHistory();
    }
    return { success: false, error: 'Electron API unavailable' };
  }
};
