'use client';

import { useEffect, useState } from 'react';

export function LoadingIndicator() {
  const [dots, setDots] = useState('');
  
  // אנימציה פשוטה של נקודות טעינה
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 300);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
          טוען{dots}
        </p>
      </div>
    </div>
  );
} 