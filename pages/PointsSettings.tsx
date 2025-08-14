import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import type { PointsSettings, EducationLevel, Class } from '../types';
import { AwardIcon, ArrowLeftIcon } from '../components/Icons';
import Notification from '../components/Notification';
import { INITIAL_POINTS_SETTINGS } from '../constants';
import { api } from '../services/api';

interface OutletContextType {
  appState: AppState;
}

const PointsSettingsPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { pointsSettings } = appState;
  const { levels, classes } = appState;
  const navigate = useNavigate();

  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [localSettings, setLocalSettings] = useState<PointsSettings | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info';} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app', { replace: true });
    }
  };

  const availableClasses = useMemo(() => {
    return selectedLevelId ? classes.filter(c => c.level_id === selectedLevelId) : [];
  }, [classes, selectedLevelId]);
  
  React.useEffect(() => {
    if (selectedClassId) {
      setLocalSettings(pointsSettings[selectedClassId] || INITIAL_POINTS_SETTINGS);
    } else {
      setLocalSettings(null);
    }
  }, [selectedClassId, pointsSettings]);
  
  React.useEffect(() => {
    setSelectedClassId('');
  }, [selectedLevelId]);

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!localSettings) return;
    const { name, value } = e.target;
    setLocalSettings(prev => ({
        ...(prev as PointsSettings),
        [name]: Number(value) >= 0 ? Number(value) : 0
    }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (localSettings && selectedClassId) {
        setIsSaving(true);
        try {
            await api.updatePointsSettings(selectedClassId, localSettings);
            setNotification({ message: 'تم حفظ التغييرات بنجاح!', type: 'success' });
        } catch (error) {
            setNotification({ message: 'فشل حفظ الإعدادات.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    } else {
        setNotification({ message: 'يرجى اختيار فصل أولاً.', type: 'error' });
    }
  };

  const settingsFields: { name: keyof PointsSettings; label: string; }[] = [
    { name: 'attendance', label: 'نقاط الحضور' },
    { name: 'lateWithExcuse', label: 'نقاط التأخير بعذر' },
    { name: 'prayer', label: 'نقاط حضور الصلاة' },
    { name: 'psalm', label: 'نقاط تسميع المزمور' },
    { name: 'behavior', label: 'نقاط السلوك داخل الفصل' },
    { name: 'scarf', label: 'نقاط لبس الإيشارب' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">النظام العام لتوزيع النقاط</h1>
            <p className="text-slate-500 mt-1">حدد عدد النقاط الممنوحة لكل بند من بنود التقييم لكل فصل على حدة.</p>
        </div>
        <button onClick={handleBack} className="btn btn-secondary">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>رجوع</span>
        </button>
      </div>

       <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
                <label htmlFor="level-select" className="block text-sm font-medium text-slate-700 mb-1">اختر المرحلة</label>
                <select id="level-select" value={selectedLevelId} onChange={e => setSelectedLevelId(e.target.value)} className="form-select">
                    <option value="">-- اختر مرحلة --</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
             <div className="w-full">
                <label htmlFor="class-select" className="block text-sm font-medium text-slate-700 mb-1">اختر الفصل</label>
                <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="form-select" disabled={!selectedLevelId}>
                    <option value="">-- اختر فصل --</option>
                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </div>

      {localSettings && (
        <div className="bg-white rounded-xl shadow-md animate-fade-in">
            <div className="p-4 border-b bg-slate-50 flex items-center gap-3" style={{ color: '#927dc8' }}>
                <AwardIcon className="w-6 h-6" />
                <h2 className="font-bold text-lg">إعدادات النقاط لفصل: {classes.find(c => c.id === selectedClassId)?.name}</h2>
            </div>
            <div className="p-6 space-y-4">
                {settingsFields.map(({ name, label }) => (
                    <div key={name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <label htmlFor={name} className="text-md font-semibold text-slate-700">
                            {label}
                        </label>
                        <input
                            type="number"
                            id={name}
                            name={name}
                            value={localSettings[name] || 0}
                            onChange={handleSettingChange}
                            className="form-input w-full sm:w-32 text-center font-bold text-lg"
                            min="0"
                        />
                    </div>
                ))}
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default PointsSettingsPage;
