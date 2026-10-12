const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db = null;
let dbFilePath = null;
let saveTimeout = null;

/**
 * Resolves the database file location.
 */
function getDbPath(customPath) {
  if (customPath) return customPath;
  let userDataDir;
  try {
    const { app } = require('electron');
    userDataDir = app.getPath('userData');
  } catch (e) {
    userDataDir = path.resolve(__dirname, '../../');
  }
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'ecocity.sqlite');
}

/**
 * Saves SQLite DB to disk.
 */
function persistDb() {
  if (!db || !dbFilePath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite DB:', err);
  }
}

/**
 * Debounced persist for fast write performance.
 */
function schedulePersist() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistDb();
  }, 200);
}

/**
 * Initialize sql.js and load or create the SQLite database file.
 */
async function initDatabase(customPath) {
  dbFilePath = getDbPath(customPath);
  console.log(`[EcoCity DB] Initializing SQLite database at: ${dbFilePath}`);

  let wasmBinary = undefined;
  try {
    const sqlJsMain = require.resolve('sql.js');
    const wasmPath = path.join(path.dirname(sqlJsMain), 'sql-wasm.wasm');
    if (fs.existsSync(wasmPath)) {
      wasmBinary = fs.readFileSync(wasmPath);
    }
  } catch (e) {
    // Fall back to default sql.js loader
  }

  const SQL = await initSqlJs(wasmBinary ? { wasmBinary } : {});

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      db = new SQL.Database(fileBuffer);
      console.log('[EcoCity DB] Loaded existing database from disk.');
    } catch (e) {
      console.warn('[EcoCity DB] Existing database corrupt or unreadable, creating new.', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('[EcoCity DB] Created fresh in-memory database instance.');
  }

  createSchema();
  checkAndSeedData();
  persistDb();

  return db;
}

/**
 * Executes a SELECT query and returns an array of plain JavaScript objects.
 */
function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Executes an INSERT, UPDATE, or DELETE query and schedules disk save.
 */
function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  persistDb();
}

/**
 * Runs multiple statements in sequence.
 */
function exec(sql) {
  if (!db) throw new Error('Database not initialized');
  db.exec(sql);
  persistDb();
}

/**
 * Creates the database schema.
 */
function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      phone TEXT,
      ward TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      ward TEXT,
      status TEXT DEFAULT 'Active',
      shift TEXT,
      rating REAL DEFAULT 4.8,
      tasks_completed INTEGER DEFAULT 0,
      vehicle_assigned TEXT,
      joined_date TEXT
    );

    CREATE TABLE IF NOT EXISTS waste_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      problem_category TEXT NOT NULL,
      description TEXT,
      ward TEXT NOT NULL,
      address TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'Submitted',
      photo_url TEXT,
      reporter_name TEXT,
      reporter_contact TEXT,
      assigned_worker_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      resolution_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS collection_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      ward TEXT NOT NULL,
      location TEXT,
      waste_type TEXT NOT NULL,
      scheduled_date TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'Pending',
      assigned_worker_id TEXT,
      related_report_id TEXT,
      related_bin_id TEXT,
      target_weight_kg REAL DEFAULT 50.0,
      collected_weight_kg REAL DEFAULT 0.0,
      special_instructions TEXT,
      created_at TEXT,
      completed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS waste_bins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ward TEXT NOT NULL,
      location TEXT,
      category TEXT NOT NULL,
      fill_percentage INTEGER DEFAULT 0,
      capacity_liters INTEGER DEFAULT 240,
      last_collection_time TEXT,
      battery_level INTEGER DEFAULT 95,
      status TEXT DEFAULT 'Normal',
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      link_to TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      user_name TEXT,
      score INTEGER,
      total_questions INTEGER,
      percentage INTEGER,
      badge_earned TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS historical_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_date TEXT,
      ward TEXT,
      wet_kg REAL DEFAULT 0,
      dry_kg REAL DEFAULT 0,
      recyclable_kg REAL DEFAULT 0,
      hazardous_kg REAL DEFAULT 0,
      total_kg REAL DEFAULT 0,
      composted_kg REAL DEFAULT 0,
      recycled_kg REAL DEFAULT 0
    );
  `);
}

/**
 * Check if initial data exists, otherwise seed.
 */
function checkAndSeedData() {
  const usersCount = query('SELECT COUNT(*) as count FROM users')[0].count;
  if (usersCount === 0) {
    console.log('[EcoCity DB] Seeding initial demonstration dataset...');
    seedDatabase();
  }
}

/**
 * Populate realistic sample data.
 */
function seedDatabase() {
  db.exec('DELETE FROM users;');
  db.exec('DELETE FROM workers;');
  db.exec('DELETE FROM waste_reports;');
  db.exec('DELETE FROM collection_tasks;');
  db.exec('DELETE FROM waste_bins;');
  db.exec('DELETE FROM notifications;');
  db.exec('DELETE FROM settings;');
  db.exec('DELETE FROM historical_collections;');

  const now = new Date();
  const formatTime = (d) => d.toISOString();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
  const daysAgo = (d, h = 0) => new Date(now.getTime() - (d * 86400000 + h * 3600000)).toISOString();
  const daysAgoDate = (d) => {
    const target = new Date(now.getTime() - d * 86400000);
    return target.toISOString().split('T')[0];
  };

  // 1. Demonstration Users
  const users = [
    {
      id: 'USR-001',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@ecocity.gov',
      role: 'admin',
      phone: '+1 (555) 234-8901',
      ward: 'Ward 3 - Metro Central',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      created_at: daysAgo(90)
    },
    {
      id: 'USR-002',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@ecocity.gov',
      role: 'worker',
      phone: '+1 (555) 872-4321',
      ward: 'Ward 4 - Sunrise Heights',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      created_at: daysAgo(75)
    },
    {
      id: 'USR-003',
      name: 'Elena Rostova',
      email: 'elena.rostova@greencitizen.org',
      role: 'citizen',
      phone: '+1 (555) 456-7890',
      ward: 'Ward 1 - Green Valley',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      created_at: daysAgo(60)
    },
    {
      id: 'USR-004',
      name: 'Marcus Vance',
      email: 'marcus.vance@ecocity.gov',
      role: 'admin',
      phone: '+1 (555) 345-6789',
      ward: 'Ward 2 - Riverdale',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      created_at: daysAgo(120)
    }
  ];

  for (const u of users) {
    run(
      `INSERT INTO users (id, name, email, role, phone, ward, avatar, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.role, u.phone, u.ward, u.avatar, u.status, u.created_at]
    );
  }

  // 2. Collection Workers (10 Workers)
  const workers = [
    {
      id: 'WRK-01',
      name: 'Rajesh Kumar',
      employee_id: 'EMP-7041',
      phone: '+1 (555) 872-4321',
      email: 'rajesh.kumar@ecocity.gov',
      ward: 'Ward 4 - Sunrise Heights',
      status: 'Active',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.9,
      tasks_completed: 184,
      vehicle_assigned: 'Compactor Truck #04 (Eco-CNG)',
      joined_date: '2023-03-15'
    },
    {
      id: 'WRK-02',
      name: 'Michael Chen',
      employee_id: 'EMP-7042',
      phone: '+1 (555) 765-4321',
      email: 'm.chen@ecocity.gov',
      ward: 'Ward 1 - Green Valley',
      status: 'Active',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.8,
      tasks_completed: 156,
      vehicle_assigned: 'Electric Tipper #01',
      joined_date: '2023-05-10'
    },
    {
      id: 'WRK-03',
      name: 'Amina Al-Mansoor',
      employee_id: 'EMP-7043',
      phone: '+1 (555) 654-3210',
      email: 'amina.m@ecocity.gov',
      ward: 'Ward 2 - Riverdale',
      status: 'On Route',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.95,
      tasks_completed: 210,
      vehicle_assigned: 'Recycling Flatbed #02',
      joined_date: '2022-11-01'
    },
    {
      id: 'WRK-04',
      name: 'Carlos Rodriguez',
      employee_id: 'EMP-7044',
      phone: '+1 (555) 543-2109',
      email: 'carlos.r@ecocity.gov',
      ward: 'Ward 3 - Metro Central',
      status: 'On Route',
      shift: 'Evening (14:00 - 22:00)',
      rating: 4.75,
      tasks_completed: 142,
      vehicle_assigned: 'Heavy Hauler #07',
      joined_date: '2023-08-20'
    },
    {
      id: 'WRK-05',
      name: 'Priya Sharma',
      employee_id: 'EMP-7045',
      phone: '+1 (555) 432-1098',
      email: 'priya.s@ecocity.gov',
      ward: 'Ward 5 - Eco Tech Park',
      status: 'Active',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.88,
      tasks_completed: 178,
      vehicle_assigned: 'Electric Tipper #05',
      joined_date: '2023-02-01'
    },
    {
      id: 'WRK-06',
      name: 'David O\'Connor',
      employee_id: 'EMP-7046',
      phone: '+1 (555) 321-0987',
      email: 'david.oc@ecocity.gov',
      ward: 'Ward 3 - Metro Central',
      status: 'Active',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.7,
      tasks_completed: 129,
      vehicle_assigned: 'Compactor Truck #09',
      joined_date: '2023-09-15'
    },
    {
      id: 'WRK-07',
      name: 'Fatima Zahra',
      employee_id: 'EMP-7047',
      phone: '+1 (555) 210-9876',
      email: 'f.zahra@ecocity.gov',
      ward: 'Ward 1 - Green Valley',
      status: 'Off Duty',
      shift: 'Night (22:00 - 06:00)',
      rating: 4.82,
      tasks_completed: 164,
      vehicle_assigned: 'Street Sweeper & Collector #03',
      joined_date: '2023-01-18'
    },
    {
      id: 'WRK-08',
      name: 'Liam Wilson',
      employee_id: 'EMP-7048',
      phone: '+1 (555) 109-8765',
      email: 'liam.w@ecocity.gov',
      ward: 'Ward 4 - Sunrise Heights',
      status: 'Active',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.65,
      tasks_completed: 118,
      vehicle_assigned: 'Electric Tipper #08',
      joined_date: '2023-10-05'
    },
    {
      id: 'WRK-09',
      name: 'Ananya Deshmukh',
      employee_id: 'EMP-7049',
      phone: '+1 (555) 998-7654',
      email: 'a.deshmukh@ecocity.gov',
      ward: 'Ward 2 - Riverdale',
      status: 'Active',
      shift: 'Evening (14:00 - 22:00)',
      rating: 4.92,
      tasks_completed: 195,
      vehicle_assigned: 'Organic Waste Hauler #06',
      joined_date: '2022-08-12'
    },
    {
      id: 'WRK-10',
      name: 'Jean-Luc Dubois',
      employee_id: 'EMP-7050',
      phone: '+1 (555) 887-6543',
      email: 'jl.dubois@ecocity.gov',
      ward: 'Ward 5 - Eco Tech Park',
      status: 'On Route',
      shift: 'Morning (06:00 - 14:00)',
      rating: 4.79,
      tasks_completed: 137,
      vehicle_assigned: 'E-Waste Spec Carrier #11',
      joined_date: '2023-06-30'
    }
  ];

  for (const w of workers) {
    run(
      `INSERT INTO workers (id, name, employee_id, phone, email, ward, status, shift, rating, tasks_completed, vehicle_assigned, joined_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.id, w.name, w.employee_id, w.phone, w.email, w.ward, w.status, w.shift, w.rating, w.tasks_completed, w.vehicle_assigned, w.joined_date]
    );
  }

  // 3. Smart Waste Bins (16 Bins across 5 wards)
  const bins = [
    { id: 'BIN-W1-01', name: 'Oakridge Community Park Bin A', ward: 'Ward 1 - Green Valley', location: 'Oakridge Community Park, Gate 1', category: 'Wet Waste', fill: 42, battery: 92, last: hoursAgo(6) },
    { id: 'BIN-W1-02', name: 'Valley Market Recyclables', ward: 'Ward 1 - Green Valley', location: 'Valley Farmers Market Square', category: 'Recyclables', fill: 88, battery: 84, last: hoursAgo(18) },
    { id: 'BIN-W1-03', name: 'Greenway School Dry Waste', ward: 'Ward 1 - Green Valley', location: 'Greenway High Campus Lane', category: 'Dry Waste', fill: 68, battery: 89, last: hoursAgo(12) },
    { id: 'BIN-W2-01', name: 'Riverwalk Promenade Wet', ward: 'Ward 2 - Riverdale', location: 'Riverwalk Esplanade near Fountain', category: 'Wet Waste', fill: 94, battery: 78, last: hoursAgo(22) },
    { id: 'BIN-W2-02', name: 'Riverdale Transit Dry Waste', ward: 'Ward 2 - Riverdale', location: 'North Bus Station Terminal 2', category: 'Dry Waste', fill: 82, battery: 88, last: hoursAgo(14) },
    { id: 'BIN-W2-03', name: 'Riverside Cafe Row Recyclables', ward: 'Ward 2 - Riverdale', location: 'Pier 4 Food Street', category: 'Recyclables', fill: 91, battery: 81, last: hoursAgo(24) },
    { id: 'BIN-W3-01', name: 'City Center Plaza Wet Bin', ward: 'Ward 3 - Metro Central', location: 'Central Square Civic Center', category: 'Wet Waste', fill: 96, battery: 72, last: hoursAgo(26) },
    { id: 'BIN-W3-02', name: 'Metro Financial Station Dry', ward: 'Ward 3 - Metro Central', location: 'Grand Station Entrance B', category: 'Dry Waste', fill: 74, battery: 95, last: hoursAgo(8) },
    { id: 'BIN-W3-03', name: 'Commercial Hub Hazardous Deposit', ward: 'Ward 3 - Metro Central', location: 'City Hall Service Lane', category: 'Hazardous', fill: 35, battery: 98, last: daysAgo(3) },
    { id: 'BIN-W3-04', name: 'Broadway Boulevard Recyclables', ward: 'Ward 3 - Metro Central', location: 'Broadway & 4th Cross Avenue', category: 'Recyclables', fill: 85, battery: 77, last: hoursAgo(20) },
    { id: 'BIN-W4-01', name: 'Sunrise Residential Complex 1', ward: 'Ward 4 - Sunrise Heights', location: 'Maple Avenue Cluster A', category: 'Wet Waste', fill: 58, battery: 91, last: hoursAgo(10) },
    { id: 'BIN-W4-02', name: 'Highland Market Recyclable Bin', ward: 'Ward 4 - Sunrise Heights', location: 'Sunrise Supermarket Corner', category: 'Recyclables', fill: 92, battery: 79, last: hoursAgo(25) },
    { id: 'BIN-W4-03', name: 'Sunrise Hillcrest Dry Bin', ward: 'Ward 4 - Sunrise Heights', location: 'Hillcrest Road Public Park', category: 'Dry Waste', fill: 63, battery: 90, last: hoursAgo(9) },
    { id: 'BIN-W5-01', name: 'Innovation Hub E-Waste & Dry', ward: 'Ward 5 - Eco Tech Park', location: 'Tech Quadrangle Building C', category: 'Dry Waste', fill: 45, battery: 96, last: hoursAgo(7) },
    { id: 'BIN-W5-02', name: 'Tech Park Food Court Wet Bin', ward: 'Ward 5 - Eco Tech Park', location: 'Central Cafeteria Plaza', category: 'Wet Waste', fill: 89, battery: 86, last: hoursAgo(19) },
    { id: 'BIN-W5-03', name: 'Bio-Research Hazardous Waste Depo', ward: 'Ward 5 - Eco Tech Park', location: 'Lab Sector 4 Loading Bay', category: 'Hazardous', fill: 79, battery: 94, last: daysAgo(2) }
  ];

  for (const b of bins) {
    let status = 'Normal';
    if (b.fill >= 90) status = 'Collection Required';
    else if (b.fill >= 80) status = 'Full';
    else if (b.fill >= 60) status = 'Almost Full';

    run(
      `INSERT INTO waste_bins (id, name, ward, location, category, fill_percentage, capacity_liters, last_collection_time, battery_level, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.name, b.ward, b.location, b.category, b.fill, 240, b.last, b.battery, status, formatTime(now)]
    );
  }

  // 4. Waste Reports (22 Citizen Reports)
  const reports = [
    {
      id: 'REP-2026-0001',
      title: 'Overflowing wet waste bin attracting pests',
      category: 'Overflowing garbage bins',
      desc: 'The organic waste bin outside Riverwalk Pier 4 has been overflowing since morning. Stray dogs and birds are scattering garbage across the walkway.',
      ward: 'Ward 2 - Riverdale',
      address: 'Pier 4 Food Street, Riverwalk',
      priority: 'Urgent',
      status: 'Assigned',
      photo: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
      reporter: 'Elena Rostova',
      contact: '+1 (555) 456-7890',
      worker: 'WRK-03',
      created: hoursAgo(4)
    },
    {
      id: 'REP-2026-0002',
      title: 'Illegal construction debris dumped by highway service road',
      category: 'Illegal dumping',
      desc: 'A mini truck dumped concrete blocks, plasterboard, and broken ceramic tiles near the canal embankment overnight.',
      ward: 'Ward 4 - Sunrise Heights',
      address: 'Canal Embankment Lane, near Mile 14',
      priority: 'High',
      status: 'Submitted',
      photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
      reporter: 'Amitabh Sen',
      contact: '+1 (555) 912-3456',
      worker: null,
      created: hoursAgo(6)
    },
    {
      id: 'REP-2026-0003',
      title: 'Missed scheduled morning collection on Pine Street',
      category: 'Missed waste collection',
      desc: 'Residents of Pine Street (Houses 42 to 78) placed their segregated bins out at 06:30 AM, but the collection vehicle did not arrive.',
      ward: 'Ward 1 - Green Valley',
      address: 'Pine Street, residential block 3',
      priority: 'Medium',
      status: 'In Progress',
      photo: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
      reporter: 'Dr. Kevin Miller',
      contact: '+1 (555) 887-1234',
      worker: 'WRK-02',
      created: hoursAgo(8)
    },
    {
      id: 'REP-2026-0004',
      title: 'Chemical container leakage in alleyway',
      category: 'Hazardous waste',
      desc: 'Found two rusted metal drums leaking an oily, foul-smelling liquid near the back alley of auto mechanics cluster.',
      ward: 'Ward 3 - Metro Central',
      address: 'Mechanics Row, Alley 7B',
      priority: 'Urgent',
      status: 'Assigned',
      photo: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80',
      reporter: 'Siddharth Patel',
      contact: '+1 (555) 443-8901',
      worker: 'WRK-04',
      created: hoursAgo(3)
    },
    {
      id: 'REP-2026-0005',
      title: 'Broken foot pedal and missing lid on public bin',
      category: 'Damaged public bins',
      desc: 'The public recycling receptacle has a snapped foot pedal mechanism and rain is soaking all paper recyclables inside.',
      ward: 'Ward 1 - Green Valley',
      address: 'Oakridge Community Park, Gate 1',
      priority: 'Low',
      status: 'In Progress',
      photo: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=600&auto=format&fit=crop&q=80',
      reporter: 'Grace Hopper',
      contact: '+1 (555) 234-5678',
      worker: 'WRK-02',
      created: hoursAgo(16)
    },
    {
      id: 'REP-2026-0006',
      title: 'Mixed waste dumped into green biodegradable composter',
      category: 'Mixed waste',
      desc: 'Someone placed multiple black bags containing plastic packaging and batteries into the residential community composting drum.',
      ward: 'Ward 4 - Sunrise Heights',
      address: 'Maple Avenue Cluster A composting depot',
      priority: 'High',
      status: 'Assigned',
      photo: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=600&auto=format&fit=crop&q=80',
      reporter: 'Ritu Varma',
      contact: '+1 (555) 321-7654',
      worker: 'WRK-01',
      created: hoursAgo(5)
    },
    {
      id: 'REP-2026-0007',
      title: 'Massive cardboard build-up near commercial deliveries',
      category: 'Overflowing garbage bins',
      desc: 'Shopping strip deliveries left hundreds of flattened cardboard cartons blocking pedestrian sidewalk.',
      ward: 'Ward 3 - Metro Central',
      address: 'Broadway & 4th Cross Avenue',
      priority: 'Medium',
      status: 'Resolved',
      photo: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80',
      reporter: 'Marcus Vance',
      contact: '+1 (555) 345-6789',
      worker: 'WRK-04',
      created: daysAgo(1, 4),
      resolved_notes: 'Collected 240kg cardboard in recycling flatbed #02. Sent to Ward 3 Baler facility.'
    },
    {
      id: 'REP-2026-0008',
      title: 'Discarded computer monitors and circuit boards on grass',
      category: 'Hazardous waste',
      desc: 'Five CRT monitors, cables, and old power supply units left beside the storm water drain.',
      ward: 'Ward 5 - Eco Tech Park',
      address: 'Sector 2 Ring Road near Substation',
      priority: 'High',
      status: 'Resolved',
      photo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
      reporter: 'Tanmay Joshi',
      contact: '+1 (555) 777-8899',
      worker: 'WRK-10',
      created: daysAgo(1, 8),
      resolved_notes: 'Hazardous materials secured and logged into E-Waste Recovery Unit registry.'
    },
    {
      id: 'REP-2026-0009',
      title: 'Food court waste bin overflowing after weekend event',
      category: 'Overflowing garbage bins',
      desc: 'Festival left food containers and biodegradable cups overflowing onto the lawn.',
      ward: 'Ward 5 - Eco Tech Park',
      address: 'Central Cafeteria Plaza',
      priority: 'Urgent',
      status: 'Assigned',
      photo: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?w=600&auto=format&fit=crop&q=80',
      reporter: 'Deepa Roy',
      contact: '+1 (555) 667-2233',
      worker: 'WRK-05',
      created: hoursAgo(2)
    },
    {
      id: 'REP-2026-0010',
      title: 'Litter accumulation along Riverwalk jogging track',
      category: 'Other waste-related issues',
      desc: 'Joggers reported plastic water bottles and wrappers strewn over 200m along the north bank.',
      ward: 'Ward 2 - Riverdale',
      address: 'North Riverwalk mile marker 2.4',
      priority: 'Medium',
      status: 'Submitted',
      photo: null,
      reporter: 'Sanjay Gupta',
      contact: '+1 (555) 555-0199',
      worker: null,
      created: hoursAgo(11)
    },
    {
      id: 'REP-2026-0011',
      title: 'Fish market ice and organic waste left on curbside',
      category: 'Overflowing garbage bins',
      desc: 'Vendor stalls packed up and left fish crates and melting ice creating severe odor.',
      ward: 'Ward 2 - Riverdale',
      address: 'Old Port Fish Market, Stall Row C',
      priority: 'Urgent',
      status: 'Resolved',
      photo: null,
      reporter: 'Amina Al-Mansoor',
      contact: '+1 (555) 654-3210',
      worker: 'WRK-09',
      created: daysAgo(2),
      resolved_notes: 'Special organic waste compactor dispatched. Curbside sanitized.'
    },
    {
      id: 'REP-2026-0012',
      title: 'Residential societies mixing medical waste with household trash',
      category: 'Mixed waste',
      desc: 'Syringes and medicine blister packs found mixed inside standard green wet waste bins.',
      ward: 'Ward 4 - Sunrise Heights',
      address: 'Sunview Towers Gate 2',
      priority: 'Urgent',
      status: 'In Progress',
      photo: null,
      reporter: 'Rajesh Kumar',
      contact: '+1 (555) 872-4321',
      worker: 'WRK-01',
      created: hoursAgo(14)
    },
    {
      id: 'REP-2026-0013',
      title: 'Overgrown garden branches blocking waste truck entry',
      category: 'Other waste-related issues',
      desc: 'Fallen eucalyptus boughs prevent the compactor truck from entering Gulmohar Lane.',
      ward: 'Ward 1 - Green Valley',
      address: 'Gulmohar Lane, Cul-de-sac',
      priority: 'Low',
      status: 'Submitted',
      photo: null,
      reporter: 'Bhavna Chawla',
      contact: '+1 (555) 441-2288',
      worker: null,
      created: hoursAgo(18)
    },
    {
      id: 'REP-2026-0014',
      title: 'Smart Bin BIN-W3-01 level sensor stuck at 96%',
      category: 'Damaged public bins',
      desc: 'Bin was emptied at noon but ultrasonic sensor continues reading critical fill level.',
      ward: 'Ward 3 - Metro Central',
      address: 'Central Square Civic Center',
      priority: 'Medium',
      status: 'Assigned',
      photo: null,
      reporter: 'System Watchdog',
      contact: 'telemetry@ecocity.gov',
      worker: 'WRK-06',
      created: hoursAgo(5)
    },
    {
      id: 'REP-2026-0015',
      title: 'Commercial paint cans disposed in storm drain',
      category: 'Illegal dumping',
      desc: 'Twelve 20-liter enamel paint cans discarded near culvert.',
      ward: 'Ward 4 - Sunrise Heights',
      address: 'South Ring Bypass near Bridge',
      priority: 'Urgent',
      status: 'Resolved',
      photo: null,
      reporter: 'Sunil Rao',
      contact: '+1 (555) 890-1122',
      worker: 'WRK-08',
      created: daysAgo(3),
      resolved_notes: 'Paint drums transferred to Municipal Hazardous Waste Treatment Facility.'
    },
    {
      id: 'REP-2026-0016',
      title: 'Community park bins overflowing with picnic waste',
      category: 'Overflowing garbage bins',
      desc: 'Sunday crowds filled park bins beyond capacity. Plastic wraps blowing onto grass.',
      ward: 'Ward 1 - Green Valley',
      address: 'Valley Farmers Market Square',
      priority: 'High',
      status: 'In Progress',
      photo: null,
      reporter: 'Elena Rostova',
      contact: '+1 (555) 456-7890',
      worker: 'WRK-07',
      created: hoursAgo(7)
    },
    {
      id: 'REP-2026-0017',
      title: 'Construction contractor left dry wall scraps on public walkway',
      category: 'Illegal dumping',
      desc: 'Gypsum board residue dusting the entire pedestrian path.',
      ward: 'Ward 5 - Eco Tech Park',
      address: 'Innovation Way & 7th Avenue',
      priority: 'Medium',
      status: 'Submitted',
      photo: null,
      reporter: 'Vikram Seth',
      contact: '+1 (555) 334-5566',
      worker: null,
      created: hoursAgo(20)
    },
    {
      id: 'REP-2026-0018',
      title: 'Missed bi-weekly e-waste drive pickup',
      category: 'Missed waste collection',
      desc: 'Apartment registered for scheduled battery & cable box collection, truck never arrived.',
      ward: 'Ward 3 - Metro Central',
      address: 'Tower 9, Metro Central Condos',
      priority: 'Medium',
      status: 'Resolved',
      photo: null,
      reporter: 'Nalini Iyer',
      contact: '+1 (555) 223-4455',
      worker: 'WRK-04',
      created: daysAgo(2),
      resolved_notes: 'Special pickup completed by Carlos Rodriguez. 42kg e-waste logged.'
    },
    {
      id: 'REP-2026-0019',
      title: 'Damaged solar battery on Smart Bin BIN-W2-01',
      category: 'Damaged public bins',
      desc: 'Solar panel cracked, causing battery level to plummet to 78%.',
      ward: 'Ward 2 - Riverdale',
      address: 'Riverwalk Esplanade near Fountain',
      priority: 'Medium',
      status: 'Submitted',
      photo: null,
      reporter: 'Amina Al-Mansoor',
      contact: '+1 (555) 654-3210',
      worker: null,
      created: hoursAgo(15)
    },
    {
      id: 'REP-2026-0020',
      title: 'Wet waste container leaking leachate onto road',
      category: 'Overflowing garbage bins',
      desc: 'Drain valve cracked, foul liquid dripping on pedestrian crossing.',
      ward: 'Ward 4 - Sunrise Heights',
      address: 'Sunrise Supermarket Corner',
      priority: 'High',
      status: 'In Progress',
      photo: null,
      reporter: 'Manish Tiwari',
      contact: '+1 (555) 991-8822',
      worker: 'WRK-01',
      created: hoursAgo(9)
    },
    {
      id: 'REP-2026-0021',
      title: 'Plastic film and non-recyclable bags clogging sorting hopper',
      category: 'Mixed waste',
      desc: 'Dry waste batch contained heavy black polythene rolls.',
      ward: 'Ward 5 - Eco Tech Park',
      address: 'Central Cafeteria Plaza Loading Bay',
      priority: 'Medium',
      status: 'Resolved',
      photo: null,
      reporter: 'Priya Sharma',
      contact: '+1 (555) 432-1098',
      worker: 'WRK-05',
      created: daysAgo(3),
      resolved_notes: 'Batch segregated manually. Educational notice sent to tech park admin.'
    },
    {
      id: 'REP-2026-0022',
      title: 'Restaurant grease drum dumped by riverbank',
      category: 'Hazardous waste',
      desc: 'Used cooking oil drum tipped over near the reed beds.',
      ward: 'Ward 2 - Riverdale',
      address: 'Riverdale South Bank Trailhead',
      priority: 'Urgent',
      status: 'Resolved',
      photo: null,
      reporter: 'Sarah Jenkins',
      contact: '+1 (555) 234-8901',
      worker: 'WRK-03',
      created: daysAgo(4),
      resolved_notes: 'Absorbent boom deployed. Oil drum removed and trace containment completed.'
    }
  ];

  for (const r of reports) {
    run(
      `INSERT INTO waste_reports (id, title, problem_category, description, ward, address, priority, status, photo_url, reporter_name, reporter_contact, assigned_worker_id, created_at, updated_at, resolution_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.title, r.category, r.desc, r.ward, r.address, r.priority, r.status, r.photo, r.reporter, r.contact, r.worker, r.created, r.created, r.resolved_notes || null]
    );
  }

  // 5. Collection Tasks (22 Tasks across all workers)
  const tasks = [
    {
      id: 'TSK-2026-0001',
      title: 'Collect overflowing wet waste at Riverwalk Promenade',
      ward: 'Ward 2 - Riverdale',
      location: 'Riverwalk Esplanade near Fountain (BIN-W2-01)',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(0),
      priority: 'Urgent',
      status: 'In Progress',
      worker_id: 'WRK-03',
      report_id: 'REP-2026-0001',
      bin_id: 'BIN-W2-01',
      target_kg: 180,
      collected_kg: 0,
      instructions: 'Urgent collection triggered by sensor fill 94% and citizen report. Clean perimeter.'
    },
    {
      id: 'TSK-2026-0002',
      title: 'Morning residential wet waste collection - Maple Ave',
      ward: 'Ward 4 - Sunrise Heights',
      location: 'Maple Avenue Clusters A to F',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(0),
      priority: 'High',
      status: 'In Progress',
      worker_id: 'WRK-01',
      report_id: null,
      bin_id: 'BIN-W4-01',
      target_kg: 320,
      collected_kg: 0,
      instructions: 'Inspect for medical waste mixing reported earlier today.'
    },
    {
      id: 'TSK-2026-0003',
      title: 'Clear cardboard excess on Broadway Boulevard',
      ward: 'Ward 3 - Metro Central',
      location: 'Broadway & 4th Cross Avenue (BIN-W3-04)',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(0),
      priority: 'Medium',
      status: 'Pending',
      worker_id: 'WRK-04',
      report_id: null,
      bin_id: 'BIN-W3-04',
      target_kg: 240,
      collected_kg: 0,
      instructions: 'Bundle cartons for compacting unit.'
    },
    {
      id: 'TSK-2026-0004',
      title: 'Empty critically full bin at City Center Plaza',
      ward: 'Ward 3 - Metro Central',
      location: 'Central Square Civic Center (BIN-W3-01)',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(0),
      priority: 'Urgent',
      status: 'Pending',
      worker_id: 'WRK-06',
      report_id: 'REP-2026-0014',
      bin_id: 'BIN-W3-01',
      target_kg: 190,
      collected_kg: 0,
      instructions: 'Bin sensor reports 96% fill level. Inspect ultrasonic transducer.'
    },
    {
      id: 'TSK-2026-0005',
      title: 'Greenway School & Park recyclables collection',
      ward: 'Ward 1 - Green Valley',
      location: 'Oakridge Community Park & School Lane',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(0),
      priority: 'Medium',
      status: 'Pending',
      worker_id: 'WRK-02',
      report_id: 'REP-2026-0005',
      bin_id: 'BIN-W1-01',
      target_kg: 140,
      collected_kg: 0,
      instructions: 'Repair broken foot pedal on park bin if replacement latch is in truck.'
    },
    {
      id: 'TSK-2026-0006',
      title: 'Tech Park food court evening organic pickup',
      ward: 'Ward 5 - Eco Tech Park',
      location: 'Central Cafeteria Plaza (BIN-W5-02)',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(0),
      priority: 'High',
      status: 'Pending',
      worker_id: 'WRK-05',
      report_id: 'REP-2026-0009',
      bin_id: 'BIN-W5-02',
      target_kg: 220,
      collected_kg: 0,
      instructions: 'Food festival debris removal. Weigh composting batch at weighbridge.'
    },
    {
      id: 'TSK-2026-0007',
      title: 'Highland Market recyclables clearance',
      ward: 'Ward 4 - Sunrise Heights',
      location: 'Sunrise Supermarket Corner (BIN-W4-02)',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(0),
      priority: 'High',
      status: 'Pending',
      worker_id: 'WRK-08',
      report_id: null,
      bin_id: 'BIN-W4-02',
      target_kg: 210,
      collected_kg: 0,
      instructions: 'Fill sensor at 92%. Transfer plastic bottles and packaging.'
    },
    {
      id: 'TSK-2026-0008',
      title: 'Resolve leaking auto mechanics drums on Alley 7B',
      ward: 'Ward 3 - Metro Central',
      location: 'Mechanics Row, Alley 7B',
      waste_type: 'Hazardous',
      sched_date: daysAgoDate(0),
      priority: 'Urgent',
      status: 'In Progress',
      worker_id: 'WRK-04',
      report_id: 'REP-2026-0004',
      bin_id: null,
      target_kg: 80,
      collected_kg: 0,
      instructions: 'Wear Level C PPE. Use spill containment basin.'
    },
    {
      id: 'TSK-2026-0009',
      title: 'Yesterday Ward 1 Residential Route B Organic Collection',
      ward: 'Ward 1 - Green Valley',
      location: 'Orchard Way & Green Avenue',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(1),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-02',
      report_id: null,
      bin_id: null,
      target_kg: 350,
      collected_kg: 362.5,
      instructions: 'Standard residential door-to-door green bin collection.'
    },
    {
      id: 'TSK-2026-0010',
      title: 'Yesterday Ward 2 Waterfront Paper & Can Recycle',
      ward: 'Ward 2 - Riverdale',
      location: 'Riverdale Transit Pier & Ferry Point',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(1),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-03',
      report_id: null,
      bin_id: 'BIN-W2-02',
      target_kg: 280,
      collected_kg: 295.0,
      instructions: 'Delivered to North baling station.'
    },
    {
      id: 'TSK-2026-0011',
      title: 'Special collection for construction debris at Canal Road',
      ward: 'Ward 4 - Sunrise Heights',
      location: 'Canal Embankment Lane near Mile 14',
      waste_type: 'Mixed / Bulk',
      sched_date: daysAgoDate(0),
      priority: 'High',
      status: 'Pending',
      worker_id: 'WRK-01',
      report_id: 'REP-2026-0002',
      bin_id: null,
      target_kg: 450,
      collected_kg: 0,
      instructions: 'Clear concrete blocks and debris reported by citizen.'
    },
    {
      id: 'TSK-2026-0012',
      title: 'E-Waste collection at Innovation Quadrangle',
      ward: 'Ward 5 - Eco Tech Park',
      location: 'Tech Quadrangle Building C (BIN-W5-01)',
      waste_type: 'E-Waste',
      sched_date: daysAgoDate(1),
      priority: 'High',
      status: 'Completed',
      worker_id: 'WRK-10',
      report_id: 'REP-2026-0008',
      bin_id: 'BIN-W5-01',
      target_kg: 120,
      collected_kg: 135.0,
      instructions: 'Monitors, circuit boards, discarded wiring collected.'
    },
    {
      id: 'TSK-2026-0013',
      title: 'Routine Sunday night market sweep and sanitization',
      ward: 'Ward 1 - Green Valley',
      location: 'Valley Farmers Market Square',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(2),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-07',
      report_id: null,
      bin_id: 'BIN-W1-02',
      target_kg: 310,
      collected_kg: 320.0,
      instructions: 'Vegetable peelings and organic waste delivered to Valley Composting Facility.'
    },
    {
      id: 'TSK-2026-0014',
      title: 'Old Port Fish Market organic washdown collection',
      ward: 'Ward 2 - Riverdale',
      location: 'Old Port Fish Market, Stall Row C',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(2),
      priority: 'Urgent',
      status: 'Completed',
      worker_id: 'WRK-09',
      report_id: 'REP-2026-0011',
      bin_id: null,
      target_kg: 260,
      collected_kg: 275.4,
      instructions: 'Disinfected stalls and transported organic scraps.'
    },
    {
      id: 'TSK-2026-0015',
      title: 'High density hospital corridor sanitary collection',
      ward: 'Ward 3 - Metro Central',
      location: 'General Hospital Health Zone',
      waste_type: 'Sanitary',
      sched_date: daysAgoDate(1),
      priority: 'Urgent',
      status: 'Completed',
      worker_id: 'WRK-06',
      report_id: null,
      bin_id: null,
      target_kg: 180,
      collected_kg: 172.0,
      instructions: 'Yellow wrapped clinical bags transferred for authorized incineration.'
    },
    {
      id: 'TSK-2026-0016',
      title: 'Paint can cleanup from culvert bypass',
      ward: 'Ward 4 - Sunrise Heights',
      location: 'South Ring Bypass near Bridge',
      waste_type: 'Hazardous',
      sched_date: daysAgoDate(3),
      priority: 'Urgent',
      status: 'Completed',
      worker_id: 'WRK-08',
      report_id: 'REP-2026-0015',
      bin_id: null,
      target_kg: 150,
      collected_kg: 148.0,
      instructions: 'Delivered paint tins to toxic materials storage facility.'
    },
    {
      id: 'TSK-2026-0017',
      title: 'Commercial glass bottle pickup - Brewery Lane',
      ward: 'Ward 2 - Riverdale',
      location: 'Riverdale Craft Brewery District',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(2),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-03',
      report_id: null,
      bin_id: null,
      target_kg: 500,
      collected_kg: 540.0,
      instructions: 'Sorted green, amber, and clear glass bottles into glass recycling crates.'
    },
    {
      id: 'TSK-2026-0018',
      title: 'Biodiversity park fallen foliage compost collection',
      ward: 'Ward 1 - Green Valley',
      location: 'Botanical Garden North Edge',
      waste_type: 'Wet / Biodegradable',
      sched_date: daysAgoDate(3),
      priority: 'Low',
      status: 'Completed',
      worker_id: 'WRK-02',
      report_id: null,
      bin_id: null,
      target_kg: 400,
      collected_kg: 430.0,
      instructions: 'Delivered directly to city compost shredder.'
    },
    {
      id: 'TSK-2026-0019',
      title: 'IT cafeteria sorted plastic packaging batch',
      ward: 'Ward 5 - Eco Tech Park',
      location: 'Tower 4 Delivery Hub',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(2),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-05',
      report_id: null,
      bin_id: null,
      target_kg: 190,
      collected_kg: 205.5,
      instructions: 'Baled PET and HDPE plastics.'
    },
    {
      id: 'TSK-2026-0020',
      title: 'Residential apartment batteries and bulb deposit drive',
      ward: 'Ward 4 - Sunrise Heights',
      location: 'Hillcrest Road Public Park',
      waste_type: 'Hazardous',
      sched_date: daysAgoDate(1),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-01',
      report_id: null,
      bin_id: null,
      target_kg: 60,
      collected_kg: 68.2,
      instructions: 'Collected 140 lithium-ion and alkaline battery packs from community drop-box.'
    },
    {
      id: 'TSK-2026-0021',
      title: 'Riverbank grease drum recovery operation',
      ward: 'Ward 2 - Riverdale',
      location: 'Riverdale South Bank Trailhead',
      waste_type: 'Hazardous',
      sched_date: daysAgoDate(4),
      priority: 'Urgent',
      status: 'Completed',
      worker_id: 'WRK-03',
      report_id: 'REP-2026-0022',
      bin_id: null,
      target_kg: 120,
      collected_kg: 115.0,
      instructions: 'Safe recovery of tipped cooking grease drum and shoreline neutralization.'
    },
    {
      id: 'TSK-2026-0022',
      title: 'City Hall recycling drop-off clearing',
      ward: 'Ward 3 - Metro Central',
      location: 'Grand Station Entrance B (BIN-W3-02)',
      waste_type: 'Dry / Recyclable',
      sched_date: daysAgoDate(3),
      priority: 'Medium',
      status: 'Completed',
      worker_id: 'WRK-06',
      report_id: null,
      bin_id: 'BIN-W3-02',
      target_kg: 210,
      collected_kg: 218.0,
      instructions: 'Collected newspapers, office paper, and aluminum beverage cans.'
    }
  ];

  for (const t of tasks) {
    const isCompleted = t.status === 'Completed';
    const completedAt = isCompleted ? daysAgo(1, 2) : null;
    run(
      `INSERT INTO collection_tasks (id, title, ward, location, waste_type, scheduled_date, priority, status, assigned_worker_id, related_report_id, related_bin_id, target_weight_kg, collected_weight_kg, special_instructions, created_at, completed_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.ward, t.location, t.waste_type, t.sched_date, t.priority, t.status, t.worker_id, t.report_id, t.bin_id, t.target_kg, t.collected_kg, t.instructions, daysAgo(2), completedAt, isCompleted ? 'Completed on schedule. Verified at weighbridge.' : null]
    );
  }

  // 6. Notifications (12 Sample alerts)
  const notifications = [
    {
      id: 'NOTIF-001',
      title: 'Critical Fill Alert: Smart Bin BIN-W3-01',
      message: 'City Center Plaza Wet Bin has exceeded 95% capacity (Current: 96%). Immediate collection required.',
      type: 'bin',
      severity: 'critical',
      link: '/bins',
      read: 0,
      created: hoursAgo(1)
    },
    {
      id: 'NOTIF-002',
      title: 'New Urgent Waste Report: REP-2026-0001',
      message: 'Elena Rostova reported overflowing wet waste at Riverwalk Pier 4. Assigned to worker Amina Al-Mansoor.',
      type: 'report',
      severity: 'warning',
      link: '/reports',
      read: 0,
      created: hoursAgo(2)
    },
    {
      id: 'NOTIF-003',
      title: 'Task Assignment: Chemical leakage containment',
      message: 'Carlos Rodriguez assigned to urgent hazardous waste task TSK-2026-0008 on Mechanics Row.',
      type: 'task',
      severity: 'warning',
      link: '/tasks',
      read: 0,
      created: hoursAgo(3)
    },
    {
      id: 'NOTIF-004',
      title: 'High Fill Alert: Smart Bin BIN-W4-02',
      message: 'Highland Market Recyclable Bin reached 92% capacity in Ward 4 - Sunrise Heights.',
      type: 'bin',
      severity: 'warning',
      link: '/bins',
      read: 0,
      created: hoursAgo(4)
    },
    {
      id: 'NOTIF-005',
      title: 'Report Resolved: Broadway Cardboard Accumulation',
      message: 'Carlos Rodriguez marked report REP-2026-0007 as Resolved after collecting 240kg cardboard.',
      type: 'resolved',
      severity: 'success',
      link: '/reports',
      read: 1,
      created: daysAgo(1, 3)
    },
    {
      id: 'NOTIF-006',
      title: 'Task Completed: Tech Quadrangle E-Waste',
      message: 'Jean-Luc Dubois completed task TSK-2026-0012 with 135kg e-waste safely logged.',
      type: 'task',
      severity: 'success',
      link: '/tasks',
      read: 1,
      created: daysAgo(1, 6)
    },
    {
      id: 'NOTIF-007',
      title: 'Daily Segregation Compliance Milestone',
      message: 'City segregation compliance crossed 84.5% yesterday! Ward 1 leads with 91.2% proper segregation.',
      type: 'system',
      severity: 'info',
      link: '/analytics',
      read: 1,
      created: daysAgo(1, 12)
    },
    {
      id: 'NOTIF-008',
      title: 'Smart Bin BIN-W2-01 Collection Due',
      message: 'Riverwalk Promenade Wet Bin reached 94% fill. Task TSK-2026-0001 created.',
      type: 'bin',
      severity: 'critical',
      link: '/bins',
      read: 1,
      created: hoursAgo(5)
    },
    {
      id: 'NOTIF-009',
      title: 'Illegal Dumping Report Filed: REP-2026-0002',
      message: 'Construction debris reported on Canal Embankment Lane. Awaiting worker assignment.',
      type: 'report',
      severity: 'warning',
      link: '/reports',
      read: 1,
      created: hoursAgo(6)
    },
    {
      id: 'NOTIF-010',
      title: 'Weekly Composting Summary Available',
      message: 'Over 14.2 tons of biodegradable organic waste converted to nutrient-rich compost this week.',
      type: 'system',
      severity: 'info',
      link: '/analytics',
      read: 1,
      created: daysAgo(2)
    },
    {
      id: 'NOTIF-011',
      title: 'Battery Alert: Smart Bin BIN-W3-01',
      message: 'Battery level on Central Square Civic Center sensor is low at 72%. Solar panel inspection advised.',
      type: 'bin',
      severity: 'info',
      link: '/bins',
      read: 1,
      created: daysAgo(2, 5)
    },
    {
      id: 'NOTIF-012',
      title: 'Hazardous Waste Neutralized: Greasy Drum Spill',
      message: 'Report REP-2026-0022 closed successfully by Amina Al-Mansoor at South Bank Trailhead.',
      type: 'resolved',
      severity: 'success',
      link: '/reports',
      read: 1,
      created: daysAgo(4)
    }
  ];

  for (const n of notifications) {
    run(
      `INSERT INTO notifications (id, title, message, type, severity, link_to, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.title, n.message, n.type, n.severity, n.link, n.read, n.created]
    );
  }

  // 7. Historical Collections Data (Past 14 Days)
  // Fictional realistic municipal weights across 5 wards
  const wardNames = [
    'Ward 1 - Green Valley',
    'Ward 2 - Riverdale',
    'Ward 3 - Metro Central',
    'Ward 4 - Sunrise Heights',
    'Ward 5 - Eco Tech Park'
  ];

  for (let d = 13; d >= 0; d--) {
    const curDate = daysAgoDate(d);
    for (let wIdx = 0; wIdx < wardNames.length; wIdx++) {
      const ward = wardNames[wIdx];
      // Base generation varies by ward characteristics
      let baseWet = 480 + (wIdx * 65) + Math.sin(d + wIdx) * 50;
      let baseDry = 320 + (wIdx * 45) + Math.cos(d) * 35;
      let baseRecyc = 210 + (wIdx * 30) + Math.sin(d * 1.5) * 25;
      let baseHaz = 22 + (wIdx * 12) + (d % 3 === 0 ? 15 : 0);

      if (wIdx === 0) { // Green valley: high wet, high compost
        baseWet += 120;
        baseRecyc += 40;
      } else if (wIdx === 2) { // Metro Central: high dry & packaging
        baseDry += 160;
        baseRecyc += 75;
      } else if (wIdx === 4) { // Tech park: high e-waste / dry recyclables
        baseRecyc += 110;
        baseDry += 90;
      }

      baseWet = Math.round(baseWet * 10) / 10;
      baseDry = Math.round(baseDry * 10) / 10;
      baseRecyc = Math.round(baseRecyc * 10) / 10;
      baseHaz = Math.round(baseHaz * 10) / 10;
      const total = Math.round((baseWet + baseDry + baseRecyc + baseHaz) * 10) / 10;
      const composted = Math.round((baseWet * 0.92) * 10) / 10;
      const recycled = Math.round((baseRecyc * 0.88 + baseDry * 0.45) * 10) / 10;

      run(
        `INSERT INTO historical_collections (collection_date, ward, wet_kg, dry_kg, recyclable_kg, hazardous_kg, total_kg, composted_kg, recycled_kg)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [curDate, ward, baseWet, baseDry, baseRecyc, baseHaz, total, composted, recycled]
      );
    }
  }

  // 8. Application Settings
  const defaultSettings = {
    cityName: 'Metropolis Municipal Corporation',
    divisionName: 'GreenCity Solid Waste Management Directorate',
    binAlertThreshold: '80',
    simulatedSensorsEnabled: 'true',
    simulationIntervalSeconds: '10',
    co2CompostingFactor: '0.52', // kg CO2e saved per kg organic composted vs methane landfill
    co2RecyclingFactor: '1.45',  // kg CO2e saved per kg recycled paper/plastics/metals
    treesSavedPerTonPaper: '17.0',
    landfillDiversionFactor: '0.0016', // m3 saved per kg waste diverted
    defaultCurrencySymbol: '$',
    notificationEmail: 'alerts@ecocity.gov',
    wards: JSON.stringify(wardNames)
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    run(
      `INSERT INTO settings (key, value) VALUES (?, ?)`,
      [key, val]
    );
  }

  // 9. Initial Quiz Results
  run(
    `INSERT INTO quiz_results (id, user_name, score, total_questions, percentage, badge_earned, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['QR-001', 'Elena Rostova', 8, 8, 100, 'Master Segregator', daysAgo(1, 14)]
  );

  console.log('[EcoCity DB] Seeding completed successfully.');
}

module.exports = {
  initDatabase,
  query,
  run,
  exec,
  persistDb,
  seedDatabase,
  getDbPath
};
