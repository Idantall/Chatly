'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string) => Promise<void>;
  isSending?: boolean; // To indicate if a message is currently being sent (for disabling input/button)
}

export default function ChatInput({ disabled, onSend, isSending }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const messageToSend = input.trim();
    setInput(''); // Clear input immediately
    if (textareaRef.current) { // Reset textarea height
        textareaRef.current.style.height = 'auto';
    }
    await onSend(messageToSend);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [input]);

  return (
    <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2 bg-white dark:bg-gray-800"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none overflow-y-auto max-h-32 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        placeholder={disabled ? t('toast.apiKeyRequired') : t('chat.typeMessage')}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        }}
        disabled={disabled || isSending}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim() || isSending}
        className="p-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center h-[48px] w-[48px]"
        aria-label="Send message"
      >
        <FaPaperPlane size={20}/>
      </button>
    </form>
  );
} 