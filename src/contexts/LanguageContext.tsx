'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

// בדיקה אם אנחנו בסביבת דפדפן
const isClient = typeof window !== 'undefined';

// שפות נתמכות
export const languages = ['he', 'en'] as const;
export type Language = typeof languages[number];

// מילון תרגומים בסיסי
const translations: Record<string, Record<string, string>> = {
  he: {
    'app.title': 'צ׳אטלי',
    'home.title': 'ברוכים הבאים לצ׳אטלי',
    'home.description': 'יצירה וניהול של שיחות עם בינה מלאכותית',
    'home.getStarted': 'התחל עכשיו',
    'home.login': 'התחברות',
    'common.noChats': 'אין לך שיחות עדיין',
    'common.createNewChat': 'צור שיחה חדשה כדי להתחיל',
    'common.step': 'שלב',
    'common.optional': 'אופציונלי',
    'common.changeLanguageTo': 'שנה שפה ל-',
    'common.loading': 'טוען...',
    'dashboard.title': 'הצ׳אטים שלי',
    'dashboard.newChat': 'צ׳אט חדש',
    'dashboard.noChats': 'אין לך צ׳אטים עדיין',
    'button.continue': 'המשך',
    'button.back': 'חזור',
    'button.create': 'צור',
    'button.creating': 'יוצר...',
    'button.logout': 'התנתק',
    'button.newChat': 'צ׳אט חדש',
    'button.startChat': 'התחל צ׳אט',
    'form.botName.label': 'שם הבוט',
    'form.apiKey.label': 'מפתח API (אופציונלי)',
    'form.role.label': 'תפקיד הבוט',
    'form.tone.label': 'טון הדיבור',
    'form.definingFor': 'הגדרת עבור',
    'persona.additionalInfo': 'מידע נוסף',
    'error.missingBotName': 'נא להזין שם לבוט',
    'error.missingRoleTone': 'נא להזין תפקיד וטון דיבור',
    'error.loginRequired': 'יש להתחבר כדי ליצור צ\'אט',
    'error.createChat': 'שגיאה ביצירת הצ\'אט',
    'error.createChatNoData': 'נתוני הצ\'אט לא התקבלו',
    'error.unexpected': 'שגיאה לא צפויה',
    'error.chatLoading': 'שגיאה בטעינת הצ׳אטים',
    'error.general': 'שגיאה כללית',
    'form.create': 'צור',
    'login.title': 'התחברות',
    'login.magicLink': 'התחברות עם קישור קסם',
    'login.otpExpired': 'הקישור פג תוקף או לא תקף. אנא בקש קישור חדש.',
    'login.email': 'אימייל',
    'login.password': 'סיסמה',
    'login.linkSent': 'קישור נשלח לאימייל שלך',
    'login.sendingLink': 'שולח קישור...',
    'login.loggingIn': 'מתחבר...',
    'login.sendLink': 'שלח קישור',
    'login.withPassword': 'התחבר עם סיסמה',
    'login.withMagicLink': 'התחבר עם קישור קסם',
    'login.noAccount': 'אין לך חשבון?',
    'login.register': 'הירשם',
    'register.title': 'הרשמה',
    'register.email': 'אימייל',
    'register.password': 'סיסמה',
    'register.registering': 'מתבצע רישום...',
    'register.sendingLink': 'שולח קישור...',
    'register.sendLink': 'שלח לי קישור',
    'register.withPassword': 'הרשמה עם סיסמה',
    'register.withMagicLink': 'הרשמה עם קישור קסם',
    'register.hasAccount': 'כבר יש לך חשבון?',
    'register.login': 'התחברות',
    'chat.untitled': 'צ׳אט ללא כותרת',
    'chat.openChat': '← פתח צ׳אט',
    'chat.created': 'נוצר',
    'footer.copyright': 'צ׳אטלי &copy; {year}',
    'toast.loginRequired': 'לא ניתן לשלוח הודעה. אנא התחבר מחדש.',
    'toast.apiKeyRequired': 'אנא הגדר מפתח API בהגדרות כדי לשלוח הודעות.',
    'toast.sendError': 'שגיאה בשליחת ההודעה שלך.',
    'toast.saveError': 'התקבלה תשובה מהבוט, אך נכשל בשמירה.',
    'toast.feedbackSaveError': 'שגיאה בשמירת המשוב.',
    'toast.feedbackSaved': 'משוב ({type}) נשמר!',
    'toast.editSaveError': 'שגיאה בשמירת העריכה.',
    'toast.editSaved': 'עריכה נשמרה!',
  },
  en: {
    'app.title': 'Chatly',
    'home.title': 'Welcome to Chatly',
    'home.description': 'Create and manage conversations with AI',
    'home.getStarted': 'Get Started',
    'home.login': 'Login',
    'common.noChats': 'You have no chats yet',
    'common.createNewChat': 'Create a new chat to get started',
    'common.step': 'Step',
    'common.optional': 'Optional',
    'common.changeLanguageTo': 'Change language to',
    'common.loading': 'Loading...',
    'dashboard.title': 'My Chats',
    'dashboard.newChat': 'New Chat',
    'dashboard.noChats': 'You have no chats yet',
    'button.continue': 'Continue',
    'button.back': 'Back',
    'button.create': 'Create',
    'button.creating': 'Creating...',
    'button.logout': 'Logout',
    'button.newChat': 'New Chat',
    'button.startChat': 'Start Chat',
    'form.botName.label': 'Bot Name',
    'form.apiKey.label': 'API Key (Optional)',
    'form.role.label': 'Bot Role',
    'form.tone.label': 'Tone of Voice',
    'form.definingFor': 'Defining for',
    'persona.additionalInfo': 'Additional Information',
    'error.missingBotName': 'Please enter a bot name',
    'error.missingRoleTone': 'Please enter role and tone',
    'error.loginRequired': 'You must be logged in to create a chat',
    'error.createChat': 'Error creating chat',
    'error.createChatNoData': 'Chat data not received',
    'error.unexpected': 'Unexpected error',
    'error.chatLoading': 'Error loading chats',
    'error.general': 'General error',
    'form.create': 'Create',
    'login.title': 'Login',
    'login.magicLink': 'Login with Magic Link',
    'login.otpExpired': 'The link has expired or is invalid. Please request a new one.',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.linkSent': 'A link has been sent to your email',
    'login.sendingLink': 'Sending link...',
    'login.loggingIn': 'Logging in...',
    'login.sendLink': 'Send Link',
    'login.withPassword': 'Login with Password',
    'login.withMagicLink': 'Login with Magic Link',
    'login.noAccount': 'Don\'t have an account?',
    'login.register': 'Register',
    'register.title': 'Register',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.registering': 'Registering...',
    'register.sendingLink': 'Sending link...',
    'register.sendLink': 'Send Link',
    'register.withPassword': 'Register with Password',
    'register.withMagicLink': 'Register with Magic Link',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Login',
    'chat.untitled': 'Untitled Chat',
    'chat.openChat': '← Open Chat',
    'chat.created': 'Created',
    'footer.copyright': 'Chatly &copy; {year}',
    'toast.loginRequired': 'Cannot send message. Please log in again.',
    'toast.apiKeyRequired': 'Please set up an API key in settings to send messages.',
    'toast.sendError': 'Error sending your message.',
    'toast.saveError': 'Received response from bot, but failed to save.',
    'toast.feedbackSaveError': 'Error saving feedback.',
    'toast.feedbackSaved': 'Feedback ({type}) saved!',
    'toast.editSaveError': 'Error saving edit.',
    'toast.editSaved': 'Edit saved!',
  },
};

type LanguageContextType = {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  isReady: boolean;
  t: (key: string) => string;
};

// ערכי ברירת מחדל לקונטקסט השפה
const defaultContext: LanguageContextType = {
  language: 'he', // שפת ברירת מחדל עבור SSR
  dir: 'rtl',
  setLanguage: () => {},
  isReady: false,
  t: (key: string) => key,
};

// יצירת קונטקסט השפה
const LanguageContext = createContext<LanguageContextType>(defaultContext);

// פונקציה לקריאה בטוחה מאחסון מקומי
const safeGetItem = (key: string): string | null => {
  if (!isClient) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('שגיאה בקריאה מאחסון מקומי:', error);
    return null;
  }
};

// פונקציה לכתיבה בטוחה לאחסון מקומי
const safeSetItem = (key: string, value: string): boolean => {
  if (!isClient) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('שגיאה בכתיבה לאחסון מקומי:', error);
    return false;
  }
};

// פונקציה לעדכון תכונות ה-HTML לפי השפה
const setHtmlAttributes = (() => {
  // נשמור מידע על העדכון האחרון למניעת עדכונים מיותרים
  let lastLanguage: Language | null = null;
  let lastUpdateTime = 0;

  return (lang: Language) => {
    if (!isClient) return;
    
    // מניעת עדכונים מיותרים
    const now = Date.now();
    if (lastLanguage === lang && now - lastUpdateTime < 300) return;
    
    // עדכון המידע על העדכון האחרון
    lastLanguage = lang;
    lastUpdateTime = now;
    
    try {
      // הוספת מחלקת מעבר למניעת הבהובים
      document.documentElement.classList.add('language-transition');
      
      // עדכון תכונות HTML
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
      
      // הסרת מחלקת המעבר אחרי השינוי
      setTimeout(() => {
        document.documentElement.classList.remove('language-transition');
      }, 300);
    } catch (error) {
      console.error('שגיאה בעדכון תכונות HTML:', error);
    }
  };
})();

// ספק הקונטקסט
export function LanguageProvider({ children }: { children: ReactNode }) {
  // מצב השפה - תמיד מתחילים עם ערך ברירת מחדל אחיד עבור SSR
  const [language, setLanguageState] = useState<Language>('he');
  const [isReady, setIsReady] = useState(false);
  const initialized = useRef(false);

  // חישוב כיוון הטקסט המתאים לשפה
  const dir = language === 'he' ? 'rtl' : 'ltr';

  // פונקציית תרגום עם טיפול בשגיאות
  const t = (key: string): string => {
    // החזרת המפתח עצמו אם השפה לא מוכנה עדיין
    if (!isReady) return key;
    
    try {
      // גישה בטוחה לתרגומים
      const langTranslations = translations[language];
      if (!langTranslations) return key;
      
      return langTranslations[key] || key;
    } catch (error) {
      console.error('שגיאה בתרגום:', error);
      return key;
    }
  };

  // פונקציה להגדרת השפה
  const setLanguage = (lang: Language) => {
    // וידוא תקינות השפה ושהמערכת מוכנה
    if (!isClient || !isReady || !languages.includes(lang)) return;
    
    // עדכון המצב והאחסון המקומי רק אם השפה שונה מהקיימת
    if (language !== lang) {
      setLanguageState(lang);
      safeSetItem('language', lang);
      setHtmlAttributes(lang);
    }
  };

  // אתחול ראשוני של השפה
  useEffect(() => {
    // בדיקה שאנחנו בצד הלקוח וטרם אתחלנו
    if (!isClient || initialized.current) return;
    
    // סימון שאתחלנו
    initialized.current = true;
    
    try {
      // בדיקת שפה שמורה באחסון מקומי
      const savedLanguage = safeGetItem('language');
      
      // אם יש שפה שמורה ותקפה, נשתמש בה
      if (savedLanguage && languages.includes(savedLanguage as Language)) {
        const lang = savedLanguage as Language;
        setLanguageState(lang);
        setHtmlAttributes(lang);
      } else {
        // אחרת נגדיר את שפת ברירת המחדל
        setHtmlAttributes('he');
      }
      
      // סימון שהקונטקסט מוכן
      setTimeout(() => {
        setIsReady(true);
      }, 100);
    } catch (error) {
      console.error('שגיאה באתחול שפה:', error);
      setIsReady(true); // במקרה של שגיאה, עדיין מסמנים כמוכן
    }
  }, []); // אין תלויות, רץ פעם אחת בלבד

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, isReady, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// הוק לשימוש בקונטקסט השפה
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    console.error('useLanguage חייב להיות בשימוש בתוך LanguageProvider');
    return defaultContext;
  }
  
  return context;
} 