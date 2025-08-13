
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import { ClipboardCheckIcon, ArrowLeftIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const Attendance: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { levels, classes } = appState;
  const navigate = useNavigate();

  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || '');
  const [selectedDivision, setSelectedDivision] = useState<'boys' | 'girls' | ''>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app', { replace: true });
    }
  };

  const specialLevels = ['level-nursery', 'level-university', 'level-graduates'];
  const isSpecialLevel = specialLevels.includes(selectedLevelId);
  const hasDivisions = useMemo(() => ['level-preparatory', 'level-secondary'].includes(selectedLevelId), [selectedLevelId]);


  const availableClasses = useMemo(() => {
    if (!selectedLevelId || isSpecialLevel) return [];
    
    let filtered = classes.filter(c => c.level_id === selectedLevelId);
    
    if (hasDivisions) {
        if (!selectedDivision) return [];
        if (selectedDivision === 'boys') {
            filtered = filtered.filter(c => c.name.includes('بنين'));
        } else if (selectedDivision === 'girls') {
            filtered = filtered.filter(c => c.name.includes('بنات'));
        }
    }
    
    return filtered;
  }, [classes, selectedLevelId, isSpecialLevel, hasDivisions, selectedDivision]);
  
  useEffect(() => {
    if (isSpecialLevel) {
        const mainClass = classes.find(c => c.id === `${selectedLevelId}-main`);
        setSelectedClassId(mainClass?.id || '');
    } else {
        setSelectedClassId('');
    }
    setSelectedDivision('');
  }, [selectedLevelId, isSpecialLevel, classes]);
  
  useEffect(() => {
      if (hasDivisions) {
        setSelectedClassId('');
      }
  }, [selectedDivision, hasDivisions]);

  const handleOpenAttendance = () => {
    if (selectedClassId) {
      navigate(`/app/class-attendance/${selectedClassId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-900">تسجيل الحضور</h1>
            <button onClick={handleBack} className="btn btn-secondary">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>رجوع</span>
            </button>
        </div>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8">
        <div className="text-center">
            <ClipboardCheckIcon className="mx-auto w-16 h-16 text-purple-500 mb-4" />
            <p className="text-slate-500 mt-2">اختر الفصل لبدء تسجيل حضور الأطفال.</p>
        </div>

        <div className="space-y-6">
            <div>
                <label htmlFor="level-select" className="block text-sm font-medium text-slate-700 mb-2">
                    1. اختر المرحلة
                </label>
                <select 
                    id="level-select" 
                    value={selectedLevelId} 
                    onChange={(e) => setSelectedLevelId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                >
                    <option value="" disabled>-- اختر المرحلة --</option>
                    {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>
            
            {hasDivisions && (
                <div className="animate-fade-in">
                    <label htmlFor="division-select" className="block text-sm font-medium text-slate-700 mb-2">
                        2. اختر القسم
                    </label>
                    <select 
                        id="division-select" 
                        value={selectedDivision} 
                        onChange={(e) => setSelectedDivision(e.target.value as any)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    >
                        <option value="" disabled>-- اختر بنين / بنات --</option>
                        <option value="boys">بنين</option>
                        <option value="girls">بنات</option>
                    </select>
                </div>
            )}

            {!isSpecialLevel && (
                <div className={!hasDivisions ? 'animate-fade-in' : ''}>
                    <label htmlFor="class-select" className="block text-sm font-medium text-slate-700 mb-2">
                        {hasDivisions ? '3. اختر الفصل' : '2. اختر الفصل'}
                    </label>
                    <select 
                        id="class-select" 
                        value={selectedClassId} 
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        disabled={!selectedLevelId || (hasDivisions && !selectedDivision)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition disabled:bg-slate-200"
                    >
                        <option value="" disabled>
                            {availableClasses.length === 0 && selectedLevelId ? 'لا توجد فصول تطابق هذا الاختيار' : '-- اختر الفصل --'}
                        </option>
                        {availableClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.grade} - {c.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        <div className="pt-6 border-t border-slate-200">
             <button
                onClick={handleOpenAttendance}
                disabled={!selectedClassId}
                className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300"
            >
                <span>فتح سجل الحضور</span>
                <ArrowLeftIcon className="w-6 h-6 transform rotate-180" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;