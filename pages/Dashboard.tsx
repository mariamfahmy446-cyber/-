
import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AppState, Class } from '../types';
import { UsersIcon, ClipboardCheckIcon, BookOpenIcon, LayoutDashboardIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface ChartData {
    id: string;
    name: string;
    present: number;
    absent: number;
    late: number;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ElementType, colorClass: string }> = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-xl shadow-md p-5 flex items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className={`p-4 rounded-full mr-4 ml-2 ${colorClass} shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-md text-slate-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { levels, classes, children, attendanceHistory } = appState;

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { selectedDayAttendancePercentage, chartData, maxCount } = useMemo(() => {
        const selectedDateRecords = attendanceHistory.filter(rec => rec.date === selectedDate);
        let totalPresentOrLate = 0;
        let totalStudentsToday = 0;

        const data: ChartData[] = classes.map(cls => {
            const record = selectedDateRecords.find(r => r.classId === cls.id);
            const classChildrenCount = children.filter(c => c.class_id === cls.id).length;
            
            if (!record) {
                return { id: cls.id, name: cls.name, present: 0, absent: classChildrenCount, late: 0 };
            }
            
            const counts = { present: 0, absent: 0, late: 0 };
            
            Object.values(record.attendanceData).forEach((att: { status: AttendanceStatus }) => {
                counts[att.status]++;
            });
            
            const unrecordedChildren = classChildrenCount - Object.keys(record.attendanceData).length;
            if(unrecordedChildren > 0) {
                counts.absent += unrecordedChildren;
            }

            totalPresentOrLate += counts.present + counts.late;
            totalStudentsToday += classChildrenCount;
            
            return { id: cls.id, name: cls.name, ...counts };
        });

        const attendancePercentage = totalStudentsToday > 0 ? ((totalPresentOrLate / totalStudentsToday) * 100).toFixed(1) + '%' : '0%';
        
        const maxVal = Math.max(1, ...data.flatMap(d => [d.present, d.absent, d.late]));
        const scaleMax = Math.ceil(maxVal / 5) * 5 || 5;

        return { selectedDayAttendancePercentage: attendancePercentage, chartData: data, maxCount: scaleMax };
    }, [selectedDate, attendanceHistory, classes, children]);
    
    const classesWithChildren = useMemo(() => {
        const classChildCounts = classes.reduce((acc, cls) => {
            acc[cls.id] = children.filter(c => c.class_id === cls.id).length;
            return acc;
        }, {} as Record<string, number>);
        
        return chartData
            .filter(cd => classChildCounts[cd.id] > 0)
            .sort((a,b) => a.name.localeCompare(b.name, 'ar'));
    }, [chartData, classes, children]);


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم الرئيسية</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي الطلاب" value={children.length} icon={UsersIcon} colorClass="bg-blue-500" />
                <StatCard title="الحضور في اليوم المختار" value={selectedDayAttendancePercentage} icon={ClipboardCheckIcon} colorClass="bg-green-500" />
                <StatCard title="إجمالي المراحل" value={levels.length} icon={BookOpenIcon} colorClass="bg-yellow-500" />
                <StatCard title="إجمالي الفصول" value={classes.length} icon={LayoutDashboardIcon} colorClass="bg-red-500" />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-slate-800">إحصائيات الحضور ليوم محدد</h2>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-input w-full sm:w-auto"
                    />
                </div>
                
                {classesWithChildren.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        
                        <div>
                            <h3 className="text-md font-bold text-slate-700 mb-4 text-center">رسم بياني للالتزام</h3>
                            <div className="flex" style={{ height: '320px' }}>
                                <div className="flex flex-col justify-between text-xs text-slate-500 pr-2 border-r border-slate-200">
                                    <span>{maxCount}</span>
                                    <span>{maxCount * 3 / 4}</span>
                                    <span>{maxCount / 2}</span>
                                    <span>{maxCount / 4}</span>
                                    <span className="pb-6">0</span>
                                </div>
                                <div className="flex-grow flex justify-around pl-4 overflow-x-auto gap-2">
                                    {classesWithChildren.map((cls, index) => (
                                        <div key={cls.id} className="h-full flex flex-col justify-end items-center flex-1 min-w-[50px]">
                                            <div className="flex items-end h-full w-full justify-center gap-1">
                                                <div title={`حاضر: ${cls.present}`} className="bg-green-500 rounded-t-md w-1/3 animate-grow-bar" style={{ height: `${(cls.present / maxCount) * 100}%`, animationDelay: `${index * 50}ms` }}></div>
                                                <div title={`غائب: ${cls.absent}`} className="bg-red-500 rounded-t-md w-1/3 animate-grow-bar" style={{ height: `${(cls.absent / maxCount) * 100}%`, animationDelay: `${index * 50 + 25}ms` }}></div>
                                                <div title={`متأخر: ${cls.late}`} className="bg-yellow-400 rounded-t-md w-1/3 animate-grow-bar" style={{ height: `${(cls.late / maxCount) * 100}%`, animationDelay: `${index * 50 + 50}ms` }}></div>
                                            </div>
                                            <div className="h-10 pt-1 text-xs text-slate-600 font-medium text-center border-t border-slate-300 w-full mt-1 flex items-center justify-center">
                                                <span className="break-words" style={{ hyphens: 'auto' }}>{cls.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                                 <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 bg-green-500 rounded-sm"></div><span>حاضر</span></div>
                                 <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 bg-red-500 rounded-sm"></div><span>غائب</span></div>
                                 <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 bg-yellow-400 rounded-sm"></div><span>متأخر</span></div>
                            </div>
                        </div>

                        
                        <div className="h-full">
                            <h3 className="text-md font-bold text-slate-700 mb-4 text-center">تفاصيل الالتزام</h3>
                             <div className="max-h-[384px] overflow-y-auto border rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-right font-semibold text-slate-600">الفصل</th>
                                            <th className="p-2 text-center font-semibold text-slate-600">حاضر</th>
                                            <th className="p-2 text-center font-semibold text-slate-600">غائب</th>
                                            <th className="p-2 text-center font-semibold text-slate-600">متأخر</th>
                                            <th className="p-2 text-center font-semibold text-slate-600">الالتزام</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {classesWithChildren.map(cls => {
                                            const total = cls.present + cls.absent + cls.late;
                                            const commitment = total > 0 ? Math.round(((cls.present + cls.late) / total) * 100) : 0;
                                            return (
                                                <tr key={cls.id} className="hover:bg-slate-50">
                                                    <td className="p-2 font-medium text-slate-800">{cls.name}</td>
                                                    <td className="p-2 text-center font-semibold text-green-600">{cls.present}</td>
                                                    <td className="p-2 text-center font-semibold text-red-600">{cls.absent}</td>
                                                    <td className="p-2 text-center font-semibold text-yellow-600">{cls.late}</td>
                                                    <td className="p-2 text-center font-bold text-blue-600">{commitment}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                             </div>
                        </div>

                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-10">لا توجد بيانات حضور لعرضها في اليوم المختار.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
