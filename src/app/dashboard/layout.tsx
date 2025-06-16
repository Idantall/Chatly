'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// בדיקה אם אנחנו בסביבת דפדפן
const isClient = typeof window !== 'undefined';

// מניעת רינדור מרובה באמצעות דגל גלובלי
let authCheckInProgress = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // אפקט למעקב אחר המאונט הראשוני
  useEffect(() => {
    if (isClient) {
      setMounted(true);
    }
  }, []);

  // בדיקת אימות רק בצד הלקוח ורק פעם אחת
  useEffect(() => {
    // יש לבצע את בדיקת האימות רק אם הרכיב מאונטד ובסביבת דפדפן
    if (!isClient || !mounted || authCheckInProgress) return;
    
    // סימון שהבדיקה החלה למניעת בדיקות כפולות
    authCheckInProgress = true;
    
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          console.log('אין משתמש מחובר בלייאוט של הדשבורד, מעביר לדף הכניסה');
          router.push('/login');
          return;
        }
        
        // המשתמש מחובר, אפשר להציג את הדף
        setAuthenticated(true);
      } catch (error) {
        console.error('שגיאה בבדיקת אימות בלייאוט של הדשבורד:', error);
      } finally {
        // איפוס הדגל בסוף הבדיקה
        authCheckInProgress = false;
      }
    };
    
    checkAuth();
  }, [router, mounted]);

  // פונקציה להתנתקות
  const handleLogout = async () => {
    if (!isClient) return;
    
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('שגיאה בהתנתקות:', error);
    }
  };

  // אם עדיין לא מאונטד, נחזיר שלד בסיסי למניעת שגיאות הידרציה
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <header className="bg-blue-600 dark:bg-blue-800 text-white p-4">
          <div className="h-7"></div>
        </header>
        <div className="container mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/4 mb-4 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* כותרת עליונה */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">{t('app.title')}</h1>
        
        <div className="flex items-center gap-4">
          <LanguageToggle />
          
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded transition-colors"
          >
            {t('button.logout')}
          </button>
        </div>
      </header>
      
      {/* תוכן הדף */}
      <div className="container mx-auto p-4" dir={dir}>
        {authenticated ? children : (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/4 mb-4 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
          </div>
        )}
      </div>
      
      {/* כותרת תחתונה */}
      <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4 text-center text-sm border-t border-gray-200 dark:border-gray-700">
        <p>{t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}</p>
      </footer>
    </div>
  );
} 