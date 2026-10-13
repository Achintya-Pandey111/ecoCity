const { ipcMain, dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const db = require('../database');

/**
 * Register all Electron IPC handlers with secure validation.
 */
function registerIpcHandlers(mainWindow) {
  // 1. Dashboard Statistics Handler
  ipcMain.handle('dashboard:get-stats', async () => {
    try {
      // Historical totals
      const histSummary = db.query(`
        SELECT 
          SUM(total_kg) as total_kg,
          SUM(wet_kg) as wet_kg,
          SUM(dry_kg) as dry_kg,
          SUM(recyclable_kg) as recyclable_kg,
          SUM(hazardous_kg) as hazardous_kg,
          SUM(composted_kg) as composted_kg,
          SUM(recycled_kg) as recycled_kg
        FROM historical_collections
      `)[0] || {};

      // Current tasks completed weight
      const completedTasksWeight = db.query(`
        SELECT SUM(collected_weight_kg) as current_completed_kg
        FROM collection_tasks
        WHERE status = 'Completed'
      `)[0]?.current_completed_kg || 0;

      const totalWasteCollectedKg = Math.round(((histSummary.total_kg || 0) + completedTasksWeight) * 10) / 10;
      const totalWet = (histSummary.wet_kg || 0);
      const totalRecyclable = (histSummary.recyclable_kg || 0);
      const totalAll = histSummary.total_kg || 1;

      // Segregation rate: (Wet + Recyclables properly segregated) / total
      const segregationRate = Math.min(100, Math.round(((totalWet + totalRecyclable) / totalAll) * 1000) / 10);
      const recyclingRate = Math.min(100, Math.round(((histSummary.recycled_kg || 0) / totalAll) * 1000) / 10);

      // Counts
      const pendingRequests = db.query(`
        SELECT COUNT(*) as count 
        FROM waste_reports 
        WHERE status IN ('Submitted', 'Assigned', 'In Progress')
      `)[0]?.count || 0;

      const activeWorkers = db.query(`
        SELECT COUNT(*) as count 
        FROM workers 
        WHERE status IN ('Active', 'On Route')
      `)[0]?.count || 0;

      const overflowingBins = db.query(`
        SELECT COUNT(*) as count 
        FROM waste_bins 
        WHERE status IN ('Full', 'Collection Required')
      `)[0]?.count || 0;

      // Weekly trends (last 7 days grouped by date)
      const weeklyTrend = db.query(`
        SELECT 
          collection_date as date,
          SUM(total_kg) as total,
          SUM(wet_kg) as wet,
          SUM(dry_kg) as dry,
          SUM(recyclable_kg) as recyclable,
          SUM(hazardous_kg) as hazardous,
          SUM(recycled_kg) as recycled
        FROM historical_collections
        GROUP BY collection_date
        ORDER BY collection_date DESC
        LIMIT 7
      `).reverse();

      // Composition totals for pie chart
      const composition = [
        { name: 'Wet / Biodegradable', value: Math.round(histSummary.wet_kg || 0), color: '#10B981' },
        { name: 'Dry Recyclables', value: Math.round(histSummary.recyclable_kg || 0), color: '#3B82F6' },
        { name: 'Dry Non-Recyclable', value: Math.round(histSummary.dry_kg || 0), color: '#6B7280' },
        { name: 'Hazardous Waste', value: Math.round(histSummary.hazardous_kg || 0), color: '#EF4444' }
      ];

      // Ward-wise performance
      const wardPerformance = db.query(`
        SELECT 
          ward,
          SUM(total_kg) as total_collected,
          SUM(recycled_kg) as total_recycled,
          ROUND((SUM(recycled_kg) / SUM(total_kg)) * 100, 1) as recycling_rate
        FROM historical_collections
        GROUP BY ward
        ORDER BY total_collected DESC
      `);

      // Task completion metrics
      const taskCounts = db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM collection_tasks
        GROUP BY status
      `);

      const tasksSummary = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
      };
      for (const t of taskCounts) {
        tasksSummary.total += t.count;
        if (t.status === 'Pending') tasksSummary.pending = t.count;
        if (t.status === 'In Progress') tasksSummary.inProgress = t.count;
        if (t.status === 'Completed') tasksSummary.completed = t.count;
      }
      tasksSummary.completionRate = tasksSummary.total > 0
        ? Math.round((tasksSummary.completed / tasksSummary.total) * 100)
        : 0;

      // Recent citizen reports
      const recentReports = db.query(`
        SELECT * FROM waste_reports
        ORDER BY created_at DESC
        LIMIT 5
      `);

      // Upcoming collection tasks
      const upcomingTasks = db.query(`
        SELECT t.*, w.name as worker_name, w.phone as worker_phone
        FROM collection_tasks t
        LEFT JOIN workers w ON t.assigned_worker_id = w.id
        WHERE t.status != 'Completed'
        ORDER BY 
          CASE t.priority 
            WHEN 'Urgent' THEN 1 
            WHEN 'High' THEN 2 
            WHEN 'Medium' THEN 3 
            ELSE 4 
          END,
          t.created_at DESC
        LIMIT 5
      `);

      return {
        success: true,
        data: {
          totalWasteCollectedKg,
          segregationRate,
          recyclingRate,
          pendingRequests,
          activeWorkers,
          overflowingBins,
          weeklyTrend,
          composition,
          wardPerformance,
          tasksSummary,
          recentReports,
          upcomingTasks
        }
      };
    } catch (err) {
      console.error('[IPC dashboard:get-stats]', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Waste Reports Handlers
  ipcMain.handle('reports:get-all', async (event, filters = {}) => {
    try {
      let sql = `
        SELECT r.*, w.name as assigned_worker_name
        FROM waste_reports r
        LEFT JOIN workers w ON r.assigned_worker_id = w.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status && filters.status !== 'All') {
        sql += ` AND r.status = ?`;
        params.push(filters.status);
      }
      if (filters.priority && filters.priority !== 'All') {
        sql += ` AND r.priority = ?`;
        params.push(filters.priority);
      }
      if (filters.ward && filters.ward !== 'All') {
        sql += ` AND r.ward = ?`;
        params.push(filters.ward);
      }
      if (filters.category && filters.category !== 'All') {
        sql += ` AND r.problem_category = ?`;
        params.push(filters.category);
      }
      if (filters.search) {
        sql += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.address LIKE ? OR r.id LIKE ?)`;
        const s = `%${filters.search}%`;
        params.push(s, s, s, s);
      }

      sql += ` ORDER BY r.created_at DESC`;
      const reports = db.query(sql, params);
      return { success: true, data: reports };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:get-by-id', async (event, id) => {
    try {
      const reports = db.query(`
        SELECT r.*, w.name as assigned_worker_name, w.phone as assigned_worker_phone
        FROM waste_reports r
        LEFT JOIN workers w ON r.assigned_worker_id = w.id
        WHERE r.id = ?
      `, [id]);
      if (reports.length === 0) return { success: false, error: 'Report not found' };
      return { success: true, data: reports[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:create', async (event, reportData) => {
    try {
      const {
        title,
        problem_category,
        description,
        ward,
        address,
        priority = 'Medium',
        photo_url = null,
        reporter_name = 'Citizen Reporter',
        reporter_contact = ''
      } = reportData;

      if (!title || !problem_category || !ward) {
        return { success: false, error: 'Title, category, and ward are required' };
      }

      // Generate sequence ID
      const countRes = db.query(`SELECT COUNT(*) as count FROM waste_reports`);
      const nextSeq = (countRes[0]?.count || 0) + 1;
      const id = `REP-2026-${String(nextSeq).padStart(4, '0')}`;
      const now = new Date().toISOString();

      db.run(`
        INSERT INTO waste_reports 
          (id, title, problem_category, description, ward, address, priority, status, photo_url, reporter_name, reporter_contact, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?)
      `, [id, title, problem_category, description || '', ward, address || '', priority, photo_url, reporter_name, reporter_contact, now, now]);

      // Add Notification
      const notifId = `NOTIF-${Date.now()}`;
      db.run(`
        INSERT INTO notifications (id, title, message, type, severity, link_to, is_read, created_at)
        VALUES (?, ?, ?, 'report', ?, '/reports', 0, ?)
      `, [
        notifId,
        `New Report: ${title.slice(0, 40)}`,
        `${reporter_name} submitted a new ${priority.toLowerCase()} priority report for ${ward}.`,
        priority === 'Urgent' ? 'critical' : priority === 'High' ? 'warning' : 'info',
        now
      ]);

      return { success: true, data: { id } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:update-status', async (event, { id, status, assigned_worker_id, resolution_notes }) => {
    try {
      const now = new Date().toISOString();
      let sql = `UPDATE waste_reports SET status = ?, updated_at = ?`;
      const params = [status, now];

      if (assigned_worker_id !== undefined) {
        sql += `, assigned_worker_id = ?`;
        params.push(assigned_worker_id);
      }
      if (resolution_notes !== undefined) {
        sql += `, resolution_notes = ?`;
        params.push(resolution_notes);
      }

      sql += ` WHERE id = ?`;
      params.push(id);

      db.run(sql, params);

      if (status === 'Resolved') {
        const notifId = `NOTIF-${Date.now()}`;
        db.run(`
          INSERT INTO notifications (id, title, message, type, severity, link_to, is_read, created_at)
          VALUES (?, ?, ?, 'resolved', 'success', '/reports', 0, ?)
        `, [
          notifId,
          `Report Resolved: ${id}`,
          `Report ${id} has been marked as resolved.${resolution_notes ? ` Notes: ${resolution_notes}` : ''}`,
          now
        ]);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 3. Collection Tasks Handlers
  ipcMain.handle('tasks:get-all', async (event, filters = {}) => {
    try {
      let sql = `
        SELECT t.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_assigned
        FROM collection_tasks t
        LEFT JOIN workers w ON t.assigned_worker_id = w.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status && filters.status !== 'All') {
        sql += ` AND t.status = ?`;
        params.push(filters.status);
      }
      if (filters.worker_id && filters.worker_id !== 'All') {
        sql += ` AND t.assigned_worker_id = ?`;
        params.push(filters.worker_id);
      }
      if (filters.ward && filters.ward !== 'All') {
        sql += ` AND t.ward = ?`;
        params.push(filters.ward);
      }
      if (filters.priority && filters.priority !== 'All') {
        sql += ` AND t.priority = ?`;
        params.push(filters.priority);
      }
      if (filters.search) {
        sql += ` AND (t.title LIKE ? OR t.location LIKE ? OR t.id LIKE ?)`;
        const s = `%${filters.search}%`;
        params.push(s, s, s);
      }

      sql += `
        ORDER BY 
          CASE t.status
            WHEN 'In Progress' THEN 1
            WHEN 'Pending' THEN 2
            WHEN 'Completed' THEN 3
            ELSE 4
          END,
          CASE t.priority
            WHEN 'Urgent' THEN 1
            WHEN 'High' THEN 2
            WHEN 'Medium' THEN 3
            ELSE 4
          END,
          t.created_at DESC
      `;

      const tasks = db.query(sql, params);
      return { success: true, data: tasks };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tasks:get-by-id', async (event, id) => {
    try {
      const tasks = db.query(`
        SELECT t.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_assigned,
               r.title as report_title, r.description as report_description,
               b.name as bin_name, b.fill_percentage as bin_fill
        FROM collection_tasks t
        LEFT JOIN workers w ON t.assigned_worker_id = w.id
        LEFT JOIN waste_reports r ON t.related_report_id = r.id
        LEFT JOIN waste_bins b ON t.related_bin_id = b.id
        WHERE t.id = ?
      `, [id]);
      if (tasks.length === 0) return { success: false, error: 'Task not found' };
      return { success: true, data: tasks[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tasks:create', async (event, taskData) => {
    try {
      const {
        title,
        ward,
        location,
        waste_type,
        scheduled_date,
        priority = 'Medium',
        assigned_worker_id = null,
        related_report_id = null,
        related_bin_id = null,
        target_weight_kg = 50.0,
        special_instructions = ''
      } = taskData;

      if (!title || !ward || !waste_type) {
        return { success: false, error: 'Title, ward, and waste type are required' };
      }

      const countRes = db.query(`SELECT COUNT(*) as count FROM collection_tasks`);
      const nextSeq = (countRes[0]?.count || 0) + 1;
      const id = `TSK-2026-${String(nextSeq).padStart(4, '0')}`;
      const now = new Date().toISOString();

      db.run(`
        INSERT INTO collection_tasks
          (id, title, ward, location, waste_type, scheduled_date, priority, status, assigned_worker_id, related_report_id, related_bin_id, target_weight_kg, collected_weight_kg, special_instructions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 0.0, ?, ?)
      `, [
        id, title, ward, location || '', waste_type,
        scheduled_date || now.split('T')[0], priority,
        assigned_worker_id, related_report_id, related_bin_id,
        target_weight_kg, special_instructions, now
      ]);

      // If tied to a report, update report status
      if (related_report_id) {
        db.run(`
          UPDATE waste_reports 
          SET status = 'Assigned', assigned_worker_id = ?, updated_at = ?
          WHERE id = ?
        `, [assigned_worker_id, now, related_report_id]);
      }

      // Notification
      const notifId = `NOTIF-${Date.now()}`;
      db.run(`
        INSERT INTO notifications (id, title, message, type, severity, link_to, is_read, created_at)
        VALUES (?, ?, ?, 'task', ?, '/tasks', 0, ?)
      `, [
        notifId,
        `New Collection Task: ${title.slice(0, 40)}`,
        `Task ${id} scheduled for ${ward} (${waste_type}).`,
        priority === 'Urgent' ? 'critical' : priority === 'High' ? 'warning' : 'info',
        now
      ]);

      return { success: true, data: { id } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tasks:update-status', async (event, { id, status, collected_weight_kg, notes }) => {
    try {
      const now = new Date().toISOString();
      let sql = `UPDATE collection_tasks SET status = ?`;
      const params = [status];

      if (collected_weight_kg !== undefined) {
        sql += `, collected_weight_kg = ?`;
        params.push(Number(collected_weight_kg));
      }
      if (notes !== undefined) {
        sql += `, notes = ?`;
        params.push(notes);
      }
      if (status === 'Completed') {
        sql += `, completed_at = ?`;
        params.push(now);
      }

      sql += ` WHERE id = ?`;
      params.push(id);

      db.run(sql, params);

      // Fetch task to handle side-effects (e.g. updating related worker count, linked bin or report)
      const task = db.query(`SELECT * FROM collection_tasks WHERE id = ?`, [id])[0];
      if (task && status === 'Completed') {
        // Increment worker tasks_completed count
        if (task.assigned_worker_id) {
          db.run(`
            UPDATE workers 
            SET tasks_completed = tasks_completed + 1 
            WHERE id = ?
          `, [task.assigned_worker_id]);
        }

        // Reset linked smart bin to empty
        if (task.related_bin_id) {
          db.run(`
            UPDATE waste_bins 
            SET fill_percentage = 8, status = 'Normal', last_collection_time = ?, updated_at = ?
            WHERE id = ?
          `, [now, now, task.related_bin_id]);
        }

        // Resolve linked report
        if (task.related_report_id) {
          db.run(`
            UPDATE waste_reports
            SET status = 'Resolved', resolution_notes = ?, updated_at = ?
            WHERE id = ?
          `, [notes || `Collection completed via task ${id}`, now, task.related_report_id]);
        }

        // Record collection in historical records
        const weight = Number(task.collected_weight_kg) || Number(task.target_weight_kg) || 50;
        const todayDate = now.split('T')[0];
        const isRecyclable = task.waste_type.includes('Recyclable') || task.waste_type.includes('E-Waste');
        const isWet = task.waste_type.includes('Wet') || task.waste_type.includes('Bio');
        const isHazardous = task.waste_type.includes('Hazardous') || task.waste_type.includes('Sanitary');

        db.run(`
          INSERT INTO historical_collections 
            (collection_date, ward, wet_kg, dry_kg, recyclable_kg, hazardous_kg, total_kg, composted_kg, recycled_kg)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          todayDate,
          task.ward,
          isWet ? weight : 0,
          (!isWet && !isRecyclable && !isHazardous) ? weight : 0,
          isRecyclable ? weight : 0,
          isHazardous ? weight : 0,
          weight,
          isWet ? Math.round(weight * 0.95 * 10) / 10 : 0,
          isRecyclable ? Math.round(weight * 0.9 * 10) / 10 : 0
        ]);

        // Add Notification
        const notifId = `NOTIF-${Date.now()}`;
        db.run(`
          INSERT INTO notifications (id, title, message, type, severity, link_to, is_read, created_at)
          VALUES (?, ?, ?, 'task', 'success', '/tasks', 0, ?)
        `, [
          notifId,
          `Task Completed: ${task.title.slice(0, 35)}`,
          `Collection verified. ${weight} kg waste collected.`,
          now
        ]);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 4. Smart Bins Handlers
  ipcMain.handle('bins:get-all', async (event, filters = {}) => {
    try {
      let sql = `SELECT * FROM waste_bins WHERE 1=1`;
      const params = [];

      if (filters.ward && filters.ward !== 'All') {
        sql += ` AND ward = ?`;
        params.push(filters.ward);
      }
      if (filters.category && filters.category !== 'All') {
        sql += ` AND category = ?`;
        params.push(filters.category);
      }
      if (filters.status && filters.status !== 'All') {
        sql += ` AND status = ?`;
        params.push(filters.status);
      }
      if (filters.search) {
        sql += ` AND (name LIKE ? OR location LIKE ? OR id LIKE ?)`;
        const s = `%${filters.search}%`;
        params.push(s, s, s);
      }

      sql += `
        ORDER BY 
          CASE status
            WHEN 'Collection Required' THEN 1
            WHEN 'Full' THEN 2
            WHEN 'Almost Full' THEN 3
            ELSE 4
          END,
          fill_percentage DESC
      `;

      const bins = db.query(sql, params);
      return { success: true, data: bins };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('bins:update-fill', async (event, { id, fill_percentage }) => {
    try {
      const now = new Date().toISOString();
      const fill = Math.max(0, Math.min(100, Number(fill_percentage)));
      let status = 'Normal';
      if (fill >= 90) status = 'Collection Required';
      else if (fill >= 80) status = 'Full';
      else if (fill >= 60) status = 'Almost Full';

      db.run(`
        UPDATE waste_bins 
        SET fill_percentage = ?, status = ?, updated_at = ?
        WHERE id = ?
      `, [fill, status, now, id]);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('bins:simulate-readings', async () => {
    try {
      const bins = db.query(`SELECT * FROM waste_bins`);
      const now = new Date().toISOString();
      let alertsGenerated = 0;

      for (const bin of bins) {
        // Random drift between -2 and +5
        const change = Math.floor(Math.random() * 8) - 2;
        let newFill = Math.min(100, Math.max(5, bin.fill_percentage + change));
        let status = 'Normal';
        if (newFill >= 90) status = 'Collection Required';
        else if (newFill >= 80) status = 'Full';
        else if (newFill >= 60) status = 'Almost Full';

        db.run(`
          UPDATE waste_bins
          SET fill_percentage = ?, status = ?, updated_at = ?
          WHERE id = ?
        `, [newFill, status, now, bin.id]);

        // If bin just breached 90% and wasn't already collection required, trigger notification
        if (newFill >= 90 && bin.status !== 'Collection Required') {
          alertsGenerated++;
          const notifId = `NOTIF-${Date.now()}-${bin.id}`;
          db.run(`
            INSERT INTO notifications (id, title, message, type, severity, link_to, is_read, created_at)
            VALUES (?, ?, ?, 'bin', 'critical', '/bins', 0, ?)
          `, [
            notifId,
            `Sensor Alert: ${bin.name} at ${newFill}%`,
            `Smart bin ${bin.id} in ${bin.ward} requires collection.`,
            now
          ]);
        }
      }

      const updatedBins = db.query(`SELECT * FROM waste_bins ORDER BY fill_percentage DESC`);
      return { success: true, data: updatedBins, alertsGenerated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 5. Workers Handlers
  ipcMain.handle('workers:get-all', async (event, filters = {}) => {
    try {
      let sql = `SELECT * FROM workers WHERE 1=1`;
      const params = [];

      if (filters.ward && filters.ward !== 'All') {
        sql += ` AND ward = ?`;
        params.push(filters.ward);
      }
      if (filters.status && filters.status !== 'All') {
        sql += ` AND status = ?`;
        params.push(filters.status);
      }
      if (filters.search) {
        sql += ` AND (name LIKE ? OR employee_id LIKE ? OR phone LIKE ?)`;
        const s = `%${filters.search}%`;
        params.push(s, s, s);
      }

      sql += ` ORDER BY name ASC`;
      const workers = db.query(sql, params);
      return { success: true, data: workers };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('workers:create', async (event, workerData) => {
    try {
      const { name, phone, email, ward, shift, vehicle_assigned } = workerData;
      if (!name || !ward) return { success: false, error: 'Name and ward are required' };

      const countRes = db.query(`SELECT COUNT(*) as count FROM workers`);
      const nextNum = (countRes[0]?.count || 0) + 1;
      const id = `WRK-${String(nextNum).padStart(2, '0')}`;
      const empId = `EMP-${7040 + nextNum}`;
      const today = new Date().toISOString().split('T')[0];

      db.run(`
        INSERT INTO workers 
          (id, name, employee_id, phone, email, ward, status, shift, rating, tasks_completed, vehicle_assigned, joined_date)
        VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, 5.0, 0, ?, ?)
      `, [id, name, empId, phone || '', email || '', ward, shift || 'Morning (06:00 - 14:00)', vehicle_assigned || 'Electric Tipper', today]);

      return { success: true, data: { id, employee_id: empId } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 6. Notifications Handlers
  ipcMain.handle('notifications:get-all', async () => {
    try {
      const list = db.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`);
      return { success: true, data: list };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notifications:mark-read', async (event, id) => {
    try {
      db.run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notifications:mark-all-read', async () => {
    try {
      db.run(`UPDATE notifications SET is_read = 1`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notifications:delete', async (event, id) => {
    try {
      db.run(`DELETE FROM notifications WHERE id = ?`, [id]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 7. Analytics & Sustainability Handlers
  ipcMain.handle('analytics:get-data', async (event, options = {}) => {
    try {
      const { ward = 'All', days = 14 } = options;
      let sql = `
        SELECT * FROM historical_collections 
        WHERE 1=1
      `;
      const params = [];

      if (ward !== 'All') {
        sql += ` AND ward = ?`;
        params.push(ward);
      }

      sql += ` ORDER BY collection_date ASC`;
      const rows = db.query(sql, params);

      // Aggregations
      let totalKg = 0;
      let wetKg = 0;
      let dryKg = 0;
      let recyclableKg = 0;
      let hazardousKg = 0;
      let compostedKg = 0;
      let recycledKg = 0;

      const dailyMap = {};

      for (const r of rows) {
        totalKg += r.total_kg || 0;
        wetKg += r.wet_kg || 0;
        dryKg += r.dry_kg || 0;
        recyclableKg += r.recyclable_kg || 0;
        hazardousKg += r.hazardous_kg || 0;
        compostedKg += r.composted_kg || 0;
        recycledKg += r.recycled_kg || 0;

        if (!dailyMap[r.collection_date]) {
          dailyMap[r.collection_date] = {
            date: r.collection_date,
            total: 0,
            wet: 0,
            dry: 0,
            recyclable: 0,
            hazardous: 0,
            recycled: 0,
            composted: 0
          };
        }
        dailyMap[r.collection_date].total += r.total_kg || 0;
        dailyMap[r.collection_date].wet += r.wet_kg || 0;
        dailyMap[r.collection_date].dry += r.dry_kg || 0;
        dailyMap[r.collection_date].recyclable += r.recyclable_kg || 0;
        dailyMap[r.collection_date].hazardous += r.hazardous_kg || 0;
        dailyMap[r.collection_date].recycled += r.recycled_kg || 0;
        dailyMap[r.collection_date].composted += r.composted_kg || 0;
      }

      const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      // Fetch settings for environmental factors
      const settingsRows = db.query(`SELECT * FROM settings`);
      const cfg = {};
      for (const s of settingsRows) {
        cfg[s.key] = s.value;
      }

      const co2CompFactor = parseFloat(cfg.co2CompostingFactor || '0.52');
      const co2RecycFactor = parseFloat(cfg.co2RecyclingFactor || '1.45');
      const treesFactor = parseFloat(cfg.treesSavedPerTonPaper || '17.0');
      const landfillFactor = parseFloat(cfg.landfillDiversionFactor || '0.0016');

      // Environmental metrics
      const co2PreventedKg = Math.round((compostedKg * co2CompFactor + recycledKg * co2RecycFactor) * 10) / 10;
      // Estimate 35% of recycled waste is paper
      const paperRecycledTons = (recycledKg * 0.35) / 1000;
      const treesSaved = Math.round(paperRecycledTons * treesFactor * 10) / 10;
      const landfillSpaceSavedM3 = Math.round((compostedKg + recycledKg) * landfillFactor * 10) / 10;
      const recyclingRate = totalKg > 0 ? Math.round((recycledKg / totalKg) * 1000) / 10 : 0;
      const compostingRate = totalKg > 0 ? Math.round((compostedKg / totalKg) * 1000) / 10 : 0;

      // Ward Comparison
      const wardComparison = db.query(`
        SELECT 
          ward,
          ROUND(SUM(total_kg), 1) as total,
          ROUND(SUM(wet_kg), 1) as wet,
          ROUND(SUM(recyclable_kg), 1) as recyclable,
          ROUND(SUM(recycled_kg), 1) as recycled,
          ROUND((SUM(recycled_kg) / SUM(total_kg)) * 100, 1) as recycling_rate
        FROM historical_collections
        GROUP BY ward
        ORDER BY total DESC
      `);

      // Reports resolution stats
      const reportsStats = db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM waste_reports
        GROUP BY status
      `);

      let totalReports = 0;
      let resolvedReports = 0;
      for (const rs of reportsStats) {
        totalReports += rs.count;
        if (rs.status === 'Resolved') resolvedReports = rs.count;
      }

      return {
        success: true,
        data: {
          summary: {
            totalKg: Math.round(totalKg * 10) / 10,
            wetKg: Math.round(wetKg * 10) / 10,
            dryKg: Math.round(dryKg * 10) / 10,
            recyclableKg: Math.round(recyclableKg * 10) / 10,
            hazardousKg: Math.round(hazardousKg * 10) / 10,
            compostedKg: Math.round(compostedKg * 10) / 10,
            recycledKg: Math.round(recycledKg * 10) / 10,
            recyclingRate,
            compostingRate
          },
          sustainability: {
            co2PreventedKg,
            treesSaved,
            landfillSpaceSavedM3,
            calculationNotes: {
              co2Model: `EPA WARM standard: ${co2CompFactor} kg CO2e / kg organic composted + ${co2RecycFactor} kg CO2e / kg recyclable diverted.`,
              treesModel: `${treesFactor} mature trees saved per ton paper recycled (based on 35% paper fraction).`,
              landfillModel: `${landfillFactor} m³ landfill airspace preserved per kg diverted waste.`
            }
          },
          dailyTrends,
          wardComparison,
          reportsSummary: {
            total: totalReports,
            resolved: resolvedReports,
            resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
          }
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // CSV Export Handler
  ipcMain.handle('analytics:export-csv', async (event, { type = 'historical', ward = 'All' }) => {
    try {
      let rows = [];
      let csvContent = '';
      const nowStr = new Date().toISOString().split('T')[0];
      let defaultFileName = `ecocity_${type}_${nowStr}.csv`;

      if (type === 'historical') {
        let sql = `SELECT * FROM historical_collections WHERE 1=1`;
        const params = [];
        if (ward !== 'All') {
          sql += ` AND ward = ?`;
          params.push(ward);
        }
        sql += ` ORDER BY collection_date DESC, ward ASC`;
        rows = db.query(sql, params);

        csvContent = 'Date,Ward,Wet Waste (kg),Dry Waste (kg),Recyclables (kg),Hazardous (kg),Total Waste (kg),Composted (kg),Recycled (kg)\n';
        for (const r of rows) {
          csvContent += `"${r.collection_date}","${r.ward}",${r.wet_kg},${r.dry_kg},${r.recyclable_kg},${r.hazardous_kg},${r.total_kg},${r.composted_kg},${r.recycled_kg}\n`;
        }
      } else if (type === 'reports') {
        rows = db.query(`SELECT * FROM waste_reports ORDER BY created_at DESC`);
        csvContent = 'Report ID,Title,Problem Category,Ward,Address,Priority,Status,Reporter,Created At,Resolution Notes\n';
        for (const r of rows) {
          csvContent += `"${r.id}","${(r.title || '').replace(/"/g, '""')}","${r.problem_category}","${r.ward}","${(r.address || '').replace(/"/g, '""')}","${r.priority}","${r.status}","${r.reporter_name}","${r.created_at}","${(r.resolution_notes || '').replace(/"/g, '""')}"\n`;
        }
      } else if (type === 'tasks') {
        rows = db.query(`SELECT t.*, w.name as worker_name FROM collection_tasks t LEFT JOIN workers w ON t.assigned_worker_id = w.id ORDER BY t.created_at DESC`);
        csvContent = 'Task ID,Title,Ward,Location,Waste Type,Scheduled Date,Priority,Status,Worker,Target (kg),Collected (kg),Completed At\n';
        for (const t of rows) {
          csvContent += `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${t.ward}","${(t.location || '').replace(/"/g, '""')}","${t.waste_type}","${t.scheduled_date}","${t.priority}","${t.status}","${t.worker_name || 'Unassigned'}",${t.target_weight_kg},${t.collected_weight_kg},"${t.completed_at || ''}"\n`;
        }
      }

      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export EcoCity Analytics Data',
        defaultPath: path.join(app.getPath('downloads'), defaultFileName),
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      fs.writeFileSync(filePath, csvContent, 'utf-8');
      return { success: true, filePath, rowCount: rows.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 8. Settings Handlers
  ipcMain.handle('settings:get-all', async () => {
    try {
      const rows = db.query(`SELECT * FROM settings`);
      const cfg = {};
      for (const r of rows) {
        cfg[r.key] = r.value;
      }
      return { success: true, data: cfg };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('settings:update', async (event, settingsMap) => {
    try {
      for (const [key, value] of Object.entries(settingsMap)) {
        db.run(`
          INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `, [key, String(value)]);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('settings:reset-demo', async () => {
    try {
      db.seedDatabase();
      return { success: true, message: 'Database reset and re-seeded with demo records.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 9. Users Handlers
  ipcMain.handle('users:get-all', async () => {
    try {
      const users = db.query(`SELECT * FROM users ORDER BY role ASC, name ASC`);
      return { success: true, data: users };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 10. Quiz Handlers
  ipcMain.handle('quiz:save-result', async (event, resultData) => {
    try {
      const { user_name, score, total_questions, percentage, badge_earned } = resultData;
      const id = `QR-${Date.now()}`;
      const now = new Date().toISOString();

      db.run(`
        INSERT INTO quiz_results (id, user_name, score, total_questions, percentage, badge_earned, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, user_name, score, total_questions, percentage, badge_earned, now]);

      return { success: true, id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('quiz:get-history', async () => {
    try {
      const results = db.query(`SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT 20`);
      return { success: true, data: results };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerIpcHandlers };
