

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, Link, Navigate } from 'react-router-dom';
import type { Settings, EducationLevel, Class as ClassType, Servant, User, AppState, NotificationItem, Child, UserRole } from '../types';
import { 
    EditIcon, TrashIcon, PlusIcon, ChevronDownIcon, 
    UserIcon, BellIcon, ImageIcon, UsersIcon, XIcon, BookOpenIcon, UserPlusIcon, ArrowLeftIcon
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
        navigate('/app/dashboard', { replace: true });
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
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">الإداريات</h1>
            <p className="text-slate-500 mt-1">إدارة الخدمات، المستخدمين، والصلاحيات.</p>
        </div>
        <button
            onClick={handleBack}
            className="btn btn-secondary"
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

const UserRoleSection: React.FC<{
  title: string;
  description?: string;
  users: User[];
  currentUser: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  hideDelete?: boolean;
  isEditDisabled?: (user: User) => boolean;
}> = ({ title, description, users, currentUser, onEdit, onDelete, hideDelete, isEditDisabled }) => (
    <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800 mb-1">{title}</h3>
        {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
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
            setSettings(prev => ({ ...prev, churchLogo: base64String }));
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
        };
        
        setNotifications(prev => [newNotification, ...prev]);

        showNotification('تم إرسال الإشعار لجميع المستخدمين!', 'success');
        setNotificationMessage('');
        setIsSendingNotification(false);
    }
        
    const roleTranslations: Record<UserRole, string> = {
        priest: 'الأباء الكهنة',
        general_secretary: 'امين عام',
        assistant_secretary: 'امين مساعد',
        secretary: 'أمين',
        level_secretary: 'امين مرحلة',
        class_supervisor: 'مسئول الفصل',
        servant: 'خادم',
    };
    
    const priests = users.filter(u => u.roles.includes('priest'));
    const generalSecretaries = users.filter(u => u.roles.includes('general_secretary'));
    const assistantSecretaries = users.filter(u => u.roles.includes('assistant_secretary'));
    const secretaries = users.filter(u => u.roles.includes('secretary'));
    const levelSecretaries = users.filter(u => u.roles.includes('level_secretary'));
    const classSupervisors = users.filter(u => u.roles.includes('class_supervisor'));
    const servantUsers = users.filter(u => u.roles.includes('servant'));
    
    const handleLevelIdChange = (index: number, value: string) => {
        setUserForm(prev => {
            const newLevelIds = [...(prev.levelIds || [])];
            newLevelIds[index] = value;
            return { ...prev, levelIds: newLevelIds };
        });
    };

    const addLevelIdField = () => {
        setUserForm(prev => ({ ...prev, levelIds: [...(prev.levelIds || []), ''] }));
    };

    const removeLevelIdField = (index: number) => {
        setUserForm(prev => {
            const newLevelIds = [...(prev.levelIds || [])];
            newLevelIds.splice(index, 1);
            return { ...prev, levelIds: newLevelIds };
        });
    };

    const handleNewUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'nationalId') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 14) {
                setNewUserForm(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setNewUserForm(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAddNewUser = () => {
        const { displayName, nationalId, password, role } = newUserForm;
    
        if (!displayName.trim() || !nationalId.trim() || !password.trim()) {
            showNotification('يرجى ملء جميع الحقول المطلوبة.', 'error');
            return;
        }
        if (nationalId.length !== 14) {
            showNotification('الرقم القومي يجب أن يتكون من 14 رقمًا.', 'error');
            return;
        }
        if (users.some(u => u.username === nationalId || u.nationalId === nationalId)) {
            showNotification('الرقم القومي أو اسم المستخدم هذا مسجل بالفعل.', 'error');
            return;
        }
    
        const newServantId = `servant-${Date.now()}`;
        const newServant: Servant = {
          id: newServantId,
          name: displayName.trim(),
          phone: '',
          email: '',
          address: '',
          notes: `تم إنشاؤه بواسطة المدير العام.`,
          serviceAssignments: [],
        };
        setServants(prev => [...prev, newServant]);
    
        const newUser: User = {
            id: `user-${Date.now()}`,
            username: nationalId,
            password: password,
            displayName: displayName.trim(),
            nationalId: nationalId,
            roles: [role],
            servantId: newServantId,
            profileComplete: true,
        };
        setUsers(prev => [...prev, newUser]);
        
        showNotification('تم إضافة المستخدم والخادم بنجاح!', 'success');
        setNewUserForm({
            displayName: '',
            nationalId: '',
            password: '',
            role: 'servant' as UserRole,
        });
    };
    
    const roleOptions = Object.entries(roleTranslations)
        .filter(([roleKey]) => !(isPriest && roleKey === 'general_secretary'));

    const renderUserEditFormContent = () => {
        const isSpecialUser = editingUser?.nationalId === SUPER_ADMIN_NATIONAL_ID;

        const handleSingleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newRole = e.target.value as UserRole;
            setUserForm(prev => ({
                ...prev,
                roles: [newRole]
            }));
        };

        return (
            <div ref={formRef} className="pt-6 mt-4 border-t border-slate-200 animate-fade-in">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">{editingUser ? `تعديل المستخدم: ${editingUser.displayName}` : 'إضافة مستخدم جديد'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <InputField label="الاسم كامل ثلاثى" name="displayName" value={userForm.displayName} onChange={handleUserFormChange} />
                    <div>
                        <label htmlFor="nationalId" className="block text-xs font-medium text-slate-700 mb-1">الرقم القومي</label>
                        <input
                            type="text"
                            id="nationalId"
                            name="nationalId"
                            value={userForm.nationalId || ''}
                            onChange={handleUserFormChange}
                            className="form-input text-sm"
                            maxLength={14}
                            placeholder="14 رقم"
                        />
                    </div>
                    <InputField label="اسم المستخدم (للدخول)" name="username" value={userForm.username} onChange={handleUserFormChange} />
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">كلمة المرور {editingUser && '(اختياري للتغيير)'}</label>
                        <input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} className="form-input text-sm"/>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">الأدوار</label>
                        {isSpecialUser ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                {roleOptions.map(([roleKey, roleName]) => (
                                    <label key={roleKey} className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                                        <input
                                            type="checkbox"
                                            checked={(userForm.roles || []).includes(roleKey as UserRole)}
                                            onChange={(e) => handleRolesChange(roleKey as UserRole, e.target.checked)}
                                            className="form-checkbox h-4 w-4 text-violet-600 rounded focus:ring-violet-500"
                                            disabled={(roleKey === 'general_secretary' && userForm.id === currentUser.id) || (isPriest && roleKey === 'general_secretary')}
                                        />
                                        <span className="text-sm font-medium">{roleName}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                             <select
                                className="form-select mt-2"
                                value={userForm.roles[0] || 'servant'}
                                onChange={handleSingleRoleChange}
                            >
                                {roleOptions.map(([roleKey, roleName]) => (
                                    <option key={roleKey} value={roleKey}>{roleName}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">المرحلة التى يخدم بها</label>
                        {(userForm.levelIds || []).map((levelId, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <select
                                    value={levelId}
                                    onChange={(e) => handleLevelIdChange(index, e.target.value)}
                                    className="form-select text-sm flex-grow"
                                >
                                    <option value="">-- اختر مرحلة --</option>
                                    {appState.levels.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => removeLevelIdField(index)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addLevelIdField}
                            className="w-full text-sm flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300"
                        >
                            <PlusIcon className="w-4 h-4" />
                            إضافة مرحلة خدمة أخرى
                        </button>
                    </div>

                    <div className="flex gap-2 md:col-span-2 justify-end">
                        {editingUser && <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" title="إلغاء التعديل">إلغاء</button>}
                        <button type="button" onClick={handleSaveUser} className="btn btn-primary">{editingUser ? 'حفظ التعديلات' : 'إضافة مستخدم'}</button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <SettingsSection title="بيانات الكنيسة" icon={BookOpenIcon}>
                 <div className="bg-white p-3 rounded-lg flex justify-center items-center border border-slate-200">
                    <span className="font-semibold text-slate-800 text-center">كاتدرائية العذراء مريم والشهيد مارمينا العجايبي ( بمنيا القمح )</span>
                 </div>
                 <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <ImageUploader simple label="شعار الكنيسة" imageSrc={settings.churchLogo} onChange={handleChurchLogoChange} />
                 </div>
            </SettingsSection>
            
            <SettingsSection title="إرسال إشعار للجميع" icon={BellIcon}>
                 <p className="text-sm text-slate-500 -mt-2 mb-2">سيظهر هذا الإشعار لجميع المستخدمين في أيقونة الجرس.</p>
                 <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="اكتب رسالة الإشعار هنا..."
                    rows={3}
                    className="form-textarea"
                    disabled={isSendingNotification}
                />
                <div className="text-left">
                    <button onClick={handleSendGlobalNotification} disabled={isSendingNotification} className="btn btn-primary">
                    {isSendingNotification ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                    </button>
                </div>
            </SettingsSection>

            <div className="space-y-6">
                <UserRoleSection 
                    title="الأباء الكهنة"
                    description="بيانات الأباء الكهنة المسؤولين عن الخدمة."
                    users={priests} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    hideDelete={true}
                />
                <UserRoleSection 
                    title="المديريين" 
                    users={generalSecretaries} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    hideDelete={true}
                    isEditDisabled={(user) => isPriest && user.nationalId === SUPER_ADMIN_NATIONAL_ID}
                />
                <UserRoleSection 
                    title="الأمناء" 
                    users={secretaries} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                />
                 <UserRoleSection 
                    title="الأمناء المساعدون" 
                    users={assistantSecretaries} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                />
                 <UserRoleSection 
                    title="أمناء المراحل" 
                    users={levelSecretaries} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                />
                <UserRoleSection 
                    title="مسؤولو الفصول"
                    description="يشمل أمناء الخدمة والخدام المسؤولين عن الفصول."
                    users={classSupervisors} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                />
                 <UserRoleSection 
                    title="الخدام" 
                    users={servantUsers} 
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                />
            </div>
            
            {editingUser && renderUserEditFormContent()}
            
            <div ref={addUserFormRef} className="pt-8 mt-8 border-t-2 border-slate-200">
                <SettingsSection title="إضافة مستخدم جديد" icon={UserPlusIcon}>
                    <p className="text-sm text-slate-500 -mt-2 mb-4">
                      سيتم إنشاء ملف خادم مرتبط بهذا المستخدم تلقائياً.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <InputField label="الاسم كامل ثلاثى" name="displayName" value={newUserForm.displayName} onChange={handleNewUserFormChange} />
                        <div>
                            <label htmlFor="newUserNationalId" className="block text-xs font-medium text-slate-700 mb-1">الرقم القومي (14 رقم)</label>
                            <input
                                type="text"
                                id="newUserNationalId"
                                name="nationalId"
                                value={newUserForm.nationalId}
                                onChange={handleNewUserFormChange}
                                className="form-input text-sm"
                                maxLength={14}
                                placeholder="يُستخدم كاسم للمستخدم"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">كلمة المرور</label>
                            <input type="password" name="password" value={newUserForm.password} onChange={e => handleNewUserFormChange(e as any)} className="form-input text-sm"/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">الدور</label>
                            <select name="role" value={newUserForm.role} onChange={e => handleNewUserFormChange(e as any)} className="form-select">
                              {roleOptions.map(([roleKey, roleName]) => (
                                <option key={roleKey} value={roleKey}>{roleName}</option>
                              ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="button" onClick={handleAddNewUser} className="btn btn-primary">إضافة المستخدم</button>
                    </div>
                </SettingsSection>
            </div>
        </div>
    )
}


const ServantNamesManager: React.FC<{
    names: string[],
    setNames: (names: string[]) => void
}> = ({ names, setNames }) => {
    
    const [nameToAdd, setNameToAdd] = useState('');

    const handleAddName = () => {
        if (nameToAdd.trim() && !names.includes(nameToAdd.trim())) {
            setNames([...names, nameToAdd.trim()]);
            setNameToAdd('');
        }
    }

    const handleRemoveName = (nameToRemove: string) => {
        setNames(names.filter(name => name !== nameToRemove));
    }

    return (
        <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700">خدام الفصل ({names.length})</h4>
            <div className="space-y-2">
                {names.map((name, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-slate-100 p-2 rounded-md">
                        <span className="">{name}</span>
                        <button type="button" onClick={() => handleRemoveName(name)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
                 {names.length === 0 && <p className="text-xs text-slate-500">لا يوجد خدام مضافين.</p>}
            </div>
            <div className="flex gap-2 items-end">
                <div className="w-full">
                    <label htmlFor="servant-name-input" className="block text-xs font-medium text-slate-400 mb-1">إضافة اسم خادم</label>
                    <input 
                        id="servant-name-input"
                        type="text"
                        value={nameToAdd}
                        onChange={e => setNameToAdd(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddName(); }}}
                        className="form-input text-sm"
                        placeholder="اكتب الاسم واضغط Enter"
                    />
                </div>
                <button type="button" onClick={handleAddName} className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 shrink-0"><PlusIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
}

const InputField: React.FC<{label:string, name:string, value: string, onChange: (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)=>void, type?: string}> = ({label, name, value, onChange, type='text'}) => (
    <div className="w-full">
        <label htmlFor={name} className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="form-input text-sm"
        />
    </div>
);

const ImageUploader: React.FC<{label: string, imageSrc?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void, simple?: boolean}> = ({label, imageSrc, onChange, simple}) => (
  <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="flex items-center gap-4">
        <div className={`bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 ${simple ? 'w-10 h-10' : 'w-16 h-16'}`}>
        {imageSrc ? (
            <img src={imageSrc} alt={label} className="w-full h-full object-cover" />
        ) : (
            <span className="text-xs text-slate-500 text-center p-1">لا يوجد</span>
        )}
        </div>
        <div>
        <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm transition-colors">
            {imageSrc ? `تغيير` : `رفع`}
            <input type="file" onChange={onChange} accept="image/*" className="hidden" />
        </label>
        </div>
    </div>
  </div>
);

const ClassModal: React.FC<{
    onClose: () => void,
    classToEdit: ClassType | null,
    appState: AppState,
    showNotification: (msg: string, type?: NotificationType['type']) => void,
}> = ({ onClose, classToEdit, appState, showNotification }) => {
    const { levels, servants, setClasses } = appState;
    
    const getInitialFormState = () => ({
        level_id: classToEdit?.level_id || '',
        name: classToEdit?.name || '',
        grade: classToEdit?.grade || '',
        supervisorName: classToEdit?.supervisorName || '',
        servantNames: classToEdit?.servantNames || [],
    });

    const [formState, setFormState] = useState(getInitialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.level_id || !formState.name) {
            showNotification('يرجى اختيار مرحلة وإدخال اسم الفصل.', 'error');
            return;
        }

        if (classToEdit) {
            setClasses(prev => prev.map(c => c.id === classToEdit.id ? { ...c, ...formState } : c));
            showNotification('تم تعديل الفصل بنجاح.');
        } else {
            const newClass: ClassType = {
                id: Date.now().toString(),
                ...formState,
                logo: '',
            };
            setClasses(prev => [...prev, newClass]);
            showNotification('تم إضافة الفصل بنجاح.');
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{classToEdit ? 'تعديل الفصل' : 'إضافة فصل جديد'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon className="w-6 h-6 text-slate-500"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="level_id" className="block text-sm font-medium text-slate-700 mb-1">المرحلة</label>
                        <select id="level_id" name="level_id" value={formState.level_id} onChange={handleChange} className="form-select" required>
                            <option value="" disabled>-- اختر مرحلة --</option>
                            {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1">الصف</label>
                        <input type="text" id="grade" name="grade" value={formState.grade} onChange={handleChange} className="form-input" placeholder="مثال: الصف الأول الابتدائي" />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">اسم الفصل</label>
                        <input type="text" id="name" name="name" value={formState.name} onChange={handleChange} className="form-input" required placeholder="مثال: فصل القديس مارمرقس" />
                    </div>
                    <div>
                        <label htmlFor="supervisorName" className="block text-sm font-medium text-slate-700 mb-1">المشرف</label>
                        <select id="supervisorName" name="supervisorName" value={formState.supervisorName} onChange={handleChange} className="form-select">
                            <option value="">-- لم يعين --</option>
                            {servants.map(servant => <option key={servant.id} value={servant.name}>{servant.name}</option>)}
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-secondary">إلغاء</button>
                        <button type="submit" className="btn btn-primary">{classToEdit ? 'حفظ التغييرات' : 'إضافة الفصل'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdministrativesPage;