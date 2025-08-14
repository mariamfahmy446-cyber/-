import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Settings, NotificationItem, User, UserRole } from '../types';
import { ArrowLeftIcon, HomeIcon, BellIcon, LogOutIcon, CheckIcon, XIcon, UserIcon, NotificationIconComponent } from './Icons';
import { kidsLogoBase64 } from '../assets';

interface HeaderProps {
  settings: Settings;
  language: string;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  currentUser: User | null;
  onLogout: () => void;
}

const translations = {
    ar: {
        dashboard: 'لوحة التحكم',
        settings: 'الإعدادات',
        mainMenu: 'القائمة الرئيسية',
        logo: 'شعار',
        goBack: 'رجوع',
        welcome: 'مرحباً',
        logout: 'تسجيل الخروج',
        notifications: 'الإشعارات',
        noNotifications: 'لا توجد إشعارات جديدة.',
        newNotificationsAppearHere: 'ستظهر الإشعارات الجديدة هنا.',
        markAllAsRead: 'تحديد الكل كمقروء',
        roleGeneralSecretary: 'مدير الموقع',
        roleAssistantSecretary: 'امين مساعد',
        roleSecretary: 'أمين',
        roleLevelSecretary: 'امين مرحلة',
        roleClassSupervisor: 'مسئول الفصل',
        roleServant: 'خادم',
        rolePriest: 'كاهن',
    },
    en: {
        dashboard: 'Dashboard',
        settings: 'Settings',
        mainMenu: 'Main Menu',
        logo: 'Logo',
        goBack: 'Back',
        welcome: 'Welcome',
        logout: 'Logout',
        notifications: 'Notifications',
        noNotifications: 'No new notifications.',
        newNotificationsAppearHere: 'New notifications will appear here.',
        markAllAsRead: 'Mark all as read',
        roleGeneralSecretary: 'Site Manager',
        roleAssistantSecretary: 'Assistant Secretary',
        roleSecretary: 'Secretary',
        roleLevelSecretary: 'Level Secretary',
        roleClassSupervisor: 'Class Supervisor',
        roleServant: 'Servant',
        rolePriest: 'Priest',
    }
}


const Header: React.FC<HeaderProps> = ({ settings, language, notifications, setNotifications, currentUser, onLogout }) => {
  const t = (key: keyof typeof translations.ar) => {
    const lang = language as keyof typeof translations;
    return translations[lang]?.[key] || translations.ar[key];
  }
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [viewingNotification, setViewingNotification] = useState<NotificationItem | null>(null);

  const visibleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => {
        return !n.targetUserId || n.targetUserId === currentUser.id;
    });
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => visibleNotifications.filter(n => !n.read).length, [visibleNotifications]);

  const handleLogout = () => {
    onLogout();
  }

  const handleViewNotification = (notification: NotificationItem) => {
    setViewingNotification(notification);
    // Also mark as read when viewed
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    setNotificationsOpen(false); // Close the dropdown
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotificationsOpen(false);
  }
  
  const getRoleTranslation = (roles?: User['roles']) => {
    if (!roles || roles.length === 0) return '';

    const roleOrder: UserRole[] = ['general_secretary', 'priest', 'assistant_secretary', 'secretary', 'level_secretary', 'class_supervisor', 'servant'];
    const roleTranslationMap: Record<UserRole, string> = {
        'general_secretary': t('roleGeneralSecretary'),
        'assistant_secretary': t('roleAssistantSecretary'),
        'secretary': t('roleSecretary'),
        'level_secretary': t('roleLevelSecretary'),
        'class_supervisor': t('roleClassSupervisor'),
        'servant': t('roleServant'),
        'priest': t('rolePriest'),
    };
    
    for (const role of roleOrder) {
        if (roles.includes(role)) {
            return roleTranslationMap[role];
        }
    }

    return roleTranslationMap[roles[0]] || roles[0];
  }

  return (
    <>
    <header style={{ backgroundColor: '#927dc8' }} className="text-white shadow-md p-3 flex justify-between items-center sticky top-0 z-20 h-16">
      <div className="flex items-center gap-2">
         <Link to="/app" className="p-2 rounded-full transition-colors hover:bg-white/20" aria-label={t('mainMenu')}>
            <HomeIcon className="w-5 h-5" />
         </Link>
         
         <div className="flex items-center gap-4 ml-2">
            <div className="bg-white/90 p-1 rounded-md shadow-md">
              <img src={settings.churchLogo || kidsLogoBase64} alt={t('logo')} className="h-10 w-auto object-contain" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">خدمتى</h1>
         </div>
      </div>
      <nav className="flex items-center gap-4">
        <div className="relative">
            <button 
              id="notification-button"
              onClick={() => setNotificationsOpen(o => !o)} 
              className="relative p-2 rounded-full transition-colors hover:bg-white/20"
              aria-label={t('notifications')}
              aria-haspopup="true"
              aria-expanded={notificationsOpen}
            >
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#927dc8]"></span>
              )}
            </button>
    
            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                  aria-hidden="true"
                ></div>
                <div
                  className="absolute left-0 mt-2 w-96 max-w-sm origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-scale-in-tl text-slate-800 flex flex-col"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="notification-button"
                  style={{ maxHeight: 'calc(100vh - 5rem)'}}
                >
                    <div className="p-4 flex justify-between items-center border-b border-slate-200">
                      <h3 className="font-bold text-lg text-slate-800">{t('notifications')}</h3>
                      <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                        <XIcon className="w-6 h-6" />
                      </button>
                    </div>
            
                    <div className="flex-1 overflow-y-auto">
                      {visibleNotifications.length > 0 ? (
                        visibleNotifications.map(n => {
                          return (
                            <div
                              key={n.id}
                              className="p-4 hover:bg-slate-50 border-b last:border-b-0 flex items-start gap-4 cursor-pointer"
                              onClick={() => handleViewNotification(n)}
                            >
                              {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>}
                              <div className={`p-2.5 rounded-full ${n.read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                                <NotificationIconComponent icon={n.icon} className={`w-6 h-6 ${n.read ? 'text-slate-500' : 'text-blue-600'}`} />
                              </div>
                              <div className="flex-grow">
                                <p className={`text-base leading-relaxed ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.text}</p>
                                <p className="text-sm text-slate-400 mt-1">{n.time}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <BellIcon className="w-16 h-16 text-slate-300 mb-4"/>
                            <p className="font-semibold text-slate-600">{t('noNotifications')}</p>
                            <p className="text-sm text-slate-400">{t('newNotificationsAppearHere')}</p>
                        </div>
                      )}
                    </div>
            
                    {unreadCount > 0 && (
                      <div className="p-3 bg-slate-50 border-t text-center">
                        <button onClick={handleMarkAllAsRead} className="w-full btn btn-secondary">
                          {t('markAllAsRead')}
                        </button>
                      </div>
                    )}
                </div>
              </>
            )}
        </div>

        <div className="h-8 w-px bg-white/20"></div>

        <div className="relative">
            <button 
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full transition-colors hover:bg-white/20"
                id="user-menu-button"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User Menu"
            >
                <span className="font-semibold text-sm hidden sm:block">{currentUser?.displayName}</span>
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5"/>
                </div>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                ></div>
                <div
                  className="absolute left-0 mt-2 w-64 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-scale-in-tl text-slate-800"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                        <UserIcon className="w-6 h-6 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-semibold truncate">{currentUser?.displayName}</p>
                        <p className="text-sm text-slate-500">{getRoleTranslation(currentUser?.roles)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
                      role="menuitem"
                    >
                      <LogOutIcon className="w-5 h-5" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
        </div>
      </nav>
    </header>
    {viewingNotification && (
        <NotificationModal notification={viewingNotification} onClose={() => setViewingNotification(null)} />
    )}
    </>
  );
};

const NotificationModal: React.FC<{ notification: NotificationItem; onClose: () => void; }> = ({ notification, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in-center text-slate-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full shrink-0">
                         <NotificationIconComponent icon={notification.icon} className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-lg font-bold text-slate-800">تفاصيل الإشعار</h2>
                        <p className="text-sm text-slate-500">{notification.time}</p>
                    </div>
                     <button onClick={onClose} className="ml-auto p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="py-4 border-t border-b border-slate-200">
                     <p className="text-slate-700 text-base leading-relaxed">{notification.text}</p>
                </div>
                <div className="text-center">
                    <button onClick={onClose} className="btn btn-primary">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;