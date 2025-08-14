

import React, { useMemo } from 'react';
import { useOutletContext, Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { AppState, Class } from '../types';
import { BookOpenIcon, ArrowLeftIcon, UsersIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const SchedulePage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { levels, classes } = appState;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedLevelId = searchParams.get('levelId');

  const selectedLevel = useMemo(() => {
    if (!selectedLevelId) return null;
    return levels.find(l => l.id === selectedLevelId);
  }, [selectedLevelId, levels]);
  
  const specialLevels = ['level-nursery', 'level-university', 'level-graduates'];
  const isPrepOrSecondary = useMemo(() => ['level-preparatory', 'level-secondary'].includes(selectedLevel?.id || ''), [selectedLevel]);

  const groupedClasses = useMemo(() => {
    if (!selectedLevel) return {};

    const levelClasses = classes.filter(c => c.level_id === selectedLevel.id);
    
    if (isPrepOrSecondary) {
        const groups: Record<string, Class[]> = { 'بنين': [], 'بنات': [] };
        levelClasses.forEach(cls => {
            if (cls.name.includes('بنين')) {
                groups['بنين'].push(cls);
            } else if (cls.name.includes('بنات')) {
                groups['بنات'].push(cls);
            }
        });
        
        const gradeOrder = selectedLevel.id === 'level-preparatory' 
          ? ['اولى اعدادى', 'ثانية اعدادى', 'ثالثة اعدادى']
          : ['اولى ثانوى', 'ثانية ثانوى', 'ثالثة ثانوى'];
        
        Object.values(groups).forEach(group => group.sort((a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)));

        return groups;
    }
    
    const groups = levelClasses.reduce((acc: Record<string, Class[]>, cls) => {
      const grade = cls.grade || 'بدون صف';
      if (!acc[grade]) {
        acc[grade] = [];
      }
      acc[grade].push(cls);
      return acc;
    }, {});

    // Sort boys before girls within each grade group for consistent ordering.
    (Object.values(groups) as Class[][]).forEach(group => {
      group.sort((a, b) => {
        const aIsBoys = a.name.includes('بنين');
        const bIsBoys = b.name.includes('بنين');
        
        if(aIsBoys && !bIsBoys) return -1;
        if(!aIsBoys && bIsBoys) return 1;
        
        return a.name.localeCompare(b.name, 'ar');
      });
    });

    return groups;
  }, [selectedLevel, classes, isPrepOrSecondary]);

  const gradeOrder = useMemo(() => {
    if (!selectedLevel) return [];
    
    if (isPrepOrSecondary) {
        return ['بنين', 'بنات'].filter(group => groupedClasses[group]?.length > 0);
    }
    
    const isPrimaryStage = selectedLevel.name === 'المرحلة الابتدائية';
    const primaryGradeOrder = ['الصف الاول', 'الصف الثانى', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];

    const groupKeys = Object.keys(groupedClasses);

    if (isPrimaryStage) {
        return groupKeys.sort((a, b) => {
            const indexA = primaryGradeOrder.indexOf(a);
            const indexB = primaryGradeOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            
            return a.localeCompare(b, 'ar');
        });
    }

    return groupKeys.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [groupedClasses, selectedLevel, isPrepOrSecondary]);

  const isPrimaryStage = selectedLevel?.name === 'المرحلة الابتدائية';

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app', { replace: true });
    }
  };

  if (!selectedLevelId) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-center sm:text-right flex-grow">
                <h1 className="text-3xl font-bold text-slate-900">جدول الخدمة</h1>
                <p className="text-slate-500 mt-1">اختر المرحلة لعرض جدول الفصول أو المنهج.</p>
            </div>
             <button onClick={handleBack} className="btn btn-secondary self-center sm:self-auto">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>رجوع</span>
            </button>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map(level => {
                const isSpecial = specialLevels.includes(level.id);
                
                const handleClick = () => {
                    if (isSpecial) {
                        const mainClass = classes.find(c => c.id === `${level.id}-main`);
                        if(mainClass) {
                            navigate(`/app/schedule/class/${mainClass.id}`);
                        } else {
                            console.error(`Main class for special level ${level.id} not found.`);
                            alert("لم يتم العثور على الفصل الرئيسي لهذه المرحلة.");
                        }
                    } else {
                        setSearchParams({ levelId: level.id });
                    }
                };
                
                const levelClassesCount = classes.filter(c => c.level_id === level.id).length;
                
                return (
                    <button 
                        key={level.id}
                        onClick={handleClick}
                        className="group flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center"
                    >
                        <div className="p-4 bg-purple-500 rounded-full text-white mb-4">
                            <BookOpenIcon className="w-8 h-8"/>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">{level.name}</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {isSpecial ? 'عرض المنهج مباشرة' : `${levelClassesCount} فصول`}
                        </p>
                    </button>
                )
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-center sm:text-right flex-grow">
                <h1 className="text-3xl font-bold text-slate-900">جدول خدمة: {selectedLevel?.name}</h1>
                <p className="text-slate-500 mt-1">اختر الفصل لعرض المنهج الدراسي.</p>
            </div>
            <button
                onClick={() => setSearchParams({})}
                className="btn btn-secondary self-center sm:self-auto"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>العودة لاختيار المرحلة</span>
            </button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            {gradeOrder.map(groupName => (
                <div key={groupName}>
                    <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-2">{groupName}</h3>
                    <div className={`grid grid-cols-1 ${isPrimaryStage ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                        {groupedClasses[groupName].map(cls => (
                            <Link 
                                to={`/app/schedule/class/${cls.id}`} 
                                key={cls.id}
                                className="group flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-colors"
                            >
                                <div className="p-2 bg-slate-200 rounded-full text-slate-600 group-hover:bg-purple-200 group-hover:text-purple-700">
                                    <UsersIcon className="w-5 h-5"/>
                                </div>
                                <div className="truncate">
                                    <p className="font-semibold text-slate-700 truncate">{cls.name}</p>
                                </div>
                                <ArrowLeftIcon className="w-5 h-5 text-slate-400 ml-auto mr-0 group-hover:text-purple-600 shrink-0"/>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
             {Object.keys(groupedClasses).length === 0 && (
                <p className="text-center text-slate-500 py-8">لا توجد فصول لهذه المرحلة.</p>
             )}
        </div>
    </div>
  );
};

export default SchedulePage;