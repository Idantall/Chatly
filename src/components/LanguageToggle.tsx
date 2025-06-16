'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// בדיקה אם אנחנו בסביבת דפדפן
const isClient = typeof window !== 'undefined';

export default function LanguageToggle() {
  const { language, setLanguage, isReady, t } = useLanguage();
  // מצב לניהול תהליך שינוי השפה ומניעת לחיצות כפולות
  const [isChanging, setIsChanging] = useState(false);
  // מצב למעקב אחר טעינת הרכיב בדפדפן
  const [isMounted, setIsMounted] = useState(false);

  // סימון שהרכיב מותקן בדפדפן
  useEffect(() => {
    if (isClient) {
      setIsMounted(true);
    }
    return () => {
      // ניקוי בעת הסרת הרכיב
      setIsMounted(false);
    };
  }, []);
  
  // פונקציה לשינוי שפה עם ממואיזציה למניעת רינדור מיותר
  const toggleLanguage = useCallback(() => {
    // מניעת שינוי אם לא בדפדפן, אם הקונטקסט לא מוכן, אם הרכיב לא מותקן, או אם שינוי כבר מתבצע
    if (!isClient || !isReady || !isMounted || isChanging) return;
    
    // סימון שהתחלנו שינוי
    setIsChanging(true);
    
    try {
      // שינוי השפה בקונטקסט
      const newLanguage = language === 'he' ? 'en' : 'he';
      setLanguage(newLanguage);
    } catch (error) {
      console.error('שגיאה בהחלפת שפה:', error);
    }
    
    // הפעלת טיימר קצר לפני שמאפשרים שינוי חדש
    setTimeout(() => {
      setIsChanging(false);
    }, 500);
  }, [language, setLanguage, isReady, isChanging, isMounted]);

  // אם הרכיב לא מותקן או הקונטקסט לא מוכן, מחזירים div ריק למניעת בעיות הידרציה
  if (!isMounted || !isReady) {
    return <div className="language-toggle-placeholder w-16 h-8" />;
  }

  return (
    <button
      onClick={toggleLanguage}
      disabled={isChanging}
      aria-label={`${t('common.changeLanguageTo')} ${language === 'he' ? 'English' : 'עברית'}`}
      className={`
        language-toggle
        px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700
        text-white dark:text-gray-100 rounded
        transition-colors duration-200 rtl-sensitive
        ${isChanging ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      {isChanging ? (
        <span className="loading-dots">...</span>
      ) : (
        <span>{language === 'he' ? 'English' : 'עברית'}</span>
      )}
    </button>
  );
} 