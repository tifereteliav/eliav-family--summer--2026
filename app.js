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
  currentDate: new Date(), // תאריך היום כברירת מחדל
  activeChildId: 'hila',
  activeTab: 'scoreboard',
  children: [],
  events: [],
  shopping: [],
  scores: {},
  currentUser: null,
  currentPIN: '',
  tempSelectedUserId: null
};

// אתחול האפליקציה
document.addEventListener('DOMContentLoaded', () => {
  initData();
  setupEventListeners();
  updateDateDisplay();
  renderAll();
  setupFirebaseSync(); // סנכרון ענן בזמן אמת
  showToast('האפליקציה נטענה בהצלחה! ☀️', 'success');
});

// טעינת נתונים או אתחולם מנתוני ברירת המחדל ב-data.js
function initData() {
  // ילדים
  const savedChildren = localStorage.getItem('family_summer_children');
  if (savedChildren) {
    state.children = JSON.parse(savedChildren);
  } else {
    state.children = INITIAL_CHILDREN;
    localStorage.setItem('family_summer_children', JSON.stringify(INITIAL_CHILDREN));
  }

  // פעילויות / אירועים
  const savedEvents = localStorage.getItem('family_summer_events');
  if (savedEvents) {
    state.events = JSON.parse(savedEvents);
  } else {
    state.events = INITIAL_EVENTS;
    localStorage.setItem('family_summer_events', JSON.stringify(INITIAL_EVENTS));
  }

  // רשימת קניות
  const savedShopping = localStorage.getItem('family_summer_shopping');
  if (savedShopping) {
    state.shopping = JSON.parse(savedShopping);
  } else {
    state.shopping = INITIAL_SHOPPING;
    localStorage.setItem('family_summer_shopping', JSON.stringify(INITIAL_SHOPPING));
  }

  // נקודות ומשימות - מנגנון טעינה וסנכרון בטוח
  const currentScoresVersion = '1.2';
  const savedVersion = localStorage.getItem('family_summer_scores_version');
  const savedScores = localStorage.getItem('family_summer_scores');
  
  if (savedScores) {
    try {
      state.scores = JSON.parse(savedScores);
    } catch (e) {
      state.scores = {};
    }
  } else {
    // אתחול ראשוני רק אם אין נתונים בכלל
    state.scores = {
      '2026-07-06': {
        'moriah': {
          tasks: {},
          custom: [
            { id: 'init_moriah', reason: 'נקודות פתיחה', points: 30 },
            { id: 'restore_moriah', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 180 }
          ]
        },
        'ariel': {
          tasks: {},
          custom: [{ id: 'restore_ariel', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 107 }]
        },
        'hila': {
          tasks: {},
          custom: [{ id: 'restore_hila', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 184 }]
        },
        'shira': {
          tasks: {},
          custom: [{ id: 'restore_shira', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 30 }]
        },
        'talia': {
          tasks: {},
          custom: [{ id: 'restore_talia', reason: 'שחזור נקודות שהוכנסו ונמחקו', points: 20 }]
        }
      }
    };
  }

  // עדכון גרסה מקומי ב-localStorage ללא דריסת הנתונים הקיימים
  if (savedVersion !== currentScoresVersion) {
    localStorage.setItem('family_summer_scores_version', currentScoresVersion);
  }

  // משתמש פעיל
  const savedUser = localStorage.getItem('family_summer_active_user');
  const portal = document.getElementById('profileSelectionPortal');
  if (savedUser) {
    state.currentUser = savedUser;
    if (savedUser !== 'parent_amit' && savedUser !== 'parent_tiferet') {
      state.activeChildId = savedUser;
    }
    if (portal) portal.classList.remove('active');
  } else {
    state.currentUser = null;
    if (portal) portal.classList.add('active');
  }
}

// שמירת נתונים בענן (Firebase) ובגיבוי מקומי
function saveScores() {
  localStorage.setItem('family_summer_scores', JSON.stringify(state.scores));
  db.collection('family_data').doc('scores').set({ scores: state.scores })
    .catch(err => console.error("שגיאה בשמירת ניקוד לענן:", err));
}

function saveEvents() {
  localStorage.setItem('family_summer_events', JSON.stringify(state.events));
  db.collection('family_data').doc('events').set({ events: state.events })
    .catch(err => console.error("שגיאה בשמירת אירועים לענן:", err));
}

function saveShopping() {
  localStorage.setItem('family_summer_shopping', JSON.stringify(state.shopping));
  db.collection('family_data').doc('shopping').set({ shopping: state.shopping })
    .catch(err => console.error("שגיאה בשמירת קניות לענן:", err));
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
  // 1. מאזין לניקוד ומשימות
  db.collection('family_data').doc('scores').onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const remoteScores = data.scores || {};
      
      // מיזוג נתונים מקומיים עם נתוני הענן
      const mergedScores = mergeScores(state.scores, remoteScores);
      
      // בדיקה האם יש הבדל בין המיזוג לנתוני הענן. אם כן, נעדכן את הענן
      if (JSON.stringify(mergedScores) !== JSON.stringify(remoteScores)) {
        db.collection('family_data').doc('scores').set({ scores: mergedScores })
          .catch(err => console.error("שגיאה בשמירת ניקוד מעודכן לענן:", err));
      }
      
      // עדכון ה-state וה-localStorage בנתונים הממוזגים
      state.scores = mergedScores;
      localStorage.setItem('family_summer_scores', JSON.stringify(mergedScores));
      renderAll();
    } else {
      // אם אין מסמך בענן בכלל, נשמור את הניקוק המקומי הקיים לענן
      saveScores();
    }
  }, (error) => {
    console.error("שגיאה בסנכרון ניקוד:", error);
  });

  // 2. מאזין לפעילויות ואירועים
  db.collection('family_data').doc('events').onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      state.events = data.events || [];
      renderAll();
    } else {
      // אם אין מסמך בענן, נשמור את האירועים המקומיים לענן
      saveEvents();
    }
  }, (error) => {
    console.error("שגיאה בסנכרון אירועים:", error);
  });

  // 3. מאזין לרשימת קניות
  db.collection('family_data').doc('shopping').onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      state.shopping = data.shopping || [];
      renderAll();
    } else {
      // אם אין מסמך בענן, נשמור את הקניות המקומיות לענן
      saveShopping();
    }
  }, (error) => {
    console.error("שגיאה בסנכרון קניות:", error);
  });
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
    // מנקה תווים בלתי נראים ומתקן את תצוגת הגרשיים
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

// מאזיני אירועים
function setupEventListeners() {
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

// חישוב ניקוד מצטבר לילד
function calculateCumulativePoints(childId) {
  let total = 0;
  for (const dateKey in state.scores) {
    const dayScores = state.scores[dateKey][childId];
    if (dayScores) {
      // משימות חיוביות
      if (dayScores.tasks) {
        for (const taskId in dayScores.tasks) {
          if (dayScores.tasks[taskId]) {
            // מצא את הניקוד של המשימה מתוך data.js
            let task = DEFAULT_TASKS.daily.find(t => t.id === taskId) ||
                       DEFAULT_TASKS.bonus.find(t => t.id === taskId) ||
                       DEFAULT_TASKS.negative.find(t => t.id === taskId);
            if (task) total += task.points;
          }
        }
      }
      // נקודות ידניות
      if (dayScores.custom) {
        dayScores.custom.forEach(item => {
          total += item.points;
        });
      }
    }
  }
  return total;
}

// חישוב ניקוד משפחתי כולל
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

// בר עדכון סיכום משפחתי
function renderFamilySummaryBar() {
  const { totalPoints } = getFamilyTotals();
  const familyPointsEl = document.getElementById('familyTotalPoints');
  if (familyPointsEl) familyPointsEl.textContent = totalPoints.toLocaleString() + ' נק\'';
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
  if (userId.startsWith('parent_')) {
    state.tempSelectedUserId = userId;
    state.currentPIN = '';
    updatePinDots();
    const pinModal = document.getElementById('pinCodeModal');
    if (pinModal) pinModal.classList.add('active');
  } else {
    // התחברות כילד
    state.currentUser = userId;
    state.activeChildId = userId;
    localStorage.setItem('family_summer_active_user', userId);
    
    const portal = document.getElementById('profileSelectionPortal');
    if (portal) portal.classList.remove('active');
    
    renderAll();
    
    const child = state.children.find(c => c.id === userId);
    showToast(`שלום ${child ? child.name : ''}! 👋`, 'success');
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
        
        const portal = document.getElementById('profileSelectionPortal');
        if (portal) portal.classList.remove('active');
        
        state.activeChildId = 'hila'; // ברירת מחדל
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
  
  const portal = document.getElementById('profileSelectionPortal');
  if (portal) portal.classList.add('active');
  
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

  // 1. רנדור רשימת הילדים (צד ימין / למעלה במובייל)
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
    btn.style.setProperty('--child-bg-light', child.color + '18'); // שקיפות של 10%
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

  // 2. עדכון כרטיס המידע של הילד הנבחר
  const activeChild = state.children.find(c => c.id === state.activeChildId);
  if (!activeChild) return;

  const childColor = activeChild.color;
  const pane = document.getElementById('childDetailsPane');
  pane.style.setProperty('--child-color', childColor);
  pane.style.setProperty('--child-bg-light', childColor + '18');

  // כותרת והישגים לילד
  const childCumulativePoints = calculateCumulativePoints(activeChild.id);
  
  const avatarEl = document.getElementById('selectedChildAvatar');
  const nameEl = document.getElementById('selectedChildName');
  const pointsEl = document.getElementById('selectedChildPoints');
  
  if (avatarEl) avatarEl.textContent = activeChild.icon;
  if (nameEl) nameEl.textContent = `הישגים לקיץ - ${activeChild.name}`;
  if (pointsEl) pointsEl.textContent = `${childCumulativePoints} נקודות`;

  // 3. רנדור רשימת משימות ליום זה
  if (!state.scores[dateKey]) {
    state.scores[dateKey] = {};
  }
  if (!state.scores[dateKey][activeChild.id]) {
    state.scores[dateKey][activeChild.id] = { tasks: {}, custom: [] };
  }

  const childDayData = state.scores[dateKey][activeChild.id];
  if (childDayData) {
    if (!childDayData.tasks) childDayData.tasks = {};
    if (!childDayData.custom) childDayData.custom = [];
  }

  // רנדור משימות יומיות
  const dailyTasksList = document.getElementById('dailyTasksList');
  if (dailyTasksList) {
    dailyTasksList.innerHTML = '';
    DEFAULT_TASKS.daily.forEach(task => {
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
    DEFAULT_TASKS.bonus.forEach(task => {
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
    DEFAULT_TASKS.negative.forEach(task => {
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

  // הסתרת טופס הוספת נקודות של הורה לילדים
  const customPointsCard = document.querySelector('.custom-points-card');
  if (customPointsCard) {
    customPointsCard.style.display = isParent() ? 'block' : 'none';
  }

  // עדכון סך הכל המשפחתי בבר העליון
  renderFamilySummaryBar();
}

// toggle משימה
function toggleTask(dateKey, childId, taskId) {
  if (!state.scores[dateKey]) state.scores[dateKey] = {};
  if (!state.scores[dateKey][childId]) state.scores[dateKey][childId] = { tasks: {}, custom: [] };
  
  const currentStatus = !!state.scores[dateKey][childId].tasks[taskId];
  state.scores[dateKey][childId].tasks[taskId] = !currentStatus;
  
  saveScores();
  renderScoreboard();
  
  // הודעה
  let task = DEFAULT_TASKS.daily.find(t => t.id === taskId) ||
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

  if (!state.scores[dateKey]) state.scores[dateKey] = {};
  if (!state.scores[dateKey][childId]) state.scores[dateKey][childId] = { tasks: {}, custom: [] };

  const newItem = {
    id: 'custom_' + Date.now(),
    reason: reason,
    points: amount
  };

  state.scores[dateKey][childId].custom.push(newItem);
  saveScores();
  
  // איפוס טופס
  reasonInput.value = '';
  amountInput.value = '';

  renderScoreboard();
  const child = state.children.find(c => c.id === childId);
  showToast(`נוסף רישום מיוחד ל${child.name}: ${reason} (${amount > 0 ? '+' : ''}${amount} נקודות)`, 'success');
}

// מחיקת רישום ידני
function deleteCustomPoints(dateKey, childId, itemId) {
  if (state.scores[dateKey] && state.scores[dateKey][childId] && state.scores[dateKey][childId].custom) {
    state.scores[dateKey][childId].custom = state.scores[dateKey][childId].custom.filter(item => item.id !== itemId);
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

  // סינון הפעילויות מהמדינה
  const filteredEvents = state.events.filter(event => {
    // 1. סינון לפי ילד
    if (childFilter !== 'all') {
      if (!event.children.includes(childFilter)) return false;
    }

    // 2. סינון לפי קטגוריה
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;

    // 3. סינון לפי חיפוש חופשי (כותרת, ציוד או הערות)
    if (searchQuery) {
      const matchTitle = event.title.toLowerCase().includes(searchQuery);
      const matchRequired = event.required && event.required.toLowerCase().includes(searchQuery);
      const matchNotes = event.notes && event.notes.toLowerCase().includes(searchQuery);
      if (!matchTitle && !matchRequired && !matchNotes) return false;
    }

    // 4. סינון לפי תאריכים
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
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const eventDate = new Date(eventDateStr);
        if (eventDate < today || eventDate > nextWeek) return false;
      } else if (dateTypeFilter === 'specific') {
        if (specificDateVal && eventDateStr !== specificDateVal) return false;
      }
    }

    return true;
  });

  // מיון לפי תאריך ושעה
  filteredEvents.sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.time.localeCompare(b.time);
  });

  // עדכון מונה אירועים
  const countEl = document.getElementById('activityCount');
  if (countEl) {
    countEl.textContent = `נמצאו ${filteredEvents.length} פעילויות`;
  }

  // רנדור
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
    
    // קביעת כותרת קטגוריה בעברית
    let categoryName = 'פעילות';
    if (event.category === 'course') categoryName = 'קורס/חוג';
    if (event.category === 'medical') categoryName = 'תור רפואי';

    // המרת התאריך לעברית ולועזית יפה
    const eventDate = new Date(event.date);
    const hebDateStr = getHebrewDateString(eventDate);
    const gregDateStr = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(eventDate);
    const dayOfWeek = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(eventDate);

    // תגיות ילדים משתתפים
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
    state.events = state.events.filter(e => e.id !== eventId);
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

  // קריאת הילדים שנבחרו בתיבות הסימון
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

  state.events.push(newEvent);
  saveEvents();
  
  // איפוס הטופס וסגירת המודאל
  e.target.reset();
  // סגירת מודאל
  document.getElementById('activityModal').classList.remove('active');
  // איפוס עיצוב כפתורי הילדים בטופס
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
function renderShopping() {
  const shopContainer = document.getElementById('shoppingListContainer');
  if (!shopContainer) return;

  // הסתרת טופס הוספה והתאמת גריד
  const sideFormCard = document.querySelector('.side-form-card');
  if (sideFormCard) {
    sideFormCard.style.display = isParent() ? 'block' : 'none';
  }
  const shoppingLayout = document.querySelector('.shopping-layout');
  if (shoppingLayout) {
    shoppingLayout.style.gridTemplateColumns = isParent() ? '2fr 1fr' : '1fr';
  }
  const filterShopChildEl = document.getElementById('filterShopChild');
  if (filterShopChildEl) {
    filterShopChildEl.style.display = isParent() ? 'inline-block' : 'none';
  }

  const childFilter = isParent() ? (filterShopChildEl ? filterShopChildEl.value : 'all') : state.currentUser;
  const statusFilter = document.getElementById('filterShopStatus').value;

  const filteredItems = state.shopping.filter(item => {
    // 1. סינון לפי ילד
    if (childFilter !== 'all') {
      if (item.child !== childFilter && item.child !== 'all') return false;
    }
    // 2. סינון לפי סטטוס
    if (statusFilter !== 'all') {
      const isBought = statusFilter === 'bought';
      if (item.bought !== isBought) return false;
    }
    return true;
  });

  // רנדור מד התקדמות לקניות
  const totalItems = filteredItems.length;
  const boughtItems = filteredItems.filter(i => i.bought).length;
  const progressTextEl = document.getElementById('shoppingProgressText');
  if (progressTextEl) {
    progressTextEl.textContent = `נקנו ${boughtItems} מתוך ${totalItems} פריטים (${totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0}%)`;
  }

  // רנדור רשימה
  shopContainer.innerHTML = '';
  if (filteredItems.length === 0) {
    shopContainer.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text-muted);">
        <p>אין פריטים ברשימה התואמים לסינון הנוכחי.</p>
      </div>
    `;
    return;
  }

  filteredItems.forEach(item => {
    const row = document.createElement('div');
    row.className = `shop-item-row ${item.bought ? 'bought' : ''}`;
    
    // זיהוי שם הילד והצבע שלו
    let childName = 'כולם';
    let childColor = 'var(--color-all)';
    let childIcon = '👥';
    if (item.child !== 'all') {
      const child = state.children.find(c => c.id === item.child);
      if (child) {
        childName = child.name;
        childColor = child.color;
        childIcon = child.icon;
      }
    }

    row.innerHTML = `
      <div class="shop-item-info" onclick="toggleShopItem('${item.id}')" style="cursor:pointer;">
        <div class="task-checkbox" style="border-radius:50%; width:24px; height:24px; border-color:${childColor};"></div>
        <div class="shop-item-details">
          <span class="shop-item-title">${item.title}</span>
          <div class="shop-item-meta">
            <span class="badge-child" style="background:${childColor}18; color:${childColor}">${childIcon} ל${childName}</span>
            ${item.notes ? `<span>• ${item.notes}</span>` : ''}
          </div>
        </div>
      </div>
      ${isParent() ? `
      <div>
        <button class="btn-icon delete" title="מחק פריט" onclick="deleteShopItem('${item.id}')">🗑️</button>
      </div>` : ''}
    `;
    
    // אם כבר נקנה, סמן וי בתיבה
    if (item.bought) {
      row.querySelector('.task-checkbox').style.background = childColor;
      row.querySelector('.task-checkbox').innerHTML = '<span style="color:white; font-size:0.75rem; font-weight:bold;">✓</span>';
    }

    shopContainer.appendChild(row);
  });
}

// שינוי סטטוס קנייה
window.toggleShopItem = function(itemId) {
  const item = state.shopping.find(i => i.id === itemId);
  if (item) {
    item.bought = !item.bought;
    saveShopping();
    renderShopping();
    showToast(item.bought ? `סומן כ"נקנה": ${item.title}` : `סומן כ"צריך לקנות": ${item.title}`, 'info');
  }
};

// מחיקת פריט קנייה
window.deleteShopItem = function(itemId) {
  const item = state.shopping.find(i => i.id === itemId);
  if (item && confirm(`למחוק את "${item.title}" מרשימת הקניות?`)) {
    state.shopping = state.shopping.filter(i => i.id !== itemId);
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
  const notesInput = document.getElementById('shopNotes');

  if (!titleInput || !childSelect || !notesInput) return;

  const title = titleInput.value.trim();
  const child = childSelect.value;
  const notes = notesInput.value.trim();

  if (!title) {
    showToast('נא להזין שם מוצר לקנייה', 'error');
    return;
  }

  const newItem = {
    id: 'shop_' + Date.now(),
    title,
    child,
    bought: false,
    notes
  };

  state.shopping.push(newItem);
  saveShopping();

  // איפוס
  titleInput.value = '';
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

  // מחיקה אוטומטית לאחר 3.5 שניות
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease-out reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
