'use client'; // Required for using hooks like useState, useRouter

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Register() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [useMagicLink, setUseMagicLink] = useState(false);

  // בדיקת קישוריות בסיסית ל-Supabase
  useEffect(() => {
    async function checkSupabaseConnectivity() {
      try {
        // בדיקה פשוטה של קישוריות ל-Supabase
        const { data, error } = await supabase.from('chats').select('count').limit(1);
        
        if (error) {
          console.error('שגיאת קישוריות Supabase:', error);
          setApiStatus(`שגיאת קישוריות: ${error.message}`);
        } else {
          console.log('קישוריות Supabase תקינה:', data);
          setApiStatus('מחובר בהצלחה ל-Supabase');
        }
      } catch (err) {
        console.error('שגיאה כללית בבדיקת קישוריות:', err);
        setApiStatus(`שגיאת קישוריות: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
      }
    }

    checkSupabaseConnectivity();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      console.log('התחלת תהליך הרשמה עם:', email);
      
      // נסה להתחבר ישירות ל-API של Supabase עם אפשרויות מורחבות
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          // Add data object here if needed
          data: {
            full_name: email.split('@')[0], // לדוגמה, שימוש בשם המשתמש מהאימייל
          }
        }
      });
      
      console.log('תשובת Supabase:', { data, error });
      
      if (error) {
        console.error('שגיאת הרשמה:', error);
        
        // אם נכשל, ננסה עם דרך חלופית של בקשת fetch ישירה
        if (error.message.includes('fetch') || error.message.includes('network')) {
          console.log('מנסה שיטת רישום חלופית...');
          await directSignUp();
        } else {
          setError(error.message);
        }
      } else {
        // Registration successful
        console.log('הרשמה הושלמה בהצלחה');
        setSuccess('רישום בוצע בהצלחה! אנא בדוק את האימייל שלך לאישור החשבון.');
        // Wait 3 seconds before redirecting to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('שגיאת הרשמה לא צפויה:', err);
      
      // אם היתה שגיאה כללית, ננסה את שיטת הגיבוי
      try {
        console.log('מנסה שיטת רישום חלופית אחרי שגיאה...');
        await directSignUp();
      } catch (backupErr) {
        console.error('גם שיטת הגיבוי נכשלה:', backupErr);
        setError('כל ניסיונות ההרשמה נכשלו. אנא נסה שוב מאוחר יותר.');
      }
    } finally {
      setLoading(false);
    }
  };

  // פונקציית גיבוי - שימוש ב-fetch ישירות ל-API של Supabase
  const directSignUp = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trpdjsqnkztibrdjfjwi.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGRqc3Fua3p0aWJyZGpmandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODA1NzksImV4cCI6MjA2MjU1NjU3OX0.sy8SKBUc7fzFdA2V1dl-fRAarByKNSDcSHSM-yJmVPY';
    
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'X-Client-Info': 'supabase-js/2.39.7',
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: email.split('@')[0] },
          gotrue_meta_security: {},
          redirect_to: `${window.location.origin}/login`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('שגיאת API ישירה:', errorData);
        throw new Error(errorData.error || 'שגיאה לא ידועה');
      }
      
      const data = await response.json();
      console.log('הרשמה ישירה הצליחה:', data);
      
      setSuccess('רישום בוצע בהצלחה! אנא בדוק את האימייל שלך לאישור החשבון.');
      // Wait 3 seconds before redirecting to login
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
      return data;
    } catch (err) {
      console.error('שגיאה בהרשמה ישירה:', err);
      throw err;
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      console.log('שולח קישור קסם לאימייל:', email);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        console.error('שגיאת שליחת קישור קסם:', error);
        setError(error.message);
      } else {
        setSuccess('קישור התחברות נשלח לאימייל שלך. אנא בדוק את תיבת הדואר שלך.');
      }
    } catch (err) {
      console.error('שגיאה לא צפויה בשליחת קישור קסם:', err);
      setError('אירעה שגיאה לא צפויה. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900">
      <form onSubmit={useMagicLink ? handleMagicLink : handleRegister} className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-5 text-center text-gray-900 dark:text-gray-100">
          {useMagicLink ? t('register.withMagicLink') : t('register.title')}
        </h2>
        
        {apiStatus && (
          <div className={`mb-4 p-2 rounded ${apiStatus.includes('שגיאה') ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`}>
            {apiStatus}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <input
          type="email" required placeholder={t('register.email')}
          className="mb-3 w-full p-2 rounded border bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        
        {!useMagicLink && (
          <input
            type="password" required placeholder={t('register.password')} minLength={6}
            className="mb-4 w-full p-2 rounded border bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={password} onChange={e => setPassword(e.target.value)}
          />
        )}
        
        {error && <p className="text-red-500 text-sm mb-3" dir="rtl">{error}</p>}
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 mb-3" 
          disabled={loading || success !== ''}
        >
          {loading 
            ? (useMagicLink ? t('register.sendingLink') : t('register.registering')) 
            : (useMagicLink ? t('register.sendLink') : t('register.title'))}
        </button>
        
        <button 
          type="button"
          onClick={() => {
            setUseMagicLink(!useMagicLink);
            setError('');
            setSuccess('');
          }}
          className="w-full border border-gray-400 bg-transparent py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 mb-3"
        >
          {useMagicLink ? t('register.withPassword') : t('register.withMagicLink')}
        </button>
        
        <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-300" dir="rtl">
          {t('register.hasAccount')} <Link href="/login" className="underline hover:text-blue-500">{t('register.login')}</Link>
        </p>
      </form>
    </main>
  );
} 