


import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { AppState, Class as ClassType, Child } from '../types';
import { UsersIcon, UserIcon, ArrowLeftIcon, BookOpenIcon, ChevronDownIcon, PlusIcon, EditIcon, TrashIcon, IdIcon } from '../components/Icons';
import Notification from '../components/Notification';


interface OutletContextType {
  appState: AppState;
}

const LevelDetailsPage: React.FC = () => {
  const { appState } = ReactRouterDOM.useOutletContext<OutletContextType>();
  const { levels, classes, children, setChildren } = appState;
  const { levelId } = ReactRouterDOM.useParams<{ levelId: string }>();
  const [searchParams] = ReactRouterDOM.useSearchParams();
  const division = searchParams.get('division');
  const navigate = ReactRouterDOM.useNavigate();
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'warning' | 'info'} | null>(null);

  const level = useMemo(() => levels.find(l => l.id === levelId), [levelId, levels]);

  const levelClasses = useMemo(() => {
    if (!level) return [];
    
    let baseClasses = classes.filter(c => c.level_id === level.id);

    if (division === 'boys') {
        return baseClasses.filter(c => c.name.includes('بنين'));
    }
    if (division === 'girls') {
        return baseClasses.filter(c => c.name.includes('بنات'));
    }
    
    return baseClasses;
  }, [classes, level, division]);

  const totalChildren = useMemo(() => {
    const classIds = new Set(levelClasses.map(c => c.id));
    return children.filter(child => classIds.has(child.class_id)).length;
  }, [levelClasses, children]);

  const totalServants = useMemo(() => {
    const servantNames = new Set<string>();
    levelClasses.forEach(cls => {
      if (cls.supervisorName) servantNames.add(cls.supervisorName.trim());
      (cls.servantNames || []).forEach(name => servantNames.add(name.trim()));
    });
    return servantNames.size;
  }, [levelClasses]);

    const isSpecialLevel = useMemo(() => ['level-nursery', 'level-university', 'level-graduates'].includes(level?.id || ''), [level]);
    const isYouthLevel = useMemo(() => ['level-university', 'level-graduates'].includes(level?.id || ''), [level]);

    const mainClassId = useMemo(() => isSpecialLevel ? `${level!.id}-main` : null, [isSpecialLevel, level]);
    const levelChildren = useMemo(() => {
        if (!mainClassId) return [];
        return children.filter(c => c.class_id === mainClassId);
    }, [children, mainClassId]);

    const handleDeleteChild = (id: string) => {
        if (window.confirm('هل أنت متأكد من رغبتك في حذف بيانات هذا الشاب/الطفل؟')) {
          setChildren(prev => prev.filter(child => child.id !== id));
          setNotification({ message: 'تم الحذف بنجاح.', type: 'success' });
        }
    };

    const handleEditChild = (id: string) => navigate(`/app/edit-child/${id}`);
    const handleViewCard = (id: string) => navigate(`/app/child/${id}/card`);

  const groupedClasses = useMemo(() => {
    if (!level || isSpecialLevel) return {};
    
    if (level.id === 'level-primary') {
      const groups: { [key: string]: ClassType[] } = {
        'مرحلة أولى وتانية': [],
        'مرحلة تالتة ورابعة': [],
        'مرحلة خامسة وسادسة': [],
      };
      levelClasses.forEach(cls => {
        if (['الصف الاول', 'الصف الثانى'].includes(cls.grade)) groups['مرحلة أولى وتانية'].push(cls);
        else if (['الصف الثالث', 'الصف الرابع'].includes(cls.grade)) groups['مرحلة تالتة ورابعة'].push(cls);
        else if (['الصف الخامس', 'الصف السادس'].includes(cls.grade)) groups['مرحلة خامسة وسادسة'].push(cls);
      });
      Object.values(groups).forEach(group => group.sort((a,b) => a.name.includes('بنين') ? -1 : 1));
      return groups;
    }

    const groups: Record<string, ClassType[]> = {};
    const hasSections = level.sections && level.sections.length > 0;

    levelClasses.forEach(cls => {
        let groupName: string | null = null;
        const grade = cls.grade || 'غير محدد';

        if (hasSections) {
            groupName = findMatchingSection(grade, level.sections);
        }
        
        if (!groupName) {
            groupName = grade;
        }

        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(cls);
    });

    Object.values(groups).forEach(group => {
        group.sort((a, b) => {
             const aIsBoys = a.name.includes('بنين');
             const bIsBoys = b.name.includes('بنين');
             const aIsGirls = a.name.includes('بنات');
             const bIsGirls = b.name.includes('بنات');
             
             if(aIsBoys && bIsGirls) return -1;
             if(aIsGirls && bIsBoys) return 1;

             return a.name.localeCompare(b.name, 'ar');
        });
    });
    
    return groups;
  }, [levelClasses, level, isSpecialLevel]);
  
  const gradeGroupOrder = useMemo(() => {
    if (!level || isSpecialLevel) return [];
    if (level.id === 'level-primary') {
        return ['مرحلة أولى وتانية', 'مرحلة تالتة ورابعة', 'مرحلة خامسة وسادسة'];
    }
    const hasSections = level.sections && level.sections.length > 0;

    if (hasSections) {
        const orderedSections = level.sections.filter(section => groupedClasses[section]);
        const otherGroups = Object.keys(groupedClasses)
            .filter(g => !level.sections.includes(g))
            .sort((a,b) => a.localeCompare(b, 'ar'));
        return [...orderedSections, ...otherGroups];
    }

    return Object.keys(groupedClasses).sort((a,b) => a.localeCompare(b, 'ar'));
  }, [level, groupedClasses, isSpecialLevel]);

  const pageTitle = useMemo(() => {
    if (!level) return 'لم يتم العثور على المرحلة';
    if (division === 'boys') return `${level.name} (بنين)`;
    if (division === 'girls') return `${level.name} (بنات)`;
    return level.name;
  }, [level, division]);
  
  const sectionTitle = isSpecialLevel
    ? (isYouthLevel ? 'الشباب المسجلين' : 'الأطفال المسجلون')
    : 'الفصول';

  const addButtonText = isYouthLevel ? 'إضافة شاب' : 'إضافة طفل';

  if (!level) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-md">
            <BookOpenIcon className="w-24 h-24 text-red-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-700">لم يتم العثور على المرحلة</h2>
            <p className="text-slate-500 mt-2">قد يكون الرابط غير صحيح أو تم حذف المرحلة.</p>
            <button
                onClick={() => navigate('/app/settings')}
                className="mt-6 flex items-center gap-2 text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-200 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>العودة إلى الإعدادات</span>
            </button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
        <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
        >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>رجوع</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <StatCard icon={UsersIcon} title="إجمالي الخدام" value={totalServants} />
            <StatCard icon={UserIcon} title="إجمالي المخدومين" value={totalChildren} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <SecretaryNameCard title="الأمين العام" name={level.generalSecretary.name} />
            <SecretaryNameCard title="الأمين المساعد" name={level.assistantSecretary.name} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-6">
            <h2 className="text-xl font-bold text-slate-800">
                {sectionTitle}
            </h2>
            {isSpecialLevel && mainClassId && (
                <button onClick={() => navigate(`/app/add-child/${mainClassId}`)} className="flex-shrink-0 flex items-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
                    <PlusIcon className="w-5 h-5"/> {addButtonText}
                </button>
            )}
        </div>
        
        {isSpecialLevel ? (
            <ChildrenTable classChildren={levelChildren} onEdit={handleEditChild} onDelete={handleDeleteChild} onViewCard={handleViewCard} youthMode={isYouthLevel} />
        ) : (
            <div className="space-y-6">
                {gradeGroupOrder.map(groupName => {
                    const groupClasses = groupedClasses[groupName];
                    if (!groupClasses || groupClasses.length === 0) return null;
                    
                    return (
                        <CollapsibleGradeGroup
                            key={groupName}
                            title={groupName}
                            classes={groupClasses}
                            allChildren={children}
                        />
                    );
                })}
                 {levelClasses.length === 0 && (
                    <p className="text-center text-slate-500 py-8">لا توجد فصول مضافة لهذه المرحلة بعد.</p>
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

const getClassGender = (className: string): 'بنين' | 'بنات' | '' => {
    if (className.includes('بنين')) return 'بنين';
    if (className.includes('بنات')) return 'بنات';
    return '';
};

function findMatchingSection(grade: string, sections: string[]): string | null {
    if (sections.includes(grade)) {
        return grade;
    }
    const keywords = {
        'الاول': ['اولى'], 'الثانى': ['ثانية', 'تانية'], 'الثالث': ['ثالثة', 'تالتة'],
        'الرابع': ['رابعة'], 'الخامس': ['خامسة'], 'السادس': ['سادسة']
    };
    for (const [gradeNum, gradeWords] of Object.entries(keywords)) {
        if (grade.includes(gradeNum)) {
            for (const section of sections) {
                for (const word of gradeWords) {
                    if (section.includes(word)) return section;
                }
            }
        }
    }
    return null;
}

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; }> = ({ icon: Icon, title, value }) => (
    <div className="bg-white rounded-xl shadow p-4 flex items-center">
        <div className="p-3 rounded-lg mr-4 ml-2 bg-purple-500">
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const SecretaryNameCard: React.FC<{ title: string; name: string }> = ({ title, name }) => (
     <div className="bg-white rounded-xl shadow p-4 flex items-center">
        <div className="p-3 rounded-lg mr-4 ml-2 bg-slate-100">
            <UserIcon className="w-6 h-6 text-slate-600"/>
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-lg font-bold text-slate-800">{name || 'غير مسجل'}</p>
        </div>
    </div>
);


const CollapsibleGradeGroup: React.FC<{ title: string; classes: ClassType[]; allChildren: Child[] }> = ({ title, classes, allChildren }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (classes.length === 0) return null;

    return (
        <div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                aria-expanded={isExpanded}
            >
                <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="pr-4 pt-3 mt-2 space-y-1 border-r-2 border-slate-200">
                    {classes.map(cls => {
                        const gender = getClassGender(cls.name);
                        return (
                            <ReactRouterDOM.Link
                                to={`/app/class/${cls.id}`}
                                key={cls.id}
                                className="group flex items-center gap-4 p-2 rounded-md hover:bg-purple-50 transition-colors"
                            >
                                {gender ? (
                                    <span className="font-semibold text-slate-600 w-16 text-center">({gender})</span>
                                ) : (
                                    <span className="w-16 flex-shrink-0"></span>
                                )}
                                <span className="font-medium text-slate-700 group-hover:text-purple-600">{cls.name}</span>
                            </ReactRouterDOM.Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const ChildrenTable: React.FC<{
  classChildren: Child[];
  onEdit: (childId: string) => void;
  onDelete: (childId: string) => void;
  onViewCard: (childId: string) => void;
  youthMode: boolean;
}> = ({ classChildren, onEdit, onDelete, onViewCard, youthMode }) => {
 
  if (classChildren.length === 0) {
    return <p className="text-center text-slate-500 py-8">لا يوجد {youthMode ? 'شباب' : 'أطفال'} في هذه المرحلة بعد.</p>;
  }

  return (
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
            <tr>
            {['#', 'الصورة', 'الاسم', 'تاريخ الميلاد', 'الهواتف', 'ملاحظات', 'إجراءات'].map(h => (
                <th key={h} className="text-right p-3 font-semibold text-slate-600">{h}</th>
            ))}
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
            {classChildren.map((child, index) => (
            <tr key={child.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-700">{index + 1}</td>
                <td className="p-3"><img src={child.image || 'https://picsum.photos/200'} alt={child.name} className="w-12 h-12 rounded-full object-cover" /></td>
                <td className="p-3 font-medium text-slate-800">
                    <ReactRouterDOM.Link to={`/app/edit-child/${child.id}`} className="hover:underline text-purple-600">
                        {child.name}
                    </ReactRouterDOM.Link>
                </td>
                <td className="p-3 text-slate-600">{child.birthDate ? new Date(child.birthDate).toLocaleDateString('ar-EG-u-nu-latn') : 'N/A'}</td>
                <td className="p-3 text-slate-600 text-xs leading-5">
                    {child.fatherPhone && <div><span className="font-semibold">الأب:</span> {child.fatherPhone}</div>}
                    {child.motherPhone && <div className="mt-1"><span className="font-semibold">الأم:</span> {child.motherPhone}</div>}
                </td>
                <td className="p-3 text-slate-600 truncate max-w-xs">{child.notes}</td>
                <td className="p-3">
                <div className="flex gap-1">
                    <button onClick={() => onEdit(child.id)} className="p-2 text-purple-600 hover:text-purple-800" aria-label={`تعديل ${child.name}`}><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => onDelete(child.id)} className="p-2 text-red-600 hover:text-red-800" aria-label={`حذف ${child.name}`}><TrashIcon className="w-5 h-5" /></button>
                    <button onClick={() => onViewCard(child.id)} className="p-2 text-purple-600 hover:text-purple-800" aria-label={`عرض كارت ${child.name}`}><IdIcon className="w-5 h-5" /></button>
                </div>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    </div>
  );
};


export default LevelDetailsPage;