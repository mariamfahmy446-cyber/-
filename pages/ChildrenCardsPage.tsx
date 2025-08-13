import React, { useMemo, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import ChildCard from '../components/ChildCard';
import { ArrowLeftIcon, PrinterIcon, CheckIcon, XIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const ChildrenCardsPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { classes, children, settings, levels } = appState;
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
  const classChildren = useMemo(() => children.filter(c => c.class_id === classId), [children, classId]);
  const activeLevel = useMemo(() => {
    if (!activeClass) return null;
    return levels.find(l => l.id === activeClass.level_id);
  }, [levels, activeClass]);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate(`/app/class/${classId}`, { replace: true });
    }
  };
  
  const handlePrintSelected = () => {
    const printableArea = document.getElementById('printable-area');
    if (!printableArea) return;
    
    // Add a class to hide non-selected cards
    printableArea.classList.add('printing-selected');
    
    // Use onafterprint to clean up, which is more reliable than setTimeout
    const afterPrint = () => {
      printableArea.classList.remove('printing-selected');
      window.removeEventListener('afterprint', afterPrint);
    };
    window.addEventListener('afterprint', afterPrint);
    
    window.print();
  };

  const toggleSelection = (childId: string) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(childId)) {
            newSet.delete(childId);
        } else {
            newSet.add(childId);
        }
        return newSet;
    });
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === classChildren.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(classChildren.map(c => c.id)));
      }
  };

  if (!activeClass) {
    return <div className="text-center p-8">لم يتم العثور على الفصل.</div>;
  }

  const allSelected = selectedIds.size === classChildren.length && classChildren.length > 0;

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

          #printable-area-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: visible;
          }
          
          #printable-area {
            background-color: transparent !important;
            padding: 0 !important;
          }
          
          #printable-area.printing-selected .card-wrapper:not(.selected) {
            display: none !important;
          }

          .break-inside-avoid {
              break-inside: avoid;
          }
        }
      `}</style>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
            <div>
                 <h1 className="text-3xl font-bold text-slate-900">طباعة كروت الأطفال</h1>
                 <p className="text-slate-500 mt-1">
                    فصل: {activeClass.grade} - {activeClass.name} ({classChildren.length} أطفال)
                 </p>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
                {!selectionMode && (
                     <button
                        onClick={() => setSelectionMode(true)}
                        className="flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-purple-700 transition-colors"
                    >
                        <CheckIcon className="w-4 h-4" />
                        <span>تحديد الكروت</span>
                    </button>
                )}
            </div>
        </header>

        {selectionMode && (
             <div className="bg-purple-600 text-white rounded-lg p-3 flex justify-between items-center no-print animate-slide-in-right">
                <div className="font-semibold">{selectedIds.size} كروت تم تحديدها</div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleSelectAll} className="px-3 py-1 bg-white/20 rounded-md text-sm hover:bg-white/30">
                        {allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                    <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="px-3 py-1 bg-red-500/80 rounded-md text-sm hover:bg-red-500">
                        إلغاء التحديد
                    </button>
                </div>
            </div>
        )}

        <div id="printable-area-container">
            <div id="printable-area" className="p-2 bg-slate-200/50 rounded-lg">
                <div className="flex flex-wrap justify-center gap-6">
                    {classChildren.map(child => {
                        const isSelected = selectedIds.has(child.id);
                        return (
                            <div 
                                key={child.id}
                                className={`card-wrapper relative transition-transform duration-200 ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'selected scale-95' : ''}`}
                                onClick={() => selectionMode && toggleSelection(child.id)}
                            >
                                <ChildCard 
                                    child={child}
                                    activeClass={activeClass}
                                    settings={settings}
                                    levelLogo={activeLevel?.logo}
                                />
                                {selectionMode && (
                                    <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-colors ${isSelected ? 'bg-purple-500' : 'bg-black/30'}`}>
                                        {isSelected && <CheckIcon className="w-5 h-5 text-white" />}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {classChildren.length === 0 && (
                        <div className="text-center py-16 text-slate-500 bg-white rounded-lg w-full no-print">
                            <p>لا يوجد أطفال في هذا الفصل لطباعة كروت لهم.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {selectionMode && selectedIds.size > 0 && (
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200 flex justify-center no-print z-20">
                <button
                    onClick={handlePrintSelected}
                    className="flex items-center gap-2 text-lg bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors font-bold"
                >
                    <PrinterIcon className="w-6 h-6" />
                    <span>طباعة الكروت المحددة ({selectedIds.size})</span>
                </button>
            </footer>
        )}
      </div>
    </>
  );
};

export default ChildrenCardsPage;