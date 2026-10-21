/**
 * DailyFlow Storage & Domain Engine — Tesla Telemetry & Reminder Edition
 * Dual-persistence: LocalStorage (instant sync) + IndexedDB (durable mobile storage)
 */

const STORAGE_KEY = 'dailyflow_app_data_v1';
const IDB_NAME = 'DailyFlowDB';
const IDB_STORE = 'app_state';
const IDB_VERSION = 1;

// --- Local Date Utilities (Timezone-safe for UTC+7 / Mobile) ---
function toLocalDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(dateStr, offsetDays) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + offsetDays);
  return toLocalDateStr(d);
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// Map legacy emojis to precision vector icon keys
const EMOJI_TO_ICON_KEY = {
  '💧': 'hydration',
  '🏃': 'fitness',
  '📖': 'reading',
  '🌙': 'sleep',
  '🧘': 'mindfulness',
  '🥗': 'nutrition',
  '💊': 'nutrition',
  '💻': 'work',
  '💰': 'wealth',
  '🎯': 'focus',
  '✨': 'energy'
};

function normalizeHabitIconKey(iconVal) {
  if (!iconVal) return 'energy';
  if (EMOJI_TO_ICON_KEY[iconVal]) return EMOJI_TO_ICON_KEY[iconVal];
  const validKeys = [
    'hydration', 'fitness', 'reading', 'sleep', 'focus',
    'nutrition', 'energy', 'work', 'wealth', 'mindfulness'
  ];
  return validKeys.includes(iconVal) ? iconVal : 'energy';
}

// --- Default Categories ---
const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'งาน', color: '#3e6ae1', icon: 'work' },
  { id: 'personal', name: 'ส่วนตัว', color: '#10b981', icon: 'mindfulness' },
  { id: 'health', name: 'สุขภาพ', color: '#e31937', icon: 'fitness' },
  { id: 'finance', name: 'การเงิน', color: '#f59e0b', icon: 'wealth' },
  { id: 'study', name: 'พัฒนาตัวเอง', color: '#8b5cf6', icon: 'reading' }
];

// --- Default Starter Data (Relative to Today) ---
function createStarterData() {
  const today = toLocalDateStr();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const inTwoDays = addDays(today, 2);

  const drinkLogs = {};
  const exerciseLogs = {};
  const readLogs = {};
  const sleepLogs = {};

  for (let i = 20; i >= 1; i--) {
    const dStr = addDays(today, -i);
    const dayOfWeek = parseLocalDate(dStr).getDay();
    if (i <= 6 || i % 2 === 0 || i % 3 === 0) drinkLogs[dStr] = true;
    if ([1, 3, 5, 6].includes(dayOfWeek) && i !== 8) exerciseLogs[dStr] = true;
    if (i <= 4 || i % 2 === 1) readLogs[dStr] = true;
    if (i <= 3 || i % 3 !== 0) sleepLogs[dStr] = true;
  }
  drinkLogs[today] = true;

  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    settings: {
      theme: 'dark', // Default to signature Tesla Obsidian Dark Mode
      firstDayOfWeek: 1,
      showCompletedTodos: true,
      notificationsEnabled: false,
      soundEnabled: true,
      dailyBriefingTime: '08:30',
      lastBriefingDate: null
    },
    categories: [...DEFAULT_CATEGORIES],
    todos: [
      {
        id: generateId('todo'),
        title: 'วางแผนเป้าหมายประจำสัปดาห์และจัดลำดับงานสำคัญ',
        note: 'ทบทวนโปรเจกต์ที่ต้องส่งและเคลียร์งานค้าง',
        dueDate: today,
        dueTime: '10:00',
        reminderMinutes: '15', // 15 mins before
        notifiedKey: null,
        snoozedUntil: null,
        priority: 'high',
        category: 'work',
        tags: ['โฟกัส', 'สัปดาห์นี้'],
        completed: false,
        completedAt: null,
        subtasks: [
          { id: generateId('sub'), title: 'เช็คตารางนัดหมายในปฏิทิน', done: true },
          { id: generateId('sub'), title: 'เลือกงานสำคัญสุด 3 ชิ้นของวันนี้', done: false }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('todo'),
        title: 'ออกกำลังกายตอนเย็น / เดินเร็ว 30 นาที',
        note: 'ยืดเหยียดกล้ามเนื้อหลังเลิกงาน',
        dueDate: today,
        dueTime: '18:00',
        reminderMinutes: '15',
        notifiedKey: null,
        snoozedUntil: null,
        priority: 'medium',
        category: 'health',
        tags: ['สุขภาพ'],
        completed: false,
        completedAt: null,
        subtasks: [],
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('todo'),
        title: 'สรุปรายรับ-รายจ่ายและเช็คบิลบัตรเครดิต',
        note: 'ตรวจสอบรายการตัดบัตรอัตโนมัติประจำเดือน',
        dueDate: tomorrow,
        dueTime: '20:00',
        reminderMinutes: '30',
        notifiedKey: null,
        snoozedUntil: null,
        priority: 'high',
        category: 'finance',
        tags: ['การเงิน'],
        completed: false,
        completedAt: null,
        subtasks: [
          { id: generateId('sub'), title: 'เช็คยอดค่าไฟ/ค่าเน็ต', done: false },
          { id: generateId('sub'), title: 'โอนเงินเข้าบัญชีออมทรัพย์', done: false }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('todo'),
        title: 'ซื้อของใช้เข้าบ้าน (กาแฟ, ผลไม้, นม)',
        note: 'แวะซูเปอร์มาร์เก็ตขากลับบ้าน',
        dueDate: inTwoDays,
        dueTime: '17:30',
        reminderMinutes: '0',
        notifiedKey: null,
        snoozedUntil: null,
        priority: 'low',
        category: 'personal',
        tags: ['ซื้อของ'],
        completed: false,
        completedAt: null,
        subtasks: [],
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('todo'),
        title: 'ตั้งค่าเว็บแอป DailyFlow บนมือถือ',
        note: 'กดเพิ่มไปยังหน้าจอโฮม (Add to Home Screen)',
        dueDate: yesterday,
        dueTime: '09:00',
        reminderMinutes: 'none',
        notifiedKey: null,
        snoozedUntil: null,
        priority: 'medium',
        category: 'personal',
        tags: ['แอปส่วนตัว'],
        completed: true,
        completedAt: new Date().toISOString(),
        subtasks: [],
        createdAt: new Date().toISOString()
      }
    ],
    habits: [
      {
        id: generateId('hab'),
        title: 'ดื่มน้ำเปล่าครบ 8 แก้ว (2 ลิตร)',
        icon: 'hydration',
        color: '#3e6ae1',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        logs: drinkLogs,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('hab'),
        title: 'ออกกำลังกาย / ขยับร่างกาย 30 นาที',
        icon: 'fitness',
        color: '#e31937',
        frequencyDays: [1, 3, 5, 6],
        logs: exerciseLogs,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('hab'),
        title: 'อ่านหนังสือหรือฟังพอดแคสต์ 20 นาที',
        icon: 'reading',
        color: '#10b981',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        logs: readLogs,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('hab'),
        title: 'เข้านอนก่อน 23:30 น. (งดไถมือถือก่อนนอน)',
        icon: 'sleep',
        color: '#f59e0b',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        logs: sleepLogs,
        createdAt: new Date().toISOString()
      }
    ]
  };
}

// --- IndexedDB Helper ---
function openIDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function saveToIDB(state) {
  try {
    const db = await openIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(state, STORAGE_KEY);
  } catch (err) {
    console.warn('IndexedDB save fallback:', err);
  }
}

async function loadFromIDB() {
  try {
    const db = await openIDB();
    if (!db) return null;
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(STORAGE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// --- Habit Streak & Stats Calculator ---
function calculateHabitStats(habit, refDateStr = toLocalDateStr()) {
  const logs = habit.logs || {};
  const freq = Array.isArray(habit.frequencyDays) && habit.frequencyDays.length > 0
    ? habit.frequencyDays
    : [0, 1, 2, 3, 4, 5, 6];

  const isScheduledDay = (dStr) => {
    const dow = parseLocalDate(dStr).getDay();
    return freq.includes(dow);
  };

  let currentStreak = 0;
  let cursor = refDateStr;
  for (let i = 0; i < 365; i++) {
    const scheduled = isScheduledDay(cursor);
    const done = !!logs[cursor];
    if (done) {
      currentStreak++;
    } else if (scheduled) {
      if (cursor !== refDateStr) {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  const allLoggedDates = Object.keys(logs).filter((k) => logs[k]).sort();
  const totalCheckins = allLoggedDates.length;

  let bestStreak = currentStreak;
  if (allLoggedDates.length > 0) {
    const earliest = allLoggedDates[0];
    let tempStreak = 0;
    let d = earliest;
    while (d <= refDateStr) {
      if (logs[d]) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (isScheduledDay(d) && d !== refDateStr) {
        tempStreak = 0;
      }
      d = addDays(d, 1);
    }
  }

  let scheduledLast30 = 0;
  let completedLast30 = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = addDays(refDateStr, -i);
    if (isScheduledDay(dStr)) {
      scheduledLast30++;
      if (logs[dStr]) completedLast30++;
    } else if (logs[dStr]) {
      completedLast30++;
      scheduledLast30++;
    }
  }
  const rate30d = scheduledLast30 > 0
    ? Math.min(100, Math.round((completedLast30 / scheduledLast30) * 100))
    : 0;

  return {
    currentStreak,
    bestStreak,
    totalCheckins,
    rate30d,
    isScheduledToday: isScheduledDay(refDateStr),
    isDoneToday: !!logs[refDateStr]
  };
}

// --- Compute Reminder Trigger Timestamp (ms) ---
function getTodoReminderTimeMs(todo) {
  if (!todo || todo.completed || !todo.dueDate) return null;
  if (todo.snoozedUntil) {
    const snoozeMs = new Date(todo.snoozedUntil).getTime();
    if (!isNaN(snoozeMs)) return snoozeMs;
  }
  const rem = todo.reminderMinutes;
  if (!rem || rem === 'none') return null;

  const [y, m, d] = todo.dueDate.split('-').map(Number);
  if (!y || !m || !d) return null;

  if (rem === '1440') {
    // 1 day before at 09:00
    const target = new Date(y, m - 1, d - 1, 9, 0, 0, 0);
    return target.getTime();
  }

  if (!todo.dueTime) return null;
  const [hh, mm] = todo.dueTime.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;

  const dueMs = new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  const offsetMins = Number(rem) || 0;
  return dueMs - offsetMins * 60 * 1000;
}

// --- Main Store Class ---
class DailyFlowStore {
  constructor() {
    this.state = this.loadInitialState();
    this.listeners = [];
    this.initDurableStorage();
  }

  loadInitialState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return this.normalizeState(parsed);
      }
    } catch (e) {
      console.warn('LocalStorage load warning:', e);
    }
    const starter = createStarterData();
    this.saveSync(starter);
    return starter;
  }

  normalizeState(data) {
    const fallback = createStarterData();
    if (!data || typeof data !== 'object') return fallback;

    // Upgrade v1 theme 'system' to 'dark' for Tesla Luxury edition unless explicitly set in v2
    const isUpgradingFromV1 = !data.version || data.version < 2;
    const resolvedTheme = isUpgradingFromV1
      ? 'dark'
      : (data.settings?.theme || 'dark');

    return {
      version: 2,
      updatedAt: data.updatedAt || new Date().toISOString(),
      settings: {
        theme: resolvedTheme,
        firstDayOfWeek: data.settings?.firstDayOfWeek ?? 1,
        showCompletedTodos: data.settings?.showCompletedTodos ?? true,
        notificationsEnabled: data.settings?.notificationsEnabled ?? false,
        soundEnabled: data.settings?.soundEnabled ?? true,
        dailyBriefingTime: data.settings?.dailyBriefingTime || '08:30',
        lastBriefingDate: data.settings?.lastBriefingDate || null
      },
      categories: Array.isArray(data.categories) && data.categories.length > 0
        ? data.categories
        : [...DEFAULT_CATEGORIES],
      todos: Array.isArray(data.todos) ? data.todos.map((t) => ({
        id: t.id || generateId('todo'),
        title: t.title || 'ไม่มีชื่อรายการ',
        note: t.note || '',
        dueDate: t.dueDate || toLocalDateStr(),
        dueTime: t.dueTime || '',
        reminderMinutes: t.reminderMinutes !== undefined
          ? String(t.reminderMinutes)
          : (t.dueTime ? '15' : 'none'),
        notifiedKey: t.notifiedKey || null,
        snoozedUntil: t.snoozedUntil || null,
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        category: t.category || 'personal',
        tags: Array.isArray(t.tags) ? t.tags : [],
        completed: !!t.completed,
        completedAt: t.completedAt || null,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        createdAt: t.createdAt || new Date().toISOString()
      })) : [],
      habits: Array.isArray(data.habits) ? data.habits.map((h) => ({
        id: h.id || generateId('hab'),
        title: h.title || 'นิสัยใหม่',
        icon: normalizeHabitIconKey(h.icon),
        color: h.color || '#3e6ae1',
        frequencyDays: Array.isArray(h.frequencyDays) && h.frequencyDays.length > 0
          ? h.frequencyDays
          : [0, 1, 2, 3, 4, 5, 6],
        logs: h.logs && typeof h.logs === 'object' ? h.logs : {},
        createdAt: h.createdAt || new Date().toISOString()
      })) : []
    };
  }

  async initDurableStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        await navigator.storage.persist();
      } catch (_) {}
    }

    const idbState = await loadFromIDB();
    if (idbState && idbState.updatedAt) {
      const localRaw = localStorage.getItem(STORAGE_KEY);
      if (!localRaw) {
        this.state = this.normalizeState(idbState);
        this.saveSync(this.state);
        this.notify();
      } else {
        await saveToIDB(this.state);
      }
    } else {
      await saveToIDB(this.state);
    }
  }

  saveSync(state = this.state) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    saveToIDB(state);
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.saveSync();
    this.listeners.forEach((fn) => fn(this.state));
  }

  // --- Settings ---
  updateSettings(partial) {
    this.state.settings = { ...this.state.settings, ...partial };
    this.notify();
  }

  // --- To-Do Operations ---
  addTodo(todoData) {
    const dueTime = todoData.dueTime || '';
    const newTodo = {
      id: generateId('todo'),
      title: todoData.title.trim(),
      note: (todoData.note || '').trim(),
      dueDate: todoData.dueDate || toLocalDateStr(),
      dueTime,
      reminderMinutes: todoData.reminderMinutes !== undefined
        ? String(todoData.reminderMinutes)
        : (dueTime ? '15' : 'none'),
      notifiedKey: null,
      snoozedUntil: null,
      priority: todoData.priority || 'medium',
      category: todoData.category || 'personal',
      tags: Array.isArray(todoData.tags) ? todoData.tags : [],
      completed: false,
      completedAt: null,
      subtasks: Array.isArray(todoData.subtasks) ? todoData.subtasks : [],
      createdAt: new Date().toISOString()
    };
    this.state.todos.unshift(newTodo);
    this.notify();
    return newTodo;
  }

  updateTodo(id, updates) {
    const idx = this.state.todos.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.state.todos[idx] = {
      ...this.state.todos[idx],
      ...updates,
      notifiedKey: null,
      snoozedUntil: null
    };
    this.notify();
    return this.state.todos[idx];
  }

  markTodoNotified(id, key) {
    const todo = this.state.todos.find((t) => t.id === id);
    if (!todo) return;
    todo.notifiedKey = key;
    todo.snoozedUntil = null;
    this.saveSync();
  }

  snoozeTodo(id, minutes = 10) {
    const todo = this.state.todos.find((t) => t.id === id);
    if (!todo) return;
    const snoozeTarget = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    todo.snoozedUntil = snoozeTarget;
    todo.notifiedKey = null;
    this.notify();
  }

  toggleTodo(id) {
    const todo = this.state.todos.find((t) => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date().toISOString() : null;
    this.notify();
  }

  toggleSubtask(todoId, subtaskId) {
    const todo = this.state.todos.find((t) => t.id === todoId);
    if (!todo || !Array.isArray(todo.subtasks)) return;
    const sub = todo.subtasks.find((s) => s.id === subtaskId);
    if (!sub) return;
    sub.done = !sub.done;
    this.notify();
  }

  deleteTodo(id) {
    this.state.todos = this.state.todos.filter((t) => t.id !== id);
    this.notify();
  }

  clearCompletedTodos() {
    this.state.todos = this.state.todos.filter((t) => !t.completed);
    this.notify();
  }

  // --- Habit Operations ---
  addHabit(habitData) {
    const newHabit = {
      id: generateId('hab'),
      title: habitData.title.trim(),
      icon: normalizeHabitIconKey(habitData.icon),
      color: habitData.color || '#3e6ae1',
      frequencyDays: Array.isArray(habitData.frequencyDays) && habitData.frequencyDays.length > 0
        ? habitData.frequencyDays
        : [0, 1, 2, 3, 4, 5, 6],
      logs: {},
      createdAt: new Date().toISOString()
    };
    this.state.habits.push(newHabit);
    this.notify();
    return newHabit;
  }

  updateHabit(id, updates) {
    const idx = this.state.habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    if (updates.icon) updates.icon = normalizeHabitIconKey(updates.icon);
    this.state.habits[idx] = { ...this.state.habits[idx], ...updates };
    this.notify();
    return this.state.habits[idx];
  }

  toggleHabitDate(habitId, dateStr = toLocalDateStr()) {
    const habit = this.state.habits.find((h) => h.id === habitId);
    if (!habit) return false;
    if (!habit.logs) habit.logs = {};
    if (habit.logs[dateStr]) {
      delete habit.logs[dateStr];
    } else {
      habit.logs[dateStr] = true;
    }
    this.notify();
    return !!habit.logs[dateStr];
  }

  deleteHabit(id) {
    this.state.habits = this.state.habits.filter((h) => h.id !== id);
    this.notify();
  }

  // --- Backup & Restore ---
  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importJSON(rawJsonString) {
    const parsed = JSON.parse(rawJsonString);
    if (!parsed || (!Array.isArray(parsed.todos) && !Array.isArray(parsed.habits))) {
      throw new Error('รูปแบบไฟล์ข้อมูลสำรองไม่ถูกต้อง');
    }
    this.state = this.normalizeState(parsed);
    this.notify();
    return true;
  }

  resetToStarterData() {
    this.state = createStarterData();
    this.notify();
  }

  clearAllData() {
    this.state = {
      version: 2,
      updatedAt: new Date().toISOString(),
      settings: { ...this.state.settings },
      categories: [...DEFAULT_CATEGORIES],
      todos: [],
      habits: []
    };
    this.notify();
  }
}

window.DailyFlowDB = {
  store: new DailyFlowStore(),
  toLocalDateStr,
  parseLocalDate,
  addDays,
  generateId,
  calculateHabitStats,
  getTodoReminderTimeMs,
  normalizeHabitIconKey,
  DEFAULT_CATEGORIES
};
