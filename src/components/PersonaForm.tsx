'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

// ממשק חדש עם prop בשם onSuccess
export interface PersonaFormProps {
  onSuccess?: (chatId: string) => void;
  userId?: string;
}

// מספר השלבים בטופס
const TOTAL_STEPS = 2;

export default function PersonaForm({ onSuccess, userId }: PersonaFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  
  // מצבי הטופס
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // נתוני הצ'אט
  const [formData, setFormData] = useState({
    botName: '',
    apiKey: '',
    role: '',
    tone: '',
    additionalInfo: '',
  });

  // עדכון שדות הטופס
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // מעבר לשלב הבא בטופס
  const handleNext = () => {
    if (currentStep === 1) {
      // בדיקת תקינות השלב הראשון
      if (!formData.botName.trim()) {
        setError(t('error.missingBotName'));
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    setError(null);
  };

  // חזרה לשלב הקודם
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  // שליחת הטופס
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // בדיקת תקינות אחרונה
    if (!formData.botName.trim()) {
      setError(t('error.missingBotName'));
      return;
    }
    
    if (!formData.role.trim() || !formData.tone.trim()) {
      setError(t('error.missingRoleTone'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // קבלת פרטי המשתמש המחובר
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = userId || sessionData?.session?.user?.id;
      
      if (!currentUserId) {
        setError(t('error.loginRequired'));
        setIsSubmitting(false);
        return;
      }
      
      // יצירת אובייקט הפרסונה
      const personaData = {
        apiKey: formData.apiKey || null,
        role: formData.role,
        tone: formData.tone,
        additionalInfo: formData.additionalInfo || null,
      };
      
      // יצירת צ'אט חדש עם אובייקט הפרסונה בשדה persona
      const { data, error: createError } = await supabase.from('chats').insert({
        title: formData.botName,
        user_id: currentUserId,
        persona: personaData, // שימוש בשדה persona במקום בשדות נפרדים
      }).select('id').single();
      
      if (createError) {
        console.error('שגיאה ביצירת צ\'אט:', createError);
        setError(t('error.createChat'));
        setIsSubmitting(false);
        return;
      }
      
      if (!data) {
        setError(t('error.createChatNoData'));
        setIsSubmitting(false);
        return;
      }
      
      // הצ'אט נוצר בהצלחה - נודיע לרכיב ההורה
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        // אם אין פונקציית onSuccess, ננווט ישירות לצ'אט
        router.push(`/chat/${data.id}`);
      }
    } catch (error) {
      console.error('שגיאה לא צפויה:', error);
      setError(t('error.unexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // שלב 1: פרטי בסיס
  const renderStep1 = () => (
    <div>
      <div className="mb-4">
        <label htmlFor="botName" className="block text-sm font-medium mb-1">
          {t('form.botName.label')}
        </label>
        <input
          type="text"
          id="botName"
          name="botName"
          value={formData.botName}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('form.botName.label')}
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
          {t('form.apiKey.label')}
        </label>
        <input
          type="text"
          id="apiKey"
          name="apiKey"
          value={formData.apiKey}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('form.apiKey.label')}
        />
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {t('button.continue')}
        </button>
      </div>
    </div>
  );

  // שלב 2: התנהגות והגדרות
  const renderStep2 = () => (
    <div>
      {formData.botName && (
        <p className="mb-4 text-sm">
          {t('form.definingFor')} <strong>{formData.botName}</strong>
        </p>
      )}
      
      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          {t('form.role.label')}
        </label>
        <input
          type="text"
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('form.role.label')}
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="tone" className="block text-sm font-medium mb-1">
          {t('form.tone.label')}
        </label>
        <input
          type="text"
          id="tone"
          name="tone"
          value={formData.tone}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('form.tone.label')}
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">
          {t('persona.additionalInfo')} ({t('common.optional')})
        </label>
        <textarea
          id="additionalInfo"
          name="additionalInfo"
          value={formData.additionalInfo}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
        >
          {t('button.back')}
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-70"
        >
          {isSubmitting ? t('button.creating') : t('button.create')}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* סרגל התקדמות */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">
            {t('common.step')} {currentStep} / {TOTAL_STEPS}
          </span>
          <span className="text-sm font-medium">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="overflow-hidden h-2 rounded-full bg-gray-200">
          <div 
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            className="h-full bg-blue-600 transition-all duration-300"
          />
        </div>
      </div>
      
      {/* תצוגת שגיאות */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* תוכן השלב הנוכחי */}
      {currentStep === 1 ? renderStep1() : renderStep2()}
    </form>
  );
} 