'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PersonaForm from '@/components/PersonaForm';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// בדיקה סטטית אם אנחנו בסביבת לקוח
const isClient = typeof window !== 'undefined';

export default function NewChatPage() {
  // הוק השפה עם בדיקת מוכנות
  const { t, isReady } = useLanguage();
  const router = useRouter();
  
  // מצבים לטיפול בתהליך יצירת הצ'אט
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // רפרנס לטיפול באתחול יחיד
  const initialized = useRef(false);

  // בדיקת משתמש מחובר בטעינה הראשונית
  useEffect(() => {
    // שומר על אתחול יחיד
    if (initialized.current || !isClient || !isReady) return;
    
    const checkAuth = async () => {
      try {
        // סימון שאתחלנו
        initialized.current = true;
        
        // בדיקת משתמש מחובר
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session?.user) {
          // אם אין משתמש מחובר, מעבירים לדף ההתחברות
          setIsError(true);
          setErrorMessage('יש להתחבר כדי ליצור צ\'אט חדש');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          // המשתמש מחובר, ניתן להציג את הטופס
          setIsLoading(false);
        }
      } catch (error) {
        console.error('שגיאה בבדיקת אימות:', error);
        setIsError(true);
        setErrorMessage('התרחשה שגיאה בבדיקת אימות. נסה שוב מאוחר יותר.');
      }
    };
    
    // הפעלת בדיקת האימות כשהקונטקסט מוכן
    if (isReady) {
      checkAuth();
    }
  }, [router, isReady]);

  // טיפול בהצלחת יצירת צ'אט
  const handleSuccess = (chatId: string) => {
    // מעבירים לדף הצ'אט החדש
    router.push(`/chat/${chatId}`);
  };

  // תצוגת טעינה
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // תצוגת שגיאה
  if (isError) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-500">{errorMessage || t('error.general')}</p>
        </div>
      </div>
    );
  }

  // תצוגה רגילה של טופס יצירת צ'אט
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('form.create')} {t('dashboard.newChat')}</h1>
      <PersonaForm onSuccess={handleSuccess} />
    </div>
  );
} 