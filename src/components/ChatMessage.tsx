'use client';

import { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaEdit, FaCheck, FaTimes, FaUserCircle, FaRobot } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatMessageProps {
  id: string; // Message ID
  role: 'user' | 'assistant';
  content: string | null; // content can be null initially if streaming
  createdAt?: string; // Optional: for displaying timestamp
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
  onEdit?: (messageId: string, newContent: string) => void;
  isTrainingMode?: boolean; // To show/hide feedback buttons
  isEdited?: boolean; // To show if message was edited
}

export default function ChatMessage({
  id,
  role,
  content,
  createdAt,
  onFeedback,
  onEdit,
  isTrainingMode = false,
  isEdited = false
}: ChatMessageProps) {
  const { t } = useLanguage();
  const isAssistant = role === 'assistant';
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || '');

  const handleEditSave = () => {
    if (onEdit && content !== editedContent) { // Only save if content changed
      onEdit(id, editedContent);
    }
    setEditing(false);
  };

  const handleEditCancel = () => {
    setEditedContent(content || '');
    setEditing(false);
  }

  return (
    <div className={`flex mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex gap-2 max-w-xl ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        {isAssistant ? (
            <FaRobot className="h-8 w-8 text-blue-500 self-start mt-1" />
        ) : (
            <FaUserCircle className="h-8 w-8 text-green-500 self-start mt-1" />
        )}
        <div className={`rounded-lg px-3 py-2 shadow ${ 
            isAssistant
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'bg-blue-500 dark:bg-blue-600 text-white'
          }`}
        >
          {isAssistant && editing ? (
            <textarea
              className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 min-h-[60px]"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
            />
          ) : (
            <>
              <p className="whitespace-pre-wrap">{content || (isAssistant ? t('chat.thinking') : "")}</p>
              {isEdited && isAssistant && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                  {t('chat.edited')}
                </div>
              )}
            </>
          )}
           {isAssistant && isTrainingMode && (
            <div className="mt-2 pt-1 border-t border-gray-300 dark:border-gray-600 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {!editing ? (
                <>
                  <button onClick={() => onFeedback && onFeedback(id, 'like')} title={t('chat.like')} className="hover:text-green-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FaThumbsUp /></button>
                  <button onClick={() => onFeedback && onFeedback(id, 'dislike')} title={t('chat.dislike')} className="hover:text-red-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FaThumbsDown /></button>
                  {onEdit && <button onClick={() => { setEditing(true); setEditedContent(content || ''); }} title={t('chat.edit')} className="hover:text-yellow-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FaEdit /></button>}
                </>
              ) : (
                <>
                  <button onClick={handleEditSave} title={t('chat.saveEdit')} className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FaCheck /></button>
                  <button onClick={handleEditCancel} title={t('chat.cancelEdit')} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FaTimes /></button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 