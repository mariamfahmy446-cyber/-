import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { AppState, Class as ClassType, Servant, Child, EducationLevel } from '../types';
import { PlusIcon, EditIcon, TrashIcon, UserIcon, PhoneIcon, XIcon, UsersIcon, UserPlusIcon, ArrowLeftIcon } from '../components/Icons';
import Notification from '../components/Notification';

interface OutletContextType {
  appState: AppState;
}

const ClassCard: React.FC<{
    cls: ClassType,
    childrenCount: number,
    supervisor?: Servant,
}> = ({ cls, childrenCount, supervisor }) => {
    const displayName = cls.level_id === 'level-primary' && !cls.name.includes('بنين') && !cls.name.includes('بنات')
        ? `${cls.name} ${cls.id.includes('boys') ? 'بنين' : 'بنات'}`
        : cls.name;

    return (
        <ReactRouterDOM.Link 
            to={`/app/class/${cls.id}`}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 shadow-md">
            <div className="flex-grow space-y-3">
                <h3 className="font-bold text-lg text-slate-800">{displayName}</h3>
                <div className="flex items-center gap-3">
                    {supervisor?.image ? (
                        <img src={supervisor.image} alt={supervisor.name} className="w-12 h-12 rounded-full object-cover"/>
                    ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-slate-500"/>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-slate-500">المشرف</p>
                        <p className="font-semibold text-slate-700">{cls.supervisorName || 'لم يعين'}</p>
                        {supervisor?.phone && (
                            <p className="text-xs text-slate-500">هاتف: {supervisor.phone}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm font-medium text-slate-600">{childrenCount} طالب</span>
            </div>
        </ReactRouterDOM.Link>
    );
};


const LevelStatCard: React.FC<{
    icon: React.ElementType,
    label: string,
    value: string | number
}> = ({ icon: Icon, label, value }) => (
    <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 border border-slate-200">
        <div className="p-2 bg-violet-100 text-violet-600 rounded-full">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-bold text-slate-800">{value}</p>
        </div>
    </div>
);


const ClassesAndLevels: React.FC = () => {
  const { appState } = ReactRouterDOM.useOutletContext<OutletContextType>();
  const { levels, classes, children, servants, currentUser } = appState;
  const navigate = ReactRouterDOM.useNavigate();
  
  if (currentUser?.roles.includes('servant')) {
    return <ReactRouterDOM.Navigate to="/app/dashboard" replace />;
  }

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app', { replace: true });
    }
  };
  
  const sortedLevels = useMemo(() => {
    const order = ['level-primary', 'level-preparatory', 'level-secondary', 'level-nursery', 'level-university', 'level-graduates'];
    return [...levels].sort((a, b) => {
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name, 'ar');
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
  }, [levels]);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">ادارة الخدمات</h1>
        <div className="flex gap-2 sm:gap-4 w-full md:w-auto flex-wrap justify-center md:justify-end">
            <button onClick={() => navigate('/app/add-child')} className="btn btn-primary">
                <UserPlusIcon className="w-5 h-5"/>
                <span>إضافة طفل</span>
            </button>
             <button onClick={handleBack} className="btn btn-secondary">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>رجوع</span>
            </button>
        </div>
      </div>

      <div className="space-y-8">
        {sortedLevels.map(level => {
            const levelClasses = classes.filter(c => c.level_id === level.id);
            const isSpecialLevel = ['level-nursery', 'level-university', 'level-graduates'].includes(level.id);
            const isPrimaryLevel = level.id === 'level-primary';
            const isPrepOrSecondary = ['level-preparatory', 'level-secondary'].includes(level.id);

            const totalChildrenForLevel = children.filter(c => levelClasses.some(lc => lc.id === c.class_id)).length;
            const servantNames = new Set<string>();
            levelClasses.forEach(cls => {
                if (cls.supervisorName) servantNames.add(cls.supervisorName.trim());
                (cls.servantNames || []).forEach(name => servantNames.add(name.trim()));
            });
            const totalServants = servantNames.size;
            const generalSecretaryName = level.generalSecretary?.name || 'غير محدد';

            if (isSpecialLevel) {
                const mainClass = levelClasses[0];
                const childrenCount = mainClass ? children.filter(c => c.class_id === mainClass.id).length : 0;
                
                return (
                    <div key={level.id} className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">{level.name}</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <LevelStatCard icon={UsersIcon} label="إجمالي الخدام" value={totalServants} />
                            <LevelStatCard icon={UserIcon} label="إجمالي المخدومين" value={childrenCount} />
                            <LevelStatCard icon={UserIcon} label="الأمين العام" value={generalSecretaryName} />
                        </div>
                        <ReactRouterDOM.Link 
                            to={`/app/level/${level.id}`}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 flex flex-col justify-center items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-800">عرض بيانات المرحلة</h3>
                            <p className="text-sm font-medium text-slate-600">{childrenCount} طالب/شاب مسجل</p>
                        </ReactRouterDOM.Link>
                    </div>
                );
            }

            return (
                <div key={level.id} className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">{level.name}</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <LevelStatCard icon={UsersIcon} label="إجمالي الخدام" value={totalServants} />
                        <LevelStatCard icon={UserIcon} label="إجمالي المخدومين" value={totalChildrenForLevel} />
                        <LevelStatCard icon={UserIcon} label="الأمين العام" value={generalSecretaryName} />
                    </div>
                    
                    {isPrimaryLevel ? (
                        (() => {
                            const sortGradeClasses = (classes: ClassType[]) => {
                                return classes.sort((a, b) => {
                                    const aIsBoys = a.name.includes('بنين');
                                    const bIsBoys = b.name.includes('بنين');
                                    if (aIsBoys && !bIsBoys) return -1;
                                    if (!aIsBoys && bIsBoys) return 1;
                                    return 0;
                                });
                            };

                            const gradesByColumn = {
                                'col1': ['الصف الاول', 'الصف الثانى'],
                                'col2': ['الصف الثالث', 'الصف الرابع'],
                                'col3': ['الصف الخامس', 'الصف السادس']
                            };

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {Object.values(gradesByColumn).map((colGrades, colIndex) => (
                                        <div key={colIndex} className="space-y-6">
                                            {colGrades.map(gradeName => {
                                                const gradeClasses = sortGradeClasses(levelClasses.filter(c => c.grade === gradeName));
                                                return gradeClasses.map(cls => (
                                                    <ClassCard 
                                                        key={cls.id} 
                                                        cls={cls} 
                                                        childrenCount={children.filter(c => c.class_id === cls.id).length}
                                                        supervisor={servants.find(s => s.name === cls.supervisorName)}
                                                    />
                                                ));
                                            })}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    ) : isPrepOrSecondary ? (
                        (() => {
                            const boysClasses = levelClasses.filter(c => c.name.includes('بنين'));
                            const girlsClasses = levelClasses.filter(c => c.name.includes('بنات'));
                            
                            const gradeOrder = level.id === 'level-preparatory' 
                              ? ['اولى اعدادى', 'ثانية اعدادى', 'ثالثة اعدادى']
                              : ['اولى ثانوى', 'ثانية ثانوى', 'ثالثة ثانوى'];
                    
                            const sortClassesByGrade = (classesToSort: ClassType[]) => {
                                return classesToSort.sort((a, b) => {
                                    const indexA = gradeOrder.indexOf(a.grade);
                                    const indexB = gradeOrder.indexOf(b.grade);
                                    return indexA - indexB;
                                });
                            };
                            
                            const sortedBoysClasses = sortClassesByGrade(boysClasses);
                            const sortedGirlsClasses = sortClassesByGrade(girlsClasses);
                    
                            return (
                              <div className="space-y-8">
                                {sortedBoysClasses.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-lg text-slate-700 mb-3">بنين</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {sortedBoysClasses.map(cls => (
                                        <ClassCard 
                                          key={cls.id} 
                                          cls={cls} 
                                          childrenCount={children.filter(c => c.class_id === cls.id).length}
                                          supervisor={servants.find(s => s.name === cls.supervisorName)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {sortedGirlsClasses.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-lg text-slate-700 mb-3">بنات</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {sortedGirlsClasses.map(cls => (
                                        <ClassCard 
                                          key={cls.id} 
                                          cls={cls} 
                                          childrenCount={children.filter(c => c.class_id === cls.id).length}
                                          supervisor={servants.find(s => s.name === cls.supervisorName)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                        })()
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {levelClasses.length > 0 ? (
                                levelClasses.map(cls => (
                                    <ClassCard 
                                        key={cls.id} 
                                        cls={cls} 
                                        childrenCount={children.filter(c => c.class_id === cls.id).length}
                                        supervisor={servants.find(s => s.name === cls.supervisorName)}
                                    />
                                ))
                            ) : (
                                <p className="md:col-span-3 text-center text-slate-500 py-4">لا توجد فصول دراسية في هذه المرحلة بعد.</p>
                            )}
                        </div>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  );
}

export default ClassesAndLevels;