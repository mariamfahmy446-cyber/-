
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import type { AttendanceRecord, PointsBreakdown, Child } from '../types';
import { ArrowLeftIcon, PlusIcon, MinusIcon, UserIcon, CalendarIcon, AwardIcon } from '../components/Icons';
import Notification from '../components/Notification';

interface OutletContextType {
  appState: AppState;
}

const pointCategories: { key: keyof PointsBreakdown; label: string; forGirlsOnly?: boolean }[] = [
  { key: 'classAttendance', label: 'حضور المخدوم' },
  { key: 'prayerAttendance', label: 'حضور الصلاة' },
  { key: 'psalmRecitation', label: 'تسميع المزمور' },
  { key: 'scarf', label: 'الإيشارب', forGirlsOnly: true },
];

type NotificationType = {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
};

const PointsDetails: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { children, attendanceHistory, setAttendanceHistory } = appState;
    const { classId, childId } = useParams<{ classId: string; childId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const date = searchParams.get('date');
    const recordId = `${classId}-${date}`;

    const [child, setChild] = useState<Child | null>(null);
    const [points, setPoints] = useState<PointsBreakdown | null>(null);
    const [totalPoints, setTotalPoints] = useState(0);
    const [notification, setNotification] = useState<NotificationType | null>(null);

    useEffect(() => {
        const currentChild = children.find(c => c.id === childId);
        if (!currentChild) {
            navigate(-1); // Go back if child not found
            return;
        }
        setChild(currentChild);

        const record = attendanceHistory.find(r => r.id === recordId);
        const childAttendance = record?.attendanceData[childId!];

        if (childAttendance) {
            setPoints(childAttendance.points);
            setTotalPoints(Object.values(childAttendance.points).reduce((sum, p) => sum + (p as number), 0));
        } else {
             // If no record exists, maybe redirect or show an error. For now, let's init with 0.
             const defaultPoints: PointsBreakdown = { classAttendance: 0, prayerAttendance: 0, psalmRecitation: 0, scarf: 0, behavior: 0 };
             setPoints(defaultPoints);
             setTotalPoints(0);
        }

    }, [childId, classId, date, children, attendanceHistory, navigate, recordId]);

    const handlePointsChange = (key: keyof PointsBreakdown, delta: number) => {
        setPoints(prevPoints => {
            if (!prevPoints) return null;
            const newPoints = {
                ...prevPoints,
                [key]: Math.max(0, (prevPoints[key] || 0) + delta)
            };
            
            // Save automatically
            savePoints(newPoints);
            
            return newPoints;
        });
    };
    
    const savePoints = (newPoints: PointsBreakdown) => {
        setAttendanceHistory(prevHistory => {
            const recordIndex = prevHistory.findIndex(r => r.id === recordId);
            if (recordIndex === -1) {
                // This shouldn't happen if navigating from the attendance page, but as a fallback:
                setNotification({message: 'خطأ: لم يتم العثور على سجل الحضور.', type: 'error'});
                return prevHistory;
            }
            
            const updatedHistory = [...prevHistory];
            const updatedRecord = { ...updatedHistory[recordIndex] };
            updatedRecord.attendanceData[childId!] = {
                ...updatedRecord.attendanceData[childId!],
                points: newPoints
            };
            updatedHistory[recordIndex] = updatedRecord;
            
            setTotalPoints(Object.values(newPoints).reduce((sum: number, p: number) => sum + p, 0));
            setNotification({message: 'تم تحديث النقاط', type: 'success'});
            return updatedHistory;
        });
    }

    if (!child || !points) {
        return <div className="text-center p-8">جاري التحميل...</div>;
    }
    
    return (
         <div className="max-w-2xl mx-auto space-y-6">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src={child.image || 'https://picsum.photos/200'} alt={child.name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"/>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{child.name}</h1>
                        <p className="text-slate-500 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{date ? new Date(date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'}) : ''}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Points Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800">تفاصيل النقاط</h2>
                    <div className="flex items-center gap-2 text-orange-600 font-bold">
                        <AwardIcon className="w-6 h-6" />
                        <span className="text-xl">{totalPoints} نقطة</span>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                   {pointCategories.map(category => {
                        if (category.forGirlsOnly && child.gender !== 'female') {
                            return null;
                        }
                        return (
                            <div key={category.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <span className="font-semibold text-slate-700">{category.label}</span>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handlePointsChange(category.key, -1)} className="p-1.5 bg-slate-300 text-slate-700 rounded-full hover:bg-slate-400 disabled:opacity-50" disabled={(points[category.key] || 0) === 0}>
                                        <MinusIcon className="w-5 h-5"/>
                                    </button>
                                    <span className="text-lg font-bold w-8 text-center text-slate-800">{points[category.key] || 0}</span>
                                     <button onClick={() => handlePointsChange(category.key, 1)} className="p-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600">
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        )
                   })}
                </div>
            </div>
         </div>
    );
};

export default PointsDetails;
