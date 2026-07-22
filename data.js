// נתוני ברירת המחדל עבור אפליקציית הקיץ של משפחת אליאב 2026

const INITIAL_CHILDREN = [
  { id: 'hila', name: 'הילה', age: 10, grade: 'כיתה ד', icon: '👧', color: '#ff6b6b' },
  { id: 'moriah', name: 'מוריה', age: 8, grade: 'כיתה ג', icon: '🌸', color: '#f06595' },
  { id: 'ariel', name: 'אריאל', age: 7, grade: 'כיתה א', icon: '👦', color: '#4dabf7' },
  { id: 'shira', name: 'שירה', age: 4, grade: 'גן', icon: '☀️', color: '#fcc419' },
  { id: 'talia', name: 'טליה', age: 2, grade: 'מעון', icon: '👶', color: '#51cf66' }
];

const DEFAULT_TASKS = {
  daily: [
    { id: 'wake_up', text: 'לקום בזמן בבוקר', points: 1, icon: '⏰' },
    { id: 'wash_hands', text: 'ליטול ידיים של בוקר', points: 1, icon: '💧' },
    { id: 'brush_morning', text: 'לצחצוח שיניים בבוקר', points: 1, icon: '🪥' },
    { id: 'prayer', text: 'תפילת בוקר', points: 1, icon: '📖' },
    { id: 'clear_breakfast', text: 'פינוי ארוחת בוקר', points: 1, icon: '🍽️' },
    { id: 'exercise', text: 'התעמלות בוקר', points: 1, icon: '🏃' },
    { id: 'learn', text: 'לימוד', points: 1, icon: '📚' },
    { id: 'clear_lunch', text: 'פינוי ארוחת צהרים', points: 1, icon: '🍲' },
    { id: 'clear_dinner', text: 'פינוי ארוחת ערב', points: 1, icon: '🥣' },
    { id: 'shower_time', text: 'מקלחת בזמן', points: 2, icon: '🚿' },
    { id: 'bed_time', text: 'לעלות למיטה בזמן בערב', points: 2, icon: '🛌' },
    { id: 'brush_night', text: 'לצחצוח שיניים לפני השינה', points: 1, icon: '🪥' }
  ],
  bonus: [
    { id: 'wash_dishes', text: 'לשטוף כלים', points: 5, icon: '🧽' },
    { id: 'fold_laundry', text: 'לקפל כביסה', points: 5, icon: '👕' },
    { id: 'unload_dishwasher', text: 'לפנות את המדיח', points: 5, icon: '🍽️' },
    { id: 'load_dishwasher', text: 'להכניס כלים למדיח', points: 5, icon: '🍽️' },
    { id: 'run_washer', text: 'להפעיל מכונת כביסה', points: 5, icon: '🧼' },
    { id: 'unload_dryer', text: 'לפנות את המייבש', points: 5, icon: '💨' },
    { id: 'take_down_laundry', text: 'להוריד כביסה', points: 5, icon: '🧺' },
    { id: 'sweep_floor', text: 'לטאטא את הריצפה', points: 5, icon: '🧹' },
    { id: 'tidy_morning', text: 'לסדר את הבית בבוקר', points: 5, icon: '🏠' },
    { id: 'tidy_noon', text: 'לסדר את הבית בצהרים', points: 5, icon: '🏠' },
    { id: 'tidy_night', text: 'לסדר את הבית בערב', points: 5, icon: '🏠' },
    { id: 'throw_trash', text: 'לשפוך אשפה', points: 5, icon: '🗑️' },
    { id: 'babysit', text: 'לשמור על שירה וטליה', points: 5, icon: '👶' },
    { id: 'bathe_kids', text: 'לקלח את שירה וטליה', points: 5, icon: '🛀' },
    { id: 'cook_meal_dessert', text: 'להכין ארוחה או קינוח כולל לנקות אחרי ולשטוף כלים', points: 5, icon: '🍳' },
    { id: 'water_plants', text: 'להשקות עציצים', points: 2, icon: '🪴' },
    { id: 'dress_kids', text: 'להלביש את שירה וטליה אחרי המקלחת או בבוקר', points: 5, icon: '👚' },
    { id: 'put_kids_to_bed', text: 'להשכיב את שירה וטליה לישון', points: 5, icon: '🛏️' },
    { id: 'unpack_groceries', text: 'לסדר קניות/להרים את הקניות מהאוטו', points: 5, icon: '🛍️' }
  ],
  negative: [
    { id: 'screaming', text: 'צעקות', points: -15, icon: '🗣️' },
    { id: 'fights', text: 'מריבות והצקות', points: -15, icon: '⚡' },
    { id: 'screens', text: 'חריגה מזמן מסכים', points: -15, icon: '📱' },
    { id: 'disobedience', text: 'חוסר הקשבה או ויכוח', points: -15, icon: '🙉' }
  ]
};

const INITIAL_EVENTS = [
  // הילה ומוריה - בריכה בקייטנה (6.7, 12.7, 16.7)
  {
    id: 'pool_hm_1',
    title: 'בריכה בקייטנה',
    date: '2026-07-06',
    time: '08:00 - 13:00',
    category: 'activity',
    children: ['hila', 'moriah'],
    required: 'בגד ים, מגבת, כובע ים, משקפת, קרם הגנה, בקבוק מים גדול, בגדי החלפה',
    notes: 'איסוף והחזרה כרגיל מהקייטנה. לא לשכוח כובע שמש!'
  },
  {
    id: 'pool_hm_2',
    title: 'בריכה בקייטנה',
    date: '2026-07-12',
    time: '08:00 - 13:00',
    category: 'activity',
    children: ['hila', 'moriah'],
    required: 'בגד ים, מגבת, כובע ים, משקפת, קרם הגנה, בקבוק מים גדול, בגדי החלפה',
    notes: 'יום בריכה שני בקייטנה.'
  },
  {
    id: 'pool_hm_3',
    title: 'בריכה בקייטנה',
    date: '2026-07-16',
    time: '08:00 - 13:00',
    category: 'activity',
    children: ['hila', 'moriah'],
    required: 'בגד ים, מגבת, כובע ים, משקפת, קרם הגנה, בקבוק מים גדול, בגדי החלפה',
    notes: 'יום בריכה שלישי בקייטנה.'
  },
  // אריאל - בריכה בקייטנה (9.7, 14.7)
  {
    id: 'pool_a_1',
    title: 'בריכה בקייטנה',
    date: '2026-07-09',
    time: '08:00 - 13:00',
    category: 'activity',
    children: ['ariel'],
    required: 'בגד ים, מגבת, כובע ים, משקפת, קרם הגנה, מים',
    notes: 'יום בריכה ראשון של אריאל בקייטנה.'
  },
  {
    id: 'pool_a_2',
    title: 'בריכה בקייטנה',
    date: '2026-07-14',
    time: '08:00 - 13:00',
    category: 'activity',
    children: ['ariel'],
    required: 'בגד ים, מגבת, כובע ים, משקפת, קרם הגנה, מים',
    notes: 'יום בריכה שני של אריאל בקייטנה.'
  },
  // אריאל - קורס שחייה (6.7, 7.7, 9.7, 13.7, 14.7, 16.7, 20.7, 21.7)
  {
    id: 'swim_a_1',
    title: 'קורס שחייה - שיעור 1',
    date: '2026-07-06',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'תחילת הקורס! להגיע 10 דקות לפני הזמן ללבוש בגד ים.'
  },
  {
    id: 'swim_a_2',
    title: 'קורס שחייה - שיעור 2',
    date: '2026-07-07',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור שחייה שני.'
  },
  {
    id: 'swim_a_3',
    title: 'קורס שחייה - שיעור 3',
    date: '2026-07-09',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור שחייה שלישי.'
  },
  {
    id: 'swim_a_4',
    title: 'קורס שחייה - שיעור 4',
    date: '2026-07-13',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור שחייה רביעי.'
  },
  {
    id: 'swim_a_5',
    title: 'קורס שחייה - שיעור 5',
    date: '2026-07-14',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור שחייה חמישי.'
  },
  {
    id: 'swim_a_6',
    title: 'קורס שחייה - שיעור 6',
    date: '2026-07-16',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור שחייה שישי.'
  },
  {
    id: 'swim_a_7',
    title: 'קורס שחייה - שיעור 7',
    date: '2026-07-20',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור שחייה שביעי.'
  },
  {
    id: 'swim_a_8',
    title: 'קורס שחייה - שיעור 8 (אחרון)',
    date: '2026-07-21',
    time: '13:00 - 13:45',
    category: 'course',
    children: ['ariel'],
    required: 'בגד ים, משקפת שחייה, כובע ים, מגבת, כפכפים',
    notes: 'שיעור סיום וחלוקת תעודות!'
  },
  // תורים רפואיים
  {
    id: 'med_eye_1',
    title: 'תור לרופא עיניים',
    date: '2026-08-10',
    time: '09:30 - 10:30',
    category: 'medical',
    children: ['shira', 'talia', 'ariel'],
    required: 'כרטיסים מגנטיים של קופת חולים, פנקס חיסונים/טיפת חלב',
    notes: 'בדיקת ראייה שגרתית לשלושת הילדים: שירה, טליה ואריאל. אצל ד"ר לוי.'
  }
];

const INITIAL_SHOPPING = [
  // --- אריאל ---
  { id: 'shop_ariel_1', title: 'נעלי ספורט', child: 'ariel', quantity: 1, category: 'clothing', bought: false, notes: 'חינוך גופני: ביגוד חובה לשיעורים' },
  { id: 'shop_ariel_2', title: 'מכנס קצר או טרנינג', child: 'ariel', quantity: 1, category: 'clothing', bought: false, notes: 'חינוך גופני: ביגוד חובה לשיעורים' },
  { id: 'shop_ariel_3', title: 'מחברות עברית חכמות לכיתה ב\'', child: 'ariel', quantity: 7, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_ariel_4', title: 'מחברת חשבון 40 דף', child: 'ariel', quantity: 2, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_ariel_5', title: 'קלסר פוליו עם טבעות לדפי עבודה', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'מחברות' },
  { id: 'shop_ariel_6', title: 'חוצצים מבריסטול', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'מחברות' },
  { id: 'shop_ariel_7', title: 'עפרון', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_8', title: 'מחק', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_9', title: 'מחדד', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_10', title: 'מספריים', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_11', title: '6 צבעים או לורדים', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_12', title: 'מרקר בצבע צהוב', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_13', title: 'סרגל', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_14', title: 'דבק סטיק', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד' },
  { id: 'shop_ariel_15', title: 'מפית לתיק אוכל', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'תיק אוכל' },
  { id: 'shop_ariel_16', title: 'מגבת לתיק אוכל', child: 'ariel', quantity: 1, category: 'equipment', bought: false, notes: 'תיק אוכל' },

  // --- הילה ---
  { id: 'shop_hila_1', title: 'סידור תפילה', child: 'hila', quantity: 1, category: 'books', bought: false, notes: 'הציוד הנדרש' },
  { id: 'shop_hila_2', title: 'תנ"ך', child: 'hila', quantity: 1, category: 'books', bought: false, notes: 'הציוד הנדרש' },
  { id: 'shop_hila_3', title: 'מחברת עברית שורה אחת 40 דף', child: 'hila', quantity: 20, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_hila_4', title: 'מחברת חשבון 40 דף', child: 'hila', quantity: 2, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_hila_5', title: 'מחברת אנגלית גאונית', child: 'hila', quantity: 1, category: 'books', bought: false, notes: 'מי שיש בידה משנה שעברה לא צריכה' },
  { id: 'shop_hila_6', title: 'עפרון', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'עפרונות / עפרון חודים + חודים' },
  { id: 'shop_hila_7', title: 'מחק', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_hila_8', title: 'מחדד', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_hila_9', title: 'סרגל', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_hila_10', title: 'דבק סטיק קטן', child: 'hila', quantity: 5, category: 'equipment', bought: false, notes: 'מומלץ לקנות 5 קטנים כדי שלא יתייבש, אבל יספיק לכל השנה' },
  { id: 'shop_hila_11', title: 'מספריים', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_hila_12', title: 'טושים', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'צבעים' },
  { id: 'shop_hila_13', title: 'מרקרים בצבעים שונים', child: 'hila', quantity: 5, category: 'equipment', bought: false, notes: 'צבעים' },
  { id: 'shop_hila_14', title: 'חב\' ניילוניות', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד משרדי' },
  { id: 'shop_hila_15', title: 'קלסר', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד משרדי' },
  { id: 'shop_hila_16', title: 'דפדפות עברית', child: 'hila', quantity: 1, category: 'equipment', bought: false, notes: 'נייר' },
  { id: 'shop_hila_17', title: 'יומן שנתי עם תאריכים בגודל A5', child: 'hila', quantity: 1, category: 'books', bought: false, notes: 'ההולם את דרכו החינוכית של בית הספר' },

  // --- מוריה ---
  { id: 'shop_moriah_1', title: 'מחברת עברית 14 שורות 40 דף', child: 'moriah', quantity: 20, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_moriah_2', title: 'מחברת חשבון 40 דף', child: 'moriah', quantity: 2, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_moriah_3', title: 'מחברת אנגלית גאונית', child: 'moriah', quantity: 1, category: 'books', bought: false, notes: 'מחברות' },
  { id: 'shop_moriah_4', title: 'תיקייה שקופה', child: 'moriah', quantity: 4, category: 'equipment', bought: false, notes: 'תיקיות שקופות' },
  { id: 'shop_moriah_5', title: 'מספריים', child: 'moriah', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_moriah_6', title: 'דבק סטיק גדול', child: 'moriah', quantity: 3, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_moriah_7', title: 'דבק נוזלי', child: 'moriah', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_moriah_8', title: 'סרגל', child: 'moriah', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד כתיבה' },
  { id: 'shop_moriah_9', title: 'מרקרים בצבעים שונים', child: 'moriah', quantity: 5, category: 'equipment', bought: false, notes: 'צבעים' },
  { id: 'shop_moriah_10', title: 'חב\' ניילוניות', child: 'moriah', quantity: 1, category: 'equipment', bought: false, notes: 'ציוד משרדי' },
  { id: 'shop_moriah_11', title: 'יומן שנתי עם תאריכים בגודל A5', child: 'moriah', quantity: 1, category: 'books', bought: false, notes: 'ההולם את דרכו החינוכית של בית הספר' },
  { id: 'shop_moriah_12', title: 'סידור תפילה', child: 'moriah', quantity: 1, category: 'books', bought: false, notes: 'הציוד הנדרש' }
];
