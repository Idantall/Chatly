'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation'; // useParams for chatId
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TrainingToggle from '@/components/TrainingToggle';
import { Database, Json } from '@/lib/database.types'; // Using generated types
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid'; // For generating temporary IDs
import { useLanguage } from '@/contexts/LanguageContext';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type ChatRow = Database['public']['Tables']['chats']['Row'];
type Persona = ChatRow['persona']; // This will be Json | null

// הגדרה מעודכנת של מבנה הפרסונה
interface ChatPersona {
  apiKey?: string | null;
  role?: string;
  tone?: string;
  additionalInfo?: string | null;
  name?: string;
  system_prompt?: string;
}

// טיפוס עבור הפיילואד של הודעות בזמן אמת
interface MessagePayload {
  new: MessageRow;
}

// טיפוס עבור שגיאות מסד נתונים
type DbError = { code?: string; message?: string; details?: string };

interface FeedbackData {
  feedback_type: 'like' | 'dislike' | 'edit';
  original_content: string;
  new_content?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string | undefined;
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatRow | null>(null);
  const [persona, setPersona] = useState<ChatPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [trainingMode, setTrainingMode] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'missing' | 'present'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [editedMessages, setEditedMessages] = useState<Set<string>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const dataFetchedRef = useRef(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // פונקציה להצגת הודעות קצרות
  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch user and API key status
  useEffect(() => {
    const initializePage = async () => {
      try {
        // קבלת נתוני משתמש
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }
        setUser(session.user);

        // אין צורך לבדוק API keys מטבלה נפרדת כרגע - הם יהיו בתוך הפרסונה
        setApiKeyStatus('present'); // נניח שהמפתח קיים בינתיים
      } catch (error) {
        console.error('שגיאה באתחול הדף:', error);
        setError('שגיאה בטעינת נתוני המשתמש');
      }
    };
    initializePage();
  }, [router]);

  // Fetch chat details and messages
  useEffect(() => {
    if (!chatId || !user || dataFetchedRef.current) return;

    const fetchChatData = async () => {
      setLoading(true);
      setError(null);
      try {
        // סימון שהתחלנו את הטעינה למניעת קריאות מרובות
        dataFetchedRef.current = true;
        
        // הנה הבעיה העיקרית - נוסיף ניהול שגיאות טוב יותר כאן
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .eq('user_id', user.id);  // הבטחת בעלות על הצאט

        if (chatError) {
          console.error("שגיאה בטעינת פרטי הצאט:", chatError);
          setError("הצאט לא נמצא או שאין לך הרשאה לצפות בו.");
          setLoading(false);
          return;
        }

        if (!chatData || chatData.length === 0) {
          console.error("לא נמצא צאט עם המזהה:", chatId);
          setError("הצאט לא נמצא.");
          setLoading(false);
          router.push("/dashboard");
          return;
        }

        // חילוץ הצאט הראשון (אמור להיות אחד בלבד)
        const chat = chatData[0];
        setCurrentChat(chat);

        // בדיקת פרסונה
        const chatPersona = chat.persona as ChatPersona | null;
        setPersona(chatPersona);

        // בדיקת סטטוס מפתח API
        if (chatPersona?.apiKey) {
          setApiKeyStatus('present');
        } else {
          setApiKeyStatus('missing');
        }

        // טעינת הודעות
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (msgsError) {
          console.error("שגיאה בטעינת הודעות", msgsError);
          setError("נכשל בטעינת הודעות");
          setMessages([]);
        } else if (msgs) {
          setMessages(msgs);
        }
      } catch (error) {
        console.error("שגיאה כללית בטעינת הצאט:", error);
        setError("נכשל בטעינת הצאט.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // רישום להודעות בזמן אמת
    const channel = supabase.channel(`chat-${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload: MessagePayload) => {
          // רק אם ההודעה היא מהבוט ולא קיימת עדיין
          if (!messages.find(m => m.id === payload.new.id) && payload.new.role === 'assistant') {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user, router]); // הסרנו את messages מהתלויות למניעת קריאות חוזרות

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // שליחת הודעה חדשה
  const handleSend = async (userMessageContent: string) => {
    if (!chatId || !user) {
      displayToast(t('toast.loginRequired'));
      return;
    }

    if (!userMessageContent.trim()) {
      displayToast(t('toast.emptyMessage'));
      return;
    }

    setIsSending(true);
    setError(null);

    // יצירת מזהה זמני להודעת המשתמש
    const tempUserMessageId = uuidv4();
    const userMessage: MessageRow = {
      id: tempUserMessageId,
      chat_id: chatId,
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]); // עדכון אופטימי

    // שמירת הודעת המשתמש במסד הנתונים
    supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: userMessageContent,
    }).then(({ error: dbError }: { error: DbError | null }) => {
      if (dbError) {
        console.error("שגיאה בשמירת הודעת המשתמש:", dbError);
        setMessages(prev => prev.filter(m => m.id !== tempUserMessageId));
        displayToast(t('toast.messageSaveError'));
      }
    });

    // הכנת ההודעות עבור ה-API
    const messagesForApi = messages.map(m => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: userMessageContent }]);

    // הוספת כללים שנלמדו מהמשוב אם קיימים
    const dynamicRuleset = await buildRuleset();
    console.log('handleSend: dynamicRuleset to be sent:', dynamicRuleset);
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          persona: persona,
          messages: messagesForApi,
          userId: user.id,
          dynamicRuleset: dynamicRuleset
        })
      });

      if (!response.ok) {
        let errorMessage = t('toast.serverError');
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `${t('toast.apiError')} ${response.status}`;
        } catch (e) {
          console.error("שגיאה בפענוח תשובת השגיאה:", e);
        }
        throw new Error(errorMessage);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let assistantReplyContent = '';
        let assistantMessageId = uuidv4(); // מזהה זמני להודעת הבוט

        // הוספת placeholder זמני להודעת הבוט
        const tempAssistantMessage: MessageRow = {
          id: assistantMessageId,
          chat_id: chatId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempAssistantMessage]);

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
          if (chunk) {
            assistantReplyContent += chunk;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId ? { ...m, content: assistantReplyContent } : m
              )
            );
          }
        }

        // הזרמה הסתיימה. שמירת ההודעה השלמה במסד הנתונים
        if (assistantReplyContent.trim()) {
          const { data: finalAssistantMessage, error: insertError } = await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              role: 'assistant',
              content: assistantReplyContent,
            })
            .select();

          if (insertError) {
            console.error('שגיאה בשמירת הודעת הבוט:', insertError);
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId ? { ...m, content: assistantReplyContent + " (שגיאה בשמירה)" } : m
              )
            );
            displayToast(t('toast.botSaveError'));
          } else if (finalAssistantMessage && finalAssistantMessage.length > 0) {
            // החלפת הודעת הבוט הזמנית בהודעה הסופית ממסד הנתונים
            setMessages(prev =>
              prev.map(m => (m.id === assistantMessageId ? finalAssistantMessage[0] : m))
            );
          }
        } else {
          // אם תשובת הבוט ריקה, הסרת ה-placeholder
          setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
        }
      }
    } catch (apiError: any) {
      console.error('שגיאה בקריאה ל-/api/ask:', apiError);
      setError(`${t('toast.responseError')}: ${apiError.message}`);
      displayToast(`${t('toast.error')}: ${apiError.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedback = async (messageId: string, feedbackType: 'like' | 'dislike') => {
    if (!trainingMode || !user || !chatId) return;

    const messageToFeedback = messages.find(m => m.id === messageId);
    if (!messageToFeedback || messageToFeedback.role !== 'assistant') return;

    const { error: feedbackError } = await supabase.from('rulebook').insert({
      user_id: user.id,
      chat_id: chatId,
      message_id: messageId,
      feedback_type: feedbackType,
      original_content: messageToFeedback.content
    });

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      displayToast(t('toast.feedbackError'));
    } else {
      displayToast(t('toast.feedbackSaved'));
    }
  };

  const buildRuleset = async (): Promise<string> => {
    if (!chatId || !user) {
      console.log('buildRuleset: Missing chatId or user');
      return '';
    }
    
    console.log('buildRuleset: Starting with chatId:', chatId, 'userId:', user.id);
    
    try {
      const { data: feedbackData, error } = await supabase
        .from('rulebook')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching feedback data:', error);
        return '';
      }

      console.log('buildRuleset: Fetched feedback data:', feedbackData);

      if (!feedbackData || feedbackData.length === 0) {
        console.log('buildRuleset: No feedback data found');
        return '';
      }

      const rules: string[] = [];
      
      feedbackData.forEach((feedback: FeedbackData) => {
        switch (feedback.feedback_type) {
          case 'like':
            rules.push(`✓ המשתמש אוהב תגובות מסוג: "${feedback.original_content}"`);
            break;
          case 'dislike':
            rules.push(`✗ המשתמש לא אוהב תגובות מסוג: "${feedback.original_content}"`);
            break;
          case 'edit':
            rules.push(`📝 המשתמש מעדיף: "${feedback.new_content}" במקום: "${feedback.original_content}"`);
            break;
        }
      });

      const ruleset = rules.length > 0 ? `\n\nכללים שנלמדו מהמשוב:\n${rules.join('\n')}` : '';
      console.log('buildRuleset: Generated ruleset:', ruleset);
      return ruleset;
    } catch (error) {
      console.error('Error building ruleset:', error);
      return '';
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!trainingMode || !user || !chatId) return;

    const originalMessage = messages.find(m => m.id === messageId);
    if (!originalMessage || originalMessage.role !== 'assistant') return;

    const { error: editError } = await supabase.from('rulebook').insert({
      user_id: user.id,
      chat_id: chatId,
      message_id: messageId,
      feedback_type: 'edit',
      original_content: originalMessage.content,
      new_content: newContent
    });

    if (editError) {
      console.error('Error saving edit feedback:', editError);
      displayToast(t('toast.editError'));
    } else {
      // Optimistically update the message in the UI to show the edit
      setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, content: newContent } : m)));
      // Mark this message as edited
      setEditedMessages(prev => new Set(prev).add(messageId));
      displayToast(t('toast.editSaved'));
    }
  };

  if (loading && !error) { // Show full page loading only if no specific error yet
    return (
        <main className="flex flex-col h-screen bg-white dark:bg-gray-900 items-center justify-center">
            <p className="text-gray-700 dark:text-gray-300">{t('chat.loading')}...</p>
        </main>
    );
  }

  if (error && !loading) { // If there's a general error (e.g. chat not found) and not in initial load
     return (
        <main className="flex flex-col h-screen bg-white dark:bg-gray-900 items-center justify-center p-4">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                חזור ללוח הבקרה
            </Link>
        </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="חזור ללוח הבקרה">
                <FaArrowLeft size={18} />
            </Link>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">
                {persona?.name || currentChat?.title || 'צאט'}
            </h2>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {user && chatId && (
            <a
              href={`/api/export/${chatId}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="ייצוא נתוני צאט"
            >
              <FaDownload size={18} />
            </a>
          )}
          {user && <TrainingToggle enabled={trainingMode} onToggle={() => setTrainingMode(!trainingMode)} />}
        </div>
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">אין עדיין הודעות. התחל לשלוח הודעה!</p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={msg.content}
              onFeedback={handleFeedback}
              onEdit={handleEdit}
              isTrainingMode={trainingMode && msg.role === 'assistant'} // Pass training mode status
              isEdited={editedMessages.has(msg.id)} // Pass edited status
            />
          ))
        )}
        <div ref={bottomRef}></div> {/* Dummy div for auto-scrolling */}
      </div>

      {/* API Key notice */}
      {apiKeyStatus === 'missing' && user && (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 text-center text-sm">
          ⚠️ הוסף מפתח API בהגדרות הפרסונה כדי לשלוח הודעות.
        </div>
      )}
        {/* Toast Notification */}
        {showToast && (
            <div className="fixed bottom-20 right-4 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-xl transition-opacity duration-300 opacity-100 z-50">
            {toastMessage}
            </div>
      )}

      {/* Message Input - only enable if user and API key are present */}
      {user && <ChatInput
        disabled={apiKeyStatus !== 'present' || isSending}
        onSend={handleSend}
        isSending={isSending}
      />}
    </main>
  );
} 