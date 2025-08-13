import React, { useMemo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import { UsersIcon, ArrowLeftIcon, BookOpenIcon, UserIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

interface ServantDisplayInfo {
    name: string;
    role: string;
    className: string;
}

const LevelServantsPage: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { levels, classes } = appState;
    const { levelId } = useParams<{ levelId: string }>();
    const navigate = useNavigate();

    const level = useMemo(() => levels.find(l => l.id === levelId), [levels, levelId]);

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate(`/app/level/${levelId}`, { replace: true });
        }
    };

    const servantsList = useMemo(() => {
        if (!level) return [];
        const levelClasses = classes.filter(c => c.level_id === level.id);
        const allServantsData: ServantDisplayInfo[] = [];

        levelClasses.forEach(cls => {
            const classDesc = `${cls.grade} - ${cls.name}`;
            if (cls.supervisorName && cls.supervisorName.trim()) {
                allServantsData.push({
                    name: cls.supervisorName.trim(),
                    role: 'مسؤول الفصل',
                    className: classDesc,
                });
            }
            (cls.servantNames || []).forEach(servantName => {
                 if (servantName && servantName.trim()) {
                    allServantsData.push({
                        name: servantName.trim(),
                        role: 'خادم',
                        className: classDesc,
                    });
                }
            });
        });
        
        const grouped = allServantsData.reduce((acc, curr) => {
            if (!acc[curr.name]) {
                acc[curr.name] = { name: curr.name, roles: new Set(), classNames: new Set() };
            }
            acc[curr.name].roles.add(curr.role);
            acc[curr.name].classNames.add(curr.className);
            return acc;
        }, {} as Record<string, { name: string, roles: Set<string>, classNames: Set<string> }>);
    
        return Object.values(grouped).map(item => ({
            name: item.name,
            role: Array.from(item.roles).join(' / '),
            className: Array.from(item.classNames).join('، ')
        }));

    }, [classes, level]);

     if (!level) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-md">
                <BookOpenIcon className="w-24 h-24 text-red-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">لم يتم العثور على المرحلة</h2>
            </div>
        );
    }


    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                <h1 className="text-3xl font-bold text-slate-900">خدام مرحلة {level.name}</h1>
                <p className="text-slate-500 mt-1">قائمة بجميع الخدام والمسؤولين داخل فصول المرحلة.</p>
                </div>
                <button onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-3">
                        <UsersIcon className="w-6 h-6 text-purple-600"/>
                        <span>قائمة الخدام ({servantsList.length})</span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                {['#', 'الاسم', 'الدور', 'الفصل'].map(h => (
                                    <th key={h} className="text-right p-3 font-semibold text-slate-600">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {servantsList.map((servant, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-700">{index + 1}</td>
                                    <td className="p-3 font-medium text-slate-800">{servant.name}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${servant.role.includes('مسؤول') ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {servant.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-600">{servant.className}</td>
                                </tr>
                            ))}
                            {servantsList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-slate-500">
                                        <UserIcon className="w-12 h-12 mx-auto text-slate-300 mb-2"/>
                                        لا يوجد خدام مسجلين في فصول هذه المرحلة.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LevelServantsPage;