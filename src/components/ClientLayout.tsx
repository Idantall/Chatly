'use client';

import { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoadingIndicator } from './LoadingIndicator';

// בדיקה קבועה אם אנחנו בסביבת הדפדפן
const isClient = typeof window !== 'undefined';

/**
 * רכיב המטפל בבעיות הידרציה בין שרת ללקוח
 * ומונע שגיאות של "browser is not defined"
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // משתנה מצב לבדיקה האם הרכיב הורכב בצד הלקוח
  const [isMounted, setIsMounted] = useState(false);
  // נשתמש במשתנה מצב נוסף כדי לדעת מתי בדיוק לרנדר את התוכן
  const [isReady, setIsReady] = useState(false);
  
  // אפקט המופעל פעם אחת בלבד כאשר הרכיב מורכב
  useEffect(() => {
    if (isClient) {
      // סימון שהרכיב הורכב בצד הלקוח
      setIsMounted(true);
      
      // השהיה קטנה לפני הצגת התוכן כדי לאפשר למערכת להתייצב
      const readyTimer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      // ניקוי הטיימר כאשר הרכיב מוסר
      return () => clearTimeout(readyTimer);
    }
  }, []);
  
  // מחזירים שלד פשוט אם הרכיב לא הורכב עדיין (במצב SSR או כשהרכיב עוד לא מונט בלקוח)
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white text-black">
        {/* שלד פשוט שמתרנדר בצד השרת */}
      </div>
    );
  }
  
  // החזרת הרכיבים עם הפרובידרים רק כאשר אנחנו בצד הלקוח
  return (
    <ThemeProvider>
      <LanguageProvider>
        {!isReady ? (
          <LoadingIndicator />
        ) : (
          children
        )}
      </LanguageProvider>
    </ThemeProvider>
  );
} 