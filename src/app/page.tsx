'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Changed from 'next/router' for App Router
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
// import { useSession } from '@/lib/useSession'; // We'll address session management later

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  // const session = useSession(); // Placeholder for session check
  const session = null; // Temporary: Assume no session for now

  if (session) {
    router.push('/dashboard');
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      
      <h1 className="text-4xl font-bold mb-4">{t('home.title')}</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md mb-8">
        {t('home.description')}
      </p>
      <div className="space-x-4 rtl:space-x-reverse">
        <Link href="/register" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('home.getStarted')}
        </Link>
        <Link href="/login" className="px-6 py-2 border border-gray-500 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          {t('home.login')}
        </Link>
      </div>
    </main>
  );
}
