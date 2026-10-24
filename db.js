/**
 * DailyFlow Storage & Domain Engine — Tesla Telemetry, Reminder & Jay Park 1.5-Hr Gym Blueprint Edition
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
  { id: 'health', name: 'สุขภาพ & ฟิตเนส', color: '#e31937', icon: 'fitness' },
  { id: 'finance', name: 'การเงิน', color: '#f59e0b', icon: 'wealth' },
  { id: 'study', name: 'พัฒนาตัวเอง', color: '#8b5cf6', icon: 'reading' }
];

// --- Jay Park 1.5-Hour (90-Min) All-in-One Gym Blueprint (Upper Chest & 3D Shoulders Priority) ---
const JAY_PARK_WORKOUT_PHASES = [
  {
    id: 'warmup',
    shortLabel: '1. วอร์มไหล่',
    title: 'Phase 1 · วอร์มอัปเปิดข้อต่อหัวไหล่และสะบัก',
    duration: '10 นาที',
    subtitle: 'เตรียมเอ็นหมุนข้อไหล่ (Rotator Cuff) ก่อนดันอกบนและไหล่หนักในวันเดียวกัน'
  },
  {
    id: 'chest',
    shortLabel: '2. อกส่วนบน',
    title: 'Phase 2 · Priority 1: ปั้นอกส่วนบน (Upper Chest Shelf)',
    duration: '25 นาที',
    subtitle: 'สร้างสันอกด้านบนใต้ไหปลาร้าให้นูนเต็มเวลาถอดเสื้อหรือใส่เสื้อกล้ามแบบ Jay Park'
  },
  {
    id: 'shoulders',
    shortLabel: '3. หัวไหล่ 3D',
    title: 'Phase 3 · Priority 2: หัวไหล่กลมกว้าง 3 มิติ (3D Shoulders)',
    duration: '25 นาที',
    subtitle: 'ขยายโครงไหล่ข้างและไหล่หลังให้ส่วนสูง 184 cm ดูกว้างเป็นทรง V-Taper'
  },
  {
    id: 'back_arms',
    shortLabel: '4. หลัง & แขน',
    title: 'Phase 4 · ดึงแผ่นหลัง V-Taper & ซูเปอร์เซ็ตแขนแน่น',
    duration: '15 นาที',
    subtitle: 'ดึงปีกหลังรับกับหัวไหล่ และปั๊มหน้าแขน-หลังแขนให้แน่นเต็มเสื้อโดยใช้เวลาสั้นที่สุด'
  },
  {
    id: 'legs_core',
    shortLabel: '5. ขา & ท้อง',
    title: 'Phase 5 · ขาสมส่วน & ร่องท้อง 6-Pack / V-Cut',
    duration: '15 นาที',
    subtitle: 'กระตุ้นฮอร์โมนช่วงล่าง 1 ท่าหลัก และปั้นร่องท้องล่าง V-Cut สไตล์ Jay Park'
  }
];

const JAY_PARK_WORKOUT_EXERCISES = [
  {
    id: 'w1',
    code: 'W1',
    phase: 'warmup',
    name: 'External Rotation (ยางยืด/เคเบิลเปิดข้อไหล่)',
    thaiSub: 'หมุนไหล่ + ดึงเปิดเอ็นหมุนข้อไหล่',
    target: 'วอร์มข้อไหล่ (Rotator Cuff)',
    sets: 2,
    reps: '15 ครั้ง',
    restSec: 45,
    defaultWeight: 'เบาสุด',
    express: true,
    isPriority: false,
    cue: 'หนีบศอกไว้ข้างลำตัว หมุนแขนท่อนล่างออกด้านข้างช้าๆ ช่วยป้องกันอาการบาดเจ็บไหล่หน้าเวลาเล่นอกบนคู่กับไหล่'
  },
  {
    id: 'w2',
    code: 'W2',
    phase: 'warmup',
    name: 'Incline Push-Up (วิดพื้นกับขอบม้านั่ง)',
    thaiSub: 'กระตุ้นสะบักและกล้ามเนื้ออกส่วนบน',
    target: 'เปิดสะบัก & อกส่วนบน',
    sets: 2,
    reps: '12 ครั้ง',
    restSec: 45,
    defaultWeight: 'Bodyweight',
    express: true,
    isPriority: false,
    cue: 'โฟกัสยืดอกและบีบสะบักเข้าหากันตอนลง ดันตัวขึ้นพร้อมเกร็งเนินอกด้านบนเพื่อเปิดระบบประสาทก่อนยกจริง'
  },
  {
    id: 'ex1',
    code: '01',
    phase: 'chest',
    name: 'Incline Dumbbell Press (ม้านั่งเอียง 30°)',
    thaiSub: 'ท่าหลักสร้างความหนาของสันอกส่วนบน',
    target: 'อกส่วนบน · Priority #1',
    sets: 4,
    reps: '8–12 ครั้ง',
    restSec: 90,
    defaultWeight: '14 kg',
    express: true,
    isPriority: true,
    cue: 'ปรับม้านั่งเอียงแค่ 30 องศา (ล็อกที่ 2 จากพื้น) ห้ามปรับสูง 45° เพราะไหล่หน้าจะแย่งงาน ตอนลงกางศอกทำมุม 45–60° กับลำตัว ดันขึ้นบีบเนินอกด้านบนโดยไม่ต้องเอาดัมเบลชนกัน'
  },
  {
    id: 'ex2',
    code: '02',
    phase: 'chest',
    name: 'Low-to-High Cable Fly (ดึงเคเบิลล่างขึ้นบน)',
    thaiSub: 'หรือ Incline Machine Press เน้นบีบอกบน',
    target: 'ร่องอกบนใต้ไหปลาร้า · Priority #1',
    sets: 3,
    reps: '12–15 ครั้ง',
    restSec: 75,
    defaultWeight: '7.5 kg',
    express: true,
    isPriority: true,
    cue: 'ตั้งรอกเคเบิลต่ำสุด ก้าวขาออกมา 1 ก้าว ช้อนมือดึงสายเคเบิลเฉียงขึ้นประกบกันระดับอกบน/ปลายคาง แล้วเกร็งค้างไว้ 1–2 วินาทีทุกครั้ง'
  },
  {
    id: 'ex3',
    code: '03',
    phase: 'shoulders',
    name: 'Seated Dumbbell Shoulder Press',
    thaiSub: 'ดันดัมเบลสร้างมวลหัวไหล่ (หรือ Machine Press)',
    target: 'ความหนาหัวไหล่รวม · Priority #2',
    sets: 3,
    reps: '8–12 ครั้ง',
    restSec: 90,
    defaultWeight: '12 kg',
    express: true,
    isPriority: true,
    cue: 'ตั้งพนักพิงเกือบตรง (75–80 องศา) เอาดัมเบลลงมาถึงระดับหู/คางเพื่อยืดกล้ามเนื้อไหล่ให้สุด แล้วดันขึ้นตรงๆ'
  },
  {
    id: 'ex4',
    code: '04',
    phase: 'shoulders',
    name: 'Dumbbell / Cable Lateral Raise',
    thaiSub: 'กางไหล่ข้าง — ท่าไม้ตายขยายไหล่กว้างทรง Jay Park',
    target: 'ไหล่ข้าง (Side Delts) · สำคัญที่สุด',
    sets: 4,
    reps: '12–15 ครั้ง',
    restSec: 60,
    defaultWeight: '6 kg',
    express: true,
    isPriority: true,
    cue: 'ใช้น้ำหนักเบา-กลาง (4–6 kg) โน้มตัวไปข้างหน้านิดเดียว โฟกัส "ดันข้อศอกออกไปให้ไกลลำตัวที่สุด" ห้ามยักไหล่ให้บ่า (Traps) แย่งงาน'
  },
  {
    id: 'ex5',
    code: '05',
    phase: 'shoulders',
    name: 'Reverse Pec Deck / Rope Face Pull',
    thaiSub: 'เล่นไหล่หลังให้กลม 3 มิติ & ปรับบุคลิกอกผาย',
    target: 'ไหล่หลัง (Rear Delts) & บุคลิกภาพ',
    sets: 3,
    reps: '12–15 ครั้ง',
    restSec: 60,
    defaultWeight: '25 kg',
    express: true,
    isPriority: true,
    cue: 'วาดแขนออกด้านหลังด้วยหัวไหล่หลัง ช่วยสร้างก้อนไหล่ให้ดูกลมจากมุมข้าง และดึงไหล่ไม่ให้ห่อจากการเล่นอก'
  },
  {
    id: 'ex6',
    code: '06',
    phase: 'back_arms',
    name: 'Wide-Grip Lat Pulldown',
    thaiSub: 'ดึงเคเบิลสร้างปีกหลังทรง V-Taper',
    target: 'ปีกหลังกว้างรับหัวไหล่',
    sets: 3,
    reps: '10–12 ครั้ง',
    restSec: 75,
    defaultWeight: '40 kg',
    express: true,
    isPriority: false,
    cue: 'จับบาร์กว้างกว่าไหล่เล็กน้อย แอ่นอกขึ้น ดึงบาร์ลงมาหาอกส่วนบนโดยโฟกัสกดข้อศอกลงข้างลำตัว'
  },
  {
    id: 'ex7',
    code: '07',
    phase: 'back_arms',
    name: 'Superset แขน: Dumbbell Curl + Triceps Pushdown',
    thaiSub: 'หน้าแขน 10–12 ครั้ง ต่อด้วยหลังแขน 12–15 ครั้งทันที',
    target: 'หน้าแขน & หลังแขนแน่นเต็มเสื้อ',
    sets: 3,
    reps: '10–12 + 12–15',
    restSec: 60,
    defaultWeight: '10 / 20 kg',
    express: false,
    isPriority: false,
    cue: 'เล่นหน้าแขนจบปุ๊บ เดินมากดเคเบิลหลังแขนต่อทันทีโดยไม่พัก แล้วค่อยพัก 60 วินาที ใช้เวลาแค่ 6–7 นาทีแต่แขนปั๊มแน่นครบ'
  },
  {
    id: 'ex8',
    code: '08',
    phase: 'legs_core',
    name: 'Leg Press หรือ Goblet Squat',
    thaiSub: 'ถีบขาหรือสควอทกระตุ้นฮอร์โมนและรักษามวลขา',
    target: 'ต้นขา & เผาผลาญพลังงาน',
    sets: 3,
    reps: '10–12 ครั้ง',
    restSec: 75,
    defaultWeight: '80 kg',
    express: false,
    isPriority: false,
    cue: 'วางเท้ากว้างระดับไหล่ ย่อลงลึกพอดีแล้วถีบด้วยส้นเท้า ช่วยให้ช่วงล่างสมส่วนกับส่วนสูง 184 cm โดยไม่ล้าเกินไป'
  },
  {
    id: 'ex9',
    code: '09',
    phase: 'legs_core',
    name: 'Hanging Knee Raise + Cable Crunch',
    thaiSub: 'โหนบาร์ยกเข่าปั้น V-Cut สลับดึงเคเบิลร่องท้อง 6-Pack',
    target: 'ร่องท้อง 6-Pack & V-Cut ท้องล่าง',
    sets: 3,
    reps: '12–15 ครั้ง',
    restSec: 45,
    defaultWeight: 'Bodyweight',
    express: true,
    isPriority: false,
    cue: 'ตอนยกเข่าขึ้น ให้ "ม้วนก้นกบขึ้นหาหน้าอก" (ไม่ยกขาเฉยๆ) เพื่อบีบท้องล่างและสร้างร่อง V-Cut ข้างเอวแบบ Jay Park'
  }
];

function cloneDefaultExercises() {
  return JAY_PARK_WORKOUT_EXERCISES.map((ex) => ({ ...ex }));
}

function createDefaultWorkoutState() {
  const weights = {};
  JAY_PARK_WORKOUT_EXERCISES.forEach((ex) => {
    weights[ex.id] = ex.defaultWeight;
  });
  return {
    mode: 'full', // 'full' (90 mins) | 'express' (55 mins)
    activePhase: 'all', // 'all' | 'warmup' | 'chest' | 'shoulders' | 'back_arms' | 'legs_core'
    schedulePreset: 'flexible', // 'flexible' (ทุก 2-3 วัน) | '3days' (จ-พฤ-ส) | '2days' (อ-ศ)
    plannedDays: [1, 4, 6], // จันทร์, พฤหัสบดี, เสาร์ (เว้นพัก 48-72 ชม.)
    exercises: cloneDefaultExercises(),
    weights,
    logsByDate: {}
  };
}

function buildWorkoutTodoObject(dueDateStr) {
  return {
    id: 'todo_jaypark_gym_routine',
    title: 'ฟิตเนส 1.5 ชม. — ตาราง Jay Park (เน้นอกส่วนบน & หัวไหล่ 3D)',
    note: 'ตารางรวมเล่นได้ทุกวัน (ไปยิมทุก 2–3 วัน) • หลังซ้อมจัดมื้อหลัก + ไข่ต้ม 3 ฟอง หรือนมถั่วเหลืองฝาดำ ~28g โปรตีน',
    dueDate: dueDateStr,
    dueTime: '18:00',
    reminderMinutes: '30',
    notifiedKey: null,
    snoozedUntil: null,
    priority: 'high',
    category: 'health',
    tags: ['JayParkFit', 'อกบน-ไหล่'],
    completed: false,
    completedAt: null,
    subtasks: [
      { id: 'sub_jp_w', title: 'Warm-up 10 นาที: External Rotation 2×15 + Incline Push-Up 2×12', done: false },
      { id: 'sub_jp_1', title: '1. [อกส่วนบน] Incline Dumbbell Press (เบาะเอียง 30°) — 4 เซ็ต × 8–12 ครั้ง', done: false },
      { id: 'sub_jp_2', title: '2. [อกส่วนบน] Low-to-High Cable Fly (ดึงล่างขึ้นบนค้าง 2 วิ) — 3 เซ็ต × 12–15 ครั้ง', done: false },
      { id: 'sub_jp_3', title: '3. [ไหล่รวม] Seated Dumbbell Shoulder Press — 3 เซ็ต × 8–12 ครั้ง', done: false },
      { id: 'sub_jp_4', title: '4. [ไหล่ข้าง V-Taper] Dumbbell / Cable Lateral Raise — 4 เซ็ต × 12–15 ครั้ง', done: false },
      { id: 'sub_jp_5', title: '5. [ไหล่หลัง 3D] Reverse Pec Deck / Rope Face Pull — 3 เซ็ต × 12–15 ครั้ง', done: false },
      { id: 'sub_jp_6', title: '6. [หลัง V-Taper] Wide-Grip Lat Pulldown — 3 เซ็ต × 10–12 ครั้ง', done: false },
      { id: 'sub_jp_7', title: '7. [แขน Superset] Dumbbell Curl + Cable Triceps Pushdown — 3 เซ็ต × 10–15 ครั้ง', done: false },
      { id: 'sub_jp_8', title: '8. [ขา] Leg Press หรือ Goblet Squat — 3 เซ็ต × 10–12 ครั้ง', done: false },
      { id: 'sub_jp_9', title: '9. [ร่องท้อง V-Cut] Hanging Knee Raise + Cable Crunch — 3 เซ็ต × 12–15 ครั้ง', done: false }
    ],
    createdAt: new Date().toISOString()
  };
}

// --- Default Starter Data (Relative to Today) ---
function createStarterData() {
  const today = toLocalDateStr();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const inTwoDays = addDays(today, 2);

  const drinkLogs = {};
  const exerciseLogs = {};
  const proteinLogs = {};
  const sleepLogs = {};

  for (let i = 20; i >= 1; i--) {
    const dStr = addDays(today, -i);
    const dayOfWeek = parseLocalDate(dStr).getDay();
    if (i <= 6 || i % 2 === 0 || i % 3 === 0) drinkLogs[dStr] = true;
    if ([1, 3, 5, 6].includes(dayOfWeek) && i !== 8) exerciseLogs[dStr] = true;
    if (i <= 5 || i % 2 === 1) proteinLogs[dStr] = true;
    if (i <= 3 || i % 3 !== 0) sleepLogs[dStr] = true;
  }
  drinkLogs[today] = true;

  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    settings: {
      theme: 'dark',
      firstDayOfWeek: 1,
      showCompletedTodos: true,
      notificationsEnabled: false,
      soundEnabled: true,
      dailyBriefingTime: '08:30',
      lastBriefingDate: null
    },
    workout: createDefaultWorkoutState(),
    categories: [...DEFAULT_CATEGORIES],
    todos: [
      buildWorkoutTodoObject(today),
      {
        id: generateId('todo'),
        title: 'วางแผนเป้าหมายประจำสัปดาห์และจัดลำดับงานสำคัญ',
        note: 'ทบทวนโปรเจกต์ที่ต้องส่งและเคลียร์งานค้าง',
        dueDate: today,
        dueTime: '10:00',
        reminderMinutes: '15',
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
        title: 'ซื้อของเติมโปรตีน (ไข่ต้ม, นมถั่วเหลืองโปรตีนสูงฝาดำ, อกไก่)',
        note: 'เตรียมไว้กินหลังซ้อมเวท 1.5 ชม. เพื่อปั้นอกบนและหัวไหล่',
        dueDate: inTwoDays,
        dueTime: '17:30',
        reminderMinutes: '0',
        notifiedKey: null,
        snoozedUntil: null,
        priority: 'medium',
        category: 'health',
        tags: ['โภชนาการ'],
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
        id: 'hab_jaypark_gym',
        title: 'ฟิตเนส 1.5 ชม. (อกบน & ไหล่ Jay Park)',
        icon: 'fitness',
        color: '#e31937',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        logs: exerciseLogs,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hab_protein_target',
        title: 'โปรตีนถึงเป้า (ไข่ต้ม 6 ฟอง / นมฝาดำ)',
        icon: 'nutrition',
        color: '#10b981',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        logs: proteinLogs,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('hab'),
        title: 'ดื่มน้ำเปล่า 8 แก้ว (ลีนคมชัด)',
        icon: 'hydration',
        color: '#3e6ae1',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        logs: drinkLogs,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('hab'),
        title: 'เข้านอนก่อน 23:30 น. (ฟื้นฟูกล้ามเนื้อ)',
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
        const normalized = this.normalizeState(parsed);
        this.saveSync(normalized);
        return normalized;
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

    const isUpgradingFromV1 = !data.version || data.version < 2;
    const isUpgradingToV3 = !data.version || data.version < 3;
    const resolvedTheme = isUpgradingFromV1
      ? 'dark'
      : (data.settings?.theme || 'dark');

    const defaultWorkout = createDefaultWorkoutState();
    const rawWorkout = data.workout && typeof data.workout === 'object' ? data.workout : {};
    const customExercises = Array.isArray(rawWorkout.exercises) && rawWorkout.exercises.length > 0
      ? rawWorkout.exercises.map((ex, idx) => ({
        id: ex.id || `ex_custom_${idx}`,
        code: ex.code || String(idx + 1).padStart(2, '0'),
        phase: ex.phase || 'chest',
        name: ex.name || 'ท่าออกกำลังกาย',
        thaiSub: ex.thaiSub || '',
        target: ex.target || 'โฟกัสกล้ามเนื้อ',
        sets: Math.max(1, Math.min(10, Number(ex.sets) || 3)),
        reps: ex.reps || '10–12 ครั้ง',
        restSec: Math.max(15, Math.min(300, Number(ex.restSec) || 60)),
        defaultWeight: ex.defaultWeight || '10 kg',
        express: ex.express !== undefined ? !!ex.express : true,
        isPriority: !!ex.isPriority,
        cue: ex.cue || ''
      }))
      : cloneDefaultExercises();

    const workoutState = {
      mode: rawWorkout.mode === 'express' ? 'express' : 'full',
      activePhase: rawWorkout.activePhase || 'all',
      schedulePreset: rawWorkout.schedulePreset || 'flexible',
      plannedDays: Array.isArray(rawWorkout.plannedDays) ? rawWorkout.plannedDays : [1, 4, 6],
      exercises: customExercises,
      weights: { ...defaultWorkout.weights, ...(rawWorkout.weights || {}) },
      logsByDate: rawWorkout.logsByDate && typeof rawWorkout.logsByDate === 'object'
        ? rawWorkout.logsByDate
        : {}
    };

    let todos = Array.isArray(data.todos) ? data.todos.map((t) => ({
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
    })) : [];

    let habits = Array.isArray(data.habits) ? data.habits.map((h) => ({
      id: h.id || generateId('hab'),
      title: h.title || 'นิสัยใหม่',
      icon: normalizeHabitIconKey(h.icon),
      color: h.color || '#3e6ae1',
      frequencyDays: Array.isArray(h.frequencyDays) && h.frequencyDays.length > 0
        ? h.frequencyDays
        : [0, 1, 2, 3, 4, 5, 6],
      logs: h.logs && typeof h.logs === 'object' ? h.logs : {},
      createdAt: h.createdAt || new Date().toISOString()
    })) : [];

    // Seamless upgrade to v3: inject Jay Park 1.5-Hr Gym Routine into existing user's Todos & Habits
    if (isUpgradingToV3) {
      const today = toLocalDateStr();
      // Remove old generic "ออกกำลังกายตอนเย็น / เดินเร็ว 30 นาที" demo todo if present
      todos = todos.filter((t) => t.title !== 'ออกกำลังกายตอนเย็น / เดินเร็ว 30 นาที');
      const hasGymTodo = todos.some((t) => t.id === 'todo_jaypark_gym_routine' || t.title.includes('ฟิตเนส 1.5 ชม.'));
      if (!hasGymTodo) {
        todos.unshift(buildWorkoutTodoObject(today));
      }

      // Upgrade fitness habit to Jay Park 1.5-Hr routine playable any day (all 7 days enabled so 2-3x/wk flexible works anytime)
      const fitHabIdx = habits.findIndex((h) => h.icon === 'fitness' || h.title.includes('ออกกำลังกาย') || h.title.includes('ฟิตเนส'));
      if (fitHabIdx !== -1) {
        habits[fitHabIdx] = {
          ...habits[fitHabIdx],
          id: habits[fitHabIdx].id || 'hab_jaypark_gym',
          title: 'ฟิตเนส 1.5 ชม. (อกบน & ไหล่ Jay Park)',
          icon: 'fitness',
          color: '#e31937',
          frequencyDays: [0, 1, 2, 3, 4, 5, 6]
        };
      } else {
        habits.unshift({
          id: 'hab_jaypark_gym',
          title: 'ฟิตเนส 1.5 ชม. (อกบน & ไหล่ Jay Park)',
          icon: 'fitness',
          color: '#e31937',
          frequencyDays: [0, 1, 2, 3, 4, 5, 6],
          logs: {},
          createdAt: new Date().toISOString()
        });
      }
    }

    return {
      version: 3,
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
      workout: workoutState,
      categories: Array.isArray(data.categories) && data.categories.length > 0
        ? data.categories
        : [...DEFAULT_CATEGORIES],
      todos,
      habits
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

  // --- Workout Operations (Jay Park 1.5-Hr Gym Blueprint & Custom Organizer) ---
  getWorkoutExercises() {
    if (!this.state.workout || !Array.isArray(this.state.workout.exercises) || this.state.workout.exercises.length === 0) {
      return cloneDefaultExercises();
    }
    return this.state.workout.exercises;
  }

  recalculateExerciseCodes() {
    if (!this.state.workout || !Array.isArray(this.state.workout.exercises)) return;
    let warmIdx = 1;
    let mainIdx = 1;
    const phaseOrder = ['warmup', 'chest', 'shoulders', 'back_arms', 'legs_core'];
    this.state.workout.exercises.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));
    this.state.workout.exercises.forEach((ex) => {
      if (ex.phase === 'warmup') {
        ex.code = `W${warmIdx++}`;
      } else {
        ex.code = String(mainIdx++).padStart(2, '0');
      }
    });
  }

  saveWorkoutExercise(exData) {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    if (!Array.isArray(this.state.workout.exercises)) {
      this.state.workout.exercises = cloneDefaultExercises();
    }
    const list = this.state.workout.exercises;
    const setsNum = Math.max(1, Math.min(10, Number(exData.sets) || 3));
    const restNum = Math.max(15, Math.min(300, Number(exData.restSec) || 60));
    const weightVal = (exData.weight || exData.defaultWeight || '10 kg').trim();

    if (exData.id) {
      const idx = list.findIndex((x) => x.id === exData.id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          phase: exData.phase || list[idx].phase || 'chest',
          name: (exData.name || list[idx].name).trim(),
          thaiSub: (exData.thaiSub || '').trim(),
          target: (exData.target || 'โฟกัสกล้ามเนื้อ').trim(),
          sets: setsNum,
          reps: (exData.reps || '8–12 ครั้ง').trim(),
          restSec: restNum,
          defaultWeight: weightVal,
          express: exData.express !== undefined ? !!exData.express : list[idx].express,
          isPriority: exData.isPriority !== undefined ? !!exData.isPriority : list[idx].isPriority,
          cue: (exData.cue || '').trim()
        };
        this.state.workout.weights[exData.id] = weightVal;
        this.recalculateExerciseCodes();
        this.notify();
        return list[idx];
      }
    }

    const newId = generateId('ex');
    const newEx = {
      id: newId,
      code: '01',
      phase: exData.phase || 'chest',
      name: (exData.name || 'ท่าออกกำลังกายใหม่').trim(),
      thaiSub: (exData.thaiSub || '').trim(),
      target: (exData.target || 'โฟกัสกล้ามเนื้อ').trim(),
      sets: setsNum,
      reps: (exData.reps || '8–12 ครั้ง').trim(),
      restSec: restNum,
      defaultWeight: weightVal,
      express: exData.express !== undefined ? !!exData.express : true,
      isPriority: !!exData.isPriority,
      cue: (exData.cue || '').trim()
    };
    list.push(newEx);
    this.state.workout.weights[newId] = weightVal;
    this.recalculateExerciseCodes();
    this.notify();
    return newEx;
  }

  deleteWorkoutExercise(exId) {
    if (!this.state.workout || !Array.isArray(this.state.workout.exercises)) return;
    this.state.workout.exercises = this.state.workout.exercises.filter((x) => x.id !== exId);
    this.recalculateExerciseCodes();
    this.notify();
  }

  moveWorkoutExercise(exId, delta) {
    if (!this.state.workout || !Array.isArray(this.state.workout.exercises)) return;
    const list = this.state.workout.exercises;
    const idx = list.findIndex((x) => x.id === exId);
    if (idx === -1) return;
    const targetPhase = list[idx].phase;
    // Find adjacent item within the same phase
    let swapIdx = -1;
    if (delta < 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (list[i].phase === targetPhase) { swapIdx = i; break; }
      }
    } else {
      for (let i = idx + 1; i < list.length; i++) {
        if (list[i].phase === targetPhase) { swapIdx = i; break; }
      }
    }
    if (swapIdx === -1) return;
    const temp = list[idx];
    list[idx] = list[swapIdx];
    list[swapIdx] = temp;
    this.recalculateExerciseCodes();
    this.notify();
  }

  resetWorkoutRoutineToDefault() {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    this.state.workout.exercises = cloneDefaultExercises();
    JAY_PARK_WORKOUT_EXERCISES.forEach((ex) => {
      if (!this.state.workout.weights[ex.id]) {
        this.state.workout.weights[ex.id] = ex.defaultWeight;
      }
    });
    this.notify();
  }

  toggleWorkoutPlannedDay(dayNum) {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    const cur = Array.isArray(this.state.workout.plannedDays) ? [...this.state.workout.plannedDays] : [1, 4, 6];
    const idx = cur.indexOf(dayNum);
    if (idx === -1) {
      cur.push(dayNum);
      cur.sort((a, b) => a - b);
    } else if (cur.length > 1) {
      cur.splice(idx, 1);
    }
    this.state.workout.plannedDays = cur;
    this.state.workout.schedulePreset = 'custom';
    this.notify();
  }

  setWorkoutSchedulePreset(preset) {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    this.state.workout.schedulePreset = preset;
    if (preset === '2days') {
      this.state.workout.plannedDays = [2, 5]; // อังคาร & ศุกร์ (พัก 2-3 วัน)
    } else if (preset === '3days') {
      this.state.workout.plannedDays = [1, 4, 6]; // จันทร์, พฤหัส, เสาร์
    } else {
      this.state.workout.plannedDays = [1, 4, 6]; // ยืดหยุ่น 2-3 วันไปที
    }
    this.notify();
  }

  ensureWorkoutDateLog(dateStr = toLocalDateStr()) {
    if (!this.state.workout) {
      this.state.workout = createDefaultWorkoutState();
    }
    if (!this.state.workout.logsByDate) {
      this.state.workout.logsByDate = {};
    }
    if (!this.state.workout.logsByDate[dateStr]) {
      this.state.workout.logsByDate[dateStr] = {
        completedSets: {},
        sessionCompleted: false
      };
    }
    return this.state.workout.logsByDate[dateStr];
  }

  toggleWorkoutSet(dateStr, exerciseId, setIdx, totalSets) {
    const dayLog = this.ensureWorkoutDateLog(dateStr);
    if (!Array.isArray(dayLog.completedSets[exerciseId])) {
      dayLog.completedSets[exerciseId] = Array(totalSets).fill(false);
    }
    const arr = dayLog.completedSets[exerciseId];
    while (arr.length < totalSets) arr.push(false);
    arr[setIdx] = !arr[setIdx];
    const isNowDone = arr[setIdx];

    // Sync corresponding subtask in To-Do if present on this date
    this.syncWorkoutProgressToHabitAndTodo(dateStr);
    this.notify();
    return isNowDone;
  }

  toggleWorkoutExerciseAllSets(dateStr, exerciseId, totalSets) {
    const dayLog = this.ensureWorkoutDateLog(dateStr);
    const currentArr = Array.isArray(dayLog.completedSets[exerciseId])
      ? dayLog.completedSets[exerciseId]
      : [];
    const allDone = currentArr.length >= totalSets && currentArr.slice(0, totalSets).every(Boolean);
    dayLog.completedSets[exerciseId] = Array(totalSets).fill(!allDone);
    this.syncWorkoutProgressToHabitAndTodo(dateStr);
    this.notify();
    return !allDone;
  }

  updateWorkoutWeight(exerciseId, weightStr) {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    if (!this.state.workout.weights) this.state.workout.weights = {};
    this.state.workout.weights[exerciseId] = weightStr.trim() || 'BW';
    this.notify();
  }

  setWorkoutMode(mode) {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    this.state.workout.mode = mode === 'express' ? 'express' : 'full';
    this.notify();
  }

  setWorkoutPhaseFilter(phase) {
    if (!this.state.workout) this.state.workout = createDefaultWorkoutState();
    this.state.workout.activePhase = phase || 'all';
    this.notify();
  }

  completeWorkoutSession(dateStr = toLocalDateStr()) {
    const dayLog = this.ensureWorkoutDateLog(dateStr);
    const mode = this.state.workout.mode || 'full';
    const allEx = this.getWorkoutExercises();
    const exercises = allEx.filter((ex) => mode === 'full' || ex.express);
    exercises.forEach((ex) => {
      dayLog.completedSets[ex.id] = Array(ex.sets).fill(true);
    });
    dayLog.sessionCompleted = true;

    // Automatically mark Fitness habit done on dateStr
    const fitHabit = this.state.habits.find((h) => h.icon === 'fitness' || h.title.includes('ฟิตเนส') || h.title.includes('ออกกำลังกาย'));
    if (fitHabit) {
      if (!fitHabit.logs) fitHabit.logs = {};
      fitHabit.logs[dateStr] = true;
    }

    this.syncWorkoutProgressToHabitAndTodo(dateStr, true);
    this.notify();
  }

  resetWorkoutSession(dateStr = toLocalDateStr()) {
    if (this.state.workout && this.state.workout.logsByDate && this.state.workout.logsByDate[dateStr]) {
      delete this.state.workout.logsByDate[dateStr];
    }
    this.syncWorkoutProgressToHabitAndTodo(dateStr, false);
    this.notify();
  }

  syncWorkoutProgressToHabitAndTodo(dateStr, forceComplete = null) {
    const dayLog = this.ensureWorkoutDateLog(dateStr);
    const mode = this.state.workout?.mode || 'full';
    const allEx = this.getWorkoutExercises();
    const activeExercises = allEx.filter((ex) => mode === 'full' || ex.express);

    let doneExercisesCount = 0;
    activeExercises.forEach((ex) => {
      const setsArr = dayLog.completedSets[ex.id] || [];
      const exDone = setsArr.length >= ex.sets && setsArr.slice(0, ex.sets).every(Boolean);
      if (exDone) doneExercisesCount++;
    });

    const allDone = forceComplete !== null
      ? forceComplete
      : (activeExercises.length > 0 && doneExercisesCount === activeExercises.length);
    dayLog.sessionCompleted = allDone;

    if (allDone) {
      const fitHabit = this.state.habits.find((h) => h.icon === 'fitness' || h.title.includes('ฟิตเนส') || h.title.includes('ออกกำลังกาย'));
      if (fitHabit) {
        if (!fitHabit.logs) fitHabit.logs = {};
        fitHabit.logs[dateStr] = true;
      }
    }

    // Sync with matching gym To-Do on dateStr if present
    const gymTodo = this.state.todos.find((t) =>
      t.dueDate === dateStr && (t.id === 'todo_jaypark_gym_routine' || t.title.includes('ฟิตเนส 1.5 ชม.'))
    );
    if (gymTodo && Array.isArray(gymTodo.subtasks)) {
      const w1Done = (dayLog.completedSets.w1 || []).filter(Boolean).length >= 2;
      const w2Done = (dayLog.completedSets.w2 || []).filter(Boolean).length >= 2;
      const mapSubToEx = {
        sub_jp_w: w1Done && w2Done,
        sub_jp_1: (dayLog.completedSets.ex1 || []).filter(Boolean).length >= 4,
        sub_jp_2: (dayLog.completedSets.ex2 || []).filter(Boolean).length >= 3,
        sub_jp_3: (dayLog.completedSets.ex3 || []).filter(Boolean).length >= 3,
        sub_jp_4: (dayLog.completedSets.ex4 || []).filter(Boolean).length >= 4,
        sub_jp_5: (dayLog.completedSets.ex5 || []).filter(Boolean).length >= 3,
        sub_jp_6: (dayLog.completedSets.ex6 || []).filter(Boolean).length >= 3,
        sub_jp_7: (dayLog.completedSets.ex7 || []).filter(Boolean).length >= 3,
        sub_jp_8: (dayLog.completedSets.ex8 || []).filter(Boolean).length >= 3,
        sub_jp_9: (dayLog.completedSets.ex9 || []).filter(Boolean).length >= 3
      };
      gymTodo.subtasks.forEach((sub) => {
        if (mapSubToEx[sub.id] !== undefined) {
          sub.done = mapSubToEx[sub.id];
        }
      });
      if (forceComplete === true || allDone) {
        gymTodo.completed = true;
        gymTodo.completedAt = new Date().toISOString();
      } else if (forceComplete === false) {
        gymTodo.completed = false;
        gymTodo.completedAt = null;
      }
    }
  }

  addWorkoutToDateTodos(dateStr = toLocalDateStr()) {
    const existing = this.state.todos.find((t) =>
      t.dueDate === dateStr && (t.id === 'todo_jaypark_gym_routine' || t.title.includes('ฟิตเนส 1.5 ชม.'))
    );
    if (existing) {
      return { added: false, todo: existing };
    }
    const newTodo = buildWorkoutTodoObject(dateStr);
    newTodo.id = generateId('todo_gym');
    this.state.todos.unshift(newTodo);
    this.syncWorkoutProgressToHabitAndTodo(dateStr);
    this.notify();
    return { added: true, todo: newTodo };
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
      version: 3,
      updatedAt: new Date().toISOString(),
      settings: { ...this.state.settings },
      workout: createDefaultWorkoutState(),
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
  DEFAULT_CATEGORIES,
  JAY_PARK_WORKOUT_PHASES,
  JAY_PARK_WORKOUT_EXERCISES
};
