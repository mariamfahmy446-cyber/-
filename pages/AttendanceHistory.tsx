import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import { ArrowLeftIcon, CalendarIcon, CheckIcon, XIcon, EditIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const AttendanceHistory: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { attendanceHistory, classes, children } = appState;
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes.length > 0 ? classes[0].id : '');

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app/dashboard', { replace: true });
    }
  };

  const { uniqueDates, attendanceGrid, studentsInClass, monthlyAttendancePercentage } = useMemo(() => {
    if (!selectedClassId) return { uniqueDates: [], attendanceGrid: new Map(), studentsInClass: [], monthlyAttendancePercentage: new Map() };
    
    const filteredHistory = attendanceHistory.filter(r => r.classId === selectedClassId);
    const students = children.filter(c => c.class_id === selectedClassId);

    const dates = [...new Set(filteredHistory.map(r => r.date))]
      .sort((a: string, b: string) => b.localeCompare(a)); // Sorts YYYY-MM-DD strings descending

    const grid = new Map<string, Record<string, 'present' | 'absent'>>();
    
    students.forEach(student => grid.set(student.id, {}));

    filteredHistory.forEach(record => {
      const dateKey = record.date;
      Object.entries(record.attendanceData).forEach(([studentId, data]) => {
          if (grid.has(studentId)) {
              grid.get(studentId)![dateKey] = (data as { status: 'present' | 'absent' }).status;
          }
      });
    });

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const datesInCurrentMonth = dates.filter(dateStr => {
        const d = new Date(dateStr + 'T00:00:00Z');
        return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });

    const percentages = new Map<string, number>();
    if (datesInCurrentMonth.length > 0) {
        students.forEach(student => {
            const studentRecords = grid.get(student.id);
            if (studentRecords) {
                let presentCount = 0;
                datesInCurrentMonth.forEach((date: string) => {
                    if (studentRecords[date] === 'present') {
                        presentCount++;
                    }
                });
                const percentage = Math.round((presentCount / datesInCurrentMonth.length) * 100);
                percentages.set(student.id, percentage);
            } else {
                percentages.set(student.id, 0);
            }
        });
    } else {
         students.forEach(student => {
            percentages.set(student.id, 0);
        });
    }

    return { uniqueDates: dates, attendanceGrid: grid, studentsInClass: students, monthlyAttendancePercentage: percentages };
  }, [selectedClassId, attendanceHistory, children, classes]);
  
  const handleEditAttendance = (date: string) => { // date is YYYY-MM-DD
    navigate(`/app/class-attendance/${selectedClassId}?date=${date}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">سجل الحضور</h1>
        <button onClick={handleBack} className="btn btn-secondary">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>رجوع</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
        <div className="flex items-center gap-4">
            <label htmlFor="class-select" className="font-semibold">اختر الفصل:</label>
            <select 
                id="class-select" 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
                {classes.length > 0 ? (
                    classes.map(c => (
                        <option key={c.id} value={c.id}>{c.grade} - {c.name}</option>
                    ))
                ) : (
                    <option disabled>لا توجد فصول</option>
                )}
            </select>
        </div>

        <div className="overflow-auto border rounded-lg" style={{maxHeight: 'calc(100vh - 280px)'}}>
          {uniqueDates.length > 0 ? (
            <table className="min-w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                <tr>
                  <th className="sticky right-0 bg-slate-100 p-3 font-semibold text-slate-600 text-right z-20 border-l w-60"># الطالب</th>
                  {uniqueDates.map(date => (
                      <th key={date} className="p-3 font-semibold text-slate-600 whitespace-nowrap text-center">
                          {new Date(date).toLocaleDateString('ar-EG', { timeZone: 'UTC', month: 'short', day: 'numeric' })}
                      </th>
                  ))}
                  <th className="p-3 font-semibold text-slate-600 whitespace-nowrap text-center border-r bg-slate-100">حضور الشهر</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {studentsInClass.map((student, index) => {
                  const studentRecords = attendanceGrid.get(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="sticky right-0 bg-white hover:bg-slate-50 p-2 border-b border-l whitespace-nowrap z-10">
                          <div className="flex items-center gap-3">
                              <span className="w-6 text-center text-slate-500">{index + 1}.</span>
                              <img src={student.image || 'https://picsum.photos/200'} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                              <span className="font-medium text-slate-800">{student.name}</span>
                          </div>
                      </td>
                      {uniqueDates.map(date => {
                          const status = studentRecords?.[date];
                          return (
                              <td key={date} className="p-2 border-b text-center">
                                  {status === 'present' && <CheckIcon className="w-5 h-5 text-green-500 mx-auto" aria-label="حاضر" />}
                                  {status === 'absent' && <XIcon className="w-5 h-5 text-red-500 mx-auto" aria-label="غائب" />}
                                  {!status && <span className="text-slate-300">-</span>}
                              </td>
                          )
                      })}
                       <td className="p-2 border-b border-r text-center">
                         <span className="font-bold text-slate-700">{monthlyAttendancePercentage.get(student.id) ?? 0}%</span>
                       </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-100">
                <tr>
                  <th className="sticky right-0 bg-slate-100 p-2 border-l z-20"></th>
                  {uniqueDates.map(date => (
                    <td key={`edit-${date}`} className="p-2 text-center border-t">
                      <button 
                        onClick={() => handleEditAttendance(date)}
                        className="flex items-center justify-center gap-1 mx-auto text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md hover:bg-slate-300 transition-colors"
                        title={`تعديل حضور يوم ${new Date(date).toLocaleDateString('ar-EG', { timeZone: 'UTC' })}`}
                      >
                        <EditIcon className="w-3 h-3"/>
                        <span>تعديل</span>
                      </button>
                    </td>
                  ))}
                  <td className="p-2 border-t border-r"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
             <div className="text-center py-16 text-slate-500">
                <CalendarIcon className="mx-auto w-12 h-12 text-slate-400" />
                <p className="mt-4">
                  {selectedClassId ? 'لا يوجد سجلات حضور محفوظة لهذا الفصل.' : 'يرجى اختيار فصل لعرض السجل.'}
                </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;