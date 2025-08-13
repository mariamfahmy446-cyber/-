import React, { useMemo } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import ChildCard from '../components/ChildCard';
import { ArrowLeftIcon, PrinterIcon, EditIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const ChildCardPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { classes, children, settings, levels } = appState;
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const child = useMemo(() => children.find(c => c.id === childId), [children, childId]);
  const activeClass = useMemo(() => {
    if (!child) return null;
    return classes.find(c => c.id === child.class_id);
  }, [classes, child]);
  const activeLevel = useMemo(() => {
    if (!activeClass) return null;
    return levels.find(l => l.id === activeClass.level_id);
  }, [levels, activeClass]);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else if (activeClass) {
        navigate(`/app/class/${activeClass.id}`, { replace: true });
    } else {
        navigate('/app/dashboard', { replace: true });
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  if (!child || !activeClass) {
    return <div className="text-center p-8">لم يتم العثور على بيانات الطفل أو الفصل.</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          body > #root > div > div:first-child, /* Header */
          body > #root > div > div:last-child > aside, /* Sidebar */
          .no-print {
            display: none !important;
          }

          body > #root > div > div:last-child > main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          
          #printable-area {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            background-color: transparent !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
            <div>
                 <h1 className="text-3xl font-bold text-slate-900">كارت الطفل: {child.name}</h1>
                 <p className="text-slate-500 mt-1">
                    فصل: {activeClass.grade} - {activeClass.name}
                 </p>
            </div>
            <div className="flex items-center gap-3">
                 <button onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                 </button>
                 <button
                    onClick={() => navigate(`/app/edit-child/${childId}`)}
                    className="flex items-center gap-2 text-sm bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-sm hover:bg-yellow-200 transition-colors"
                >
                    <EditIcon className="w-4 h-4" />
                    <span>تعديل البيانات</span>
                </button>
                 <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-purple-700 transition-colors"
                >
                    <PrinterIcon className="w-4 h-4" />
                    <span>طباعة</span>
                </button>
            </div>
        </header>

        <div id="printable-area" className="flex justify-center items-start pt-8">
            <ChildCard 
                child={child}
                activeClass={activeClass}
                settings={settings}
                levelLogo={activeLevel?.logo}
            />
        </div>
      </div>
    </>
  );
};

export default ChildCardPage;