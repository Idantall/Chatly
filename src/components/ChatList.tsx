'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface Chat {
  id: string;
  title: string | null;
  created_at: string;
}

interface ChatListProps {
  chats: Chat[];
}

export const ChatList = ({ chats }: ChatListProps) => {
  const { dir, t } = useLanguage();
  
  if (chats.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('common.noChats')}</p>
        <p className="text-gray-500 dark:text-gray-300">{t('common.createNewChat')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {chats.map(chat => (
        <li 
          key={chat.id} 
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow hover:shadow-md transition-shadow"
          dir={dir}
        >
          <Link href={`/chat/${chat.id}`} className="block group">
            <div className="flex justify-between items-center">
              <strong className="text-lg font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                {chat.title || t('chat.untitled')}
              </strong>
              <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                {dir === 'rtl' ? t('chat.openChat') : t('chat.openChat')}
              </span>
            </div>
            
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t('chat.created')}: {new Date(chat.created_at).toLocaleDateString(dir === 'rtl' ? 'he-IL' : 'en-US')}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}; 