const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose secure, sandboxed IPC bridges to the React renderer.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:get-stats'),

  // Waste Reports
  getReports: (filters) => ipcRenderer.invoke('reports:get-all', filters),
  getReportById: (id) => ipcRenderer.invoke('reports:get-by-id', id),
  createReport: (reportData) => ipcRenderer.invoke('reports:create', reportData),
  updateReportStatus: (params) => ipcRenderer.invoke('reports:update-status', params),

  // Collection Tasks
  getTasks: (filters) => ipcRenderer.invoke('tasks:get-all', filters),
  getTaskById: (id) => ipcRenderer.invoke('tasks:get-by-id', id),
  createTask: (taskData) => ipcRenderer.invoke('tasks:create', taskData),
  updateTaskStatus: (params) => ipcRenderer.invoke('tasks:update-status', params),

  // Smart Bins
  getBins: (filters) => ipcRenderer.invoke('bins:get-all', filters),
  updateBinFill: (params) => ipcRenderer.invoke('bins:update-fill', params),
  simulateBinReadings: () => ipcRenderer.invoke('bins:simulate-readings'),

  // Workers
  getWorkers: (filters) => ipcRenderer.invoke('workers:get-all', filters),
  createWorker: (workerData) => ipcRenderer.invoke('workers:create', workerData),

  // Notifications
  getNotifications: () => ipcRenderer.invoke('notifications:get-all'),
  markNotificationRead: (id) => ipcRenderer.invoke('notifications:mark-read', id),
  markAllNotificationsRead: () => ipcRenderer.invoke('notifications:mark-all-read'),
  deleteNotification: (id) => ipcRenderer.invoke('notifications:delete', id),

  // Analytics & Export
  getAnalytics: (options) => ipcRenderer.invoke('analytics:get-data', options),
  exportAnalyticsCSV: (options) => ipcRenderer.invoke('analytics:export-csv', options),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get-all'),
  updateSettings: (settingsMap) => ipcRenderer.invoke('settings:update', settingsMap),
  resetDemoDatabase: () => ipcRenderer.invoke('settings:reset-demo'),

  // Users
  getUsers: () => ipcRenderer.invoke('users:get-all'),

  // Educational Quiz
  saveQuizResult: (data) => ipcRenderer.invoke('quiz:save-result', data),
  getQuizHistory: () => ipcRenderer.invoke('quiz:get-history'),

  // Platform info
  platform: process.platform
});
