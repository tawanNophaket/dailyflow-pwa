/**
 * DailyFlow — Main Application Controller (Tesla Luxury OS & Telemetry Edition)
 * Features: To-Do List, Habit Consistency Matrix, Unified Calendar,
 *           Web/SW Push Notifications, Tesla Harmonic Chime & .ICS Calendar Alarm Sync
 */

(function () {
  const {
    store,
    toLocalDateStr,
    parseLocalDate,
    addDays,
    generateId,
    calculateHabitStats,
    getTodoReminderTimeMs,
    normalizeHabitIconKey
  } = window.DailyFlowDB;

  // --- Precision Vector SVG Icons (1.8px Stroke) ---
  const ICONS = {
    check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    checkSm: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    bellSm: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    sun: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    grid: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`
  };

  // --- Precision Automotive Vector Icons for Habits ---
  const HABIT_ICONS = {
    hydration: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`,
    fitness: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
    reading: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
    sleep: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    focus: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    nutrition: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    energy: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    work: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,
    wealth: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
    mindfulness: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`
  };

  function getHabitSvg(iconKey) {
    const k = normalizeHabitIconKey(iconKey);
    return HABIT_ICONS[k] || HABIT_ICONS.energy;
  }

  // --- Jay Park Role Model Vision Board Items (4 Images: Physique, Ink & Charisma) ---
  const ROLE_MODELS = [
    {
      id: 'jay-1',
      src: './assets/jay-1.jpg',
      pillar: 'PHYSIQUE & INK',
      badge: 'STAGE FIT',
      shortTitle: 'หุ่นลีน · รอยสักอก',
      shortSub: 'Six-Pack & Lion Ink',
      title: 'Stage Physique & Chest Lion Tattoo',
      subtitle: 'หุ่นลีน Six-Pack · รอยสักเต็มอกซ้ายและแขน',
      focus: 'วินัยวันนี้: ออกกำลังกาย 30 นาที + คุมอาหารให้ลีนคมชัด เพื่อรักษากล้ามท้องและสัดส่วนช่วงบนให้เฟิร์มตลอดเวลา',
      pos: '50% 24%'
    },
    {
      id: 'jay-2',
      src: './assets/jay-2.jpg',
      pillar: 'INK & AESTHETIC',
      badge: 'PASSION INK',
      shortTitle: 'ลีนคม · รอยสัก',
      shortSub: 'Rib & Neck Tattoo',
      title: 'Lean Core & Iconic Ribcage Ink',
      subtitle: 'ลำตัวลีนไร้ไขมัน · รอยสักสีข้างและเข็มทิศต้นคอ',
      focus: 'วินัยวันนี้: ดื่มน้ำ 8 แก้ว ลดของทอด/หวาน เพื่อลดเปอร์เซ็นต์ไขมันให้เห็นไลน์กล้ามเนื้อด้านข้างชัดเจน',
      pos: '50% 28%'
    },
    {
      id: 'jay-3',
      src: './assets/jay-3.jpg',
      pillar: 'CHARISMA & SLEEVE',
      badge: 'FULL SLEEVE',
      shortTitle: 'อกชัด · แขนสัก',
      shortSub: 'Stage Smirk & Sleeve',
      title: 'Sculpted Pecs & Full Tattoo Sleeve',
      subtitle: 'กล้ามอกคมชัด · รอยสักเต็มแขนซ้ายและรอยยิ้มมั่นใจ',
      focus: 'วินัยวันนี้: โฟกัสเวทเทรนนิ่งช่วงอก ไหล่ และแกนกลางลำตัว สร้างพลังและความมั่นใจในทุกท่วงท่า',
      pos: '50% 22%'
    },
    {
      id: 'jay-4',
      src: './assets/jay-4.jpg',
      pillar: 'ICONIC CHARISMA',
      badge: 'BOSS AURA',
      shortTitle: 'ออร่า · โทนดำ',
      shortSub: 'All-Black & Silver Chain',
      title: 'All-Black Charisma & Compass Neck Ink',
      subtitle: 'ลุคเสื้อดำโซ่เงิน · รอยสักเข็มทิศและรอยยิ้มมีเสน่ห์',
      focus: 'วินัยวันนี้: โฟกัสงานสำคัญให้เสร็จ อ่านหนังสือ 20 นาที และพักผ่อนตรงเวลา เพื่อบุคลิกผู้นำที่นิ่งและทรงพลัง',
      pos: '50% 18%'
    }
  ];

  // --- UI State ---
  const uiState = {
    activeTab: 'today',
    todayFocusDate: toLocalDateStr(),
    quickAddPriority: 'medium',
    visionFeaturedId: localStorage.getItem('dailyflow_vision_featured_jay') || 'jay-1',
    visionActiveId: 'jay-1',
    visionMonoTone: localStorage.getItem('dailyflow_vision_mono') === '1',
    todoFilterStatus: 'all',
    todoFilterCategory: 'all',
    todoSearchQuery: '',
    todoSortBy: 'dueDate',
    calendarMode: 'month',
    calendarCursorDate: toLocalDateStr(),
    calendarSelectedDate: toLocalDateStr(),
    draftTodoPriority: 'medium',
    draftTodoSubtasks: [],
    draftHabitIcon: 'hydration',
    draftHabitColor: '#3e6ae1',
    draftHabitDays: [0, 1, 2, 3, 4, 5, 6],
    activeHeatmapHabitId: null,
    activeAlertTodoId: null,
    deferredInstallPrompt: null
  };

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const THAI_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const ENG_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const ENG_MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const THAI_DAYS_FULL = [
    'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
  ];
  const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const REMINDER_LABELS = {
    none: '',
    '0': 'ตรงเวลา',
    '5': 'ล่วงหน้า 5m',
    '15': 'ล่วงหน้า 15m',
    '30': 'ล่วงหน้า 30m',
    '60': 'ล่วงหน้า 1h',
    '1440': 'ล่วงหน้า 1d'
  };

  // --- Formatting Helpers ---
  function formatFullThaiDate(dateStr) {
    const d = parseLocalDate(dateStr);
    const dayName = THAI_DAYS_FULL[d.getDay()];
    const dayNum = d.getDate();
    const monthName = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}ที่ ${dayNum} ${monthName} ${year}`;
  }

  function formatEditorialEyebrow(dateStr) {
    const d = parseLocalDate(dateStr);
    return `TELEMETRY • ${ENG_DAYS[d.getDay()]} ${d.getDate()} ${ENG_MONTHS_SHORT[d.getMonth()]}`;
  }

  function formatShortThaiDate(dateStr) {
    const today = toLocalDateStr();
    const tomorrow = addDays(today, 1);
    const yesterday = addDays(today, -1);
    if (dateStr === today) return 'วันนี้';
    if (dateStr === tomorrow) return 'พรุ่งนี้';
    if (dateStr === yesterday) return 'เมื่อวาน';
    const d = parseLocalDate(dateStr);
    return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.22s ease';
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  }

  // --- Synthesized Tesla Dual-Tone Chime (Web Audio API) ---
  function playTeslaChime() {
    if (!store.state.settings.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const freqs = [587.33, 880]; // D5 -> A5 harmonic fifth
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.7);
      });
    } catch (_) {}
  }

  // --- Browser / Mobile Notification Dispatcher ---
  async function fireSystemNotification(title, body, tag = 'dailyflow-reminder') {
    playTeslaChime();
    if ('vibrate' in navigator) {
      try { navigator.vibrate([180, 80, 180]); } catch (_) {}
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: './icon.svg',
            badge: './icon.svg',
            tag,
            renotify: true,
            vibrate: [180, 80, 180]
          });
          return true;
        }
      }
      new Notification(title, { body, icon: './icon.svg', tag });
      return true;
    } catch (_) {
      return false;
    }
  }

  // --- Show In-App Heads-Up Telemetry Alert Banner ---
  function triggerHeadsUpAlert(todo) {
    uiState.activeAlertTodoId = todo.id;
    const banner = document.getElementById('heads-up-alert');
    document.getElementById('heads-up-title').textContent = todo.title;
    const timeLabel = todo.dueTime ? `เวลา ${todo.dueTime} น.` : formatShortThaiDate(todo.dueDate);
    document.getElementById('heads-up-sub').textContent = `${timeLabel}${todo.note ? ' · ' + todo.note : ''}`;
    banner.classList.add('active');

    fireSystemNotification(
      `⏰ แจ้งเตือนงาน: ${todo.title}`,
      `${timeLabel}${todo.note ? ' — ' + todo.note : ''}`,
      `todo-${todo.id}`
    );
  }

  // --- Background Reminder Watcher ---
  function checkDueReminders() {
    const nowMs = Date.now();
    const todos = store.state.todos;

    let hasUpcomingToday = false;
    const today = toLocalDateStr();

    for (const todo of todos) {
      if (todo.completed) continue;
      const triggerMs = getTodoReminderTimeMs(todo);
      if (!triggerMs) continue;

      if (todo.dueDate === today && triggerMs > nowMs - 3600000) {
        hasUpcomingToday = true;
      }

      const key = `${todo.dueDate}_${todo.dueTime}_${todo.reminderMinutes}_${todo.snoozedUntil || ''}`;
      // Trigger if within [triggerMs, triggerMs + 30 minutes] and not notified yet
      if (nowMs >= triggerMs && nowMs <= triggerMs + 30 * 60 * 1000 && todo.notifiedKey !== key) {
        store.markTodoNotified(todo.id, key);
        triggerHeadsUpAlert(todo);
        break;
      }
    }

    const dot = document.getElementById('notif-badge-dot');
    if (dot) {
      dot.classList.toggle('active', hasUpcomingToday);
    }
  }

  // --- Generate & Download .ICS Calendar File with Native VALARM ---
  function exportTasksToICS(onlyDateStr = null) {
    let tasks = store.state.todos.filter((t) => !t.completed && t.dueDate);
    if (onlyDateStr) {
      tasks = tasks.filter((t) => t.dueDate === onlyDateStr);
    }
    if (tasks.length === 0) {
      showToast('ไม่มีรายการงานที่ต้องซิงค์ในขณะนี้');
      return;
    }

    const pad2 = (n) => String(n).padStart(2, '0');
    const formatICSLocal = (dateStr, timeStr = '09:00') => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
      return `${y}${pad2(m)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`;
    };

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DailyFlow//Tesla Luxury Planner//TH',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    tasks.forEach((t) => {
      const startTime = t.dueTime || '09:00';
      const dtStart = formatICSLocal(t.dueDate, startTime);
      const [hh, mm] = startTime.split(':').map(Number);
      const endHh = (hh + 1) % 24;
      const dtEnd = formatICSLocal(t.dueDate, `${pad2(endHh)}:${pad2(mm)}`);
      const remMins = t.reminderMinutes && t.reminderMinutes !== 'none' ? Number(t.reminderMinutes) : 15;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${t.id}@dailyflow.app`,
        `DTSTAMP:${formatICSLocal(toLocalDateStr(), '00:00')}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${(t.title || '').replace(/[\r\n]+/g, ' ')}`,
        `DESCRIPTION:${(t.note || 'สร้างจากแอป DailyFlow').replace(/[\r\n]+/g, ' ')}`,
        'BEGIN:VALARM',
        `TRIGGER:-PT${remMins}M`,
        'ACTION:DISPLAY',
        `DESCRIPTION:แจ้งเตือน: ${(t.title || '').replace(/[\r\n]+/g, ' ')}`,
        'END:VALARM',
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyflow-reminders-${onlyDateStr || toLocalDateStr()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ปฏิทินแจ้งเตือน (.ics) เรียบร้อย');
  }

  // --- Theme Engine ---
  function applyTheme() {
    const pref = store.state.settings.theme || 'dark';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = pref === 'system' ? (prefersDark ? 'dark' : 'light') : pref;

    document.documentElement.setAttribute('data-theme', resolved);
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolved === 'dark' ? '#090a0d' : '#f4f5f7');
    }

    const iconLabel = document.getElementById('theme-icon-label');
    if (iconLabel) {
      iconLabel.innerHTML = resolved === 'dark' ? ICONS.sun : ICONS.moon;
    }

    document.querySelectorAll('#theme-selector .theme-opt-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.themeVal === pref);
    });
  }

  // --- Navigation ---
  function switchTab(tabName) {
    uiState.activeTab = tabName;

    document.querySelectorAll('.tab-view').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `view-${tabName}`);
    });

    document.querySelectorAll('.bottom-nav .nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const settingsBtn = document.getElementById('btn-open-settings');
    if (settingsBtn) {
      settingsBtn.classList.toggle('active', tabName === 'settings');
    }

    const titles = {
      today: 'DAILYFLOW',
      todos: 'TASKS',
      habits: 'HABITS',
      calendar: 'CALENDAR',
      settings: 'SYSTEM'
    };
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[tabName] || 'DAILYFLOW';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderAll();
  }

  // --- Render Precision To-Do Card HTML (Clean Linear / Things 3 Metadata Layout) ---
  function renderTodoCardHTML(todo) {
    const today = toLocalDateStr();
    const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < today;
    const isToday = todo.dueDate === today;

    const cat = store.state.categories.find((c) => c.id === todo.category) || {
      name: 'ทั่วไป'
    };

    const subtasks = Array.isArray(todo.subtasks) ? todo.subtasks : [];
    const doneSubs = subtasks.filter((s) => s.done).length;
    const subPct = subtasks.length > 0 ? Math.round((doneSubs / subtasks.length) * 100) : 0;

    const datePillClass = isOverdue ? 'overdue' : (isToday ? 'today' : '');
    const timeText = todo.dueTime ? ` · ${todo.dueTime}` : '';
    const hasReminder = todo.reminderMinutes && todo.reminderMinutes !== 'none';
    const remLabel = hasReminder ? REMINDER_LABELS[todo.reminderMinutes] || 'แจ้งเตือน' : '';

    const inlineItems = [];
    if (hasReminder) inlineItems.push(`เตือน${remLabel.replace('ล่วงหน้า ', ' ')}`);
    inlineItems.push(cat.name);
    if (todo.tags && todo.tags.length > 0) inlineItems.push(`#${todo.tags[0]}`);

    return `
      <div class="todo-card priority-${todo.priority} ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
        <div class="todo-main-row">
          <button type="button" class="check-circle ${todo.completed ? 'checked' : ''}" data-action="toggle-todo" data-id="${todo.id}" aria-label="สลับสถานะงาน">
            ${todo.completed ? ICONS.check : ''}
          </button>
          <div class="todo-body" data-action="edit-todo" data-id="${todo.id}">
            <div class="todo-title">${escapeHtml(todo.title)}</div>
            ${todo.note ? `<div class="todo-note">${escapeHtml(todo.note)}</div>` : ''}
            <div class="todo-meta-row">
              <span class="meta-pill ${datePillClass}">
                <span class="prio-dot ${todo.priority}"></span>
                ${isOverdue ? 'เลยกำหนด · ' : ''}${formatShortThaiDate(todo.dueDate)}${escapeHtml(timeText)}
              </span>
              <span class="todo-inline-meta">${inlineItems.map(escapeHtml).join(' · ')}</span>
            </div>
          </div>
          <div class="todo-actions">
            <button type="button" class="mini-action-btn" data-action="edit-todo" data-id="${todo.id}" title="แก้ไข">${ICONS.edit}</button>
            <button type="button" class="mini-action-btn delete" data-action="delete-todo" data-id="${todo.id}" title="ลบ">${ICONS.trash}</button>
          </div>
        </div>
        ${subtasks.length > 0 ? `
          <div class="subtasks-box">
            <div class="subtasks-progress-row">
              <div class="subtasks-progress-track">
                <div class="subtasks-progress-fill" style="width:${subPct}%"></div>
              </div>
              <span class="subtasks-count">${doneSubs}/${subtasks.length}</span>
            </div>
            ${subtasks.map((sub) => `
              <div class="subtask-item ${sub.done ? 'done' : ''}" data-action="toggle-subtask" data-todo-id="${todo.id}" data-sub-id="${sub.id}">
                <span class="subtask-check">${sub.done ? ICONS.checkSm : ''}</span>
                <span>${escapeHtml(sub.title)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // --- 1. Render TODAY View (With Interactive 7-Day Date Scrubber & Compact Layout) ---
  function renderTodayView() {
    const today = toLocalDateStr();
    const focusDate = uiState.todayFocusDate || today;
    const isFocusingToday = focusDate === today;

    const hour = new Date().getHours();
    let greeting = 'สวัสดีครับ';
    if (hour < 12) greeting = 'อรุณสวัสดิ์';
    else if (hour < 17) greeting = 'สวัสดีตอนบ่าย';
    else greeting = 'สวัสดีตอนเย็น';

    const eyebrowEl = document.getElementById('today-eyebrow');
    if (eyebrowEl) eyebrowEl.textContent = formatFullThaiDate(focusDate);

    const resetBtn = document.getElementById('btn-hero-reset-today');
    if (resetBtn) {
      resetBtn.style.display = isFocusingToday ? 'none' : 'inline-flex';
    }

    document.getElementById('today-greeting').textContent = isFocusingToday
      ? greeting
      : `แผนงาน · ${formatShortThaiDate(focusDate)}`;

    const allTodos = store.state.todos;
    const dueOnFocus = allTodos.filter((t) =>
      isFocusingToday
        ? (t.dueDate === today || (!t.completed && t.dueDate < today))
        : (t.dueDate === focusDate)
    );
    const completedTodayCount = dueOnFocus.filter((t) => t.completed).length;
    const totalTodayTodos = dueOnFocus.length;
    const pendingTodayCount = dueOnFocus.filter((t) => !t.completed).length;
    const todoPct = totalTodayTodos > 0 ? Math.round((completedTodayCount / totalTodayTodos) * 100) : 100;

    const focusDow = parseLocalDate(focusDate).getDay();
    const habits = store.state.habits;
    const scheduledHabits = habits.filter((h) => (h.frequencyDays || []).includes(focusDow));
    const habitsForDay = scheduledHabits.length > 0 ? scheduledHabits : habits;
    const doneHabitsToday = habitsForDay.filter((h) => h.logs && h.logs[focusDate]).length;
    const totalHabitsToday = habitsForDay.length;
    const habitPct = totalHabitsToday > 0 ? Math.round((doneHabitsToday / totalHabitsToday) * 100) : 100;

    const totalItems = totalTodayTodos + totalHabitsToday;
    const totalDone = completedTodayCount + doneHabitsToday;
    const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    const subText = pendingTodayCount > 0
      ? `เหลือ ${pendingTodayCount} งานที่ต้องทำ · เช็คอินนิสัย ${doneHabitsToday}/${totalHabitsToday}`
      : `เคลียร์งานครบแล้ว · เช็คอินนิสัย ${doneHabitsToday}/${totalHabitsToday}`;
    document.getElementById('today-full-date').textContent = subText;

    const statusTextEl = document.getElementById('header-status-text');
    if (statusTextEl) {
      statusTextEl.textContent = `INK & CHARISMA • ${overallPct}% DONE`;
    }

    document.getElementById('today-overall-pill').textContent = `${overallPct}%`;
    const ringCircle = document.getElementById('today-ring-circle');
    if (ringCircle) {
      const circumference = 213.63; // 2 * PI * 34
      const offset = circumference - (overallPct / 100) * circumference;
      ringCircle.style.strokeDashoffset = `${offset}`;
    }

    document.getElementById('hero-todo-count').textContent = `${completedTodayCount}/${totalTodayTodos}`;
    document.getElementById('hero-todo-bar').style.width = `${todoPct}%`;
    document.getElementById('hero-habit-count').textContent = `${doneHabitsToday}/${totalHabitsToday}`;
    document.getElementById('hero-habit-bar').style.width = `${habitPct}%`;

    // Render Interactive 7-Day Week Scrubber (Mon - Sun around focusDate)
    const scrubberEl = document.getElementById('hero-week-scrubber');
    if (scrubberEl) {
      const curObj = parseLocalDate(focusDate);
      const dowOffset = (curObj.getDay() + 6) % 7; // Monday = 0
      const weekStart = new Date(curObj.getFullYear(), curObj.getMonth(), curObj.getDate() - dowOffset);
      const weekCells = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        const dStr = toLocalDateStr(d);
        const hasPending = allTodos.some((t) => !t.completed && t.dueDate === dStr);
        const hasDoneHab = habits.some((h) => h.logs && h.logs[dStr]);
        weekCells.push({
          dateStr: dStr,
          dowLabel: THAI_DAYS_SHORT[d.getDay()],
          dayNum: d.getDate(),
          isToday: dStr === today,
          isSelected: dStr === focusDate,
          hasPending,
          hasDoneHab
        });
      }
      scrubberEl.innerHTML = weekCells.map((c) => `
        <button
          type="button"
          class="scrubber-day-btn ${c.isSelected ? 'active' : ''} ${c.isToday ? 'is-today' : ''}"
          data-action="select-hero-date"
          data-date="${c.dateStr}"
        >
          <span class="scrubber-dow">${c.dowLabel}</span>
          <span class="scrubber-num">${c.dayNum}</span>
          <span class="scrubber-dots">
            ${c.hasPending ? '<i class="s-dot pending"></i>' : ''}
            ${c.hasDoneHab ? '<i class="s-dot habit"></i>' : ''}
          </span>
        </button>
      `).join('');
    }

    // Update section headings & quick-add placeholder for focused date
    const quickInput = document.getElementById('quick-add-todo-input');
    if (quickInput) {
      quickInput.placeholder = isFocusingToday
        ? 'เพิ่มงานด่วนสำหรับวันนี้...'
        : `เพิ่มงานสำหรับ ${formatShortThaiDate(focusDate)}...`;
    }

    // Render Role Model Vision Board (5-Card Bento Showcase)
    renderVisionBoard();

    // Render Compact 2x2 Tactile Habit Capsules
    document.getElementById('today-habits-badge').textContent = `${doneHabitsToday}/${totalHabitsToday}`;
    const habitsContainer = document.getElementById('today-habits-container');
    if (habitsForDay.length === 0) {
      habitsContainer.innerHTML = `
        <div class="empty-state">
          <p>ยังไม่มีนิสัยในวันนี้</p>
        </div>
      `;
    } else {
      habitsContainer.innerHTML = habitsForDay.map((hab) => {
        const stats = calculateHabitStats(hab, today);
        const isDoneOnFocus = !!(hab.logs && hab.logs[focusDate]);
        return `
          <button type="button" class="today-habit-tile ${isDoneOnFocus ? 'done' : ''}" data-action="toggle-habit-date" data-id="${hab.id}" data-date="${focusDate}">
            <div class="habit-tile-icon">
              ${isDoneOnFocus ? ICONS.check : getHabitSvg(hab.icon)}
            </div>
            <div class="habit-tile-info">
              <div class="habit-tile-title">${escapeHtml(hab.title)}</div>
              <div class="habit-tile-streak">
                ${isDoneOnFocus ? `เช็คอินแล้ว · ${stats.currentStreak}d` : `ต่อเนื่อง ${stats.currentStreak} วัน`}
              </div>
            </div>
          </button>
        `;
      }).join('');
    }

    // Render Today & Overdue Todos
    document.getElementById('today-todos-badge').textContent = `${pendingTodayCount}`;
    const todosContainer = document.getElementById('today-todos-container');

    const sortedTodayTodos = [...dueOnFocus].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const prioOrder = { high: 0, medium: 1, low: 2 };
      if (prioOrder[a.priority] !== prioOrder[b.priority]) {
        return prioOrder[a.priority] - prioOrder[b.priority];
      }
      return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
    });

    if (sortedTodayTodos.length === 0) {
      todosContainer.innerHTML = `
        <div class="empty-state">
          <p>ไม่มีรายการงานในวันที่เลือก</p>
        </div>
      `;
    } else {
      todosContainer.innerHTML = sortedTodayTodos.map(renderTodoCardHTML).join('');
    }
  }

  // --- 2. Render TO-DO LIST View ---
  function renderTodosView() {
    const today = toLocalDateStr();
    const cats = store.state.categories;

    const catChipsRow = document.getElementById('todo-category-chips');
    catChipsRow.innerHTML = [
      `<button class="filter-chip ${uiState.todoFilterCategory === 'all' ? 'active' : ''}" data-cat="all">ทุกหมวดหมู่</button>`,
      ...cats.map((c) => `
        <button class="filter-chip ${uiState.todoFilterCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
          ${escapeHtml(c.name)}
        </button>
      `)
    ].join('');

    let list = [...store.state.todos];

    if (uiState.todoFilterStatus === 'today') {
      list = list.filter((t) => t.dueDate === today);
    } else if (uiState.todoFilterStatus === 'upcoming') {
      list = list.filter((t) => !t.completed && t.dueDate > today);
    } else if (uiState.todoFilterStatus === 'overdue') {
      list = list.filter((t) => !t.completed && t.dueDate < today);
    } else if (uiState.todoFilterStatus === 'completed') {
      list = list.filter((t) => t.completed);
    }

    if (uiState.todoFilterCategory !== 'all') {
      list = list.filter((t) => t.category === uiState.todoFilterCategory);
    }

    const q = uiState.todoSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.note || '').toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    const prioWeight = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => {
      if (uiState.todoFilterStatus !== 'completed' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (uiState.todoSortBy === 'priority') {
        if (prioWeight[a.priority] !== prioWeight[b.priority]) {
          return prioWeight[a.priority] - prioWeight[b.priority];
        }
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      }
      if (uiState.todoSortBy === 'created') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      const cmpDate = (a.dueDate || '').localeCompare(b.dueDate || '');
      if (cmpDate !== 0) return cmpDate;
      return prioWeight[a.priority] - prioWeight[b.priority];
    });

    document.getElementById('filtered-todos-count').textContent = `${list.length}`;
    const container = document.getElementById('all-todos-container');
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>ไม่พบรายการงานในหมวดนี้</p>
        </div>
      `;
    } else {
      container.innerHTML = list.map(renderTodoCardHTML).join('');
    }
  }

  // --- 3. Render HABITS View ---
  function renderHabitsView() {
    const today = toLocalDateStr();
    const habits = store.state.habits;

    let maxBestStreak = 0;
    let totalCheckinsAll = 0;
    let doneTodayCount = 0;

    const statsMap = {};
    habits.forEach((h) => {
      const st = calculateHabitStats(h, today);
      statsMap[h.id] = st;
      if (st.bestStreak > maxBestStreak) maxBestStreak = st.bestStreak;
      totalCheckinsAll += st.totalCheckins;
      if (st.isDoneToday) doneTodayCount++;
    });

    const todayRate = habits.length > 0 ? Math.round((doneTodayCount / habits.length) * 100) : 0;
    document.getElementById('hab-stat-today').textContent = `${todayRate}%`;
    document.getElementById('hab-stat-best-streak').textContent = `${maxBestStreak}d`;
    document.getElementById('hab-stat-total').textContent = `${totalCheckinsAll}`;

    const habitsBanner = document.getElementById('habits-vision-banner');
    if (habitsBanner) {
      habitsBanner.innerHTML = `
        <div class="vision-avatar-stack">
          ${ROLE_MODELS.map((rm) => `
            <img class="vision-avatar-item" src="${rm.src}" alt="${escapeHtml(rm.shortTitle)}" style="object-position:${rm.pos};" />
          `).join('')}
        </div>
        <div class="vision-banner-info">
          <div class="vision-banner-title">Jay Park · หุ่นลีน & Charisma</div>
          <div class="vision-banner-sub">เช็คอินวันนี้ ${doneTodayCount}/${habits.length} · แตะดู 4 ภาพต้นแบบ</div>
        </div>
        <span class="section-link" style="flex-shrink:0;">เปิด ↗</span>
      `;
    }

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = addDays(today, -i);
      const dObj = parseLocalDate(dStr);
      last7Days.push({
        dateStr: dStr,
        dayNum: dObj.getDate(),
        dow: dObj.getDay(),
        dowLabel: THAI_DAYS_SHORT[dObj.getDay()],
        isToday: dStr === today
      });
    }

    const container = document.getElementById('all-habits-container');
    if (habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>ยังไม่มีนิสัยที่ติดตาม กด "+ สร้างนิสัย" เพื่อเริ่มต้น</p>
        </div>
      `;
      return;
    }

    container.innerHTML = habits.map((hab) => {
      const st = statsMap[hab.id];
      const freq = hab.frequencyDays || [0, 1, 2, 3, 4, 5, 6];
      const freqLabel = freq.length === 7
        ? 'ทุกวัน'
        : freq.map((d) => THAI_DAYS_SHORT[d]).join(' · ');

      return `
        <div class="habit-card" data-habit-id="${hab.id}">
          <div class="habit-card-top">
            <div class="habit-title-group" data-action="open-habit-detail" data-id="${hab.id}">
              <div class="habit-avatar">
                ${getHabitSvg(hab.icon)}
              </div>
              <div>
                <div class="habit-name">${escapeHtml(hab.title)}</div>
                <div class="habit-submeta">
                  <span>ต่อเนื่อง ${st.currentStreak} วัน</span>
                  <span>·</span>
                  <span>สูงสุด ${st.bestStreak} วัน</span>
                </div>
              </div>
            </div>
            <button type="button" class="habit-today-btn ${st.isDoneToday ? 'done' : ''}" data-action="toggle-habit-date" data-id="${hab.id}" data-date="${today}">
              ${st.isDoneToday ? `${ICONS.check} เช็คแล้ว` : 'เช็คอิน'}
            </button>
          </div>

          <div class="habit-week-strip">
            ${last7Days.map((day) => {
              const checked = !!(hab.logs && hab.logs[day.dateStr]);
              const scheduled = freq.includes(day.dow);
              return `
                <div class="week-day-col">
                  <span class="week-day-label">${day.dowLabel}</span>
                  <button
                    type="button"
                    class="week-day-btn ${checked ? 'checked' : ''} ${day.isToday ? 'today-ring' : ''} ${!scheduled ? 'unscheduled' : ''}"
                    data-action="toggle-habit-date"
                    data-id="${hab.id}"
                    data-date="${day.dateStr}"
                    title="${day.dateStr}"
                  >
                    ${checked ? ICONS.check : day.dayNum}
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="habit-card-footer">
            <span>${freqLabel} · สำเร็จ ${st.rate30d}% (30d)</span>
            <div style="display:flex; gap:6px; align-items:center;">
              <button type="button" class="section-link" data-action="open-habit-detail" data-id="${hab.id}">
                ${ICONS.grid} สถิติ 90 วัน
              </button>
              <button type="button" class="mini-action-btn" data-action="edit-habit" data-id="${hab.id}" title="แก้ไข">${ICONS.edit}</button>
              <button type="button" class="mini-action-btn delete" data-action="delete-habit" data-id="${hab.id}" title="ลบ">${ICONS.trash}</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 4. Render CALENDAR View ---
  function renderCalendarView() {
    const today = toLocalDateStr();
    const cursor = parseLocalDate(uiState.calendarCursorDate);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    document.getElementById('cal-month-label').textContent = `${THAI_MONTHS[month]} ${year}`;
    document.getElementById('cal-mode-toggle-btn').textContent =
      uiState.calendarMode === 'month' ? 'เดือน' : 'สัปดาห์';

    const todosByDate = {};
    store.state.todos.forEach((t) => {
      if (!t.dueDate) return;
      if (!todosByDate[t.dueDate]) todosByDate[t.dueDate] = [];
      todosByDate[t.dueDate].push(t);
    });

    const habits = store.state.habits;

    const cells = [];
    if (uiState.calendarMode === 'month') {
      const firstOfMonth = new Date(year, month, 1);
      const startOffset = (firstOfMonth.getDay() + 6) % 7;
      const gridStart = new Date(year, month, 1 - startOffset);

      for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
        cells.push({
          dateStr: toLocalDateStr(d),
          dayNum: d.getDate(),
          inCurrentMonth: d.getMonth() === month
        });
      }
    } else {
      const dowOffset = (cursor.getDay() + 6) % 7;
      const weekStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - dowOffset);
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        cells.push({
          dateStr: toLocalDateStr(d),
          dayNum: d.getDate(),
          inCurrentMonth: true
        });
      }
    }

    const gridEl = document.getElementById('cal-days-grid');
    gridEl.innerHTML = cells.map((cell) => {
      const dayTodos = todosByDate[cell.dateStr] || [];
      const hasPendingTodo = dayTodos.some((t) => !t.completed);
      const hasDoneTodo = dayTodos.some((t) => t.completed);
      const hasHabitDone = habits.some((h) => h.logs && h.logs[cell.dateStr]);

      const isToday = cell.dateStr === today;
      const isSelected = cell.dateStr === uiState.calendarSelectedDate;

      return `
        <div
          class="cal-day-cell ${!cell.inCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}"
          data-action="select-cal-date"
          data-date="${cell.dateStr}"
        >
          <span class="cal-day-num">${cell.dayNum}</span>
          <div class="cal-dots-row">
            ${hasPendingTodo ? '<span class="cal-dot todo-pending"></span>' : ''}
            ${hasDoneTodo ? '<span class="cal-dot todo-done"></span>' : ''}
            ${hasHabitDone ? '<span class="cal-dot habit-done"></span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    const selDate = uiState.calendarSelectedDate;
    document.getElementById('cal-selected-date-label').textContent = formatFullThaiDate(selDate);

    const selTodos = todosByDate[selDate] || [];
    const selHabitsDone = habits.filter((h) => h.logs && h.logs[selDate]).length;
    document.getElementById('cal-selected-summary').textContent =
      `งาน ${selTodos.length} รายการ · เช็คอินนิสัย ${selHabitsDone}/${habits.length}`;

    const calTodosContainer = document.getElementById('cal-date-todos');
    if (selTodos.length === 0) {
      calTodosContainer.innerHTML = `
        <div class="empty-state" style="padding:18px;">
          <p>ไม่มีงานที่กำหนดไว้ในวันนี้</p>
        </div>
      `;
    } else {
      calTodosContainer.innerHTML = selTodos.map(renderTodoCardHTML).join('');
    }

    const calHabitsContainer = document.getElementById('cal-date-habits');
    if (habits.length === 0) {
      calHabitsContainer.innerHTML = `<div class="empty-state"><p>ยังไม่มีรายการนิสัย</p></div>`;
    } else {
      calHabitsContainer.innerHTML = habits.map((hab) => {
        const isDoneOnDate = !!(hab.logs && hab.logs[selDate]);
        return `
          <button type="button" class="today-habit-tile ${isDoneOnDate ? 'done' : ''}" data-action="toggle-habit-date" data-id="${hab.id}" data-date="${selDate}">
            <div class="habit-tile-icon">
              ${isDoneOnDate ? ICONS.check : getHabitSvg(hab.icon)}
            </div>
            <div class="habit-tile-info">
              <div class="habit-tile-title">${escapeHtml(hab.title)}</div>
              <div class="habit-tile-streak">${isDoneOnDate ? 'เช็คอินเรียบร้อย' : 'แตะเพื่อบันทึก'}</div>
            </div>
          </button>
        `;
      }).join('');
    }
  }

  // --- 5. Habit 90-Day Heatmap Modal ---
  function openHabitDetailModal(habitId) {
    const hab = store.state.habits.find((h) => h.id === habitId);
    if (!hab) return;
    uiState.activeHeatmapHabitId = habitId;

    const today = toLocalDateStr();
    const st = calculateHabitStats(hab, today);

    document.getElementById('habit-detail-title').textContent = hab.title;

    const cells = [];
    for (let i = 90; i >= 0; i--) {
      const dStr = addDays(today, -i);
      const done = !!(hab.logs && hab.logs[dStr]);
      cells.push({
        dateStr: dStr,
        done,
        isToday: dStr === today
      });
    }

    const body = document.getElementById('habit-detail-body');
    body.innerHTML = `
      <div class="stats-banner-row" style="margin-bottom:14px;">
        <div class="stat-mini-card">
          <div class="stat-mini-value">${st.currentStreak}d</div>
          <div class="stat-mini-label">Streak ปัจจุบัน</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-value">${st.bestStreak}d</div>
          <div class="stat-mini-label">Streak สูงสุด</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-value">${st.rate30d}%</div>
          <div class="stat-mini-label">30 วันล่าสุด</div>
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
        ความสม่ำเสมอ 91 วันย้อนหลัง (แตะช่องเพื่อบันทึกย้อนหลัง)
      </div>
      <div class="heatmap-grid">
        ${cells.map((c) => `
          <div
            class="heatmap-cell ${c.done ? 'active' : ''} ${c.isToday ? 'is-today' : ''}"
            data-action="toggle-heatmap-cell"
            data-id="${hab.id}"
            data-date="${c.dateStr}"
            title="${c.dateStr}"
          ></div>
        `).join('')}
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-top:6px;">
        <span>90 วันที่แล้ว</span>
        <span>เช็คอินสะสม ${st.totalCheckins} ครั้ง</span>
        <span>วันนี้</span>
      </div>
    `;

    openModal('habit-detail-modal');
  }

  // --- 6. Notification Center Modal ---
  function openNotificationModal() {
    const statusEl = document.getElementById('notif-permission-status');
    const enableBtn = document.getElementById('btn-enable-browser-notif');

    if (!('Notification' in window)) {
      statusEl.textContent = 'เบราว์เซอร์นี้ใช้การแจ้งเตือนในแอป + ซิงค์ .ics เข้าปฏิทินมือถือได้';
      enableBtn.style.display = 'none';
    } else if (Notification.permission === 'granted') {
      statusEl.textContent = 'สถานะ: เปิดรับการแจ้งเตือนและเสียงสัญญาณแล้ว ●';
      statusEl.style.color = 'var(--emerald)';
      enableBtn.textContent = 'เปิดใช้งานแล้ว';
      enableBtn.disabled = true;
    } else {
      statusEl.textContent = 'กดปุ่มด้านขวาเพื่ออนุญาตแจ้งเตือนเมื่อถึงเวลานัดหมาย';
      statusEl.style.color = 'var(--text-secondary)';
      enableBtn.textContent = 'เปิดแจ้งเตือน';
      enableBtn.disabled = false;
    }

    const scheduledList = document.getElementById('scheduled-reminders-list');
    const upcoming = store.state.todos
      .filter((t) => !t.completed && t.reminderMinutes && t.reminderMinutes !== 'none')
      .sort((a, b) => (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || '')));

    if (upcoming.length === 0) {
      scheduledList.innerHTML = `
        <div class="empty-state" style="padding:16px;">
          <p>ยังไม่มีรายการงานที่ตั้งเวลาแจ้งเตือน</p>
        </div>
      `;
    } else {
      scheduledList.innerHTML = upcoming.map((t) => `
        <div class="todo-card" style="padding:10px 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div style="min-width:0;">
              <div style="font-size:0.82rem; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(t.title)}
              </div>
              <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">
                ${formatShortThaiDate(t.dueDate)}${t.dueTime ? ` · ${t.dueTime} น.` : ''} (${REMINDER_LABELS[t.reminderMinutes] || 'แจ้งเตือน'})
              </div>
            </div>
            <button type="button" class="mini-action-btn" data-action="edit-todo" data-id="${t.id}" title="แก้ไขเวลา">${ICONS.edit}</button>
          </div>
        </div>
      `).join('');
    }

    openModal('notification-modal');
  }

  // --- Modal Helpers ---
  // --- 6.5 Role Model Vision Board & Lightbox Modal ---
  function renderVisionBoard() {
    const grid = document.getElementById('today-vision-grid');
    if (!grid) return;

    grid.classList.toggle('mono-tone', !!uiState.visionMonoTone);
    const toneBtn = document.getElementById('btn-toggle-vision-tone');
    if (toneBtn) {
      toneBtn.textContent = uiState.visionMonoTone ? 'โทนขาวดำ' : 'สีจริง';
    }

    const featured = ROLE_MODELS.find((r) => r.id === uiState.visionFeaturedId) || ROLE_MODELS[0];
    const others = ROLE_MODELS.filter((r) => r.id !== featured.id);
    const ordered = [featured, ...others];

    grid.innerHTML = ordered.map((rm, idx) => {
      const isFeatured = idx === 0;
      return `
        <button type="button" class="vision-card ${isFeatured ? 'is-featured' : ''}" data-action="open-vision-item" data-id="${rm.id}">
          <img class="vision-card-img" src="${rm.src}" alt="${escapeHtml(rm.title)}" style="object-position:${rm.pos};" loading="eager" />
          <div class="vision-card-caption">
            ${isFeatured ? `<span class="vision-card-pill">${escapeHtml(rm.badge)}</span>` : ''}
            <div class="vision-card-title">${escapeHtml(rm.shortTitle)}</div>
            ${isFeatured ? `<div class="vision-card-sub">${escapeHtml(rm.shortSub)}</div>` : ''}
          </div>
        </button>
      `;
    }).join('');
  }

  function openVisionModal(roleModelId = null) {
    uiState.visionActiveId = roleModelId || uiState.visionFeaturedId || ROLE_MODELS[0].id;
    renderVisionModalContent();
    openModal('vision-modal');
  }

  function renderVisionModalContent() {
    const idx = Math.max(0, ROLE_MODELS.findIndex((r) => r.id === uiState.visionActiveId));
    const current = ROLE_MODELS[idx] || ROLE_MODELS[0];

    document.getElementById('vision-modal-pillar').textContent = current.pillar;
    document.getElementById('vision-modal-title').textContent = current.title;

    const stageImg = document.getElementById('vision-stage-img');
    stageImg.src = current.src;
    stageImg.style.objectPosition = current.pos;

    document.getElementById('vision-stage-badge').textContent = `${idx + 1} / ${ROLE_MODELS.length}`;
    document.getElementById('vision-stage-sub').textContent = current.subtitle;
    document.getElementById('vision-focus-box').textContent = current.focus;

    const pinBtn = document.getElementById('btn-vision-pin-featured');
    if (pinBtn) {
      const isAlreadyPinned = current.id === uiState.visionFeaturedId;
      pinBtn.textContent = isAlreadyPinned ? '✓ ภาพหลักหน้าแรก' : 'ตั้งเป็นภาพหลักหน้าแรก';
    }

    const thumbsRow = document.getElementById('vision-thumbs-row');
    if (thumbsRow) {
      thumbsRow.innerHTML = ROLE_MODELS.map((rm) => `
        <button type="button" class="vision-thumb-btn ${rm.id === current.id ? 'active' : ''}" data-action="select-vision-thumb" data-id="${rm.id}">
          <img src="${rm.src}" alt="${escapeHtml(rm.shortTitle)}" style="object-position:${rm.pos};" />
        </button>
      `).join('');
    }
  }

  function cycleVisionSlide(delta) {
    const idx = Math.max(0, ROLE_MODELS.findIndex((r) => r.id === uiState.visionActiveId));
    const nextIdx = (idx + delta + ROLE_MODELS.length) % ROLE_MODELS.length;
    uiState.visionActiveId = ROLE_MODELS[nextIdx].id;
    renderVisionModalContent();
  }

  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }

  // --- Open Add / Edit To-Do Modal ---
  function openTodoModal(todoId = null, defaultDate = null) {
    const cats = store.state.categories;
    const catSelect = document.getElementById('todo-category-select');
    catSelect.innerHTML = cats.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    const existing = todoId ? store.state.todos.find((t) => t.id === todoId) : null;
    document.getElementById('todo-modal-title').textContent = existing ? 'แก้ไขงาน & การแจ้งเตือน' : 'เพิ่มงานใหม่';
    document.getElementById('todo-id-input').value = existing ? existing.id : '';
    document.getElementById('todo-title-input').value = existing ? existing.title : '';
    document.getElementById('todo-note-input').value = existing ? existing.note : '';
    document.getElementById('todo-date-input').value = existing
      ? existing.dueDate
      : (defaultDate || toLocalDateStr());
    document.getElementById('todo-time-input').value = existing ? (existing.dueTime || '09:00') : '09:00';
    document.getElementById('todo-reminder-select').value = existing
      ? (existing.reminderMinutes || 'none')
      : '15';
    catSelect.value = existing ? existing.category : (cats[0]?.id || 'personal');
    document.getElementById('todo-tags-input').value = existing ? (existing.tags || []).join(', ') : '';

    uiState.draftTodoPriority = existing ? existing.priority : 'medium';
    document.querySelectorAll('#todo-priority-selector .prio-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.prio === uiState.draftTodoPriority);
    });

    uiState.draftTodoSubtasks = existing && Array.isArray(existing.subtasks)
      ? existing.subtasks.map((s) => ({ ...s }))
      : [];
    renderDraftSubtasks();

    openModal('todo-modal');
    setTimeout(() => document.getElementById('todo-title-input').focus(), 100);
  }

  function renderDraftSubtasks() {
    const listEl = document.getElementById('todo-subtasks-draft-list');
    listEl.innerHTML = uiState.draftTodoSubtasks.map((sub, idx) => `
      <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-subtle); padding:7px 11px; border-radius:8px; font-size:0.8rem;">
        <span>· ${escapeHtml(sub.title)}</span>
        <button type="button" data-remove-sub-idx="${idx}" style="color:var(--tesla-red); font-weight:600; font-size:0.75rem;">ลบ</button>
      </div>
    `).join('');
  }

  // --- Open Add / Edit Habit Modal ---
  function openHabitModal(habitId = null) {
    const existing = habitId ? store.state.habits.find((h) => h.id === habitId) : null;
    document.getElementById('habit-modal-title').textContent = existing ? 'แก้ไขนิสัย' : 'สร้างนิสัยใหม่';
    document.getElementById('habit-id-input').value = existing ? existing.id : '';
    document.getElementById('habit-title-input').value = existing ? existing.title : '';

    uiState.draftHabitIcon = existing ? normalizeHabitIconKey(existing.icon) : 'hydration';
    uiState.draftHabitColor = existing ? existing.color : '#3e6ae1';
    uiState.draftHabitDays = existing && Array.isArray(existing.frequencyDays)
      ? [...existing.frequencyDays]
      : [0, 1, 2, 3, 4, 5, 6];

    const iconPicker = document.getElementById('habit-emoji-picker');
    iconPicker.innerHTML = Object.keys(HABIT_ICONS).map((key) => `
      <button type="button" class="emoji-opt ${key === uiState.draftHabitIcon ? 'active' : ''}" data-icon-key="${key}">
        ${HABIT_ICONS[key]}
      </button>
    `).join('');

    document.querySelectorAll('#habit-color-picker .color-opt').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color === uiState.draftHabitColor);
    });

    document.querySelectorAll('#habit-weekday-selector .weekday-btn').forEach((btn) => {
      const dayNum = Number(btn.dataset.day);
      btn.classList.toggle('active', uiState.draftHabitDays.includes(dayNum));
    });

    openModal('habit-modal');
    setTimeout(() => document.getElementById('habit-title-input').focus(), 100);
  }

  // --- Master Render ---
  function renderAll() {
    applyTheme();
    renderTodayView();
    renderTodosView();
    renderHabitsView();
    renderCalendarView();
    checkDueReminders();
    if (uiState.activeHeatmapHabitId && document.getElementById('habit-detail-modal').classList.contains('open')) {
      openHabitDetailModal(uiState.activeHeatmapHabitId);
    }
  }

  // --- Event Listeners Setup ---
  function bindEvents() {
    document.querySelectorAll('.bottom-nav .nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('btn-open-settings').addEventListener('click', () => switchTab('settings'));
    document.getElementById('btn-notifications').addEventListener('click', () => openNotificationModal());
    document.getElementById('btn-settings-open-notif').addEventListener('click', () => openNotificationModal());
    document.getElementById('btn-settings-export-ics').addEventListener('click', () => exportTasksToICS());
    document.getElementById('btn-sync-cal-ics').addEventListener('click', () => exportTasksToICS(uiState.calendarSelectedDate));
    document.getElementById('btn-export-ics').addEventListener('click', () => exportTasksToICS());

    // Enable Browser Notification Permission
    document.getElementById('btn-enable-browser-notif').addEventListener('click', async () => {
      if (!('Notification' in window)) {
        showToast('อุปกรณ์นี้ไม่รองรับ Web Notification API แนะนำให้กดปุ่มซิงค์ .ics');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        store.updateSettings({ notificationsEnabled: true });
        openNotificationModal();
        fireSystemNotification('DailyFlow Telemetry', 'ระบบแจ้งเตือนงานและปฏิทินพร้อมทำงานแล้ว');
        showToast('เปิดระบบแจ้งเตือนสำเร็จ');
      } else {
        showToast('กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเบราว์เซอร์');
      }
    });

    // Test Notification Button
    document.getElementById('btn-test-notif').addEventListener('click', () => {
      closeModal('notification-modal');
      triggerHeadsUpAlert({
        id: store.state.todos[0]?.id || 'test',
        title: store.state.todos[0]?.title || 'ทดสอบระบบแจ้งเตือน DailyFlow',
        dueDate: toLocalDateStr(),
        dueTime: '10:00',
        note: 'สัญญาณแจ้งเตือนพร้อมทำงานบนมือถือของคุณ'
      });
    });

    // Heads-up Alert Banner Actions
    document.getElementById('btn-dismiss-alert').addEventListener('click', () => {
      document.getElementById('heads-up-alert').classList.remove('active');
    });

    document.getElementById('btn-alert-complete').addEventListener('click', () => {
      if (uiState.activeAlertTodoId && uiState.activeAlertTodoId !== 'test') {
        const t = store.state.todos.find((x) => x.id === uiState.activeAlertTodoId);
        if (t && !t.completed) store.toggleTodo(t.id);
      }
      document.getElementById('heads-up-alert').classList.remove('active');
      showToast('บันทึกงานเสร็จสิ้นแล้ว ✓');
    });

    document.getElementById('btn-alert-snooze').addEventListener('click', () => {
      if (uiState.activeAlertTodoId && uiState.activeAlertTodoId !== 'test') {
        store.snoozeTodo(uiState.activeAlertTodoId, 10);
      }
      document.getElementById('heads-up-alert').classList.remove('active');
      showToast('เลื่อนการแจ้งเตือนออกไปอีก 10 นาที');
    });

    // Quick section links
    document.querySelectorAll('[data-goto-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.gotoTab));
    });

    // Header Theme Toggle
    document.getElementById('btn-quick-theme').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      store.updateSettings({ theme: next });
      showToast(next === 'dark' ? 'โหมด Tesla Obsidian (Dark)' : 'โหมด Titanium Pearl (Light)');
    });

    // Today Section Add Habit & Add Todo Buttons
    const btnTodayNewHabit = document.getElementById('btn-today-new-habit');
    if (btnTodayNewHabit) {
      btnTodayNewHabit.addEventListener('click', () => openHabitModal());
    }
    const btnTodayNewTodo = document.getElementById('btn-today-new-todo');
    if (btnTodayNewTodo) {
      btnTodayNewTodo.addEventListener('click', () => openTodoModal(null, uiState.todayFocusDate));
    }

    // Role Model Vision Board Controls
    const btnBrandAvatar = document.getElementById('btn-brand-avatar');
    if (btnBrandAvatar) {
      btnBrandAvatar.addEventListener('click', () => openVisionModal('jay-4'));
    }
    const btnToggleVisionTone = document.getElementById('btn-toggle-vision-tone');
    if (btnToggleVisionTone) {
      btnToggleVisionTone.addEventListener('click', () => {
        uiState.visionMonoTone = !uiState.visionMonoTone;
        localStorage.setItem('dailyflow_vision_mono', uiState.visionMonoTone ? '1' : '0');
        renderVisionBoard();
        showToast(uiState.visionMonoTone ? 'โทนภาพขาว-ดำ (Noir Ink)' : 'โทนภาพสีจริง (Full Color)');
      });
    }
    const btnOpenVisionBoard = document.getElementById('btn-open-vision-board');
    if (btnOpenVisionBoard) {
      btnOpenVisionBoard.addEventListener('click', () => openVisionModal());
    }
    const habitsVisionBanner = document.getElementById('habits-vision-banner');
    if (habitsVisionBanner) {
      habitsVisionBanner.addEventListener('click', () => openVisionModal());
    }
    const btnVisionPrev = document.getElementById('btn-vision-prev');
    if (btnVisionPrev) {
      btnVisionPrev.addEventListener('click', () => cycleVisionSlide(-1));
    }
    const btnVisionNext = document.getElementById('btn-vision-next');
    if (btnVisionNext) {
      btnVisionNext.addEventListener('click', () => cycleVisionSlide(1));
    }
    const btnVisionPin = document.getElementById('btn-vision-pin-featured');
    if (btnVisionPin) {
      btnVisionPin.addEventListener('click', () => {
        uiState.visionFeaturedId = uiState.visionActiveId;
        localStorage.setItem('dailyflow_vision_featured_jay', uiState.visionFeaturedId);
        renderVisionBoard();
        renderVisionModalContent();
        showToast('ตั้งเป็นภาพหลักในหน้าแรกแล้ว');
      });
    }

    // Reset Today Scrubber Button
    const btnHeroResetToday = document.getElementById('btn-hero-reset-today');
    if (btnHeroResetToday) {
      btnHeroResetToday.addEventListener('click', () => {
        uiState.todayFocusDate = toLocalDateStr();
        renderTodayView();
      });
    }

    // Quick Add Priority Cycling Button
    const btnQuickPrio = document.getElementById('btn-quick-prio');
    if (btnQuickPrio) {
      btnQuickPrio.addEventListener('click', () => {
        const order = ['medium', 'high', 'low'];
        const labels = { medium: 'ปกติ', high: 'ด่วน', low: 'ทั่วไป' };
        const nextIdx = (order.indexOf(uiState.quickAddPriority) + 1) % order.length;
        uiState.quickAddPriority = order[nextIdx];
        const dot = document.getElementById('quick-prio-dot');
        const lbl = document.getElementById('quick-prio-label');
        if (dot) dot.className = `prio-dot ${uiState.quickAddPriority}`;
        if (lbl) lbl.textContent = labels[uiState.quickAddPriority];
      });
    }

    // Dock Center Add Button
    document.getElementById('fab-main-add').addEventListener('click', () => {
      if (uiState.activeTab === 'habits') {
        openHabitModal();
      } else if (uiState.activeTab === 'calendar') {
        openTodoModal(null, uiState.calendarSelectedDate);
      } else {
        openTodoModal(null, uiState.todayFocusDate);
      }
    });

    // Quick Add Todo on Today View
    document.getElementById('quick-add-todo-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('quick-add-todo-input');
      const title = input.value.trim();
      if (!title) return;
      store.addTodo({
        title,
        dueDate: uiState.todayFocusDate || toLocalDateStr(),
        priority: uiState.quickAddPriority || 'medium',
        category: 'personal'
      });
      input.value = '';
      showToast('เพิ่มงานเรียบร้อยแล้ว');
    });

    // Delegated Actions
    document.body.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;

      if (action === 'toggle-todo') {
        store.toggleTodo(id);
      } else if (action === 'edit-todo') {
        closeModal('notification-modal');
        openTodoModal(id);
      } else if (action === 'delete-todo') {
        if (confirm('ต้องการลบรายการงานนี้ใช่หรือไม่?')) {
          store.deleteTodo(id);
          showToast('ลบรายการงานแล้ว');
        }
      } else if (action === 'toggle-subtask') {
        store.toggleSubtask(actionEl.dataset.todoId, actionEl.dataset.subId);
      } else if (action === 'toggle-habit-date') {
        const dateStr = actionEl.dataset.date || toLocalDateStr();
        const checked = store.toggleHabitDate(id, dateStr);
        if (checked && dateStr === toLocalDateStr()) {
          showToast('เช็คอินนิสัยสำเร็จ');
        }
      } else if (action === 'open-habit-detail') {
        openHabitDetailModal(id);
      } else if (action === 'toggle-heatmap-cell') {
        store.toggleHabitDate(id, actionEl.dataset.date);
      } else if (action === 'edit-habit') {
        openHabitModal(id);
      } else if (action === 'delete-habit') {
        if (confirm('ต้องการลบนิสัยนี้และประวัติทั้งหมดใช่หรือไม่?')) {
          store.deleteHabit(id);
          showToast('ลบนิสัยเรียบร้อยแล้ว');
        }
      } else if (action === 'select-cal-date') {
        uiState.calendarSelectedDate = actionEl.dataset.date;
        renderCalendarView();
      } else if (action === 'select-hero-date') {
        uiState.todayFocusDate = actionEl.dataset.date;
        renderTodayView();
      } else if (action === 'open-vision-item') {
        openVisionModal(actionEl.dataset.id);
      } else if (action === 'select-vision-thumb') {
        uiState.visionActiveId = actionEl.dataset.id;
        renderVisionModalContent();
      }
    });

    // Todo Filter & Search Events
    document.getElementById('todo-search-input').addEventListener('input', (e) => {
      uiState.todoSearchQuery = e.target.value;
      renderTodosView();
    });

    document.getElementById('todo-status-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-status]');
      if (!chip) return;
      uiState.todoFilterStatus = chip.dataset.status;
      document.querySelectorAll('#todo-status-chips .filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.status === uiState.todoFilterStatus);
      });
      renderTodosView();
    });

    document.getElementById('todo-category-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      uiState.todoFilterCategory = chip.dataset.cat;
      renderTodosView();
    });

    document.getElementById('todo-sort-select').addEventListener('change', (e) => {
      uiState.todoSortBy = e.target.value;
      renderTodosView();
    });

    document.getElementById('btn-open-new-habit').addEventListener('click', () => openHabitModal());

    // Calendar Navigation
    document.getElementById('cal-prev-btn').addEventListener('click', () => {
      const cur = parseLocalDate(uiState.calendarCursorDate);
      if (uiState.calendarMode === 'month') cur.setMonth(cur.getMonth() - 1);
      else cur.setDate(cur.getDate() - 7);
      uiState.calendarCursorDate = toLocalDateStr(cur);
      renderCalendarView();
    });

    document.getElementById('cal-next-btn').addEventListener('click', () => {
      const cur = parseLocalDate(uiState.calendarCursorDate);
      if (uiState.calendarMode === 'month') cur.setMonth(cur.getMonth() + 1);
      else cur.setDate(cur.getDate() + 7);
      uiState.calendarCursorDate = toLocalDateStr(cur);
      renderCalendarView();
    });

    document.getElementById('cal-goto-today-btn').addEventListener('click', () => {
      const today = toLocalDateStr();
      uiState.calendarCursorDate = today;
      uiState.calendarSelectedDate = today;
      renderCalendarView();
    });

    document.getElementById('cal-mode-toggle-btn').addEventListener('click', () => {
      uiState.calendarMode = uiState.calendarMode === 'month' ? 'week' : 'month';
      uiState.calendarCursorDate = uiState.calendarSelectedDate;
      renderCalendarView();
    });

    document.getElementById('btn-add-todo-on-date').addEventListener('click', () => {
      openTodoModal(null, uiState.calendarSelectedDate);
    });

    // Modal Close Buttons & Backdrop Click
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });

    // Todo Form Priority & Subtasks
    document.querySelectorAll('#todo-priority-selector .prio-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.draftTodoPriority = btn.dataset.prio;
        document.querySelectorAll('#todo-priority-selector .prio-option').forEach((b) => {
          b.classList.toggle('active', b.dataset.prio === uiState.draftTodoPriority);
        });
      });
    });

    const addDraftSubtask = () => {
      const inp = document.getElementById('subtask-draft-input');
      const val = inp.value.trim();
      if (!val) return;
      uiState.draftTodoSubtasks.push({ id: generateId('sub'), title: val, done: false });
      inp.value = '';
      renderDraftSubtasks();
    };

    document.getElementById('btn-add-subtask-draft').addEventListener('click', addDraftSubtask);
    document.getElementById('subtask-draft-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addDraftSubtask();
      }
    });

    document.getElementById('todo-subtasks-draft-list').addEventListener('click', (e) => {
      const rmBtn = e.target.closest('[data-remove-sub-idx]');
      if (!rmBtn) return;
      const idx = Number(rmBtn.dataset.removeSubIdx);
      uiState.draftTodoSubtasks.splice(idx, 1);
      renderDraftSubtasks();
    });

    // Save Todo Form
    document.getElementById('todo-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('todo-id-input').value;
      const title = document.getElementById('todo-title-input').value.trim();
      if (!title) return;

      const rawTags = document.getElementById('todo-tags-input').value;
      const tags = rawTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title,
        note: document.getElementById('todo-note-input').value.trim(),
        dueDate: document.getElementById('todo-date-input').value || toLocalDateStr(),
        dueTime: document.getElementById('todo-time-input').value || '',
        reminderMinutes: document.getElementById('todo-reminder-select').value || 'none',
        priority: uiState.draftTodoPriority,
        category: document.getElementById('todo-category-select').value,
        tags,
        subtasks: uiState.draftTodoSubtasks
      };

      if (id) {
        store.updateTodo(id, payload);
        showToast('อัปเดตงานและการแจ้งเตือนแล้ว');
      } else {
        store.addTodo(payload);
        showToast('บันทึกงานและการแจ้งเตือนแล้ว');
      }
      closeModal('todo-modal');
    });

    // Habit Form Pickers
    document.getElementById('habit-emoji-picker').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-icon-key]');
      if (!btn) return;
      uiState.draftHabitIcon = btn.dataset.iconKey;
      document.querySelectorAll('#habit-emoji-picker .emoji-opt').forEach((b) => {
        b.classList.toggle('active', b.dataset.iconKey === uiState.draftHabitIcon);
      });
    });

    document.querySelectorAll('#habit-color-picker .color-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.draftHabitColor = btn.dataset.color;
        document.querySelectorAll('#habit-color-picker .color-opt').forEach((b) => {
          b.classList.toggle('active', b.dataset.color === uiState.draftHabitColor);
        });
      });
    });

    document.querySelectorAll('#habit-weekday-selector .weekday-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = Number(btn.dataset.day);
        if (uiState.draftHabitDays.includes(d)) {
          if (uiState.draftHabitDays.length > 1) {
            uiState.draftHabitDays = uiState.draftHabitDays.filter((x) => x !== d);
          }
        } else {
          uiState.draftHabitDays.push(d);
        }
        btn.classList.toggle('active', uiState.draftHabitDays.includes(d));
      });
    });

    // Save Habit Form
    document.getElementById('habit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('habit-id-input').value;
      const title = document.getElementById('habit-title-input').value.trim();
      if (!title) return;

      const payload = {
        title,
        icon: uiState.draftHabitIcon,
        color: uiState.draftHabitColor,
        frequencyDays: [...uiState.draftHabitDays]
      };

      if (id) {
        store.updateHabit(id, payload);
        showToast('อัปเดตนิสัยแล้ว');
      } else {
        store.addHabit(payload);
        showToast('สร้างนิสัยใหม่แล้ว');
      }
      closeModal('habit-modal');
    });

    // Settings Tab Actions
    document.querySelectorAll('#theme-selector .theme-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.updateSettings({ theme: btn.dataset.themeVal });
        showToast('อัปเดตโหมดการแสดงผลแล้ว');
      });
    });

    document.getElementById('btn-export-json').addEventListener('click', () => {
      const dataStr = store.exportJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dailyflow-backup-${toLocalDateStr()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลดไฟล์สำรองข้อมูลแล้ว');
    });

    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-json').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          store.importJSON(ev.target.result);
          showToast('นำเข้าข้อมูลสำเร็จ');
        } catch (err) {
          alert('ไม่สามารถนำเข้าไฟล์ได้: ' + err.message);
        }
        fileInput.value = '';
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-copy-backup').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(store.exportJSON());
        showToast('คัดลอกโค้ดข้อมูลแล้ว');
      } catch (_) {
        alert('เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ กรุณาใช้ปุ่มส่งออกไฟล์ JSON');
      }
    });

    document.getElementById('btn-paste-backup').addEventListener('click', () => {
      const raw = prompt('วางโค้ด JSON ที่คัดลอกไว้ที่นี่เพื่อกู้คืนข้อมูล:');
      if (!raw) return;
      try {
        store.importJSON(raw);
        showToast('กู้คืนข้อมูลสำเร็จ');
      } catch (err) {
        alert('ข้อมูลไม่ถูกต้อง: ' + err.message);
      }
    });

    document.getElementById('btn-clear-completed').addEventListener('click', () => {
      if (confirm('ต้องการลบรายการงานที่ทำเสร็จแล้วทั้งหมดใช่หรือไม่?')) {
        store.clearCompletedTodos();
        showToast('ลบงานที่เสร็จแล้วเรียบร้อย');
      }
    });

    document.getElementById('btn-reset-demo').addEventListener('click', () => {
      if (confirm('ต้องการโหลดข้อมูลตัวอย่างใหม่ใช่หรือไม่?')) {
        store.resetToStarterData();
        showToast('โหลดข้อมูลตัวอย่างแล้ว');
      }
    });

    document.getElementById('btn-wipe-all').addEventListener('click', () => {
      if (confirm('ยืนยันการล้างข้อมูลงานและนิสัยทั้งหมดในเครื่องใช่หรือไม่?')) {
        store.clearAllData();
        showToast('ล้างข้อมูลทั้งหมดแล้ว');
      }
    });

    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      uiState.deferredInstallPrompt = e;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.style.display = 'block';
    });

    document.getElementById('btn-trigger-pwa-install').addEventListener('click', async () => {
      if (!uiState.deferredInstallPrompt) return;
      uiState.deferredInstallPrompt.prompt();
      await uiState.deferredInstallPrompt.userChoice;
      uiState.deferredInstallPrompt = null;
      document.getElementById('pwa-install-banner').style.display = 'none';
    });
  }

  // --- Register & Update Service Worker ---
  function registerServiceWorker() {
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (k !== 'dailyflow-pwa-v7') caches.delete(k);
        });
      });
    }
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js?v=7').then((reg) => {
        reg.update();
      }).catch((err) => {
        console.warn('SW registration skipped:', err);
      });
    }
  }

  // --- Initialize App ---
  store.subscribe(() => renderAll());
  bindEvents();
  renderAll();
  registerServiceWorker();
  setInterval(checkDueReminders, 12000);
})();
