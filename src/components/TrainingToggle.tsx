'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface TrainingToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function TrainingToggle({ enabled, onToggle }: TrainingToggleProps) {
  const { t } = useLanguage();
  
  return (
    <label htmlFor="training-toggle" className="flex items-center text-sm cursor-pointer select-none">
      <div className="relative">
        <input
          type="checkbox"
          id="training-toggle"
          className="sr-only" // Hide default checkbox
          checked={enabled}
          onChange={onToggle}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-full' : ''}`}></div>
      </div>
      <span className={`ml-2 font-medium ${enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {t('training.mode')} {enabled ? t('training.on') : t('training.off')}
      </span>
    </label>
  );
} 