// ניהול שגיאות גלובלי להצגה על המסך למשתמש במקרה של תקלה
window.addEventListener('error', (event) => {
  if (typeof showToast === 'function') {
    showToast(`שגיאת מערכת: ${event.message}`, 'error');
  } else {
    console.error('System error:', event.message);
  }
});

// קונפיגורציה ואתחול Firebase בענן (הגדרות הפרויקט של משפחת אליאב)
const firebaseConfig = {
  apiKey: "AIzaSyA2g2r48ILfBeTYbjOTs9pcE-W1u2fsFjA",
  authDomain: "eliav-family-summer-2026.firebaseapp.com",
  projectId: "eliav-family-summer-2026",
  storageBucket: "eliav-family-summer-2026.firebasestorage.app",
  messagingSenderId: "955545416703",
  appId: "1:955545416703:web:826e0074a06eea4b776dca"
};

// אתחול האפליקציה ב-Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ניהול המדינה (State) של האפליקציה
let state = {
  appMode: 'summer', // 'summer' | 'routine'
  currentDate: new Date(), // תאריך היום כברירת מחדל
  activeChildId: 'hila',
  activeTab: 'scoreboard',
  children: [],
  summerEvents: [],
  routineEvents: [],
  summerShopping: [],
  routineShopping: [],
  summerScores: {},
  routineScores: {},
  wallets: {}, // { childId: [ { id, date, reason, amount } ] }
  currentUser: null,
  currentPIN: '',
  tempSelectedUserId: null
};

// פונקציות עזר לקבלת הנתונים הפעילים לפי המצב הנבחר (קיץ/שגרה)
function getActiveTasks() {
  return state.appMode === 'routine' ? DEFAULT_ROUTINE_TASKS : DEFAULT_TASKS;
}

function getActiveScores() {
  return state.appMode === 'routine' ? state.routineScores : state.summerScores;
}

function setActiveScores(newScores) {
  if (state.appMode === 'routine') {
    state.routineScores = newScores;
  } else {
    state.summerScores = newScores;
  }
}

function getActiveEvents() {
  return state.appMode === 'routine' ? state.routineEvents : state.summerEvents;
}

function setActiveEvents(newEvents) {
  if (state.appMode === 'routine') {
    state.routineEvents = newEvents;
  } else {
    state.summerEvents = newEvents;
  }
}

function getActiveShopping() {
  return state.appMode === 'routine' ? state.routineShopping : state.summerShopping;
}

function setActiveShopping(newShopping) {
  if (state.appMode === 'routine') {
    state.routineShopping = newShopping;
  } else {
    state.summerShopping = newShopping;
  }
}

// אתחול האפליקציה
document.addEventListener('DOMContentLoaded', () => {
  initData();
  setupEventListeners();
  updateDateDisplay();
  renderAll();
  setupFirebaseSync(); // סנכרון ענן בזמן אמת
  showToast('האפליקציה נטענה בהצלחה! ☀️', 'success');
});

// עוזרי הצגת/הסתרת מסך כניסה
function hidePortal() {
  const portal = document.getElementById('profileSelectionPortal');
  if (portal) {
    portal.classList.remove('active');
    portal.style.setProperty('display', 'none', 'important');
  }
}

function showPortal() {
  const portal = document.getElementById('profileSelectionPortal');
  if (portal) {
    portal.style.setProperty('display', 'flex', 'important');
    portal.classList.add('active');
  }
}

// משתמש פעיל
function checkActiveUser() {
  const savedUser = localStorage.getItem('family_summer_active_user');
  if (savedUser) {
    state.currentUser = savedUser;
    if (savedUser !== 'parent_amit' && savedUser !== 'parent_tiferet') {
      state.activeChildId = savedUser;
    }
    hidePortal();
  } else {
    state.currentUser = null;
    showPortal();
  }
}

// טעינת נתונים או אתחולם מנתוני ברירת המחדל ב-data.js
function initData() {
  // מצב אפליקציה (קיץ / שגרה)
  const savedMode = localStorage.getItem('family_app_mode');
  if (savedMode === 'routine' || savedMode === 'summer') {
    state.appMode = savedMode;
  }

  // ילדים
  const savedChildren = localStorage.getItem('family_summer_children');
  if (savedChildren) {
    state.children = JSON.parse(savedChildren);
  } else {
    state.children = INITIAL_CHILDREN;
    localStorage.setItem('family_summer_children', JSON.stringify(INITIAL_CHILDREN));
  }

  // פעילויות קיץ
  const savedEvents = localStorage.getItem('family_summer_events');
  if (savedEvents) {
    state.summerEvents = JSON.parse(savedEvents);
  } else {
    state.summerEvents = INITIAL_EVENTS;
    localStorage.setItem('family_summer_events', JSON.stringify(INITIAL_EVENTS));
  }

  // פעילויות שגרה - טעינה מנתוני הלו"ז המעודכנים
  state.routineEvents = typeof INITIAL_ROUTINE_EVENTS !== 'undefined' ? INITIAL_ROUTINE_EVENTS : [];
  localStorage.setItem('family_routine_events', JSON.stringify(state.routineEvents));

  // קניות קיץ
  const savedShopping = localStorage.getItem('family_school_shopping');
  if (savedShopping) {
    state.summerShopping = JSON.parse(savedShopping).map(item => {
      const qty = parseInt(item.quantity) || 1;
      if (item.boughtQty === undefined) item.boughtQty = item.bought ? qty : 0;
      item.bought = item.boughtQty >= qty;
      return item;
    });
  } else {
    state.summerShopping = INITIAL_SHOPPING.map(item => {
      const qty = parseInt(item.quantity) || 1;
      if (item.boughtQty === undefined) item.boughtQty = item.bought ? qty : 0;
      item.bought = item.boughtQty >= qty;
      return item;
    });
    localStorage.setItem('family_school_shopping', JSON.stringify(state.summerShopping));
  }

  // קניות שגרה
  const savedRoutineShopping = localStorage.getItem('family_routine_shopping');
  if (savedRoutineShopping) {
    state.routineShopping = JSON.parse(savedRoutineShopping).map(item => {
      const qty = parseInt(item.quantity) || 1;
      if (item.boughtQty === undefined) item.boughtQty = item.bought ? qty : 0;
      item.bought = item.boughtQty >= qty;
      return item;
    });
  } else {
    state.routineShopping = (typeof INITIAL_ROUTINE_SHOPPING !== 'undefined' ? INITIAL_ROUTINE_SHOPPING : []).map(item => {
      const qty = parseInt(item.quantity) || 1;
      if (item.boughtQty === undefined) item.boughtQty = item.bought ? qty : 0;
      item.bought = item.boughtQty >= qty;
      return item;
    });
    localStorage.setItem('family_routine_shopping', JSON.stringify(state.routineShopping));
  }

  // ניקוד קיץ
  const savedSummerScores = localStorage.getItem('family_summer_scores');
  if (savedSummerScores) {
    try { state.summerScores = JSON.parse(savedSummerScores); } catch (e) { state.summerScores = {}; }
  } else {
    state.summerScores = {
      '2026-07-06': {
        'moriah': { tasks: {}, custom: [{ id: 'init_moriah', reason: 'נקודות פתיחה', points: 30 }, { id: 'restore_moriah', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 180 }] },
        'ariel': { tasks: {}, custom: [{ id: 'restore_ariel', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 107 }] },
        'hila': { tasks: {}, custom: [{ id: 'restore_hila', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 184 }] },
        'shira': { tasks: {}, custom: [{ id: 'restore_shira', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 30 }] },
        'talia': { tasks: {}, custom: [{ id: 'restore_talia', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 20 }] }
      }
    };
  }

  // ניקוד שגרה
  const savedRoutineScores = localStorage.getItem('family_routine_scores');
  if (savedRoutineScores) {
    try { state.routineScores = JSON.parse(savedRoutineScores); } catch (e) { state.routineScores = {}; }
  } else {
    state.routineScores = {};
  }

  // ארנק אישי לילדים (מריטות/מתן מזומן)
  const savedWallets = localStorage.getItem('family_wallets');
  if (savedWallets) {
    try { state.wallets = JSON.parse(savedWallets); } catch (e) { state.wallets = {}; }
  } else {
    state.wallets = {};
  }

  checkActiveUser();
}

// שמירת נתונים בענן (Firebase) ובגיבוי מקומי
function saveScores() {
  if (state.appMode === 'routine') {
    localStorage.setItem('family_routine_scores', JSON.stringify(state.routineScores));
    db.collection('family_data').doc('routine_scores').set({ scores: state.routineScores })
      .catch(err => console.error("שגיאה בשמירת ניקוד שגרה לענן:", err));
  } else {
    localStorage.setItem('family_summer_scores', JSON.stringify(state.summerScores));
    db.collection('family_data').doc('scores').set({ scores: state.summerScores })
      .catch(err => console.error("שגיאה בשמירת ניקוד קיץ לענן:", err));
  }
}

function saveEvents() {
  if (state.appMode === 'routine') {
    localStorage.setItem('family_routine_events', JSON.stringify(state.routineEvents));
    db.collection('family_data').doc('routine_events').set({ events: state.routineEvents })
      .catch(err => console.error("שגיאה בשמירת אירועי שגרה לענן:", err));
  } else {
    localStorage.setItem('family_summer_events', JSON.stringify(state.summerEvents));
    db.collection('family_data').doc('events').set({ events: state.summerEvents })
      .catch(err => console.error("שגיאה בשמירת אירועי קיץ לענן:", err));
  }
}

function saveShopping() {
  if (state.appMode === 'routine') {
    localStorage.setItem('family_routine_shopping', JSON.stringify(state.routineShopping));
    db.collection('family_data').doc('routine_shopping').set({ shopping: state.routineShopping })
      .catch(err => console.error("שגיאה בשמירת קניות שגרה לענן:", err));
  } else {
    localStorage.setItem('family_school_shopping', JSON.stringify(state.summerShopping));
    db.collection('family_data').doc('school_shopping').set({ shopping: state.summerShopping })
      .catch(err => console.error("שגיאה בשמירת קניות קיץ לענן:", err));
  }
}

function saveWallets() {
  localStorage.setItem('family_wallets', JSON.stringify(state.wallets));
  db.collection('family_data').doc('wallets').set({ wallets: state.wallets })
    .catch(err => console.error("שגיאה בשמירת ארנקים לענן:", err));
}

// פונקציית עזר למיזוג בטוח של ניקוד מקומי וניקוד בענן
function mergeScores(local, remote) {
  const result = {};

  const allDates = new Set([
    ...Object.keys(local || {}),
    ...Object.keys(remote || {})
  ]);

  for (const dateKey of allDates) {
    result[dateKey] = {};
    const localDay = (local && local[dateKey]) || {};
    const remoteDay = (remote && remote[dateKey]) || {};

    const allChildren = new Set([
      ...Object.keys(localDay),
      ...Object.keys(remoteDay)
    ]);

    for (const childId of allChildren) {
      result[dateKey][childId] = {
        tasks: {},
        custom: []
      };

      const localChild = localDay[childId] || {};
      const remoteChild = remoteDay[childId] || {};

      // מיזוג משימות (אם בוצע באחד הצדדים - מסומן כבוצע)
      const localTasks = localChild.tasks || {};
      const remoteTasks = remoteChild.tasks || {};
      const allTasks = new Set([
        ...Object.keys(localTasks),
        ...Object.keys(remoteTasks)
      ]);
      for (const taskId of allTasks) {
        result[dateKey][childId].tasks[taskId] = !!(localTasks[taskId] || remoteTasks[taskId]);
      }

      // מיזוג נקודות מיוחדות לפי מזהה ייחודי (ID)
      const localCustom = localChild.custom || [];
      const remoteCustom = remoteChild.custom || [];
      const customMap = new Map();
      remoteCustom.forEach(item => {
        if (item && item.id) customMap.set(item.id, item);
      });
      localCustom.forEach(item => {
        if (item && item.id) customMap.set(item.id, item);
      });
      result[dateKey][childId].custom = Array.from(customMap.values());
    }
  }

  return result;
}

// הגדרת סנכרון Firebase בזמן אמת מול הענן
function setupFirebaseSync() {
  // 1. מאזין לניקוד קיץ
  db.collection('family_data').doc('scores').onSnapshot((doc) => {
    if (doc.exists) {
      const remoteScores = doc.data().scores || {};
      const merged = mergeScores(state.summerScores, remoteScores);
      state.summerScores = merged;
      localStorage.setItem('family_summer_scores', JSON.stringify(merged));
      renderAll();
    } else { saveScores(); }
  }, err => console.error("שגיאה בסנכרון ניקוד קיץ:", err));

  // 2. מאזין לניקוד שגרה
  db.collection('family_data').doc('routine_scores').onSnapshot((doc) => {
    if (doc.exists) {
      const remoteScores = doc.data().scores || {};
      const merged = mergeScores(state.routineScores, remoteScores);
      state.routineScores = merged;
      localStorage.setItem('family_routine_scores', JSON.stringify(merged));
      renderAll();
    } else { saveScores(); }
  }, err => console.error("שגיאה בסנכרון ניקוד שגרה:", err));

  // 3. מאזין לאירועי קיץ
  db.collection('family_data').doc('events').onSnapshot((doc) => {
    if (doc.exists) {
      state.summerEvents = doc.data().events || [];
      renderAll();
    } else { saveEvents(); }
  }, err => console.error("שגיאה בסנכרון אירועי קיץ:", err));

  // 4. מאזין לאירועי שגרה
  db.collection('family_data').doc('routine_events').onSnapshot((doc) => {
    if (doc.exists) {
      const remoteEvents = doc.data().events || [];
      const hasObsoleteOrMissing = remoteEvents.some(e => e.id === 'routine_dentist_1' || e.id.startsWith('routine_course_')) || !remoteEvents.some(e => e.id.startsWith('routine_ceramics_'));
      if (hasObsoleteOrMissing) {
        state.routineEvents = INITIAL_ROUTINE_EVENTS;
        saveEvents();
      } else {
        state.routineEvents = remoteEvents;
      }
      renderAll();
    } else { saveEvents(); }
  }, err => console.error("שגיאה בסנכרון אירועי שגרה:", err));

  // 5. מאזין לקניות קיץ
  db.collection('family_data').doc('school_shopping').onSnapshot((doc) => {
    if (doc.exists) {
      state.summerShopping = (doc.data().shopping || []).map(item => {
        const qty = parseInt(item.quantity) || 1;
        if (item.boughtQty === undefined) item.boughtQty = item.bought ? qty : 0;
        item.bought = item.boughtQty >= qty;
        return item;
      });
      renderAll();
    } else { saveShopping(); }
  }, err => console.error("שגיאה בסנכרון קניות קיץ:", err));

  // 6. מאזין לקניות שגרה
  db.collection('family_data').doc('routine_shopping').onSnapshot((doc) => {
    if (doc.exists) {
      state.routineShopping = (doc.data().shopping || []).map(item => {
        const qty = parseInt(item.quantity) || 1;
        if (item.boughtQty === undefined) item.boughtQty = item.bought ? qty : 0;
        item.bought = item.boughtQty >= qty;
        return item;
      });
      renderAll();
    } else { saveShopping(); }
  }, err => console.error("שגיאה בסנכרון קניות שגרה:", err));

  // 7. מאזין לארנק אישי
  db.collection('family_data').doc('wallets').onSnapshot((doc) => {
    if (doc.exists) {
      state.wallets = doc.data().wallets || {};
      renderAll();
    } else { saveWallets(); }
  }, err => console.error("שגיאה בסנכרון ארנקים:", err));
}

// עוזרי תאריכים
function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getHebrewDateString(date) {
  try {
    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(date).replace(/[\u200e\u200f]/g, '');
  } catch (e) {
    return '';
  }
}

function getGregorianDateString(date) {
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
                  
  const options = { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' };
  const formatted = new Intl.DateTimeFormat('he-IL', options).format(date);
  return isToday ? `היום, ${formatted}` : formatted;
}

// עדכון תצוגת התאריך בבורר
function updateDateDisplay() {
  const gregElement = document.getElementById('gregorianDate');
  const hebElement = document.getElementById('hebrewDate');
  if (gregElement && hebElement) {
    gregElement.textContent = getGregorianDateString(state.currentDate);
    hebElement.textContent = getHebrewDateString(state.currentDate);
  }
}

// מעבר בין מצבי עבודה (קיץ vs שגרה)
window.switchAppMode = function(mode) {
  state.appMode = mode;
  localStorage.setItem('family_app_mode', mode);

  const summerBtn = document.getElementById('modeSummerBtn');
  const routineBtn = document.getElementById('modeRoutineBtn');
  if (summerBtn && routineBtn) {
    summerBtn.classList.toggle('active', mode === 'summer');
    routineBtn.classList.toggle('active', mode === 'routine');
  }

  const titleEl = document.getElementById('appHeaderTitle');
  const subtitleEl = document.getElementById('appHeaderSubtitle');
  if (titleEl && subtitleEl) {
    if (mode === 'summer') {
      titleEl.textContent = 'לו"ז חופש - משפחת אליאב 🏖️';
      subtitleEl.textContent = 'אפליקציית משימות ולוז חופשות (חגים וקיץ) להורים עמית ותפארת, והילדים הילה, מוריה, אריאל, שירה וטליה';
    } else {
      titleEl.textContent = 'שגרת הלימודים של משפחת אליאב 🏫';
      subtitleEl.textContent = 'אפליקציית משימות שגרה, חוגים וציוד לשנת הלימודים להורים עמית ותפארת והילדים';
    }
  }

  renderAll();
  showToast(mode === 'summer' ? 'עברתם ללו"ז חופש 🏖️' : 'עברתם למצב זמני שגרה 🏫', 'info');
};

// מאזיני אירועים
function setupEventListeners() {
  // בורר מצבי אפליקציה (קיץ / שגרה)
  const modeSummerBtn = document.getElementById('modeSummerBtn');
  const modeRoutineBtn = document.getElementById('modeRoutineBtn');
  if (modeSummerBtn) modeSummerBtn.addEventListener('click', () => switchAppMode('summer'));
  if (modeRoutineBtn) modeRoutineBtn.addEventListener('click', () => switchAppMode('routine'));

  // ניווט טאבים
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const selectedTab = e.currentTarget.dataset.tab;
      switchTab(selectedTab);
    });
  });

  // בורר תאריכים בלוח ניקוד
  const prevDayBtn = document.getElementById('prevDayBtn');
  const nextDayBtn = document.getElementById('nextDayBtn');
  if (prevDayBtn && nextDayBtn) {
    prevDayBtn.addEventListener('click', () => changeDate(-1));
    nextDayBtn.addEventListener('click', () => changeDate(1));
  }

  // טופס נקודות ידני
  const customPointsForm = document.getElementById('customPointsForm');
  if (customPointsForm) {
    customPointsForm.addEventListener('submit', handleCustomPointsSubmit);
  }

  // טופס ארנק אישי (מתן מזומן)
  const walletPayoutForm = document.getElementById('walletPayoutForm');
  if (walletPayoutForm) {
    walletPayoutForm.addEventListener('submit', handleWalletPayoutSubmit);
  }

  // הוספת קנייה
  const addShopForm = document.getElementById('addShopForm');
  if (addShopForm) {
    addShopForm.addEventListener('submit', handleAddShopSubmit);
  }

  // חיפושים וסינונים של פעילויות
  const filterChild = document.getElementById('filterChild');
  const filterCategory = document.getElementById('filterCategory');
  const searchInput = document.getElementById('searchInput');
  const filterDateType = document.getElementById('filterDateType');
  const filterSpecificDate = document.getElementById('filterSpecificDate');

  if (filterChild) filterChild.addEventListener('change', renderActivities);
  if (filterCategory) filterCategory.addEventListener('change', renderActivities);
  if (searchInput) searchInput.addEventListener('input', renderActivities);
  if (filterDateType) {
    filterDateType.addEventListener('change', (e) => {
      if (e.target.value === 'specific') {
        filterSpecificDate.style.display = 'block';
      } else {
        filterSpecificDate.style.display = 'none';
      }
      renderActivities();
    });
  }
  if (filterSpecificDate) filterSpecificDate.addEventListener('change', renderActivities);

  // סינוני רשימת קניות
  const filterShopChild = document.getElementById('filterShopChild');
  const filterShopStatus = document.getElementById('filterShopStatus');
  if (filterShopChild) filterShopChild.addEventListener('change', renderShopping);
  if (filterShopStatus) filterShopStatus.addEventListener('change', renderShopping);

  // פתיחת מודאל הוספת פעילות
  const btnOpenActivityModal = document.getElementById('btnOpenActivityModal');
  const activityModal = document.getElementById('activityModal');
  const btnCloseActivityModal = document.getElementById('btnCloseActivityModal');
  const addActivityForm = document.getElementById('addActivityForm');

  if (btnOpenActivityModal && activityModal) {
    btnOpenActivityModal.addEventListener('click', () => {
      activityModal.classList.add('active');
    });
  }
  if (btnCloseActivityModal && activityModal) {
    btnCloseActivityModal.addEventListener('click', () => {
      activityModal.classList.remove('active');
    });
  }
  if (addActivityForm) {
    addActivityForm.addEventListener('submit', handleAddActivitySubmit);
  }
  
  // התנתקות מהפרופיל
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', window.logout);
  }
}

// מעבר בין טאבים
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabId}Tab`);
  });
  renderAll();
}

// שינוי תאריך בלוח הניקוד
function changeDate(days) {
  state.currentDate.setDate(state.currentDate.getDate() + days);
  updateDateDisplay();
  renderScoreboard();
}

// חישוב ניקוד מצטבר לילד במצב הנוכחי
function calculateCumulativePoints(childId) {
  let total = 0;
  const scoresObj = getActiveScores();
  for (const dateKey in scoresObj) {
    const dayScores = scoresObj[dateKey][childId];
    if (dayScores) {
      if (dayScores.tasks) {
        for (const taskId in dayScores.tasks) {
          if (dayScores.tasks[taskId]) {
            let task = DEFAULT_TASKS.daily.find(t => t.id === taskId) ||
                       DEFAULT_TASKS.bonus.find(t => t.id === taskId) ||
                       DEFAULT_TASKS.negative.find(t => t.id === taskId) ||
                       (typeof DEFAULT_ROUTINE_TASKS !== 'undefined' && (
                         DEFAULT_ROUTINE_TASKS.daily.find(t => t.id === taskId) ||
                         DEFAULT_ROUTINE_TASKS.bonus.find(t => t.id === taskId) ||
                         DEFAULT_ROUTINE_TASKS.negative.find(t => t.id === taskId)
                       ));
            if (task) total += task.points;
          }
        }
      }
      if (dayScores.custom) {
        dayScores.custom.forEach(item => {
          total += item.points;
        });
      }
    }
  }
  return total;
}

// חישוב ניקוד יומי לילד בתאריך ספציפי במצב הנוכחי
function calculateDayPoints(childId, dateKey) {
  let total = 0;
  const scoresObj = getActiveScores();
  const dayScores = scoresObj[dateKey] && scoresObj[dateKey][childId];
  if (dayScores) {
    if (dayScores.tasks) {
      for (const taskId in dayScores.tasks) {
        if (dayScores.tasks[taskId]) {
          let task = DEFAULT_TASKS.daily.find(t => t.id === taskId) ||
                     DEFAULT_TASKS.bonus.find(t => t.id === taskId) ||
                     DEFAULT_TASKS.negative.find(t => t.id === taskId) ||
                     (typeof DEFAULT_ROUTINE_TASKS !== 'undefined' && (
                       DEFAULT_ROUTINE_TASKS.daily.find(t => t.id === taskId) ||
                       DEFAULT_ROUTINE_TASKS.bonus.find(t => t.id === taskId) ||
                       DEFAULT_ROUTINE_TASKS.negative.find(t => t.id === taskId)
                     ));
          if (task) total += task.points;
        }
      }
    }
    if (dayScores.custom) {
      dayScores.custom.forEach(item => {
        total += item.points;
      });
    }
  }
  return total;
}

// חישוב ניקוד משפחתי כולל במצב הנוכחי
function getFamilyTotals() {
  let totalPoints = 0;
  state.children.forEach(child => {
    totalPoints += calculateCumulativePoints(child.id);
  });
  return { totalPoints };
}

// רנדור האפליקציה כולה
function renderAll() {
  updateUserProfileStatusBar();
  renderFamilySummaryBar();
  if (state.activeTab === 'scoreboard') {
    renderScoreboard();
  } else if (state.activeTab === 'activities') {
    renderActivities();
  } else if (state.activeTab === 'shopping') {
    renderShopping();
  }
}

// בר עדכון סיכום משפחתי + יציאה משפחתית (כל 5,000 נק')
function renderFamilySummaryBar() {
  const { totalPoints } = getFamilyTotals();
  const familyPointsEl = document.getElementById('familyTotalPoints');
  if (familyPointsEl) familyPointsEl.textContent = totalPoints.toLocaleString() + ' נק\'';

  const outingsEarned = Math.floor(totalPoints / 5000);
  const pointsInCurrentLevel = totalPoints % 5000;
  const pointsNeededNext = 5000 - pointsInCurrentLevel;
  const progressPercent = Math.min(100, Math.round((pointsInCurrentLevel / 5000) * 100));

  const outingsCountEl = document.getElementById('familyOutingsCount');
  const outingFillEl = document.getElementById('familyOutingFill');
  const outingSubtextEl = document.getElementById('familyOutingSubtext');

  if (outingsCountEl) {
    outingsCountEl.textContent = outingsEarned > 0 ? `${outingsEarned} יציאות!` : '0 יציאות';
  }
  if (outingFillEl) {
    outingFillEl.style.width = `${progressPercent}%`;
  }
  if (outingSubtextEl) {
    outingSubtextEl.textContent = (pointsNeededNext === 5000 && outingsEarned > 0)
      ? '🏆 כל הכבוד! הגעתם ליעד! היעד הבא מתחיל עכשיו!'
      : `עוד ${pointsNeededNext.toLocaleString()} נק' ליציאה הבאה`;
  }
}

// עוזרי בדיקת משתמשים והרשאות
function isParent() {
  return state.currentUser === 'parent_amit' || state.currentUser === 'parent_tiferet';
}

function updateUserProfileStatusBar() {
  const statusBar = document.getElementById('userProfileStatusBar');
  const avatarEl = document.getElementById('userStatusAvatar');
  const nameEl = document.getElementById('userStatusName');
  
  if (state.currentUser) {
    if (statusBar) statusBar.style.display = 'flex';
    
    let avatar = '👤';
    let name = '';
    
    if (state.currentUser === 'parent_amit') {
      avatar = '👨';
      name = 'אבא עמית';
    } else if (state.currentUser === 'parent_tiferet') {
      avatar = '👩';
      name = 'אמא תפארת';
    } else {
      const child = state.children.find(c => c.id === state.currentUser);
      if (child) {
        avatar = child.icon;
        name = child.name;
      }
    }
    
    if (avatarEl) avatarEl.textContent = avatar;
    if (nameEl) nameEl.textContent = name;
  } else {
    if (statusBar) statusBar.style.display = 'none';
  }
}

window.selectProfile = function(userId) {
  try {
    if (userId.startsWith('parent_')) {
      state.tempSelectedUserId = userId;
      state.currentPIN = '';
      updatePinDots();
      const pinModal = document.getElementById('pinCodeModal');
      if (pinModal) pinModal.classList.add('active');
    } else {
      state.currentUser = userId;
      state.activeChildId = userId;
      localStorage.setItem('family_summer_active_user', userId);
      
      hidePortal();
      renderAll();
      
      const child = state.children.find(c => c.id === userId);
      showToast(`שלום ${child ? child.name : ''}! 👋`, 'success');
    }
  } catch (err) {
    console.error('Error selecting profile:', err);
    showToast(`שגיאה בבחירת פרופיל: ${err.message}`, 'error');
  }
};

window.closePinModal = function() {
  const pinModal = document.getElementById('pinCodeModal');
  if (pinModal) pinModal.classList.remove('active');
  state.tempSelectedUserId = null;
  state.currentPIN = '';
};

window.pressNum = function(num) {
  if (state.currentPIN.length < 6) {
    state.currentPIN += num;
    updatePinDots();
    
    if (state.currentPIN.length === 6) {
      if (state.currentPIN === '208000') {
        state.currentUser = state.tempSelectedUserId;
        localStorage.setItem('family_summer_active_user', state.currentUser);
        
        const pinModal = document.getElementById('pinCodeModal');
        if (pinModal) pinModal.classList.remove('active');
        
        hidePortal();
        
        state.activeChildId = 'hila';
        renderAll();
        
        const parentName = state.currentUser === 'parent_amit' ? 'אבא עמית' : 'אמא תפארת';
        showToast(`שלום ${parentName}! מנהל מחובר 🔑`, 'success');
      } else {
        showToast('קוד סודי שגוי, נסו שוב', 'error');
        window.clearPin();
      }
    }
  }
};

window.clearPin = function() {
  state.currentPIN = '';
  updatePinDots();
};

window.backspacePin = function() {
  if (state.currentPIN.length > 0) {
    state.currentPIN = state.currentPIN.slice(0, -1);
    updatePinDots();
  }
};

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('filled', index < state.currentPIN.length);
  });
}

window.logout = function() {
  state.currentUser = null;
  localStorage.removeItem('family_summer_active_user');
  
  showPortal();
  
  state.currentPIN = '';
  state.tempSelectedUserId = null;
  
  renderAll();
  showToast('התנתקתם בהצלחה', 'info');
};

// --- לוח ניקוד ומשימות ---
function renderScoreboard() {
  const dateKey = formatDateKey(state.currentDate);
  const childrenContainer = document.getElementById('childrenSelectorList');
  if (!childrenContainer) return;

  const hrEl = childrenContainer.previousElementSibling;
  const h3El = hrEl ? hrEl.previousElementSibling : null;
  if (isParent()) {
    childrenContainer.style.display = 'flex';
    if (hrEl) hrEl.style.display = 'block';
    if (h3El) h3El.style.display = 'block';
  } else {
    childrenContainer.style.display = 'none';
    if (hrEl) hrEl.style.display = 'none';
    if (h3El) h3El.style.display = 'none';
  }

  childrenContainer.innerHTML = '';
  state.children.forEach(child => {
    const points = calculateCumulativePoints(child.id);
    const btn = document.createElement('button');
    btn.className = `child-btn ${state.activeChildId === child.id ? 'active' : ''}`;
    btn.style.setProperty('--child-color', child.color);
    btn.style.setProperty('--child-bg-light', child.color + '18');
    btn.innerHTML = `
      <div class="child-avatar">${child.icon}</div>
      <div class="child-meta">
        <span class="child-name">${child.name}</span>
        <span class="child-sub">${child.grade}</span>
      </div>
      <span class="child-points-badge">${points} נק'</span>
    `;
    btn.addEventListener('click', () => {
      state.activeChildId = child.id;
      renderScoreboard();
    });
    childrenContainer.appendChild(btn);
  });

  const activeChild = state.children.find(c => c.id === state.activeChildId);
  if (!activeChild) return;

  const childColor = activeChild.color;
  const pane = document.getElementById('childDetailsPane');
  pane.style.setProperty('--child-color', childColor);
  pane.style.setProperty('--child-bg-light', childColor + '18');

  const childCumulativePoints = calculateCumulativePoints(activeChild.id);
  const childDayPoints = calculateDayPoints(activeChild.id, dateKey);
  
  const avatarEl = document.getElementById('selectedChildAvatar');
  const nameEl = document.getElementById('selectedChildName');
  const pointsEl = document.getElementById('selectedChildPoints');
  const dayPointsEl = document.getElementById('selectedChildDayPoints');
  
  if (avatarEl) avatarEl.textContent = activeChild.icon;
  if (nameEl) nameEl.textContent = `הישגים ${state.appMode === 'summer' ? 'לקיץ' : 'בשגרה'} - ${activeChild.name}`;
  if (pointsEl) pointsEl.textContent = `${childCumulativePoints} נקודות (סה"כ)`;
  if (dayPointsEl) dayPointsEl.textContent = `${childDayPoints} נקודות ביום זה`;

  // רנדור ארנק אישי
  renderChildWallet(activeChild);

  // 3. רנדור רשימת משימות ליום זה
  const scoresObj = getActiveScores();
  if (!scoresObj[dateKey]) {
    scoresObj[dateKey] = {};
  }
  if (!scoresObj[dateKey][activeChild.id]) {
    scoresObj[dateKey][activeChild.id] = { tasks: {}, custom: [] };
  }

  const childDayData = scoresObj[dateKey][activeChild.id];
  if (childDayData) {
    if (!childDayData.tasks) childDayData.tasks = {};
    if (!childDayData.custom) childDayData.custom = [];
  }

  const currentTasksData = getActiveTasks();

  // רנדור משימות יומיות
  const dailyTasksList = document.getElementById('dailyTasksList');
  if (dailyTasksList) {
    dailyTasksList.innerHTML = '';
    currentTasksData.daily.forEach(task => {
      const isCompleted = !!childDayData.tasks[task.id];
      const card = document.createElement('div');
      card.className = `task-item-card ${isCompleted ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="task-click-area">
          <div class="task-checkbox"></div>
          <span class="task-text">${task.icon} ${task.text}</span>
        </div>
        <span class="task-points-badge plus">+${task.points}</span>
      `;
      card.querySelector('.task-click-area').addEventListener('click', () => {
        toggleTask(dateKey, activeChild.id, task.id);
      });
      dailyTasksList.appendChild(card);
    });
  }

  // רנדור משימות בונוס
  const bonusTasksList = document.getElementById('bonusTasksList');
  if (bonusTasksList) {
    bonusTasksList.innerHTML = '';
    currentTasksData.bonus.forEach(task => {
      const isCompleted = !!childDayData.tasks[task.id];
      const card = document.createElement('div');
      card.className = `task-item-card ${isCompleted ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="task-click-area">
          <div class="task-checkbox"></div>
          <span class="task-text">${task.icon} ${task.text}</span>
        </div>
        <span class="task-points-badge plus" style="background:#f3f0ff; color:#7048e8;">+${task.points}</span>
      `;
      card.querySelector('.task-click-area').addEventListener('click', () => {
        toggleTask(dateKey, activeChild.id, task.id);
      });
      bonusTasksList.appendChild(card);
    });
  }

  // רנדור משימות שליליות (מורידות נקודות)
  const negativeTasksList = document.getElementById('negativeTasksList');
  if (negativeTasksList) {
    negativeTasksList.innerHTML = '';
    currentTasksData.negative.forEach(task => {
      const isCompleted = !!childDayData.tasks[task.id];
      const card = document.createElement('div');
      card.className = `task-item-card negative ${isCompleted ? 'completed negative' : ''}`;
      card.innerHTML = `
        <div class="task-click-area">
          <div class="task-checkbox"></div>
          <span class="task-text">${task.icon} ${task.text}</span>
        </div>
        <span class="task-points-badge minus">${task.points}</span>
      `;
      card.querySelector('.task-click-area').addEventListener('click', () => {
        toggleTask(dateKey, activeChild.id, task.id);
      });
      negativeTasksList.appendChild(card);
    });
  }

  // 4. רנדור היסטוריית נקודות ידניות להיום
  const customActionsHistory = document.getElementById('customActionsHistory');
  customActionsHistory.innerHTML = '';
  
  if (childDayData.custom && childDayData.custom.length > 0) {
    childDayData.custom.forEach(item => {
      const isPositive = item.points >= 0;
      const row = document.createElement('div');
      row.className = `history-item ${!isPositive ? 'negative' : ''}`;
      row.style.setProperty('--child-color', childColor);
      row.innerHTML = `
        <div>
          ${isParent() ? '<button class="btn-delete-history" title="מחק רישום זה">🗑️</button>' : ''}
          <span class="history-text">⭐ ${item.reason}</span>
        </div>
        <span class="history-value ${isPositive ? 'plus' : 'minus'}">${isPositive ? '+' : ''}${item.points} נק'</span>
      `;
      if (isParent()) {
        row.querySelector('.btn-delete-history').addEventListener('click', () => {
          deleteCustomPoints(dateKey, activeChild.id, item.id);
        });
      }
      customActionsHistory.appendChild(row);
    });
  } else {
    customActionsHistory.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:5px 0;">אין תוספות/הפחתות מיוחדות להיום</div>';
  }

  const customPointsCard = document.querySelector('.custom-points-card');
  if (customPointsCard) {
    customPointsCard.style.display = isParent() ? 'block' : 'none';
  }

  renderFamilySummaryBar();
}

// רנדור ארנק אישי לילד/ה
function renderChildWallet(activeChild) {
  const walletCard = document.getElementById('childWalletCard');
  if (!walletCard) return;

  const childId = activeChild.id;
  const totalPoints = calculateCumulativePoints(childId);
  const earnedMoney = totalPoints * 0.05; // 100 points = 5 NIS => 1 point = 0.05 NIS
  
  const childWallets = state.wallets[childId] || [];
  let givenMoney = 0;
  childWallets.forEach(item => {
    givenMoney += (parseFloat(item.amount) || 0);
  });
  
  const balance = earnedMoney - givenMoney;

  const childNameEl = document.getElementById('walletChildName');
  const totalPointsEl = document.getElementById('walletTotalPoints');
  const totalMoneyEl = document.getElementById('walletTotalMoney');
  const givenMoneyEl = document.getElementById('walletGivenMoney');
  const balanceMoneyEl = document.getElementById('walletBalanceMoney');

  if (childNameEl) childNameEl.textContent = activeChild.name;
  if (totalPointsEl) totalPointsEl.textContent = `${totalPoints.toLocaleString()} נק'`;
  if (totalMoneyEl) totalMoneyEl.textContent = `${earnedMoney.toFixed(1)} ₪`;
  if (givenMoneyEl) givenMoneyEl.textContent = `${givenMoney.toFixed(1)} ₪`;
  if (balanceMoneyEl) balanceMoneyEl.textContent = `${balance.toFixed(1)} ₪`;

  const parentActionsEl = document.getElementById('walletParentActions');
  if (parentActionsEl) {
    parentActionsEl.style.display = isParent() ? 'block' : 'none';
  }

  const historyEl = document.getElementById('walletHistory');
  if (historyEl) {
    historyEl.innerHTML = '';
    if (childWallets.length > 0) {
      childWallets.forEach(item => {
        const row = document.createElement('div');
        row.className = `history-item wallet-history-item ${item.amount < 0 ? 'negative' : ''}`;
        row.style.setProperty('--child-color', activeChild.color);
        row.innerHTML = `
          <div>
            ${isParent() ? `<button class="btn-delete-history" title="מחק" onclick="deleteWalletPayout('${childId}', '${item.id}')">🗑️</button>` : ''}
            <span class="history-text">💵 ${item.reason} (${item.date || ''})</span>
          </div>
          <span class="history-value ${item.amount > 0 ? 'minus' : 'plus'}">${item.amount > 0 ? '-' : '+'}${Math.abs(item.amount)} ₪</span>
        `;
        historyEl.appendChild(row);
      });
    } else {
      historyEl.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:5px 0;">אין היסטוריית מתן מזומן</div>';
    }
  }
}

// מתן מזומן / עדכון ארנק
function handleWalletPayoutSubmit(e) {
  e.preventDefault();
  const reasonInput = document.getElementById('walletReason');
  const amountInput = document.getElementById('walletAmount');
  
  if (!reasonInput || !amountInput) return;
  
  const reason = reasonInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const childId = state.activeChildId;

  if (!reason || isNaN(amount)) {
    showToast('נא להזין סיבה וסכום תקינים', 'error');
    return;
  }

  if (!state.wallets[childId]) state.wallets[childId] = [];

  const newItem = {
    id: 'wallet_' + Date.now(),
    date: formatDateKey(new Date()),
    reason,
    amount
  };

  state.wallets[childId].push(newItem);
  saveWallets();
  
  reasonInput.value = '';
  amountInput.value = '';

  renderScoreboard();
  const child = state.children.find(c => c.id === childId);
  showToast(`עודכן ארנק ל${child ? child.name : ''}: ${reason} (${amount} ₪)`, 'success');
}

window.deleteWalletPayout = function(childId, itemId) {
  if (state.wallets[childId]) {
    state.wallets[childId] = state.wallets[childId].filter(i => i.id !== itemId);
    saveWallets();
    renderScoreboard();
    showToast('הרישום נמחק מהארנק', 'info');
  }
};

// toggle משימה
function toggleTask(dateKey, childId, taskId) {
  const scoresObj = getActiveScores();
  if (!scoresObj[dateKey]) scoresObj[dateKey] = {};
  if (!scoresObj[dateKey][childId]) scoresObj[dateKey][childId] = { tasks: {}, custom: [] };
  
  const currentStatus = !!scoresObj[dateKey][childId].tasks[taskId];
  scoresObj[dateKey][childId].tasks[taskId] = !currentStatus;
  
  saveScores();
  renderScoreboard();
  
  const tasksData = getActiveTasks();
  let task = tasksData.daily.find(t => t.id === taskId) ||
             tasksData.bonus.find(t => t.id === taskId) ||
             tasksData.negative.find(t => t.id === taskId) ||
             DEFAULT_TASKS.daily.find(t => t.id === taskId) ||
             DEFAULT_TASKS.bonus.find(t => t.id === taskId) ||
             DEFAULT_TASKS.negative.find(t => t.id === taskId);
  const child = state.children.find(c => c.id === childId);
  
  if (task && child) {
    if (!currentStatus) {
      showToast(`סומן בהצלחה: ${task.text} ל${child.name} (${task.points > 0 ? '+' : ''}${task.points} נקודות)`, 'success');
    } else {
      showToast(`בוטל סימון: ${task.text} ל${child.name}`, 'info');
    }
  }
}

// הוספת נקודות ידנית
function handleCustomPointsSubmit(e) {
  e.preventDefault();
  const reasonInput = document.getElementById('customReason');
  const amountInput = document.getElementById('customAmount');
  
  if (!reasonInput || !amountInput) return;
  
  const reason = reasonInput.value.trim();
  const amount = parseInt(amountInput.value);
  const dateKey = formatDateKey(state.currentDate);
  const childId = state.activeChildId;

  if (!reason || isNaN(amount)) {
    showToast('נא להזין סיבה וניקוד תקינים', 'error');
    return;
  }

  const scoresObj = getActiveScores();
  if (!scoresObj[dateKey]) scoresObj[dateKey] = {};
  if (!scoresObj[dateKey][childId]) scoresObj[dateKey][childId] = { tasks: {}, custom: [] };

  const newItem = {
    id: 'custom_' + Date.now(),
    reason: reason,
    points: amount
  };

  scoresObj[dateKey][childId].custom.push(newItem);
  saveScores();
  
  reasonInput.value = '';
  amountInput.value = '';

  renderScoreboard();
  const child = state.children.find(c => c.id === childId);
  showToast(`נוסף רישום מיוחד ל${child ? child.name : ''}: ${reason} (${amount > 0 ? '+' : ''}${amount} נקודות)`, 'success');
}

// מחיקת רישום ידני
function deleteCustomPoints(dateKey, childId, itemId) {
  const scoresObj = getActiveScores();
  if (scoresObj[dateKey] && scoresObj[dateKey][childId] && scoresObj[dateKey][childId].custom) {
    scoresObj[dateKey][childId].custom = scoresObj[dateKey][childId].custom.filter(item => item.id !== itemId);
    saveScores();
    renderScoreboard();
    showToast('הרישום נמחק בהצלחה', 'info');
  }
}

// --- אזור 2: פעילויות ואירועים ---
function renderActivities() {
  const eventsContainer = document.getElementById('eventsGrid');
  if (!eventsContainer) return;

  const btnOpenActivityModal = document.getElementById('btnOpenActivityModal');
  if (btnOpenActivityModal) {
    btnOpenActivityModal.style.display = isParent() ? 'block' : 'none';
  }
  const filterChildEl = document.getElementById('filterChild');
  const filterChildGroup = filterChildEl ? filterChildEl.parentElement : null;
  if (filterChildGroup) {
    filterChildGroup.style.display = isParent() ? 'flex' : 'none';
  }

  const childFilter = isParent() ? (filterChildEl ? filterChildEl.value : 'all') : state.currentUser;
  const categoryFilter = document.getElementById('filterCategory').value;
  const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
  const dateTypeFilter = document.getElementById('filterDateType').value;
  const specificDateVal = document.getElementById('filterSpecificDate').value;

  const activeEventsList = getActiveEvents();

  // סינון הפעילויות מהמדינה
  const filteredEvents = activeEventsList.filter(event => {
    if (childFilter !== 'all') {
      if (!event.children.includes(childFilter)) return false;
    }

    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;

    if (searchQuery) {
      const matchTitle = event.title.toLowerCase().includes(searchQuery);
      const matchRequired = event.required && event.required.toLowerCase().includes(searchQuery);
      const matchNotes = event.notes && event.notes.toLowerCase().includes(searchQuery);
      if (!matchTitle && !matchRequired && !matchNotes) return false;
    }

    if (dateTypeFilter !== 'all') {
      const todayStr = formatDateKey(new Date());
      const eventDateStr = event.date;

      if (dateTypeFilter === 'today') {
        if (eventDateStr !== todayStr) return false;
      } else if (dateTypeFilter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDateKey(tomorrow);
        if (eventDateStr !== tomorrowStr) return false;
      } else if (dateTypeFilter === 'week') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);
        const eventDate = new Date(eventDateStr);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today || eventDate > nextWeek) return false;
      } else if (dateTypeFilter === 'month') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        nextMonth.setHours(23, 59, 59, 999);
        const eventDate = new Date(eventDateStr);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today || eventDate > nextMonth) return false;
      } else if (dateTypeFilter === 'specific') {
        if (specificDateVal && eventDateStr !== specificDateVal) return false;
      }
    }

    return true;
  });

  filteredEvents.sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.time.localeCompare(b.time);
  });

  const countEl = document.getElementById('activityCount');
  if (countEl) {
    countEl.textContent = `נמצאו ${filteredEvents.length} פעילויות`;
  }

  eventsContainer.innerHTML = '';
  if (filteredEvents.length === 0) {
    eventsContainer.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <h3>לא נמצאו פעילויות מתאימות</h3>
        <p>נסו לשנות את הגדרות הסינון או להוסיף פעילות חדשה.</p>
      </div>
    `;
    return;
  }

  filteredEvents.forEach(event => {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    let categoryName = 'פעילות';
    if (event.category === 'course') categoryName = 'קורס/חוג';
    if (event.category === 'medical') categoryName = 'תור רפואי';

    const eventDate = new Date(event.date);
    const hebDateStr = getHebrewDateString(eventDate);
    const gregDateStr = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(eventDate);
    const dayOfWeek = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(eventDate);

    let childrenBadgesHTML = '';
    event.children.forEach(childId => {
      const child = state.children.find(c => c.id === childId);
      if (child) {
        childrenBadgesHTML += `<span class="child-badge" style="background:${child.color}">${child.icon} ${child.name}</span>`;
      }
    });

    card.innerHTML = `
      <div class="event-category-stripe ${event.category}"></div>
      <div class="event-card-header">
        <h3 class="event-title">${event.title}</h3>
        <span class="event-type-badge ${event.category}">${categoryName}</span>
      </div>
      <div class="event-details-list">
        <div class="event-detail-item">
          <span class="icon">📅</span>
          <span><span class="label-strong">תאריך:</span> ${dayOfWeek}, ${gregDateStr} • <span style="color:#d35400; font-weight:500;">${hebDateStr}</span></span>
        </div>
        <div class="event-detail-item">
          <span class="icon">⏰</span>
          <span><span class="label-strong">שעות:</span> ${event.time}</span>
        </div>
        ${event.required ? `
        <div class="event-detail-item" style="align-items: flex-start;">
          <span class="icon">🎒</span>
          <span><span class="label-strong">ציון/ציוד נדרש:</span> ${event.required}</span>
        </div>
        ` : ''}
        ${event.notes ? `
        <div class="event-detail-item" style="align-items: flex-start;">
          <span class="icon">📝</span>
          <span><span class="label-strong">הערות:</span> ${event.notes}</span>
        </div>
        ` : ''}
        <div class="event-detail-item" style="margin-top:5px;">
          <span class="icon">👥</span>
          <div class="event-children-badges">${childrenBadgesHTML}</div>
        </div>
      </div>
      ${isParent() ? `
      <div class="event-card-footer">
        <button class="btn-icon delete" title="מחק פעילות" onclick="deleteEvent('${event.id}')">🗑️</button>
      </div>` : ''}
    `;
    eventsContainer.appendChild(card);
  });
}

// מחיקת אירוע
window.deleteEvent = function(eventId) {
  if (confirm('האם אתם בטוחים שברצונכם למחוק את הפעילות הזו?')) {
    const events = getActiveEvents();
    const updated = events.filter(e => e.id !== eventId);
    setActiveEvents(updated);
    saveEvents();
    renderActivities();
    showToast('הפעילות נמחקה בהצלחה', 'info');
  }
};

// הוספת פעילות חדשה דרך המודאל
function handleAddActivitySubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('actTitle').value.trim();
  const category = document.getElementById('actCategory').value;
  const date = document.getElementById('actDate').value;
  const time = document.getElementById('actTime').value.trim() || 'כל היום';
  const required = document.getElementById('actRequired').value.trim();
  const notes = document.getElementById('actNotes').value.trim();

  const selectedChildren = [];
  state.children.forEach(child => {
    const cb = document.getElementById(`act_child_${child.id}`);
    if (cb && cb.checked) {
      selectedChildren.push(child.id);
    }
  });

  if (!title || !date || selectedChildren.length === 0) {
    showToast('נא למלא שדה כותרת, תאריך ולבחור לפחות ילד אחד', 'error');
    return;
  }

  const newEvent = {
    id: 'event_' + Date.now(),
    title,
    category,
    date,
    time,
    required,
    notes,
    children: selectedChildren
  };

  const events = getActiveEvents();
  events.push(newEvent);
  saveEvents();
  
  e.target.reset();
  document.getElementById('activityModal').classList.remove('active');
  document.querySelectorAll('.checkbox-btn-label').forEach(lbl => lbl.classList.remove('checked'));

  renderActivities();
  showToast(`הפעילות "${title}" נוספה בהצלחה! 📅`, 'success');
}

// עיצוב דינמי לכפתורי בחירת ילדים במודאל
window.toggleFormChildCheckbox = function(labelElement, checkboxId) {
  const cb = document.getElementById(checkboxId);
  if (cb) {
    cb.checked = !cb.checked;
    labelElement.classList.toggle('checked', cb.checked);
  }
};

// --- אזור 3: רשימת קניות וציוד ---
function getCombinedShoppingItems(items) {
  const combined = {};
  items.forEach(item => {
    const key = item.title.trim().toLowerCase();
    if (!combined[key]) {
      combined[key] = {
        title: item.title,
        quantity: 0,
        boughtQuantity: 0,
        childrenList: [],
        category: item.category,
        notes: [],
        items: []
      };
    }
    
    const qty = parseInt(item.quantity) || 1;
    const bQty = parseInt(item.boughtQty) || 0;
    combined[key].quantity += qty;
    combined[key].boughtQuantity += bQty;
    
    if (!combined[key].childrenList.includes(item.child)) {
      combined[key].childrenList.push(item.child);
    }
    
    if (item.notes && item.notes.trim()) {
      combined[key].notes.push(item.notes.trim());
    }
    
    combined[key].items.push(item);
  });
  
  return Object.values(combined).map((c, index) => {
    const allBought = c.items.every(i => (parseInt(i.boughtQty) || 0) >= (parseInt(i.quantity) || 1));
    const uniqueNotes = [...new Set(c.notes)].join(' ; ');
    
    return {
      id: 'combined_' + index,
      title: c.title,
      quantity: c.quantity,
      boughtQuantity: c.boughtQuantity,
      child: c.childrenList.length === 1 ? c.childrenList[0] : 'all',
      childrenList: c.childrenList,
      category: c.category,
      bought: allBought,
      notes: uniqueNotes,
      constituentIds: c.items.map(i => i.id).join(',')
    };
  });
}

function renderShopping() {
  const shopContainer = document.getElementById('shoppingListContainer');
  if (!shopContainer) return;

  const sideFormCard = document.querySelector('.side-form-card');
  if (sideFormCard) sideFormCard.style.display = 'block';
  const shoppingLayout = document.querySelector('.shopping-layout');
  if (shoppingLayout) shoppingLayout.style.gridTemplateColumns = '2fr 1fr';
  
  const shopChildSelect = document.getElementById('shopChild');
  if (shopChildSelect) {
    if (isParent()) {
      shopChildSelect.disabled = false;
    } else {
      shopChildSelect.value = state.currentUser || 'all';
      shopChildSelect.disabled = true;
    }
  }

  const filterShopChildEl = document.getElementById('filterShopChild');
  if (filterShopChildEl) {
    filterShopChildEl.style.display = isParent() ? 'inline-block' : 'none';
  }

  const childFilter = isParent() ? (filterShopChildEl ? filterShopChildEl.value : 'union') : state.currentUser;
  const statusFilter = document.getElementById('filterShopStatus').value;

  const activeShoppingList = getActiveShopping();
  let displayItems = [];

  if (childFilter === 'union') {
    const combinedItems = getCombinedShoppingItems(activeShoppingList);
    displayItems = combinedItems.filter(item => {
      if (statusFilter !== 'all') {
        const isBought = statusFilter === 'bought';
        if (item.bought !== isBought) return false;
      }
      return true;
    });
  } else if (childFilter === 'all') {
    displayItems = activeShoppingList.filter(item => {
      if (statusFilter !== 'all') {
        const isBought = statusFilter === 'bought';
        if (item.bought !== isBought) return false;
      }
      return true;
    });
  } else {
    displayItems = activeShoppingList.filter(item => {
      if (item.child !== childFilter && item.child !== 'all') return false;
      if (statusFilter !== 'all') {
        const isBought = statusFilter === 'bought';
        if (item.bought !== isBought) return false;
      }
      return true;
    });
  }

  let totalCount = 0;
  let boughtCount = 0;
  displayItems.forEach(i => {
    const qty = parseInt(i.quantity) || 1;
    totalCount += qty;
    if (i.bought) {
      boughtCount += qty;
    } else if (typeof i.boughtQuantity === 'number') {
      boughtCount += i.boughtQuantity;
    } else if (typeof i.boughtQty === 'number') {
      boughtCount += i.boughtQty;
    }
  });

  const progressTextEl = document.getElementById('shoppingProgressText');
  if (progressTextEl) {
    progressTextEl.textContent = `נקנו ${boughtCount} מתוך ${totalCount} פריטים (${totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0}%)`;
  }

  shopContainer.innerHTML = '';
  if (displayItems.length === 0) {
    shopContainer.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text-muted);">
        <p>אין פריטים ברשימה התואמים לסינון הנוכחי.</p>
      </div>
    `;
    return;
  }

  displayItems.forEach(item => {
    const row = document.createElement('div');
    row.className = `shop-item-row ${item.bought ? 'bought' : ''}`;
    
    let badgesHTML = '';
    let childColor = 'var(--color-all)';
    
    if (item.childrenList && item.childrenList.length > 0) {
      item.childrenList.forEach(childId => {
        let name = 'כולם';
        let color = 'var(--color-all)';
        let icon = '👥';
        if (childId !== 'all') {
          const child = state.children.find(c => c.id === childId);
          if (child) {
            name = child.name;
            color = child.color;
            icon = child.icon;
          }
        }
        badgesHTML += `<span class="badge-child" style="background:${color}18; color:${color}; margin-left: 4px;">${icon} ל${name}</span>`;
      });
      if (item.childrenList.length === 1 && item.childrenList[0] !== 'all') {
        const child = state.children.find(c => c.id === item.childrenList[0]);
        if (child) childColor = child.color;
      }
    } else {
      let childName = 'כולם';
      let childColorForBadge = 'var(--color-all)';
      let childIcon = '👥';
      if (item.child !== 'all') {
        const child = state.children.find(c => c.id === item.child);
        if (child) {
          childName = child.name;
          childColor = child.color;
          childColorForBadge = child.color;
          childIcon = child.icon;
        }
      }
      badgesHTML = `<span class="badge-child" style="background:${childColorForBadge}18; color:${childColorForBadge}">${childIcon} ל${childName}</span>`;
    }

    const qty = parseInt(item.quantity) || 1;
    const bQty = item.constituentIds ? (parseInt(item.boughtQuantity) || 0) : (parseInt(item.boughtQty) || 0);
    const isFullyBought = bQty >= qty;
    const isPartiallyBought = bQty > 0 && bQty < qty;

    let checkboxContent = '';
    let checkboxBg = 'transparent';
    if (isFullyBought) {
      checkboxBg = childColor === 'var(--color-all)' ? 'var(--primary)' : childColor;
      checkboxContent = '<span style="color:white; font-size:0.75rem; font-weight:bold;">✓</span>';
    } else if (isPartiallyBought) {
      checkboxBg = childColor === 'var(--color-all)' ? 'var(--primary)80' : childColor + '80';
      checkboxContent = '<span style="color:white; font-size:0.85rem; font-weight:bold; line-height: 1;">•</span>';
    }

    const checkboxStyle = `border-radius:50%; width:24px; height:24px; border-color:${childColor}; background:${checkboxBg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;`;
    
    let stepperHTML = '';
    if (qty > 1) {
      const constituentIdsArg = item.constituentIds ? `'${item.constituentIds}'` : 'null';
      stepperHTML = `
        <div class="stepper-container" onclick="event.stopPropagation();">
          <button class="btn-step" onclick="adjustBoughtQty('${item.id}', -1, ${constituentIdsArg}, event)">-</button>
          <span class="step-value">${bQty} / ${qty}</span>
          <button class="btn-step" onclick="adjustBoughtQty('${item.id}', 1, ${constituentIdsArg}, event)">+</button>
        </div>
      `;
    }

    const onclickStr = item.constituentIds 
      ? `toggleShopItem('${item.id}', '${item.constituentIds}')`
      : `toggleShopItem('${item.id}')`;

    const deleteBtn = isParent() && !item.constituentIds
      ? `<div><button class="btn-icon delete" title="מחק פריט" onclick="deleteShopItem('${item.id}')">🗑️</button></div>`
      : '';

    row.innerHTML = `
      <div class="shop-item-info" onclick="${onclickStr}" style="cursor:pointer; display:flex; align-items:center; gap:12px; flex:1;">
        <div class="task-checkbox" style="${checkboxStyle}">${checkboxContent}</div>
        <div class="shop-item-details">
          <span class="shop-item-title">${item.title} ${qty > 1 && !item.constituentIds ? `<span class="quantity-badge" style="background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px;">כמות: ${qty}</span>` : ''}</span>
          <div class="shop-item-meta">
            ${badgesHTML}
            ${item.notes ? `<span>• ${item.notes}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        ${stepperHTML}
        ${deleteBtn}
      </div>
    `;
    
    shopContainer.appendChild(row);
  });
}

// התאמת כמות קנויה פריט פריט
window.adjustBoughtQty = function(itemId, delta, constituentIdsStr, event) {
  if (event) event.stopPropagation();
  const shoppingList = getActiveShopping();
  
  if (constituentIdsStr) {
    const ids = constituentIdsStr.split(',');
    const items = shoppingList.filter(i => ids.includes(i.id));
    if (items.length > 0) {
      if (delta > 0) {
        const target = items.find(i => (parseInt(i.boughtQty) || 0) < (parseInt(i.quantity) || 1));
        if (target) {
          target.boughtQty = (parseInt(target.boughtQty) || 0) + 1;
          target.bought = target.boughtQty >= (parseInt(target.quantity) || 1);
        }
      } else if (delta < 0) {
        const target = items.find(i => (parseInt(i.boughtQty) || 0) > 0);
        if (target) {
          target.boughtQty = (parseInt(target.boughtQty) || 0) - 1;
          target.bought = target.boughtQty >= (parseInt(target.quantity) || 1);
        }
      }
      saveShopping();
      renderShopping();
      const title = items[0].title;
      let totalBought = 0;
      let totalQty = 0;
      items.forEach(i => {
        totalBought += (parseInt(i.boughtQty) || 0);
        totalQty += (parseInt(i.quantity) || 1);
      });
      showToast(`עודכן: ${title} (${totalBought}/${totalQty})`, 'info');
    }
  } else {
    const item = shoppingList.find(i => i.id === itemId);
    if (item) {
      const qty = parseInt(item.quantity) || 1;
      let current = parseInt(item.boughtQty) || 0;
      current += delta;
      if (current < 0) current = 0;
      if (current > qty) current = qty;
      item.boughtQty = current;
      item.bought = current >= qty;
      
      saveShopping();
      renderShopping();
      showToast(`עודכן: ${item.title} (${item.boughtQty}/${item.quantity})`, 'info');
    }
  }
};

// שינוי סטטוס קנייה
window.toggleShopItem = function(itemId, constituentIdsStr) {
  const shoppingList = getActiveShopping();
  if (constituentIdsStr) {
    const ids = constituentIdsStr.split(',');
    const items = shoppingList.filter(i => ids.includes(i.id));
    if (items.length > 0) {
      const allBought = items.every(i => (parseInt(i.boughtQty) || 0) >= (parseInt(i.quantity) || 1));
      items.forEach(i => {
        const qty = parseInt(i.quantity) || 1;
        i.boughtQty = !allBought ? qty : 0;
        i.bought = !allBought;
      });
      saveShopping();
      renderShopping();
      const title = items[0].title;
      showToast(!allBought ? `סומן כ"נקנה": ${title} (לכולם)` : `סומן כ"צריך לקנות": ${title} (לכולם)`, 'info');
    }
  } else {
    const item = shoppingList.find(i => i.id === itemId);
    if (item) {
      const qty = parseInt(item.quantity) || 1;
      const fullyBought = (parseInt(item.boughtQty) || 0) >= qty;
      item.boughtQty = !fullyBought ? qty : 0;
      item.bought = !fullyBought;
      
      saveShopping();
      renderShopping();
      showToast(item.bought ? `סומן כ"נקנה": ${item.title}` : `סומן כ"צריך לקנות": ${item.title}`, 'info');
    }
  }
};

// מחיקת פריט קנייה
window.deleteShopItem = function(itemId) {
  const shoppingList = getActiveShopping();
  const item = shoppingList.find(i => i.id === itemId);
  if (item && confirm(`למחוק את "${item.title}" מרשימת הקניות?`)) {
    const updated = shoppingList.filter(i => i.id !== itemId);
    setActiveShopping(updated);
    saveShopping();
    renderShopping();
    showToast('הפריט נמחק מרשימת הקניות', 'info');
  }
};

// הוספת פריט קנייה חדש
function handleAddShopSubmit(e) {
  e.preventDefault();
  const titleInput = document.getElementById('shopTitle');
  const childSelect = document.getElementById('shopChild');
  const quantityInput = document.getElementById('shopQuantity');
  const notesInput = document.getElementById('shopNotes');

  if (!titleInput || !childSelect || !notesInput) return;

  const title = titleInput.value.trim();
  const child = childSelect.value;
  const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
  const notes = notesInput.value.trim();

  if (!title) {
    showToast('נא להזין שם מוצר לקנייה', 'error');
    return;
  }

  const newItem = {
    id: 'shop_' + Date.now(),
    title,
    child,
    quantity,
    boughtQty: 0,
    bought: false,
    notes
  };

  const shoppingList = getActiveShopping();
  shoppingList.push(newItem);
  saveShopping();

  titleInput.value = '';
  if (quantityInput) quantityInput.value = '1';
  notesInput.value = '';
  
  renderShopping();
  showToast(`הפריט "${title}" נוסף לרשימת הקניות 🛒`, 'success');
}

// --- הודעות קופצות (Toast) ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease-out reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
