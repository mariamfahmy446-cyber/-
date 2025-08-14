import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { AppState } from '../types';
import type { Child, AttendanceRecord, PointsBreakdown, PointsSettings, NotificationItem } from '../types';
import { SearchIcon, UserIcon, ArrowLeftIcon, HistoryIcon, PlusIcon, MinusIcon, CheckIcon, XIcon, ClipboardCheckIcon } from '../components/Icons';
import Notification from '../components/Notification';
import { INITIAL_POINTS_SETTINGS } from '../constants';
import { api } from '../services/api';

interface OutletContextType {
  appState: AppState;
}

interface AttendanceData {
  status: 'present' | 'absent' | 'late';
  entryTime: string | null;
  points: PointsBreakdown;
}

const StatusButton: React.FC<{ text: string, icon: React.ElementType, onClick: () => void, isActive: boolean, activeClass: string, inactiveClass: string }> = ({ text, icon: Icon, onClick, isActive, activeClass, inactiveClass }) => (
    <button onClick={onClick} className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors flex-1 ${isActive ? activeClass : inactiveClass}`}>
        <Icon className="w-4 h-4" />
        <span>{text}</span>
    </button>
);

const ClassAttendance: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { classes, children, attendanceHistory, setAttendanceHistory, pointsSettings: appPointsSettings, users, setNotifications } = appState;
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const activeClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
  const classChildren = useMemo(() => children.filter(c => c.class_id === classId), [children, classId]);

  const pointsSettings: PointsSettings = useMemo(() => {
    return appPointsSettings[classId!] || INITIAL_POINTS_SETTINGS;
  }, [appPointsSettings, classId]);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateFromUrl = searchParams.get('date');
    try {
      if (dateFromUrl) {
        const date = new Date(dateFromUrl);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    } catch (e) {
      console.error("Invalid date from URL", e);
    }
    return new Date().toISOString().split('T')[0];
  });

  const [attendance, setAttendance] = useState<Record<string, AttendanceData>>({});
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app/attendance', { replace: true });
    }
  };

  useEffect(() => {
    if (!classId) return;
    const recordId = `${classId}-${selectedDate}`;
    const existingRecord = attendanceHistory.find(rec => rec.id === recordId);
    
    const defaultPoints: PointsBreakdown = { classAttendance: 0, prayerAttendance: 0, psalmRecitation: 0, scarf: 0, behavior: 0 };

    if (existingRecord) {
      const fullAttendanceData: Record<string, AttendanceData> = {};
      classChildren.forEach(child => {
        fullAttendanceData[child.id] = existingRecord.attendanceData[child.id] 
          ? { ...existingRecord.attendanceData[child.id], points: { ...defaultPoints, ...existingRecord.attendanceData[child.id].points }}
          : { status: 'absent', entryTime: null, points: { ...defaultPoints } };
      });

      setAttendance(fullAttendanceData);
      setIsExistingRecord(true);
    } else {
      const initialAttendance: Record<string, AttendanceData> = {};
      classChildren.forEach(child => {
        initialAttendance[child.id] = { status: 'absent', entryTime: null, points: { ...defaultPoints } };
      });
      setAttendance(initialAttendance);
      setIsExistingRecord(false);
    }
  }, [selectedDate, classId, classChildren, attendanceHistory]);


  const filteredChildren = useMemo(() => {
    if (!searchTerm) return classChildren;
    return classChildren.filter(child =>
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classChildren, searchTerm]);
  
  const handleStatusChange = (childId: string, newStatus: 'present' | 'absent' | 'late') => {
    setAttendance(prev => {
      const childData = prev[childId] || { status: 'absent', entryTime: null, points: { classAttendance: 0, prayerAttendance: 0, psalmRecitation: 0, scarf: 0, behavior: 0 }};
      
      let newPoints = { ...childData.points };
      
      if (newStatus === 'present') {
          newPoints = {
              ...childData.points, // Keep manual points like psalm and scarf
              classAttendance: pointsSettings.attendance,
              prayerAttendance: pointsSettings.prayer,
              behavior: pointsSettings.behavior,
          };
      } else if (newStatus === 'late') {
          newPoints = {
              ...childData.points,
              classAttendance: pointsSettings.lateWithExcuse,
              prayerAttendance: pointsSettings.prayer,
              behavior: pointsSettings.behavior,
          };
      } else { 
          // Reset all points on absent
          newPoints = {
              classAttendance: 0,
              prayerAttendance: 0,
              psalmRecitation: 0,
              scarf: 0,
              behavior: 0,
          };
      }

      return {
        ...prev,
        [childId]: {
          ...childData,
          status: newStatus,
          entryTime: (newStatus === 'present' || newStatus === 'late') ? (childData.entryTime || new Date().toISOString()) : null,
          points: newPoints,
        }
      }
    });
  };

  const handlePointsChange = (childId: string, delta: number) => {
    setAttendance(prev => {
      const childData = prev[childId];
      if (!childData || childData.status === 'absent') return prev; 

      const newPoints = { ...childData.points };
      newPoints.psalmRecitation = Math.max(0, (newPoints.psalmRecitation || 0) + delta);

      return {
        ...prev,
        [childId]: {
          ...childData,
          points: newPoints
        }
      };
    });
  };
  
  const handleSave = async () => {
    if (!classId) return;
    setIsSaving(true);
    const recordId = `${classId}-${selectedDate}`;
    
    const newRecord: AttendanceRecord = {
      id: recordId,
      classId: classId,
      date: selectedDate,
      attendanceData: attendance
    };

    try {
        await api.saveAttendanceRecord(newRecord);
        setIsExistingRecord(true);
        const message = isExistingRecord ? 'تم تحديث سجل الحضور بنجاح!' : 'تم حفظ سجل الحضور بنجاح!';
        setNotification({ message, type: 'success' });

        // --- NEW NOTIFICATION LOGIC ---
        const activeClassForNotif = classes.find(c => c.id === classId);
        if (!activeClassForNotif) return;

        const levelId = activeClassForNotif.level_id;

        const levelSecretaries = users.filter(user => 
          user.roles.includes('level_secretary') && 
          user.levelIds?.includes(levelId)
        );

        const siteManager = users.find(user => 
          user.roles.includes('general_secretary') &&
          user.nationalId === '29908241301363'
        );

        const targetUsers = [...levelSecretaries];
        if (siteManager && !targetUsers.some(u => u.id === siteManager.id)) {
          targetUsers.push(siteManager);
        }
        
        const newNotifications: NotificationItem[] = targetUsers.map(user => ({
            id: Date.now() + Math.random(),
            text: `تم تسجيل حضور فصل "${activeClassForNotif.name}" بتاريخ ${new Date(selectedDate).toLocaleDateString('ar-EG', { timeZone: 'UTC' })}.`,
            time: 'الآن',
            read: false,
            icon: ClipboardCheckIcon,
            targetUserId: user.id
        }));
        
        if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev]);
        }

    } catch (error) {
        console.error("Failed to save attendance", error);
        setNotification({ message: 'فشل حفظ سجل الحضور.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const setAllAsPresent = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تحديد الكل كـ "حاضر"؟')) {
       const newAttendance = { ...attendance };
       classChildren.forEach(child => {
           newAttendance[child.id] = {
               status: 'present',
               entryTime: new Date().toISOString(),
               points: {
                   classAttendance: pointsSettings.attendance,
                   prayerAttendance: pointsSettings.prayer,
                   behavior: pointsSettings.behavior,
                   psalmRecitation: 0,
                   scarf: 0,
               }
           };
       });
       setAttendance(newAttendance);
       setNotification({ message: 'تم تحديد الكل كـ "حاضر".', type: 'success' });
    }
  };

  if (!activeClass) {
    return (
        <div className="text-center p-8">
            <h2 className="text-xl font-bold">لم يتم العثور على الفصل</h2>
            <p className="text-slate-500 mt-2">قد يكون الرابط غير صحيح أو تم حذف الفصل.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
        
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                 <button onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
                <button onClick={setAllAsPresent} className="btn btn-primary bg-green-600 hover:bg-green-700">
                    <CheckIcon className="w-5 h-5"/>
                    <span>تحديد الكل "حاضر"</span>
                </button>
            </div>
            <div className="text-center sm:text-right">
                <h1 className="text-2xl font-bold text-slate-900">تسجيل الحضور اليومي</h1>
                <p className="text-slate-500">{activeClass.grade} - {activeClass.name}</p>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
                <input
                    type="text"
                    placeholder="ابحث عن اسم الطفل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input w-full pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
             <div className="flex items-center gap-2">
                <label htmlFor="attendance-date" className="text-slate-500 font-medium whitespace-nowrap">تاريخ الحضور:</label>
                 <input
                    type="date"
                    id="attendance-date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 rounded-md border-slate-300 border bg-white focus:ring-2 focus:ring-violet-500"
                 />
            </div>
        </div>
        
        <div id="attendance-table-container" className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-right p-3 font-semibold text-slate-600 w-1/3">الطالب</th>
                            <th className="text-center p-3 font-semibold text-slate-600">الحالة</th>
                            <th className="text-center p-3 font-semibold text-slate-600">نقاط إضافية</th>
                            <th className="text-center p-3 font-semibold text-slate-600">المجموع</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredChildren.map((child) => {
                           const childAttendance = attendance[child.id] || { status: 'absent', entryTime: null, points: { classAttendance: 0, prayerAttendance: 0, psalmRecitation: 0, scarf: 0, behavior: 0 }};
                           return (
                            <tr key={child.id} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={child.image || 'https://picsum.photos/200'} alt={child.name} className="w-10 h-10 rounded-full object-cover"/>
                                        <span className="font-medium text-slate-800">{child.name}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                     <div className="flex justify-center items-center gap-1.5">
                                        <StatusButton
                                            text="حاضر"
                                            icon={CheckIcon}
                                            onClick={() => handleStatusChange(child.id, 'present')}
                                            isActive={childAttendance.status === 'present'}
                                            activeClass="bg-green-500 text-white"
                                            inactiveClass="bg-green-100 text-green-800 hover:bg-green-200"
                                        />
                                        <StatusButton
                                            text="غائب"
                                            icon={XIcon}
                                            onClick={() => handleStatusChange(child.id, 'absent')}
                                            isActive={childAttendance.status === 'absent'}
                                            activeClass="bg-red-500 text-white"
                                            inactiveClass="bg-red-100 text-red-800 hover:bg-red-200"
                                        />
                                        <StatusButton
                                            text="متأخر"
                                            icon={HistoryIcon}
                                            onClick={() => handleStatusChange(child.id, 'late')}
                                            isActive={childAttendance.status === 'late'}
                                            activeClass="bg-yellow-400 text-slate-900"
                                            inactiveClass="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                        />
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => handlePointsChange(child.id, -1)} 
                                            disabled={childAttendance.status === 'absent' || (childAttendance.points.psalmRecitation || 0) <= 0}
                                            className="p-1.5 bg-red-200 text-red-700 rounded-full hover:bg-red-300 disabled:opacity-50"
                                        >
                                            <MinusIcon className="w-4 h-4"/>
                                        </button>
                                        <span className="text-md font-bold w-8 text-center text-slate-800">{childAttendance.points.psalmRecitation || 0}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => handlePointsChange(child.id, 1)} 
                                            disabled={childAttendance.status === 'absent'}
                                            className="p-1.5 bg-green-200 text-green-700 rounded-full hover:bg-green-300 disabled:opacity-50"
                                        >
                                            <PlusIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    {(() => {
                                        const totalPoints = Object.values(childAttendance.points).reduce((sum, p) => sum + p, 0);
                                        return (
                                            <span className="font-bold text-lg text-violet-600">
                                                {childAttendance.status === 'absent' ? 0 : totalPoints}
                                            </span>
                                        );
                                    })()}
                                </td>
                            </tr>
                           )
                        })}
                         {filteredChildren.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-slate-500">
                                    {classChildren.length === 0 ? "لا يوجد أطفال في هذا الفصل." : "لم يتم العثور على أطفال يطابقون البحث."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                    onClick={() => navigate('/app/attendance-history')}
                    className="btn btn-secondary"
                    disabled={isSaving}
                >
                    <HistoryIcon className="w-5 h-5" />
                    <span>سجل الحضور السابق</span>
                </button>
                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    {isSaving ? 'جاري الحفظ...' : isExistingRecord ? 'تحديث سجل اليوم' : 'حفظ سجل اليوم'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default ClassAttendance;
