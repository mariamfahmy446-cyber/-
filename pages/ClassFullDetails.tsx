import React, { useMemo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import { UsersIcon, UserIcon, PhoneIcon, MailIcon, ArrowLeftIcon, BookOpenIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const ClassFullDetails: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { classes, levels, children } = appState;
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app/settings', { replace: true });
    }
  };

  const activeClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
  const level = useMemo(() => {
    if (!activeClass) return null;
    return levels.find(l => l.id === activeClass.level_id);
  }, [levels, activeClass]);

  const totalServants = useMemo(() => {
      if (!activeClass) return 0;
      const names = new Set<string>();
      if (activeClass.supervisorName) names.add(activeClass.supervisorName);
      (activeClass.servantNames || []).forEach(name => names.add(name));
      return names.size;
  }, [activeClass]);
    
  const classChildrenCount = useMemo(() => children.filter(c => c.class_id === classId).length, [children, classId]);

  if (!activeClass || !level) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-md">
        <BookOpenIcon className="w-24 h-24 text-red-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">لم يتم العثور على الفصل</h2>
        <p className="text-slate-500 mt-2">قد يكون الرابط غير صحيح أو تم حذف الفصل.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">تفاصيل فصل: {activeClass.name}</h1>
          <p className="text-slate-500 mt-1">المرحلة: {level.name}</p>
        </div>
        <button onClick={handleBack} className="btn btn-secondary">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>رجوع</span>
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon={UsersIcon} title="إجمالي الخدام" value={totalServants} color="bg-purple-500" />
          <StatCard icon={UserIcon} title="إجمالي الأطفال" value={classChildrenCount} color="bg-emerald-500" />
          {activeClass.supervisorName && <StatCard icon={UserIcon} title="مسؤول الفصل" value={activeClass.supervisorName} color="bg-amber-500" />}
      </div>

      {/* Supervisor section */}
      {activeClass.supervisorName && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">مسؤول الفصل</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center space-y-3">
             <UserIcon className="w-16 h-16 mx-auto text-slate-400" />
             <h3 className="font-bold text-lg text-slate-800">{activeClass.supervisorName}</h3>
          </div>
        </div>
      )}

      {/* Servants section */}
      {activeClass.servantNames && activeClass.servantNames.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">خدام الفصل ({activeClass.servantNames.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeClass.servantNames.map((name, index) => (
               <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center space-y-3">
                    <UserIcon className="w-12 h-12 mx-auto text-slate-400" />
                    <h3 className="font-semibold text-md text-slate-800">{name}</h3>
                </div>
            ))}
          </div>
        </div>
      )}
       {activeClass.servantNames.length === 0 && !activeClass.supervisorName && (
           <div className="text-center p-8 bg-white rounded-xl shadow-md">
                <UsersIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">لم يتم تعيين خدام لهذا الفصل بعد.</p>
           </div>
       )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string; }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
        <div className={`p-3 rounded-lg mr-4 ml-2 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export default ClassFullDetails;