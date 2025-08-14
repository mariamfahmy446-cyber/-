import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Settings, AppState } from '../types';
import { 
    HelpCircleIcon, BellIcon, GlobeIcon, FileTextIcon
} from '../components/Icons';
import Notification from '../components/Notification';
import { GoogleGenAI } from "@google/genai";
import { api } from '../services/api';


interface OutletContextType {
  appState: AppState;
}

type NotificationType = {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

const SettingsPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();

  const [notification, setNotification] = useState<NotificationType | null>(null);

  const showNotification = (message: string, type: NotificationType['type'] = 'success') => {
      setNotification({ message, type });
  };

  return (
    <div className="space-y-8">
      {notification && (
        <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
            appSettings={appState.settings}
        />
       )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">الإعدادات العامة</h1>
        <p className="text-slate-500 mt-1 self-start sm:self-center">إدارة الإعدادات العامة للخدمة.</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 md:p-6">
            <GeneralSettings appState={appState} showNotification={showNotification} />
          </div>
      </div>
    </div>
  );
};

// Reusable components for GeneralSettings
const SettingsSection: React.FC<{title: string, icon: React.ElementType, children: React.ReactNode}> = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-3">
            <Icon className="w-6 h-6 text-violet-500" />
            <span>{title}</span>
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingsRow: React.FC<{children: React.ReactNode, isLink?: boolean}> = ({ children, isLink }) => (
    <div className={`bg-white p-3 rounded-lg flex justify-between items-center border border-slate-200 ${isLink ? 'hover:bg-slate-100 transition-colors' : ''}`}>
        {children}
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean, onChange: () => void}> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
    </label>
);

const GeneralSettings: React.FC<{appState: AppState, showNotification: (msg: string, type?: NotificationType['type']) => void}> = ({ appState, showNotification }) => {
    const { settings, setSettings, language, setLanguage } = appState;

    const handleToggleChange = (field: keyof Pick<Settings, 'enableSounds' | 'enableVibrations' | 'enablePopups' | 'darkMode'>) => {
        const updatedSettings = {...settings, [field]: !settings[field]};
        api.updateSettings(updatedSettings).then(() => {
            showNotification('تم حفظ الإعدادات تلقائياً.');
        });
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value); // Optimistic update
        showNotification('تم تغيير اللغة بنجاح.');
    };

    return (
        <div className="space-y-8">
            <SettingsSection title="الاشعارات والاصوات" icon={BellIcon}>
                 <p className="text-sm text-slate-500 -mt-2 mb-2">اشعارات داخل التطبيق</p>
                <SettingsRow>
                    <span className="font-medium text-slate-700">اصوات داخل التطبيق</span>
                    <ToggleSwitch checked={settings.enableSounds} onChange={() => handleToggleChange('enableSounds')} />
                </SettingsRow>
                <SettingsRow>
                    <span className="font-medium text-slate-700">اهتزازات داخل التطبيق</span>
                    <ToggleSwitch checked={settings.enableVibrations} onChange={() => handleToggleChange('enableVibrations')} />
                </SettingsRow>
                 <SettingsRow>
                    <span className="font-medium text-slate-700">اشعارات منبثقة داخل التطبيق</span>
                    <ToggleSwitch checked={settings.enablePopups} onChange={() => handleToggleChange('enablePopups')} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="اللغة" icon={GlobeIcon}>
                 <SettingsRow>
                    <span className="font-medium text-slate-700">اختر اللغة</span>
                     <select 
                        value={language} 
                        onChange={handleLanguageChange}
                        className="form-select w-32"
                     >
                         <option value="ar">العربية</option>
                         <option value="en">English</option>
                     </select>
                </SettingsRow>
            </SettingsSection>

            <SuggestionsSection showNotification={showNotification} />
            
            <SettingsSection title="المساعدة" icon={HelpCircleIcon}>
                <HelpSection showNotification={showNotification} />
            </SettingsSection>
        </div>
    );
};

const SuggestionsSection: React.FC<{ showNotification: (msg: string, type?: NotificationType['type']) => void }> = ({ showNotification }) => {
    const [suggestion, setSuggestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const handleSendSuggestion = async () => {
        if (!suggestion.trim()) {
            showNotification('يرجى كتابة اقتراحك أولاً.', 'error');
            return;
        }
        setIsSending(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `أنت مساعد لطيف في تطبيق كنسي. المستخدم قدم الاقتراح التالي. اشكره وأخبره أن الاقتراح قيد المراجعة. كن ودوداً ومشجعاً. الاقتراح: "${suggestion}"`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            showNotification(response.text, 'success');
        } catch (e) {
            console.error(e);
            showNotification('شكراً لك! تم استلام اقتراحك وسنراجعه قريباً.', 'success');
        }
        setSuggestion('');
        setIsSending(false);
    };

    return (
        <SettingsSection title="الاقتراحات والشكاوى" icon={FileTextIcon}>
            <p className="text-sm text-slate-500 -mt-2 mb-2">نحن نهتم برأيك. شاركنا بأفكارك لمساعدتنا على تحسين التطبيق.</p>
            <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="اكتب اقتراحك هنا..."
                rows={4}
                className="form-textarea"
                disabled={isSending}
            />
            <div className="text-left">
                <button onClick={handleSendSuggestion} disabled={isSending} className="btn btn-primary">
                {isSending ? 'جاري الإرسال...' : 'إرسال'}
                </button>
            </div>
        </SettingsSection>
    );
};


const HelpSection: React.FC<{ showNotification: (msg: string, type?: NotificationType['type']) => void }> = ({ showNotification }) => {
    const [helpQuestion, setHelpQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState('');
    const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

    const handleAskAssistant = async () => {
        if (!helpQuestion.trim()) {
            showNotification('يرجى كتابة سؤالك أولاً.', 'error');
            return;
        }
        setIsLoadingAnswer(true);
        setAiAnswer('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `أنت مساعد متخصص في تطبيق لإدارة خدمة مدارس الأحد. التطبيق يدير بيانات الأطفال، الفصول، الخدام، الحضور والغياب، النقاط، الترانيم، وجداول الخدمة.
            أجب على سؤال المستخدم التالي بوضوح وإيجاز باللغة العربية، وقدم خطوات عملية إذا كان ذلك مناسباً.
            السؤال: "${helpQuestion}"`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            setAiAnswer(response.text);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage = "عذراً، حدث خطأ أثناء محاولة الحصول على إجابة. يرجى المحاولة مرة أخرى.";
            setAiAnswer(errorMessage);
            showNotification('حدث خطأ في الاتصال بالمساعد الذكي.', 'error');
        } finally {
            setIsLoadingAnswer(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-2">المساعد الذكي</h4>
                <p className="text-xs text-slate-500 mb-3">اطرح سؤالاً حول كيفية استخدام التطبيق وسيقوم الذكاء الاصطناعي بالإجابة عليك.</p>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={helpQuestion}
                        onChange={(e) => setHelpQuestion(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAskAssistant(); }}}
                        placeholder="مثال: كيف أضيف خادم جديد؟"
                        className="form-input"
                        disabled={isLoadingAnswer}
                    />
                    <button onClick={handleAskAssistant} disabled={isLoadingAnswer} className="btn btn-primary shrink-0 disabled:cursor-wait">
                        {isLoadingAnswer ? 'جاري...' : 'اسأل'}
                    </button>
                </div>
                {isLoadingAnswer && <div className="mt-4 text-center text-slate-500 animate-pulse">...يفكر المساعد</div>}
                {aiAnswer && (
                    <div className="mt-4 p-3 bg-violet-50 border-r-4 border-violet-400 rounded-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {aiAnswer}
                    </div>
                )}
            </div>
        </div>
    );
};


export default SettingsPage;
