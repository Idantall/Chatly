'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // עדכון מצב ה-mount בטעינה
  useEffect(() => {
    setIsMounted(true);
    console.log('LoginForm mounted');
  }, []);

  // Check for auth errors in URL
  useEffect(() => {
    if (!isMounted) return;
    
    const errorDescription = searchParams.get('error_description');
    if (errorDescription) {
      console.error('שגיאת אימות התקבלה בניתוב:', errorDescription);
      if (errorDescription.includes('OTP') || errorDescription.includes('expired')) {
        setError(t('login.otpExpired') || 'The magic link has expired or is invalid. Please request a new one.');
      } else {
        setError(errorDescription);
      }
    }
  }, [searchParams, t, isMounted]);

  // בדיקת מצב אימות בטעינה
  useEffect(() => {
    if (!isMounted) return;
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('בדיקת מצב אימות בעת טעינת דף ההתחברות:', session ? 'מחובר' : 'לא מחובר');
        
        if (session) {
          console.log('המשתמש כבר מחובר, מעביר לדף הבקרה');
          // מעביר ישר לדף הבקרה בלי לעשות רענון
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('שגיאה בבדיקת מצב האימות:', error);
      }
    };
    
    checkAuth();
  }, [isMounted, router]);

  // Handle standard login with email and password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('מנסה להתחבר עם אימייל:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('תוצאת התחברות:', error ? 'שגיאה' : 'הצלחה', data?.session ? 'יש מושב' : 'אין מושב');

      if (error) {
        console.error('שגיאת התחברות:', error.message);
        setError(error.message);
      } else if (data?.session) {
        console.log('התחברות הצליחה, מעביר לדף הבקרה');
        // ניתוב תוך שימוש ב-router במקום לעשות רענון ישיר
        router.push('/dashboard');
      } else {
        console.error('התחברות הצליחה אבל לא התקבל מושב');
        setError('Login succeeded but no session was created. Please try again.');
      }
    } catch (e) {
      console.error('שגיאה לא צפויה בתהליך ההתחברות:', e);
      setError(`Unexpected error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle magic link login
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('שולח קישור קסם לאימייל:', email);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('שגיאה בשליחת קישור קסם:', error.message);
        setError(error.message);
      } else {
        console.log('קישור קסם נשלח בהצלחה');
        setMagicLinkSent(true);
      }
    } catch (e) {
      console.error('שגיאה לא צפויה בשליחת קישור קסם:', e);
      setError(`Unexpected error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle debug mode to show extra information
  const toggleDebug = () => {
    setDebugMode(!debugMode);
  };

  // כדי למנוע בעיות הידרציה, לא מציגים את הרכיב עד שהוא מונטה בצד הלקוח
  if (!isMounted) {
    return null; // לא מציג שום דבר בזמן הטעינה כדי למנוע את הריבוע האפור
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900 relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      
      <div className="absolute top-4 left-4">
        <button 
          onClick={toggleDebug} 
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {debugMode ? 'Hide Debug' : 'Debug'}
        </button>
      </div>
      
      {debugMode && (
        <div className="absolute bottom-4 left-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-xs border border-gray-300 rounded max-h-40 overflow-auto">
          <p>Current language: {language}</p>
          <p>URL params: {Array.from(searchParams.entries()).map(([k,v]) => `${k}=${v}`).join(', ') || 'none'}</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p>Browser info: {typeof window !== 'undefined' ? navigator.userAgent : 'Not available'}</p>
        </div>
      )}
      
      <form onSubmit={useMagicLink ? handleMagicLink : handleLogin} className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-5 text-center text-gray-900 dark:text-gray-100">
          {useMagicLink ? t('login.magicLink') : t('login.title')}
        </h2>
        
        {magicLinkSent && (
          <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
            {t('login.linkSent')}
          </div>
        )}
        
        <input
          type="email" required placeholder={t('login.email')}
          className="mb-3 w-full p-2 rounded border bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        
        {!useMagicLink && (
          <input
            type="password" required placeholder={t('login.password')}
            className="mb-4 w-full p-2 rounded border bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={password} onChange={e => setPassword(e.target.value)}
          />
        )}
        
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        
        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 mb-3" disabled={loading || magicLinkSent}>
          {loading 
            ? (useMagicLink ? t('login.sendingLink') : t('login.loggingIn')) 
            : (useMagicLink ? t('login.sendLink') : t('login.title'))}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setUseMagicLink(!useMagicLink);
            setError('');
            setMagicLinkSent(false);
          }}
          className="w-full border border-gray-400 bg-transparent py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 mb-3"
        >
          {useMagicLink ? t('login.withPassword') : t('login.withMagicLink')}
        </button>
        
        <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-300">
          {t('login.noAccount')} <Link href="/register" className="underline hover:text-blue-500">{t('login.register')}</Link>
        </p>
      </form>
    </main>
  );
} 