'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// בדיקה אם אנחנו בסביבת דפדפן
const isClient = typeof window !== 'undefined';

// יצירת קונטקסט ערכת נושא
type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isReady: boolean;
};

// ערכי ברירת מחדל לקונטקסט
const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  isReady: false,
});

// פונקציה בטוחה לקריאה מאחסון מקומי
const safeGetItem = (key: string): string | null => {
  if (!isClient) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('שגיאה בקריאה מאחסון מקומי:', error);
    return null;
  }
};

// פונקציה בטוחה לכתיבה לאחסון מקומי
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

// פונקציית עזר לעדכון מחלקות ה-HTML
const updateHtmlClasses = (() => {
  // נשמור מידע על העדכון האחרון למניעת עדכונים מיותרים
  let lastDarkMode: boolean | null = null;
  let lastUpdateTime = 0;
  
  return (isDark: boolean) => {
    if (!isClient) return;
    
    // מניעת עדכונים מיותרים
    const now = Date.now();
    if (lastDarkMode === isDark && now - lastUpdateTime < 300) return;
    
    // עדכון המידע על העדכון האחרון
    lastDarkMode = isDark;
    lastUpdateTime = now;
    
    try {
      // עדכון מחלקת HTML
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('שגיאה בעדכון מחלקות HTML:', error);
    }
  };
})();

export function ThemeProvider({ children }: { children: ReactNode }) {
  // מצב ערכת הנושא - תמיד מתחילים עם אותו ערך ברירת מחדל עבור SSR
  const [darkMode, setDarkMode] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const initialized = useRef(false);

  // החלפת מצב ערכת הנושא
  const toggleDarkMode = () => {
    if (!isClient || !isReady) return;
    
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // עדכון אחסון מקומי
    safeSetItem('theme', newMode ? 'dark' : 'light');
    
    // עדכון מחלקות HTML
    updateHtmlClasses(newMode);
  };

  // אתחול ראשוני של ערכת הנושא
  useEffect(() => {
    // בדיקה שאנחנו בצד הלקוח וטרם אתחלנו
    if (!isClient || initialized.current) return;
    
    // סימון שאתחלנו
    initialized.current = true;
    
    try {
      // בדיקת העדפת מצב כהה מהדפדפן
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // בדיקת העדפה שמורה באחסון מקומי
      const savedTheme = safeGetItem('theme');
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      
      // עדכון המצב
      setDarkMode(shouldBeDark);
      
      // עדכון מחלקות HTML
      updateHtmlClasses(shouldBeDark);
      
      // סימון שהקונטקסט מוכן
      setTimeout(() => {
        setIsReady(true);
      }, 100);
    } catch (error) {
      console.error('שגיאה באתחול ערכת נושא:', error);
      setIsReady(true); // במקרה של שגיאה, עדיין מסמנים כמוכן
    }
  }, []); // אין תלויות, רץ פעם אחת בלבד

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, isReady }}>
      {children}
    </ThemeContext.Provider>
  );
}

// הוק לשימוש בקונטקסט ערכת הנושא
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    console.error('useTheme חייב להיות בשימוש בתוך ThemeProvider');
    return {
      darkMode: false,
      toggleDarkMode: () => {},
      isReady: false
    };
  }
  
  return context;
} 