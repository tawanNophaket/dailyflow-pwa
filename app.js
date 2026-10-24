/**
 * DailyFlow — Main Application Controller (Tesla Luxury OS, Telemetry & Jay Park 1.5-Hr Gym Blueprint Edition)
 * Features: To-Do List, Habit Consistency Matrix, Unified Calendar,
 *           Interactive 1.5-Hour Gym Routine (Upper Chest & 3D Shoulders),
 *           Rest Countdown Timer, Web/SW Push Notifications, Tesla Harmonic Chime & .ICS Sync
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
    normalizeHabitIconKey,
    JAY_PARK_WORKOUT_PHASES,
    JAY_PARK_WORKOUT_EXERCISES
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

  // --- Jay Park Role Model Vision Board Items (6 Natural Photographic HD Images) ---
  const ROLE_MODELS = [
    {
      id: 'jay-1',
      src: './assets/jay-1.jpg?v=14',
      pillar: 'UPPER CHEST & 3D DELTS',
      badge: 'STAGE HD',
      shortTitle: 'อกบนตั้ง · ไหล่ 3D',
      shortSub: 'Upper Chest & Sleeve',
      title: 'Sculpted Upper Chest Shelf & 3D Shoulders',
      subtitle: 'สันอกส่วนบนตั้งชัด · หัวไหล่กลมรับกับรอยสักเต็มแขน',
      focus: 'เป้าหมายฟิตเนส: โฟกัส Incline Dumbbell Press (เบาะเอียง 30°) + Lateral Raise เพื่อสร้างสันอกบนและหัวไหล่กลมกว้างแบบในภาพนี้',
      pos: '50% 18%'
    },
    {
      id: 'jay-2',
      src: './assets/jay-2.jpg?v=14',
      pillar: 'COLLARBONE & LION INK',
      badge: 'CHEST SHELF',
      shortTitle: 'สันอกบน · สิงโต',
      shortSub: 'Thick Pecs & Collar',
      title: 'Full Clavicular Pecs & Lion Chest Tattoo',
      subtitle: 'ความหนาของกล้ามอกส่วนบนใต้ไหปลาร้าและรอยสักสิงโตคมชัด',
      focus: 'เป้าหมายฟิตเนส: ดึง Low-to-High Cable Fly ช้อนจากล่างขึ้นบนค้างไว้ 1–2 วินาทีทุกครั้ง เพื่ออัดเลือดเข้าอกส่วนบนให้เต็มถึงไหปลาร้า',
      pos: '50% 26%'
    },
    {
      id: 'jay-3',
      src: './assets/jay-3.jpg?v=14',
      pillar: 'TANK TOP FRAME',
      badge: 'WIDE DELTS',
      shortTitle: 'เสื้อกล้ามดำ · ไหล่กลม',
      shortSub: '3D Delts & Tank Fit',
      title: 'Stage Black Tank Top & Rounded Shoulder Frame',
      subtitle: 'โครงไหล่ข้างและแขนแน่นเต็มเสื้อกล้ามดำ (Official Press HD)',
      focus: 'เป้าหมายฟิตเนส: เก็บ Dumbbell Shoulder Press + Lateral Raise 4 เซ็ต + Superset แขน เพื่อใส่เสื้อกล้ามแล้วไหล่กว้างทรง V-Taper',
      pos: '50% 18%'
    },
    {
      id: 'jay-4',
      src: './assets/jay-4.jpg?v=14',
      pillar: 'ICONIC CHARISMA',
      badge: 'BOSS AURA',
      shortTitle: 'ออร่าดำ · ผม Comma',
      shortSub: 'Comma Hair & Chain',
      title: 'All-Black Collared Jacket, Comma Hair & Neck Ink',
      subtitle: 'ลุคเสื้อปกดำโซ่เงิน · ทรงผม Comma กึ่งเปียกและรอยสักเข็มทิศต้นคอ',
      focus: 'วินัยประจำวัน: ดูแลผิวหน้าให้เกลี้ยงคม เซ็ตผม Wet Comma เปิดหน้าผาก และรักษาบุคลิกอกผายไหล่ผึ่งจากท่า Reverse Pec Deck',
      pos: '50% 18%'
    },
    {
      id: 'jay-5',
      src: './assets/jay-5.jpg?v=14',
      pillar: 'LEAN V-TAPER',
      badge: 'SERENADES 2025',
      shortTitle: 'ลีน V-Taper · ซิกแพค',
      shortSub: 'Lean Waist & Chest',
      title: '2025 Serenades & Body Rolls — Lean V-Taper',
      subtitle: 'เอวสอบลีนคมชัดรับกับอกบนที่นูนตั้งและหัวไหล่กว้าง',
      focus: 'เป้าหมายโภชนาการ: คุมอาหารลีน + จัดไข่ต้ม 6 ฟอง (หรือสลับนมถั่วเหลืองฝาดำ ~28g โปรตีน) เพื่อเพิ่มมวลกล้ามเนื้อโดยไม่เพิ่มไขมันรอบเอว',
      pos: '50% 20%'
    },
    {
      id: 'jay-6',
      src: './assets/jay-6.jpg?v=14',
      pillar: 'CORE & V-CUT ABS',
      badge: 'MIRROR FIT',
      shortTitle: 'Mirror · ร่องท้องชัด',
      shortSub: 'Six-Pack & V-Cut',
      title: 'Natural Mirror Selfie — Six-Pack & Lower V-Cut',
      subtitle: 'ร่องท้อง 6-Pack และไลน์ V-Cut ท้องล่างคมชัดแบบธรรมชาติ',
      focus: 'เป้าหมายฟิตเนส: ปิดท้ายตาราง 1.5 ชม. ด้วย Hanging Knee Raise (ม้วนก้นกบขึ้นหาอก) + Cable Crunch 3 เซ็ตทุกครั้งที่ไปยิม',
      pos: '50% 22%'
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
    workoutCollapsed: localStorage.getItem('dailyflow_workout_collapsed') === '1',
    restTimerSecLeft: 0,
    restTimerTotalSec: 0,
    restTimerInterval: null,
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
    container.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.22s ease';
      setTimeout(() => toast.remove(), 220);
    }, 1800);
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

  // --- Workout Rest Countdown Timer Engine ---
  function formatSecondsMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function updateRestTimerUI() {
    const bar = document.getElementById('workout-timer-bar');
    const clock = document.getElementById('workout-timer-clock');
    const stopBtn = document.getElementById('btn-stop-rest-timer');
    if (!bar || !clock) return;

    const isRunning = uiState.restTimerSecLeft > 0;
    bar.classList.toggle('running', isRunning);
    if (stopBtn) stopBtn.style.display = isRunning ? 'inline-flex' : 'none';

    document.querySelectorAll('.timer-preset-btns .timer-chip[data-rest-sec]').forEach((btn) => {
      const secVal = Number(btn.dataset.restSec);
      btn.classList.toggle('active', isRunning && uiState.restTimerTotalSec === secVal);
    });

    if (isRunning) {
      clock.textContent = `พักอีก ${formatSecondsMMSS(uiState.restTimerSecLeft)}`;
    } else {
      clock.textContent = 'พร้อมซ้อม';
    }
  }

  function startRestTimer(seconds) {
    const sec = Number(seconds) || 60;
    if (uiState.restTimerInterval) {
      clearInterval(uiState.restTimerInterval);
      uiState.restTimerInterval = null;
    }
    uiState.restTimerTotalSec = sec;
    uiState.restTimerSecLeft = sec;
    updateRestTimerUI();

    uiState.restTimerInterval = setInterval(() => {
      uiState.restTimerSecLeft -= 1;
      if (uiState.restTimerSecLeft <= 0) {
        clearInterval(uiState.restTimerInterval);
        uiState.restTimerInterval = null;
        uiState.restTimerSecLeft = 0;
        updateRestTimerUI();
        playTeslaChime();
        if ('vibrate' in navigator) {
          try { navigator.vibrate([160, 70, 160]); } catch (_) {}
        }
        showToast('ครบเวลาพักเซ็ตแล้ว! ลุยเซ็ตต่อไปได้เลย');
      } else {
        updateRestTimerUI();
      }
    }, 1000);
  }

  function stopRestTimer() {
    if (uiState.restTimerInterval) {
      clearInterval(uiState.restTimerInterval);
      uiState.restTimerInterval = null;
    }
    uiState.restTimerSecLeft = 0;
    uiState.restTimerTotalSec = 0;
    updateRestTimerUI();
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
            icon: './assets/app-icon-192.png?v=13',
            badge: './assets/app-icon-192.png?v=13',
            tag,
            renotify: true,
            vibrate: [180, 80, 180]
          });
          return true;
        }
      }
      new Notification(title, { body, icon: './assets/app-icon-192.png?v=13', tag });
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
      `แจ้งเตือนงาน: ${todo.title}`,
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

    const headerGymBtn = document.getElementById('btn-header-gym');
    if (headerGymBtn) {
      headerGymBtn.classList.toggle('active', tabName === 'workout');
    }

    const titles = {
      today: 'DAILYFLOW',
      todos: 'TASKS',
      workout: 'GYM PLANNER',
      habits: 'HABITS',
      calendar: 'CALENDAR',
      settings: 'SYSTEM'
    };
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[tabName] || 'DAILYFLOW';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderAll();
  }

  // --- Render Precision To-Do Card HTML ---
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

  // --- Render Jay Park 1.5-Hour All-in-One Gym Blueprint ---
  function renderExerciseCardHTML(ex, focusDate, dayLog, weightsMap) {
    const setsArr = Array.isArray(dayLog.completedSets?.[ex.id])
      ? dayLog.completedSets[ex.id]
      : [];
    const doneSetsCount = setsArr.slice(0, ex.sets).filter(Boolean).length;
    const isExDone = doneSetsCount >= ex.sets;
    const weightVal = weightsMap[ex.id] || ex.defaultWeight;

    const setButtons = [];
    for (let i = 0; i < ex.sets; i++) {
      const isSetDone = !!setsArr[i];
      setButtons.push(`
        <button
          type="button"
          class="w-set-btn ${isSetDone ? 'done' : ''}"
          data-action="toggle-workout-set"
          data-date="${focusDate}"
          data-ex-id="${ex.id}"
          data-set-idx="${i}"
          data-total-sets="${ex.sets}"
          data-rest-sec="${ex.restSec}"
        >
          ${isSetDone ? ICONS.checkSm : ''}
          <span>เซ็ต ${i + 1}</span>
        </button>
      `);
    }

    const cleanTitle = String(ex.name || '').replace(/\s*\([^)]*\)\s*/g, (m) => (m.includes('30°') ? ' 30°' : '')).trim() || ex.name;
    const cleanReps = String(ex.reps || '').replace(/\s*ครั้ง\s*/g, '');
    const cleanTarget = String(ex.target || '').split('·')[0].replace(/\s*\([^)]*\)\s*/g, '').trim();
    const metaLine = `${cleanTarget} · ${ex.sets}×${cleanReps} · พัก ${ex.restSec}s`;

    return `
      <div class="workout-ex-card ${isExDone ? 'ex-done' : ''}">
        <div class="workout-ex-top">
          <div class="workout-ex-left">
            <button
              type="button"
              class="workout-ex-code"
              data-action="toggle-workout-ex-all"
              data-date="${focusDate}"
              data-ex-id="${ex.id}"
              data-total-sets="${ex.sets}"
              title="แตะเพื่อเช็คครบทุกเซ็ต"
            >
              ${isExDone ? ICONS.check : escapeHtml(ex.code)}
            </button>
            <div
              class="workout-ex-info"
              data-action="open-edit-workout-ex"
              data-ex-id="${ex.id}"
              style="cursor:pointer;"
              title="แตะเพื่อดูโฟกัสท่าหรือแก้ไขรายละเอียด"
            >
              <div class="workout-ex-name">${escapeHtml(cleanTitle)}</div>
              <div class="workout-ex-sub">${escapeHtml(metaLine)}</div>
            </div>
          </div>
          <div class="wex-right-actions">
            ${uiState.workoutEditMode ? `
              <button type="button" class="wex-ctrl-btn" data-action="move-workout-ex" data-ex-id="${ex.id}" data-delta="-1" title="เลื่อนขึ้น">↑</button>
              <button type="button" class="wex-ctrl-btn" data-action="move-workout-ex" data-ex-id="${ex.id}" data-delta="1" title="เลื่อนลง">↓</button>
              <button type="button" class="wex-ctrl-btn" data-action="open-edit-workout-ex" data-ex-id="${ex.id}" title="แก้ไขท่า">${ICONS.edit}</button>
              <button type="button" class="wex-ctrl-btn danger" data-action="delete-workout-ex" data-ex-id="${ex.id}" title="ลบท่า">${ICONS.trash}</button>
            ` : `
              <button
                type="button"
                class="wex-weight-pill"
                data-action="edit-workout-weight"
                data-ex-id="${ex.id}"
                data-ex-name="${escapeHtml(ex.name)}"
                title="แตะเพื่อบันทึกน้ำหนักที่ใช้"
              >
                <span>${escapeHtml(weightVal)}</span>
              </button>
            `}
          </div>
        </div>

        <div class="workout-sets-row" style="grid-template-columns: repeat(${Math.min(4, ex.sets)}, minmax(0, 1fr));">
          ${setButtons.join('')}
        </div>
      </div>
    `;
  }

  function openWorkoutExerciseModal(exId = null) {
    const allEx = store.getWorkoutExercises();
    const existing = exId ? allEx.find((x) => x.id === exId) : null;
    const weightsMap = store.state.workout?.weights || {};

    document.getElementById('workout-ex-modal-title').textContent = existing
      ? 'แก้ไขท่าออกกำลังกาย'
      : 'เพิ่มท่าออกกำลังกายใหม่';
    document.getElementById('wex-id-input').value = existing ? existing.id : '';
    document.getElementById('wex-name-input').value = existing ? existing.name : '';
    document.getElementById('wex-phase-select').value = existing
      ? existing.phase
      : (store.state.workout?.activePhase && store.state.workout.activePhase !== 'all'
        ? store.state.workout.activePhase
        : 'chest');
    document.getElementById('wex-target-input').value = existing ? existing.target : 'อกส่วนบน · Priority';
    document.getElementById('wex-sub-input').value = existing ? existing.thaiSub : '';
    document.getElementById('wex-sets-input').value = existing ? existing.sets : 3;
    document.getElementById('wex-reps-input').value = existing ? existing.reps : '8–12 ครั้ง';
    document.getElementById('wex-rest-input').value = existing ? existing.restSec : 60;
    document.getElementById('wex-weight-input').value = existing
      ? (weightsMap[existing.id] || existing.defaultWeight || '12 kg')
      : '12 kg';
    document.getElementById('wex-cue-input').value = existing ? existing.cue : '';
    document.getElementById('wex-priority-check').checked = existing ? !!existing.isPriority : true;
    document.getElementById('wex-express-check').checked = existing ? !!existing.express : true;

    openModal('workout-exercise-modal');
    setTimeout(() => document.getElementById('wex-name-input').focus(), 100);
  }

  function renderWorkoutBlueprint() {
    const focusDate = uiState.todayFocusDate || toLocalDateStr();
    const wState = store.state.workout || { mode: 'full', activePhase: 'all', weights: {}, logsByDate: {} };
    const mode = wState.mode === 'express' ? 'express' : 'full';
    const activePhase = wState.activePhase || 'all';
    const weightsMap = wState.weights || {};
    const dayLog = wState.logsByDate?.[focusDate] || { completedSets: {}, sessionCompleted: false };
    const allExercises = store.getWorkoutExercises();

    const modeExercises = allExercises.filter((ex) => mode === 'full' || ex.express);

    let totalSetsAll = 0;
    let doneSetsAll = 0;
    let doneExCount = 0;

    modeExercises.forEach((ex) => {
      totalSetsAll += ex.sets;
      const arr = Array.isArray(dayLog.completedSets?.[ex.id]) ? dayLog.completedSets[ex.id] : [];
      const doneInEx = arr.slice(0, ex.sets).filter(Boolean).length;
      doneSetsAll += doneInEx;
      if (doneInEx >= ex.sets) doneExCount++;
    });

    const pct = totalSetsAll > 0 ? Math.round((doneSetsAll / totalSetsAll) * 100) : 0;
    const exPct = modeExercises.length > 0 ? Math.round((doneExCount / modeExercises.length) * 100) : 0;

    const dateLabelEl = document.getElementById('workout-page-date-label');
    if (dateLabelEl) {
      dateLabelEl.textContent = `ตารางซ้อม · ${formatFullThaiDate(focusDate)}`;
    }

    const overallPctEl = document.getElementById('workout-overall-pct');
    if (overallPctEl) overallPctEl.textContent = `${pct}%`;

    const wRingCircle = document.getElementById('workout-ring-circle');
    if (wRingCircle) {
      const circumference = 213.63;
      const offset = circumference - (pct / 100) * circumference;
      wRingCircle.style.strokeDashoffset = `${offset}`;
    }

    const badgeEl = document.getElementById('workout-progress-badge');
    if (badgeEl) badgeEl.textContent = `${doneExCount}/${modeExercises.length} ท่า`;

    const exBarEl = document.getElementById('workout-ex-bar');
    if (exBarEl) exBarEl.style.width = `${exPct}%`;

    const listCountBadge = document.getElementById('workout-list-count-badge');
    if (listCountBadge) listCountBadge.textContent = `${modeExercises.length}`;

    const fillEl = document.getElementById('workout-progress-fill');
    if (fillEl) fillEl.style.width = `${pct}%`;

    const subStatusEl = document.getElementById('workout-status-sub');
    if (subStatusEl) {
      if (doneExCount === modeExercises.length && modeExercises.length > 0) {
        subStatusEl.textContent = `ซ้อมครบตารางของ ${formatShortThaiDate(focusDate)} แล้ว · พักกล้ามเนื้อ 48–72 ชม.`;
      } else {
        const modeLabel = mode === 'full' ? 'ตาราง 1.5 ชม.' : 'โหมดด่วน 55 นาที';
        subStatusEl.textContent = `${modeLabel} · เล่นซ้ำทุก 2–3 วัน · ${doneSetsAll}/${totalSetsAll} เซ็ต`;
      }
    }

    // Minimal Weekly Gym Day Selector
    const plannedDays = Array.isArray(wState.plannedDays) ? wState.plannedDays : [1, 4, 6];
    const plannedSummaryEl = document.getElementById('workout-planned-summary');
    if (plannedSummaryEl) {
      plannedSummaryEl.textContent = `วันซ้อม (${plannedDays.length} วัน)`;
    }

    const plannedDaysRow = document.getElementById('workout-planned-days-row');
    if (plannedDaysRow) {
      const orderedDays = [1, 2, 3, 4, 5, 6, 0];
      plannedDaysRow.innerHTML = orderedDays.map((d) => {
        const isPlanned = plannedDays.includes(d);
        return `
          <button
            type="button"
            class="wm-day-pill ${isPlanned ? 'active' : ''}"
            data-action="toggle-workout-planned-day"
            data-day="${d}"
          >
            ${THAI_DAYS_SHORT[d]}
          </button>
        `;
      }).join('');
    }

    // Edit Mode UI
    const editBanner = document.getElementById('workout-edit-banner');
    const editBtn = document.getElementById('btn-toggle-workout-edit-mode');
    if (editBanner && editBtn) {
      editBanner.style.display = uiState.workoutEditMode ? 'flex' : 'none';
      editBtn.textContent = uiState.workoutEditMode ? 'เสร็จสิ้น' : 'จัดการ';
    }

    // Mode switch active state
    document.querySelectorAll('.workout-mode-switch .w-mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.wmode === mode);
    });

    // Phase chips active state
    document.querySelectorAll('#workout-phase-chips .filter-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.wphase === activePhase);
    });

    // Build HTML grouped by phase
    const phasesToRender = activePhase === 'all'
      ? JAY_PARK_WORKOUT_PHASES
      : JAY_PARK_WORKOUT_PHASES.filter((p) => p.id === activePhase);

    const buildPhasesHTML = (phasesList) => phasesList.map((phase) => {
      const exInPhase = modeExercises.filter((ex) => ex.phase === phase.id);
      if (exInPhase.length === 0) return '';
      return `
        <div class="workout-phase-header">
          <span class="workout-phase-title">${escapeHtml(phase.title)}</span>
          <span class="workout-phase-time">${escapeHtml(phase.duration)}</span>
        </div>
        ${exInPhase.map((ex) => renderExerciseCardHTML(ex, focusDate, dayLog, weightsMap)).join('')}
      `;
    }).join('');

    const pageListEl = document.getElementById('workout-page-list');
    if (pageListEl) {
      pageListEl.innerHTML = buildPhasesHTML(phasesToRender);
    }

    const summaryText = `ความคืบหน้าวันนี้ ${doneSetsAll}/${totalSetsAll} เซ็ต (${pct}%) · แตะเพื่อเปิดหน้าจัดตารางฟิตเนส`;
    const todayGymSub = document.getElementById('today-gym-banner-sub');
    if (todayGymSub) todayGymSub.textContent = summaryText;

    const habitsGymSub = document.getElementById('habits-gym-banner-sub');
    if (habitsGymSub) habitsGymSub.textContent = summaryText;

    updateRestTimerUI();
  }

  // --- 1. Render TODAY View ---
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
      const circumference = 213.63;
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
      const dowOffset = (curObj.getDay() + 6) % 7;
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

    const quickInput = document.getElementById('quick-add-todo-input');
    if (quickInput) {
      quickInput.placeholder = isFocusingToday
        ? 'เพิ่มงานด่วนสำหรับวันนี้...'
        : `เพิ่มงานสำหรับ ${formatShortThaiDate(focusDate)}...`;
    }

    // Render Role Model Vision Board (Top 4 in Bento Grid, all 6 in Lightbox)
    renderVisionBoard();

    // Render 1.5-Hour Jay Park Gym Blueprint
    renderWorkoutBlueprint();

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
          ${ROLE_MODELS.slice(0, 4).map((rm) => `
            <img class="vision-avatar-item" src="${rm.src}" alt="${escapeHtml(rm.shortTitle)}" style="object-position:${rm.pos};" />
          `).join('')}
        </div>
        <div class="vision-banner-info">
          <div class="vision-banner-title">Jay Park · หุ่นลีน & Charisma (6 ลุค HD)</div>
          <div class="vision-banner-sub">เช็คอินวันนี้ ${doneTodayCount}/${habits.length} · แตะดูภาพต้นแบบชัดระดับ HD</div>
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
        ? 'เล่นได้ทุกวัน (2–3 วัน/สัปดาห์)'
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
          <p>ไม่มีงานที่กำหนดไว้ในวันนี้ (กด "+ วันซ้อมยิม" เพื่อวางตารางฟิตเนส 1.5 ชม.)</p>
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
    const orderedTop4 = [featured, ...others].slice(0, 4);

    grid.innerHTML = orderedTop4.map((rm, idx) => {
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

    // Header Gym Shortcut Button & Dedicated Workout Page Navigation
    const btnHeaderGym = document.getElementById('btn-header-gym');
    if (btnHeaderGym) {
      btnHeaderGym.addEventListener('click', () => {
        switchTab('workout');
      });
    }

    const habitsGymBanner = document.getElementById('habits-gym-banner');
    if (habitsGymBanner) {
      habitsGymBanner.addEventListener('click', () => {
        switchTab('workout');
      });
    }

    // Workout Schedule Preset Chips
    const presetChipsRow = document.getElementById('workout-preset-chips');
    if (presetChipsRow) {
      presetChipsRow.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-wpreset]');
        if (!chip) return;
        store.setWorkoutSchedulePreset(chip.dataset.wpreset);
        showToast('อัปเดตรูปแบบวันไปยิมแล้ว');
      });
    }

    // Workout Routine Edit/Organize Mode Toggle
    const btnToggleWorkoutEdit = document.getElementById('btn-toggle-workout-edit-mode');
    if (btnToggleWorkoutEdit) {
      btnToggleWorkoutEdit.addEventListener('click', () => {
        uiState.workoutEditMode = !uiState.workoutEditMode;
        renderWorkoutBlueprint();
        showToast(uiState.workoutEditMode ? 'เปิดโหมดจัดตาราง: แก้ไข/เรียงลำดับท่าได้' : 'บันทึกการจัดตารางเรียบร้อย');
      });
    }

    const btnAddWorkoutEx = document.getElementById('btn-add-workout-exercise');
    if (btnAddWorkoutEx) {
      btnAddWorkoutEx.addEventListener('click', () => openWorkoutExerciseModal(null));
    }

    const btnResetDefaultRoutine = document.getElementById('btn-reset-default-routine');
    if (btnResetDefaultRoutine) {
      btnResetDefaultRoutine.addEventListener('click', () => {
        if (confirm('ต้องการคืนค่ารายการท่าออกกำลังกายกลับเป็นตารางมาตรฐาน Jay Park 1.5 ชม. (11 ท่า) ใช่หรือไม่?')) {
          store.resetWorkoutRoutineToDefault();
          showToast('คืนค่าตารางมาตรฐาน Jay Park เรียบร้อย');
        }
      });
    }

    const workoutExForm = document.getElementById('workout-exercise-form');
    if (workoutExForm) {
      workoutExForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('wex-id-input').value;
        const name = document.getElementById('wex-name-input').value.trim();
        if (!name) return;
        store.saveWorkoutExercise({
          id: id || null,
          name,
          phase: document.getElementById('wex-phase-select').value,
          target: document.getElementById('wex-target-input').value,
          thaiSub: document.getElementById('wex-sub-input').value,
          sets: Number(document.getElementById('wex-sets-input').value) || 3,
          reps: document.getElementById('wex-reps-input').value,
          restSec: Number(document.getElementById('wex-rest-input').value) || 60,
          weight: document.getElementById('wex-weight-input').value,
          cue: document.getElementById('wex-cue-input').value,
          isPriority: document.getElementById('wex-priority-check').checked,
          express: document.getElementById('wex-express-check').checked
        });
        closeModal('workout-exercise-modal');
        showToast(id ? 'อัปเดตท่าออกกำลังกายแล้ว' : 'เพิ่มท่าออกกำลังกายใหม่แล้ว');
      });
    }

    // Workout Mode Switch (90m Full vs 55m Express)
    document.querySelectorAll('.workout-mode-switch .w-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setWorkoutMode(btn.dataset.wmode);
        showToast(btn.dataset.wmode === 'express'
          ? 'สลับเป็นโหมดด่วน 55 นาที (เน้นอกบน-ไหล่-หลัง-ท้อง)'
          : 'สลับเป็นโหมดเต็มสูบ 90 นาที (ครบทั้ง 9 ท่าหลัก)');
      });
    });

    // Workout Phase Filter Chips
    const phaseChipsRow = document.getElementById('workout-phase-chips');
    if (phaseChipsRow) {
      phaseChipsRow.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-wphase]');
        if (!chip) return;
        store.setWorkoutPhaseFilter(chip.dataset.wphase);
      });
    }

    // Preset Rest Timer Buttons
    document.querySelectorAll('.timer-preset-btns .timer-chip[data-rest-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sec = Number(btn.dataset.restSec);
        startRestTimer(sec);
        showToast(`เริ่มจับเวลาพักเซ็ต ${sec} วินาที`);
      });
    });

    const btnStopRestTimer = document.getElementById('btn-stop-rest-timer');
    if (btnStopRestTimer) {
      btnStopRestTimer.addEventListener('click', () => {
        stopRestTimer();
        showToast('หยุดจับเวลาพักเซ็ตแล้ว');
      });
    }

    // Workout Footer Actions
    const btnSyncWorkoutTodo = document.getElementById('btn-sync-workout-todo');
    if (btnSyncWorkoutTodo) {
      btnSyncWorkoutTodo.addEventListener('click', () => {
        const focusDate = uiState.todayFocusDate || toLocalDateStr();
        const res = store.addWorkoutToDateTodos(focusDate);
        showToast(res.added
          ? `เพิ่มตารางฟิตเนส 1.5 ชม. ลงในงานวันที่ ${formatShortThaiDate(focusDate)} แล้ว`
          : `ซิงค์ความคืบหน้าเข้ากับงานฟิตเนสของ ${formatShortThaiDate(focusDate)} แล้ว`);
      });
    }

    const btnCompleteWorkout = document.getElementById('btn-complete-workout-session');
    if (btnCompleteWorkout) {
      btnCompleteWorkout.addEventListener('click', () => {
        const focusDate = uiState.todayFocusDate || toLocalDateStr();
        store.completeWorkoutSession(focusDate);
        playTeslaChime();
        showToast('บันทึกจบเซสชันฟิตเนส 1.5 ชม. & เช็คอินนิสัยเรียบร้อย!');
      });
    }

    const btnModalCompleteWorkout = document.getElementById('btn-modal-complete-workout');
    if (btnModalCompleteWorkout) {
      btnModalCompleteWorkout.addEventListener('click', () => {
        const focusDate = uiState.todayFocusDate || toLocalDateStr();
        store.completeWorkoutSession(focusDate);
        closeModal('workout-modal');
        playTeslaChime();
        showToast('บันทึกจบเซสชันฟิตเนส 1.5 ชม. & เช็คอินนิสัยเรียบร้อย!');
      });
    }

    const btnResetWorkoutSession = document.getElementById('btn-reset-workout-session');
    if (btnResetWorkoutSession) {
      btnResetWorkoutSession.addEventListener('click', () => {
        const focusDate = uiState.todayFocusDate || toLocalDateStr();
        store.resetWorkoutSession(focusDate);
        showToast('รีเซ็ตเซ็ตฟิตเนสของวันนี้แล้ว');
      });
    }

    const btnCalAddGym = document.getElementById('btn-cal-add-gym');
    if (btnCalAddGym) {
      btnCalAddGym.addEventListener('click', () => {
        const res = store.addWorkoutToDateTodos(uiState.calendarSelectedDate);
        showToast(res.added
          ? `วางตารางฟิตเนส 1.5 ชม. ในวันที่ ${formatShortThaiDate(uiState.calendarSelectedDate)} แล้ว`
          : 'มีตารางฟิตเนส 1.5 ชม. ในวันนี้อยู่แล้ว');
      });
    }

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
        dueTime: '18:00',
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
      if (uiState.activeTab === 'workout') {
        openWorkoutExerciseModal(null);
      } else if (uiState.activeTab === 'habits') {
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
      } else if (action === 'toggle-workout-set') {
        const dateStr = actionEl.dataset.date || uiState.todayFocusDate || toLocalDateStr();
        const exId = actionEl.dataset.exId;
        const setIdx = Number(actionEl.dataset.setIdx);
        const totalSets = Number(actionEl.dataset.totalSets);
        const restSec = Number(actionEl.dataset.restSec) || 60;
        const nowDone = store.toggleWorkoutSet(dateStr, exId, setIdx, totalSets);
        if (nowDone) {
          startRestTimer(restSec);
          showToast(`เช็คเซ็ต ${setIdx + 1} แล้ว · เริ่มจับเวลาพัก ${restSec}s`);
        }
      } else if (action === 'toggle-workout-ex-all') {
        const dateStr = actionEl.dataset.date || uiState.todayFocusDate || toLocalDateStr();
        const exId = actionEl.dataset.exId;
        const totalSets = Number(actionEl.dataset.totalSets);
        const allDone = store.toggleWorkoutExerciseAllSets(dateStr, exId, totalSets);
        showToast(allDone ? 'เช็คครบทุกเซ็ตของท่านี้แล้ว ✓' : 'ยกเลิกการเช็คเซ็ตของท่านี้แล้ว');
      } else if (action === 'start-rest-timer') {
        const sec = Number(actionEl.dataset.restSec) || 60;
        startRestTimer(sec);
        showToast(`เริ่มจับเวลาพักเซ็ต ${sec} วินาที`);
      } else if (action === 'edit-workout-weight') {
        const exId = actionEl.dataset.exId;
        const exName = actionEl.dataset.exName || '';
        const curWeight = store.state.workout?.weights?.[exId] || '';
        const nextWeight = prompt(`บันทึกน้ำหนักที่ใช้สำหรับท่า:\n${exName}`, curWeight);
        if (nextWeight !== null) {
          store.updateWorkoutWeight(exId, nextWeight);
          showToast(`บันทึกน้ำหนัก ${nextWeight.trim() || 'BW'} เรียบร้อย`);
        }
      } else if (action === 'open-edit-workout-ex') {
        openWorkoutExerciseModal(actionEl.dataset.exId);
      } else if (action === 'move-workout-ex') {
        store.moveWorkoutExercise(actionEl.dataset.exId, Number(actionEl.dataset.delta));
      } else if (action === 'delete-workout-ex') {
        if (confirm('ต้องการลบท่าออกกำลังกายนี้ออกจากตารางใช่หรือไม่?')) {
          store.deleteWorkoutExercise(actionEl.dataset.exId);
          showToast('ลบท่าออกกำลังกายแล้ว');
        }
      } else if (action === 'toggle-workout-planned-day') {
        store.toggleWorkoutPlannedDay(Number(actionEl.dataset.day));
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
    const btnForceRefreshPwa = document.getElementById('btn-force-refresh-pwa');
    if (btnForceRefreshPwa) {
      btnForceRefreshPwa.addEventListener('click', async () => {
        showToast('กำลังล้างแคชและโหลดเวอร์ชันล่าสุด (v13)...');
        try {
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
        } catch (_) {}
        setTimeout(() => {
          window.location.href = `./?v=${Date.now()}`;
        }, 350);
      });
    }

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
      if (confirm('ต้องการโหลดข้อมูลเริ่มต้นพร้อมตารางฟิตเนส Jay Park ใหม่ใช่หรือไม่?')) {
        store.resetToStarterData();
        showToast('โหลดข้อมูลเริ่มต้นใหม่แล้ว');
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
          if (k !== 'dailyflow-pwa-v14') caches.delete(k);
        });
      });
    }
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js?v=14').then((reg) => {
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
