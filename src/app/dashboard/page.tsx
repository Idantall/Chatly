'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChatList } from '@/components/ChatList';

// דגל סטטי לבדיקת סביבת הדפדפן
const isClient = typeof window !== 'undefined';

export default function DashboardPage() {
  const { t, isReady } = useLanguage();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const chatsLoaded = useRef(false);
  const [mounted, setMounted] = useState(false);

  // אפקט לבדיקת מאונט הרכיב
  useEffect(() => {
    if (isClient) {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    // נמנע מטעינות מרובות
    if (!isClient || !mounted || !isReady || chatsLoaded.current) return;
    
    const loadChats = async () => {
      // מסמנים שהתחלנו לטעון כדי למנוע טעינות כפולות
      chatsLoaded.current = true;
      
      try {
        // בדיקת משתמש מחובר
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (!userId) {
          console.log('אין משתמש מחובר בדשבורד');
          setIsLoading(false);
          setChats([]);
          return;
        }
        
        // טעינת צ'אטים
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('שגיאה בטעינת צ׳אטים:', error);
          setIsError(true);
        } else {
          setChats(data || []);
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    // טעינת הצ'אטים רק אם אנחנו מוכנים
    loadChats();
  }, [isReady, mounted]);

  if (!mounted || !isReady) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/4 mb-4 rounded"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <Link 
          href="/chat/new" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded transition-colors"
        >
          {t('button.newChat')}
        </Link>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg h-20"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          {t('error.chatLoading')}
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('dashboard.noChats')}</p>
          <Link 
            href="/chat/new" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded inline-block transition-colors"
          >
            {t('button.startChat')}
          </Link>
        </div>
      ) : (
        <ChatList chats={chats} />
      )}
    </div>
  );
} 