import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import type { Class, EducationLevel, User } from '../types';
import { 
    ChevronDownIcon, 
    ChevronUpIcon, 
    BookOpenIcon, 
    UsersIcon,
    HomeIcon,
    ClipboardCheckIcon,
    MusicIcon,
    CalendarIcon,
    ToyBrickIcon,
    AwardIcon,
    SettingsIcon,
    FileTextIcon,
    LayoutDashboardIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    BriefcaseIcon
} from './Icons';

interface SidebarProps {
  levels: EducationLevel[];
  classes: Class[];
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: User | null;
}

const navLinkClass = (isActive: boolean) => {
    return `flex items-center gap-4 w-full text-right px-3 py-2.5 text-sm rounded-md transition-colors duration-200 border-l-4 ${
      isActive
        ? 'bg-white/20 text-white font-bold border-white'
        : 'text-white/70 hover:bg-white/20 hover:text-white border-transparent'
    }`;
}

const Sidebar: React.FC<SidebarProps> = ({ levels, classes, isCollapsed, setIsCollapsed, currentUser }) => {
  const menuItems = [
    { to: '/app/dashboard', text: 'لوحة التحكم الرئيسية', Icon: LayoutDashboardIcon },
    { to: '/app/classes-and-levels', text: 'الخدمات', Icon: UsersIcon },
    { to: '/app/schedule', text: 'جدول الخدمة', Icon: CalendarIcon },
    { to: '/app/attendance', text: 'تسجيل الحضور', Icon: ClipboardCheckIcon },
    { to: '/app/reports', text: 'التقارير والإحصائيات', Icon: FileTextIcon },
    { to: '/app/points-settings', text: 'نظام النقاط', Icon: AwardIcon },
    { to: '/app/hymns', text: 'ادارة الترانيم', Icon: MusicIcon },
    { to: '/app/activities', text: 'الانشطة', Icon: ToyBrickIcon },
    { to: '/app/administratives', text: 'الاداريات', Icon: BriefcaseIcon },
    { to: '/app/settings', text: 'الاعدادات العامة', Icon: SettingsIcon },
  ];
  
  const filteredMenuItems = useMemo(() => {
    if (!currentUser) return [];

    const isServant = currentUser.roles.includes('servant');
    
    return menuItems.filter(item => {
        if (isServant) {
            if (item.to === '/app/classes-and-levels' || item.to === '/app/administratives') {
                return false;
            }
        }
        return true;
    });
  }, [currentUser]);

  return (
    <aside 
      style={{ backgroundColor: '#927dc8' }}
      className={`transition-all duration-300 flex flex-col h-[calc(100vh-4rem)] shadow-lg ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredMenuItems.map(({ to, text, Icon }) => {
           const endRoutes = [
                '/app/dashboard', 
                '/app/reports', 
                '/app/points-settings', 
                '/app/hymns', 
                '/app/recitation', 
                '/app/certificates'
           ];
           const shouldEnd = endRoutes.includes(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={shouldEnd}
              title={isCollapsed ? text : undefined}
              className={({ isActive }) => navLinkClass(isActive) + (isCollapsed ? ' justify-center' : '')}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{text}</span>}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-2 border-t border-white/20">
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center p-3 rounded-lg text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            title={isCollapsed ? "إظهار القائمة" : "إخفاء القائمة"}
        >
            {isCollapsed ? (
                <ChevronDoubleRightIcon className="w-5 h-5 mx-auto"/>
            ) : (
                <div className="flex justify-between items-center w-full px-1">
                    <span className="text-xs font-semibold">إخفاء</span>
                    <ChevronDoubleLeftIcon className="w-5 h-5"/>
                </div>
            )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;