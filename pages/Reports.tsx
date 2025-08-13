import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState, Child } from '../types';
import { SearchIcon, ArrowLeftIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

interface StudentReport {
  id: string;
  name: string;
  image?: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

const getISODate = (date: Date) => date.toISOString().split('T')[0];
const HIDE_CLASS_FILTER_LEVELS = ['level-nursery', 'level-university', 'level-graduates'];


const ReportsPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { levels, classes, children, attendanceHistory } = appState;
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return getISODate(date);
  });
  const [endDate, setEndDate] = useState(getISODate(new Date()));

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app', { replace: true });
    }
  };

  const showClassFilter = useMemo(() => {
    return selectedLevelId && !HIDE_CLASS_FILTER_LEVELS.includes(selectedLevelId);
  }, [selectedLevelId]);


  const availableClasses = useMemo(() => {
    if (!selectedLevelId) return [];
    return classes.filter(c => c.level_id === selectedLevelId);
  }, [selectedLevelId, classes]);

  const reportData = useMemo<StudentReport[]>(() => {
    let childrenToReportOn: Child[];

    if (showClassFilter && selectedClassId) {
        childrenToReportOn = children.filter(c => c.class_id === selectedClassId);
    } else if (selectedLevelId) {
        const classIdsInLevel = classes
            .filter(c => c.level_id === selectedLevelId)
            .map(c => c.id);
        const classIdsSet = new Set(classIdsInLevel);
        childrenToReportOn = children.filter(c => classIdsSet.has(c.class_id));
    } else {
        childrenToReportOn = children;
    }

    const searchedChildren = childrenToReportOn.filter(child =>
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const attendanceInRange = attendanceHistory.filter(record => {
      return record.date >= startDate && record.date <= endDate;
    });

    const studentStats: Record<string, { present: number; absent: number; late: number; }> = {};

    searchedChildren.forEach(child => {
      studentStats[child.id] = { present: 0, absent: 0, late: 0 };
    });

    attendanceInRange.forEach(record => {
      Object.entries(record.attendanceData).forEach(([childId, data]) => {
        const attendanceData = data as { status: 'present' | 'absent' | 'late' };
        if (studentStats[childId]) {
          if (attendanceData.status === 'present') studentStats[childId].present++;
          if (attendanceData.status === 'absent') studentStats[childId].absent++;
          if (attendanceData.status === 'late') studentStats[childId].late++;
        }
      });
    });

    return searchedChildren.map(child => {
        const stats = studentStats[child.id];
        const total = stats.present + stats.absent + stats.late;
        return {
            id: child.id,
            name: child.name,
            image: child.image,
            ...stats,
            total: total
        };
    }).sort((a, b) => {
        if (b.present !== a.present) {
            return b.present - a.present;
        }
        return a.name.localeCompare(b.name, 'ar');
    });

  }, [children, classes, attendanceHistory, selectedLevelId, selectedClassId, searchTerm, startDate, endDate, showClassFilter]);
  
  const dailyAttendanceChartData = useMemo(() => {
    const todayString = new Date().toISOString().split('T')[0];
    const todaysRecords = attendanceHistory.filter(rec => rec.date === todayString);

    if (todaysRecords.length === 0) {
        return [];
    }

    const data = classes
        .map(cls => {
            const classChildrenCount = children.filter(c => c.class_id === cls.id).length;
            if (classChildrenCount === 0) {
                return null;
            }

            const record = todaysRecords.find(r => r.classId === cls.id);
            let presentCount = 0;
            let lateCount = 0;

            if (record) {
                Object.values(record.attendanceData).forEach((att: any) => {
                    if (att.status === 'present') presentCount++;
                    if (att.status === 'late') lateCount++;
                });
            }

            const percentage = ((presentCount + lateCount) / classChildrenCount) * 100;
            
            const displayName = cls.level_id === 'level-primary' && !cls.name.includes('بنين') && !cls.name.includes('بنات')
                ? `${cls.name} ${cls.id.includes('boys') ? 'بنين' : 'بنات'}`
                : cls.name;

            return { id: cls.id, name: displayName, percentage };
        })
        .filter(Boolean) as { id: string, name: string, percentage: number }[];

    return data;
  }, [classes, children, attendanceHistory]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">التقارير والإحصائيات</h1>
        <button onClick={handleBack} className="btn btn-secondary">
          <ArrowLeftIcon className="w-4 h-4" />
          <span>رجوع</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="level-filter" className="block text-sm font-medium text-slate-700 mb-1">المرحلة</label>
            <select id="level-filter" value={selectedLevelId} onChange={e => { setSelectedLevelId(e.target.value); setSelectedClassId(''); }} className="form-select">
              <option value="">كل المراحل</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {showClassFilter && (
            <div>
              <label htmlFor="class-filter" className="block text-sm font-medium text-slate-700 mb-1">الفصل</label>
              <select id="class-filter" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="form-select" disabled={!selectedLevelId}>
                <option value="">كل الفصول</option>
                {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input" />
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن اسم الطفل..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-right font-semibold text-slate-600">الطالب</th>
                <th className="p-3 text-center font-semibold text-slate-600">حاضر</th>
                <th className="p-3 text-center font-semibold text-slate-600">غائب</th>
                <th className="p-3 text-center font-semibold text-slate-600">متأخر</th>
                <th className="p-3 text-center font-semibold text-slate-600">نسبة الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportData.map(student => {
                const attendancePercentage = student.total > 0 ? Math.round(((student.present + student.late) / student.total) * 100) : 0;
                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={student.image || 'https://picsum.photos/200'} alt={student.name} className="w-10 h-10 rounded-full object-cover"/>
                        <span className="font-medium text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-medium text-green-600">{student.present}</td>
                    <td className="p-3 text-center font-medium text-red-600">{student.absent}</td>
                    <td className="p-3 text-center font-medium text-yellow-600">{student.late}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${attendancePercentage}%`}}></div>
                         </div>
                         <span className="font-semibold text-slate-700 w-10">{attendancePercentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-500">لا توجد بيانات لعرضها حسب الفلاتر المحددة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">نسبة الالتزام اليومي لكل فصل</h2>
        {dailyAttendanceChartData.length > 0 ? (
            <div className="flex" style={{ height: '300px' }}>
                <div className="flex flex-col justify-between text-xs text-slate-500 pr-2 border-r border-slate-200">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span className="pb-6">0%</span>
                </div>
                <div className="flex-grow flex justify-around pl-4 overflow-x-auto">
                    {dailyAttendanceChartData.map((cls, index) => (
                        <div key={cls.id} className="h-full flex flex-col justify-end items-center px-2 min-w-[60px]">
                            <div 
                                title={`الحضور: ${cls.percentage.toFixed(1)}%`} 
                                className="bg-blue-500 rounded-t-md w-full max-w-[40px] animate-grow-bar" 
                                style={{ height: `${cls.percentage}%`, animationDelay: `${index * 50}ms` }}>
                            </div>
                            <div className="h-10 pt-1 text-xs text-slate-600 font-medium text-center border-t border-slate-300 w-full mt-1 flex items-center justify-center">
                                <span className="break-words" style={{ hyphens: 'auto' }}>{cls.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <p className="text-center text-slate-500 py-10">لا توجد بيانات حضور مسجلة اليوم لعرضها.</p>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;