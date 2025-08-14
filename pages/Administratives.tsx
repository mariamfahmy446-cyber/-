

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, Link, Navigate } from 'react-router-dom';
import type { Settings, EducationLevel, Class as ClassType, Servant, User, AppState, NotificationItem, Child, UserRole } from '../types';
import { 
    EditIcon, TrashIcon, PlusIcon, ChevronDownIcon, 
    UserIcon, BellIcon, ImageIcon, UsersIcon, XIcon, BookOpenIcon, UserPlusIcon, ArrowLeftIcon, PhoneIcon
} from '../components/Icons';
import Notification from '../components/Notification';


interface OutletContextType {
  appState: AppState;
}

type Tab = 'levelsAndClasses' | 'users';

type NotificationType = {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

const PRIMARY_GRADES = ['الصف الاول', 'الصف الثانى', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];

const MultiSelect: React.FC<{
    options: { value: string, label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label: string;
}> = ({ options, selected, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(s => s !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="form-select text-right w-full flex justify-between items-center"
            >
                <span className="truncate">{selected.length > 0 ? selected.join(', ') : 'اختر الخدام'}</span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-100"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option.value)}
                                readOnly
                                className="form-checkbox text-violet-600"
                            />
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ClassModal: React.FC<{
    onClose: () => void;
    classToEdit: ClassType | null;
    appState: AppState;
    showNotification: (msg: string, type?: NotificationType['type']) => void;
}> = ({ onClose, classToEdit, appState, showNotification }) => {
    const { levels, servants, classes, setClasses } = appState;
    const isEditMode = !!classToEdit;

    const getInitialClassState = (): Omit<ClassType, 'id'> => ({
        level_id: '',
        grade: '',
        name: '',
        supervisorName: '',
        servantNames: [],
    });

    const [classData, setClassData] = useState<Omit<ClassType, 'id'>>(() => {
        if (classToEdit) {
            return {
                level_id: classToEdit.level_id,
                grade: classToEdit.grade,
                name: classToEdit.name,
                supervisorName: classToEdit.supervisorName || '',
                servantNames: classToEdit.servantNames || [],
            };
        }
        return getInitialClassState();
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClassData(prev => ({...prev, [name]: value}));
    };
    
    const handleServantsChange = (selectedNames: string[]) => {
        setClassData(prev => ({ ...prev, servantNames: selectedNames }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!classData.level_id || !classData.grade.trim() || !classData.name.trim()) {
            showNotification('يرجى ملء جميع الحقول المطلوبة.', 'error');
            return;
        }

        if (isEditMode && classToEdit) {
            setClasses(prev => prev.map(c => c.id === classToEdit.id ? { ...classToEdit, ...classData } : c));
            showNotification('تم تعديل الفصل بنجاح.', 'success');
        } else {
            const newClass: ClassType = {
                id: `class-${Date.now()}`,
                ...classData,
            };
            setClasses(prev => [...prev, newClass]);
            showNotification('تم إضافة الفصل بنجاح.', 'success');
        }
        onClose();
    };

    const isPrimary = useMemo(() => {
        const selectedLevel = levels.find(l => l.id === classData.level_id);
        return selectedLevel?.id === 'level-primary';
    }, [classData.level_id, levels]);
    
    const servantOptions = useMemo(() => {
        return servants.map(s => ({ value: s.name, label: s.name }));
    }, [servants]);

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">{isEditMode ? 'تعديل فصل' : 'إضافة فصل جديد'}</h2>
                        <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><XIcon className="w-5 h-5"/></button>
                    </div>

                    <div>
                        <label htmlFor="level_id" className="block text-sm font-medium text-slate-700 mb-1">المرحلة</label>
                        <select name="level_id" id="level_id" value={classData.level_id} onChange={handleChange} className="form-select" required>
                            <option value="" disabled>-- اختر مرحلة --</option>
                            {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1">الصف</label>
                        {isPrimary ? (
                             <select name="grade" id="grade" value={classData.grade} onChange={handleChange} className="form-select" required>
                                <option value="" disabled>-- اختر الصف --</option>
                                {PRIMARY_GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                            </select>
                        ) : (
                            <input type="text" id="grade" name="grade" value={classData.grade} onChange={handleChange} className="form-input" required placeholder="مثال: اولى اعدادى"/>
                        )}
                    </div>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">اسم الفصل</label>
                        <input type="text" id="name" name="name" value={classData.name} onChange={handleChange} className="form-input" required placeholder="مثال: بنين, بنات, فصل الرجاء"/>
                    </div>
                    
                     <div>
                        <label htmlFor="supervisorName" className="block text-sm font-medium text-slate-700 mb-1">مشرف الفصل</label>
                        <select name="supervisorName" id="supervisorName" value={classData.supervisorName} onChange={handleChange} className="form-select">
                            <option value="">-- اختر مشرف --</option>
                            {servants.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    
                    <MultiSelect
                        label="خدام الفصل"
                        options={servantOptions}
                        selected={classData.servantNames || []}
                        onChange={handleServantsChange}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn btn-secondary">إلغاء</button>
                        <button type="submit" className="btn btn-primary">{isEditMode ? 'حفظ التعديلات' : 'إضافة الفصل'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const QuickActions: React.FC<{
    onAddClass: () => void;
    onAddUser: () => void;
    canManageLevels: boolean;
    canManageUsers: boolean;
}> = ({ onAddClass, onAddUser, canManageLevels, canManageUsers }) => {
  const navigate = useNavigate();

  const actions = [
    { label: 'إضافة خدمة', icon: UsersIcon, onClick: () => navigate('/app/add-level'), enabled: canManageLevels },
    { label: 'إضافة فصل', icon: BookOpenIcon, onClick: onAddClass, enabled: canManageLevels },
    { label: 'إضافة مستخدم', icon: UserPlusIcon, onClick: onAddUser, enabled: canManageUsers },
    { label: 'إضافة خادم', icon: UserPlusIcon, onClick: () => navigate('/app/add-servant'), enabled: canManageLevels },
    { label: 'إضافة طفل', icon: UserPlusIcon, onClick: () => navigate('/app/add-child'), enabled: canManageLevels },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-lg font-bold text-slate-800 mb-4">إجراءات سريعة</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <button 
            key={index} 
            onClick={action.onClick} 
            disabled={!action.enabled}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-violet-50 hover:border-violet-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50"
            title={!action.enabled ? 'غير مسموح لك' : ''}
          >
            <action.icon className="w-8 h-8 text-violet-500" />
            <span className="text-sm font-semibold text-slate-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


const AdministrativesPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { levels, setLevels, classes, setClasses, children, setChildren, currentUser } = appState;
  const navigate = useNavigate();

  if (currentUser?.roles.includes('servant')) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  const addUserFormRef = useRef<HTMLDivElement>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassType | null>(null);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app', { replace: true });
    }
  };
  
  const isLevelsTabReadOnly = useMemo(() => {
    if (!currentUser) return true;
    const secretaryRoles: UserRole[] = ['secretary', 'assistant_secretary', 'level_secretary'];
    return secretaryRoles.some(role => currentUser.roles.includes(role));
  }, [currentUser]);

  const canViewUsersTab = useMemo(() => currentUser?.roles.includes('general_secretary') || currentUser?.roles.includes('priest'), [currentUser]);
  
  const [activeTab, setActiveTab] = useState<Tab>(canViewUsersTab ? 'users' : 'levelsAndClasses');
  const [notification, setNotification] = useState<NotificationType | null>(null);


  const showNotification = (message: string, type: NotificationType['type'] = 'success') => {
      setNotification({ message, type });
  };

  const handleAddNewClass = () => {
    setClassToEdit(null);
    setIsClassModalOpen(true);
  };
  
  const handleEditClass = (cls: ClassType) => {
    setClassToEdit(cls);
    setIsClassModalOpen(true);
  };

  const handleGoToAddUser = () => {
    if (!canViewUsersTab) return;
    setActiveTab('users');
    setTimeout(() => {
        addUserFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
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
        <div>
            <h1 className="text-3xl font-bold text-slate-900">الإداريات</h1>
            <p className="text-slate-500 mt-1">إدارة الخدمات، المستخدمين، والصلاحيات.</p>
        </div>
        <button
            onClick={handleBack}
            className="btn btn-secondary self-start sm:self-auto"
        >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>رجوع</span>
        </button>
      </div>

      <QuickActions 
        onAddClass={handleAddNewClass}
        onAddUser={handleGoToAddUser}
        canManageLevels={!isLevelsTabReadOnly}
        canManageUsers={canViewUsersTab}
      />


      <div className="bg-white rounded-lg shadow-lg">
          <div className="p-2 border-b border-slate-200">
            <nav className="flex gap-2 flex-wrap">
              {canViewUsersTab && <TabButton name="إدارة المستخدمين" tab="users" activeTab={activeTab} setActiveTab={setActiveTab} />}
              <TabButton name="ادارة الخدمات" tab="levelsAndClasses" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'levelsAndClasses' && <LevelsAndClassesSettings appState={appState} levels={levels} setLevels={setLevels} classes={classes} setClasses={setClasses} children={children} setChildren={setChildren} showNotification={showNotification} isReadOnly={isLevelsTabReadOnly} onEditClass={handleEditClass} />}
            {activeTab === 'users' && canViewUsersTab && <UsersSettings appState={appState} showNotification={showNotification} addUserFormRef={addUserFormRef} />}
          </div>
      </div>

      {isClassModalOpen && !isLevelsTabReadOnly && (
        <ClassModal
            onClose={() => setIsClassModalOpen(false)}
            classToEdit={classToEdit}
            appState={appState}
            showNotification={showNotification}
        />
      )}
    </div>
  );
};

const TabButton: React.FC<{name: string, tab: Tab, activeTab: Tab, setActiveTab: (t: Tab) => void}> = ({ name, tab, activeTab, setActiveTab }) => {
    const isActive = activeTab === tab;
    return (
        <button
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 rounded-md font-semibold text-sm transition-colors ${isActive ? 'bg-violet-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {name}
        </button>
    );
}

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


const LevelsAndClassesSettings: React.FC<{
    appState: AppState,
    levels: EducationLevel[], 
    setLevels: React.Dispatch<React.SetStateAction<EducationLevel[]>>,
    classes: ClassType[],
    setClasses: React.Dispatch<React.SetStateAction<ClassType[]>>,
    children: Child[],
    setChildren: React.Dispatch<React.SetStateAction<Child[]>>,
    showNotification: (msg: string, type?: NotificationType['type']) => void,
    isReadOnly: boolean;
    onEditClass: (cls: ClassType) => void;
}> = ({ appState, levels, setLevels, classes, setClasses, children, setChildren, showNotification, isReadOnly, onEditClass }) => {
    const navigate = useNavigate();
    
    const sortedLevels = useMemo(() => {
        const order = ['level-nursery', 'level-primary', 'level-preparatory', 'level-secondary', 'level-university', 'level-graduates'];
        return [...levels].sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA > -1 && indexB > -1) return indexA - indexB;
            if (indexA > -1) return -1;
            if (indexB > -1) return 1;
            return a.name.localeCompare(b.name, 'ar');
        });
    }, [levels]);
    
    const handleDeleteLevel = (id: string) => {
        if(window.confirm('هل أنت متأكد؟ سيتم حذف هذه الخدمة وكل الفصول والأطفال التابعين لها.')) {
            const classesInLevel = classes.filter(c => c.level_id === id).map(c => c.id);
            const classIdsToDelete = new Set(classesInLevel);

            setLevels(prev => prev.filter(l => l.id !== id));
            setClasses(prev => prev.filter(c => c.level_id !== id));
            setChildren(prev => prev.filter(child => !classIdsToDelete.has(child.class_id)));
            
            showNotification('تم حذف الخدمة.');
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-800">قائمة الخدمات</h3>
            </div>
            
            <div className="space-y-4">
                {sortedLevels.map(level => (
                    <CollapsibleLevelItem 
                        key={level.id}
                        level={level}
                        classes={classes.filter(c => c.level_id === level.id)}
                        onDeleteLevel={handleDeleteLevel}
                        onEditClass={onEditClass}
                        isReadOnly={isReadOnly}
                    />
                ))}
            </div>
        </div>
    );
};

const CollapsibleLevelItem: React.FC<{
    level: EducationLevel,
    classes: ClassType[],
    onDeleteLevel: (id: string) => void,
    isReadOnly: boolean,
    onEditClass: (cls: ClassType) => void,
}> = ({ level, classes, onDeleteLevel, isReadOnly, onEditClass }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    
    const isExpandable = useMemo(() => ['level-preparatory', 'level-secondary'].includes(level.id), [level.id]);
    
    const handleRowClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        if (isExpandable) {
            setIsExpanded(p => !p);
        } else {
            navigate(`/app/level/${level.id}`);
        }
    };

    const levelDescription = useMemo(() => {
        const isSpecialLevel = ['level-nursery', 'level-university', 'level-graduates'].includes(level.id);
        if (isSpecialLevel) {
            return 'خدمة عامة';
        }

        const isPrimary = level.id === 'level-primary';
        if (isPrimary) {
             const primaryGroupedClasses = {
                'مرحلة أولى وتانية': classes.filter(cls => ['الصف الاول', 'الصف الثانى'].includes(cls.grade)),
                'مرحلة تالتة ورابعة': classes.filter(cls => ['الصف الثالث', 'الصف الرابع'].includes(cls.grade)),
                'مرحلة خامسة وسادسة': classes.filter(cls => ['الصف الخامس', 'الصف السادس'].includes(cls.grade)),
            };
            const groupCount = Object.values(primaryGroupedClasses).filter(g => g.length > 0).length;
            if (groupCount > 0) return `${groupCount} مراحل`;
        }
        
        if (level.divisions && level.divisions.length > 0) {
            return `${level.divisions.length} أقسام`;
        }
        return `${classes.length} فصول`;
    }, [level, classes]);
    
    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className={`flex justify-between items-center ${!isExpandable ? 'cursor-pointer' : ''}`} onClick={handleRowClick}>
                <div className='flex items-center gap-3'>
                    {level.logo ? <img src={level.logo} alt="logo" className="w-10 h-10 rounded-md object-contain bg-white p-0.5" /> : <div className="w-10 h-10 rounded-md bg-slate-200"/>}
                    <div>
                        <span className="font-bold text-lg text-slate-800">{level.name}</span>
                        <p className="text-xs text-slate-500">{levelDescription}</p>
                    </div>
                     {isExpandable && (
                         <button onClick={(e) => { e.stopPropagation(); setIsExpanded(p => !p); }} className="p-2 text-slate-600 hover:bg-slate-200 rounded-full" title="عرض الفصول/الأقسام">
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                         </button>
                    )}
                </div>
                <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/app/edit-level/${level.id}`) }} className="p-2 text-violet-500 hover:bg-violet-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" title={isReadOnly ? 'غير مسموح بالتعديل' : "تعديل الخدمة"} disabled={isReadOnly}><EditIcon className="w-5 h-5"/></button>
                </div>
            </div>
            {isExpanded && isExpandable && (
                 <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
                    {level.divisions && level.divisions.length > 0 && (
                        <div className="pl-4 space-y-2">
                            {level.divisions.map(division => (
                                <div 
                                    key={division.type}
                                    onClick={() => navigate(`/app/level/${level.id}?division=${division.type}`)}
                                    className="group flex items-center justify-between p-3 rounded-lg bg-white border cursor-pointer hover:bg-violet-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-200 text-slate-600 rounded-full">
                                            <UsersIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-slate-800">{division.name}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/app/edit-level/${level.id}?division=${division.type}`);
                                        }}
                                        className="p-2 text-violet-500 hover:bg-violet-100 rounded-full z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={isReadOnly ? 'غير مسموح بالتعديل' : `تعديل قسم ${division.name}`}
                                        disabled={isReadOnly}
                                    >
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PriestCard: React.FC<{ 
    user: User, 
    servant?: Servant,
    onEdit: (user: User) => void;
    isEditDisabled?: (user: User) => boolean;
}> = ({ user, servant, onEdit, isEditDisabled }) => {
    const editIsDisabled = isEditDisabled ? isEditDisabled(user) : false;
    return (
        <div className="relative bg-white rounded-xl shadow-md p-4 flex flex-col items-center text-center w-44 border border-slate-200">
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(user); }} 
                className="absolute top-2 right-2 p-1.5 text-slate-500 hover:bg-slate-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed z-10" 
                title="تعديل" 
                disabled={editIsDisabled}
            >
                <EditIcon className="w-4 h-4"/>
            </button>
            <img 
                src={servant?.image || `https://i.pravatar.cc/150?u=${user.id}`} 
                alt={user.displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
            />
            <h3 className="font-bold text-lg text-slate-800 mt-3">{user.displayName}</h3>
            <div className="mt-2 text-sm text-slate-500 space-y-1">
                {servant?.phone && (
                    <div className="flex items-center justify-center gap-2">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{servant.phone}</span>
                    </div>
                )}
                <div className="flex items-center justify-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>@{user.username}</span>
                </div>
            </div>
        </div>
    );
};


const UserRoleSection: React.FC<{
  title: string;
  users: User[];
  servants: Servant[];
  currentUser: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  hideDelete?: boolean;
  isEditDisabled?: (user: User) => boolean;
}> = ({ title, users, servants, currentUser, onEdit, onDelete, hideDelete, isEditDisabled }) => {
    
    if (title === 'الأباء الكهنة') {
        return (
            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 mb-1">{title}</h3>
                {users.length > 0 ? (
                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                        {users.map(user => {
                            const servant = servants.find(s => s.id === user.servantId);
                            return <PriestCard key={user.id} user={user} servant={servant} onEdit={onEdit} isEditDisabled={isEditDisabled} />;
                        })}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-4">لا يوجد مستخدمون في هذا الدور.</p>
                )}
            </div>
        );
    }
    
    return (
        <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-1">{title}</h3>
            {users.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="text-right p-3 font-semibold text-slate-600">اسم العرض</th>
                                <th className="text-right p-3 font-semibold text-slate-600">الرقم القومي</th>
                                <th className="text-right p-3 font-semibold text-slate-600">اسم المستخدم</th>
                                <th className="text-center p-3 font-semibold text-slate-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="p-3 font-medium text-slate-800">
                                        {user.servantId ? (
                                            <Link to={`/app/servant-profile/${user.servantId}`} className="text-violet-600 hover:underline">
                                                {user.displayName}
                                            </Link>
                                        ) : (
                                            user.displayName
                                        )}
                                    </td>
                                    <td className="p-3 text-slate-600 font-mono">{user.nationalId || '-'}</td>
                                    <td className="p-3 text-slate-600 font-mono">@{user.username}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => onEdit(user)} className="p-2 text-violet-500 hover:bg-violet-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" title="تعديل" disabled={isEditDisabled?.(user)}><EditIcon className="w-5 h-5"/></button>
                                            {!hideDelete && (
                                                <button onClick={() => onDelete(user.id)} disabled={user.id === currentUser.id} className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-slate-500 py-4">لا يوجد مستخدمون في هذا الدور.</p>
            )}
        </div>
    );
};


const UsersSettings: React.FC<{appState: AppState, showNotification: (msg: string, type?: NotificationType['type']) => void, addUserFormRef: React.RefObject<HTMLDivElement>}> = ({ appState, showNotification, addUserFormRef }) => {
    const { users, setUsers, currentUser, servants, setServants, settings, setSettings, setNotifications } = appState;

    const SUPER_ADMIN_NATIONAL_ID = '29908241301363';

    const getInitialUserFormState = () => ({ id: '', displayName: '', username: '', password: '', roles: ['servant'] as UserRole[], servantId: '', levelIds: [] as string[], nationalId: '' });
    const [userForm, setUserForm] = useState(getInitialUserFormState());
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const formRef = React.useRef<HTMLDivElement>(null);

    const isPriest = useMemo(() => currentUser?.roles.includes('priest') && !currentUser?.roles.includes('general_secretary'), [currentUser]);

    const [newUserForm, setNewUserForm] = useState({
        displayName: '',
        nationalId: '',
        password: '',
        role: 'servant' as UserRole,
    });
    
    const handleChurchLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setSettings(prev => ({ ...prev, churchLogo: base64String, schoolLogo: base64String }));
            showNotification('تم تحديث الشعار بنجاح.');
          };
          reader.readAsDataURL(file);
        }
    };

    if (!currentUser) return null;
    
    const canManageUsers = currentUser.roles.includes('general_secretary') || currentUser.roles.includes('priest');

    if (!canManageUsers) {
        return (
            <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg">
                <h3 className="font-bold text-lg">وصول محدود</h3>
                <p>هذه الصفحة متاحة للمدير العام والآباء الكهنة فقط.</p>
            </div>
        );
    }

    const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'nationalId') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 14) {
                setUserForm(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setUserForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleRolesChange = (role: UserRole, isChecked: boolean) => {
        setUserForm(prev => {
            const currentRoles = new Set<UserRole>(prev.roles || []);
            if (isChecked) {
                if (isPriest && role === 'general_secretary') {
                    showNotification('غير مصرح لك بإضافة مديرين.', 'error');
                    return prev;
                }
                currentRoles.add(role);
            } else {
                if (role === 'general_secretary' && prev.id === currentUser?.id) {
                    showNotification('لا يمكن إزالة دور المدير العام.', 'error');
                    return prev;
                }
                if (currentRoles.size <= 1) {
                    showNotification('يجب أن يكون للمستخدم دور واحد على الأقل.', 'error');
                    return prev;
                }
                currentRoles.delete(role);
            }
            return { ...prev, roles: Array.from(currentRoles) };
        });
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserForm({ ...user, password: '', roles: user.roles || [], servantId: user.servantId || '', levelIds: user.levelIds || [], nationalId: user.nationalId || '' });
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setUserForm(getInitialUserFormState());
    };

    const handleSaveUser = () => {
        if (!userForm.displayName || !userForm.username) {
            showNotification('يرجى ملء الاسم كامل ثلاثى واسم المستخدم.', 'error');
            return;
        }
        
        if (userForm.nationalId && userForm.nationalId.length > 0 && userForm.nationalId.length !== 14) {
            showNotification('الرقم القومي يجب أن يتكون من 14 رقمًا.', 'error');
            return;
        }

        const finalUserForm = {
            ...userForm,
            roles: userForm.roles.length > 0 ? userForm.roles : (['servant'] as UserRole[]),
            levelIds: userForm.levelIds?.filter(id => id) || []
        };

        if (editingUser) {
            // Editing user
            if (users.some(u => u.username === userForm.username && u.id !== editingUser.id)) {
                showNotification('اسم المستخدم هذا موجود بالفعل.', 'error');
                return;
            }
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...finalUserForm, password: userForm.password || u.password } : u));
            showNotification('تم تعديل المستخدم بنجاح.');
        } else {
            // Adding new user
            if (!userForm.password) {
                showNotification('يرجى إدخال كلمة مرور للمستخدم الجديد.', 'error');
                return;
            }
            if (users.some(u => u.username === userForm.username)) {
                showNotification('اسم المستخدم هذا موجود بالفعل.', 'error');
                return;
            }
            const newUser: User = { ...finalUserForm, id: Date.now().toString() };
            setUsers(prev => [...prev, newUser]);
            showNotification('تمت إضافة المستخدم بنجاح.');
        }
        handleCancelEdit();
    };

    const handleDeleteUser = (userId: string) => {
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete?.nationalId === SUPER_ADMIN_NATIONAL_ID && isPriest) {
            showNotification('غير مسموح بحذف مدير الموقع.', 'error');
            return;
        }

        if (userId === currentUser?.id) {
            showNotification('لا يمكنك حذف حسابك الخاص.', 'error');
            return;
        }
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            showNotification('تم حذف المستخدم.');
        }
    };

    const handleSendGlobalNotification = () => {
        if (!notificationMessage.trim()) {
            showNotification('يرجى كتابة رسالة الإشعار.', 'error');
            return;
        }
        
        setIsSendingNotification(true);
        
        const newNotification: NotificationItem = {
            id: Date.now(),
            text: notificationMessage,
            time: 'الآن',
            read: false,
            icon: BellIcon,
            isImportant: true,
        };
        
        setNotifications(prev => [newNotification, ...prev]);

        showNotification('تم إرسال الإشعار لجميع المستخدمين!', 'success');
        setNotificationMessage('');
        setIsSendingNotification(false);
    }
        
    const roleTranslations: Record<UserRole, string> = {
        priest: 'الأباء الكهنة',
        general_secretary: 'مدير موقع',
        assistant_secretary: 'امين مساعد',
        secretary: 'أمين',
        level_secretary: 'امين مرحلة',
        class_supervisor: 'مسئول الفصل',
        servant: 'خادم',
    };
    
    const priests = users.filter(u => u.roles.includes('priest'));
    const generalSecretary = users.filter(u => u.roles.includes('general_secretary') && u.nationalId === SUPER_ADMIN_NATIONAL_ID);
    
    const higherRoles: UserRole[] = ['priest', 'general_secretary', 'assistant_secretary', 'secretary', 'level_secretary'];
    
    const secretaries = users.filter(u => u.roles.includes('secretary') && !u.roles.includes('general_secretary'));
    const levelSecretaries = users.filter(u => u.roles.includes('level_secretary') && !higherRoles.some(r => r !== 'level_secretary' && u.roles.includes(r)));
    const classSupervisors = users.filter(u => u.roles.includes('class_supervisor') && !higherRoles.some(r => r !== 'class_supervisor' && u.roles.includes(r)));
    const servantsOnly = users.filter(u => u.roles.includes('servant') && !u.roles.includes('class_supervisor') && !higherRoles.some(r => r !== 'servant' && u.roles.includes(r)));


    const isEditDisabled = (user: User) => {
        if (user.nationalId === SUPER_ADMIN_NATIONAL_ID && currentUser.nationalId !== SUPER_ADMIN_NATIONAL_ID) {
            return true;
        }
        return isPriest && user.roles.includes('general_secretary');
    };
    
    return (
        <div className="space-y-6">
            <SettingsSection title="بيانات الكنيسة" icon={ImageIcon}>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم الكنيسة</label>
                    <p className="form-input bg-slate-100 text-slate-600">{settings.churchName || 'غير محدد'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">شعار الكنيسة</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                        {settings.churchLogo ? (
                            <img src={settings.churchLogo} alt="Church Logo" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon className="w-10 h-10 text-slate-400" />
                        )}
                        </div>
                        <div>
                        <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm transition-colors">
                            {settings.churchLogo ? `تغيير الشعار` : `رفع شعار`}
                            <input type="file" onChange={handleChurchLogoChange} accept="image/*" className="hidden" />
                        </label>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="إرسال إشعار عام" icon={BellIcon}>
                 <p className="text-sm text-slate-500 -mt-2 mb-2">سيتم إرسال هذا الإشعار إلى جميع المستخدمين.</p>
                <textarea 
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="form-textarea w-full"
                    rows={3}
                    placeholder="اكتب رسالتك هنا..."
                />
                <div className="text-left">
                    <button onClick={handleSendGlobalNotification} disabled={isSendingNotification} className="btn btn-primary">
                        {isSendingNotification ? "جاري الإرسال..." : "إرسال الإشعار"}
                    </button>
                </div>
            </SettingsSection>
            
             <UserRoleSection
                title={roleTranslations.priest}
                users={priests}
                servants={servants}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isEditDisabled={isEditDisabled}
            />
             <UserRoleSection
                title={roleTranslations.general_secretary}
                users={generalSecretary}
                servants={servants}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isEditDisabled={(user) => user.nationalId === SUPER_ADMIN_NATIONAL_ID && currentUser.nationalId !== SUPER_ADMIN_NATIONAL_ID}
                hideDelete
            />
             <UserRoleSection
                title="امناء الخدمة"
                users={secretaries}
                servants={servants}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isEditDisabled={isEditDisabled}
            />
            <UserRoleSection
                title={roleTranslations.level_secretary}
                users={levelSecretaries}
                servants={servants}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isEditDisabled={isEditDisabled}
            />
             <UserRoleSection
                title={roleTranslations.class_supervisor}
                users={classSupervisors}
                servants={servants}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isEditDisabled={isEditDisabled}
            />
             <UserRoleSection
                title={roleTranslations.servant}
                users={servantsOnly}
                servants={servants}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isEditDisabled={isEditDisabled}
            />
        </div>
    );
}

export default AdministrativesPage;