import React, { useState, useMemo, useRef } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import type { SyllabusItem, ClassMaterial } from '../types';
import { ImageIcon, FileTextIcon, TrashIcon, PlusIcon, EditIcon, XIcon, DownloadIcon, ArrowLeftIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const ClassSyllabusPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { levels, classes, syllabus, setSyllabus, classMaterials, setClassMaterials } = appState;
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<ClassMaterial | null>(null);


  const activeClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
  const level = useMemo(() => activeClass ? levels.find(l => l.id === activeClass.level_id) : null, [levels, activeClass]);

  const currentSyllabus = useMemo(() => syllabus.filter(s => s.classId === classId).sort((a,b) => a.date.localeCompare(b.date)), [syllabus, classId]);
  const currentMaterials = useMemo(() => classMaterials.filter(m => m.classId === classId), [classMaterials, classId]);
  
  const getInitialFormState = () => ({ date: '', lessonName: '', servantName: '' });
  const [lessonForm, setLessonForm] = useState(getInitialFormState());
  const [editingLesson, setEditingLesson] = useState<SyllabusItem | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLessonForm({ ...lessonForm, [e.target.name]: e.target.value });
  };
  
  const handleSaveLesson = () => {
    if (lessonForm.date && lessonForm.lessonName && lessonForm.servantName.trim()) {
      if (editingLesson) {
        setSyllabus(prev => prev.map(item => item.id === editingLesson.id ? { ...item, ...lessonForm, servantName: lessonForm.servantName.trim() } : item));
        setEditingLesson(null);
      } else {
        const newItem: SyllabusItem = {
          id: Date.now().toString(),
          classId: classId!,
          ...lessonForm,
          servantName: lessonForm.servantName.trim(),
        };
        setSyllabus(prev => [...prev, newItem]);
      }
      setLessonForm(getInitialFormState());
    } else {
        alert('يرجى ملء جميع حقول الدرس.');
    }
  };

  const handleEditLesson = (lesson: SyllabusItem) => {
    setEditingLesson(lesson);
    setLessonForm({ date: lesson.date, lessonName: lesson.lessonName, servantName: lesson.servantName });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
    setLessonForm(getInitialFormState());
  };

  const handleDeleteLesson = (id: string) => {
    if(window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      setSyllabus(prev => prev.filter(item => item.id !== id));
      if (editingLesson?.id === id) {
          handleCancelEdit();
      }
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newMaterial: ClassMaterial = {
          id: Date.now().toString(),
          classId: classId!,
          type,
          name: file.name,
          data: reader.result as string,
        };
        setClassMaterials(prev => [...prev, newMaterial]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeleteMaterial = (id: string) => {
    if(window.confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      setClassMaterials(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleBack = () => {
    const specialLevels = ['level-nursery', 'level-university', 'level-graduates'];
    const isSpecial = level && specialLevels.includes(level.id);

    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else if (isSpecial) {
        navigate('/app/schedule', { replace: true });
    } else {
        navigate(`/app/schedule?levelId=${activeClass?.level_id}`, { replace: true });
    }
  };

  if (!activeClass || !level) {
    return <div className="text-center p-8">لم يتم العثور على بيانات الفصل.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div /> {/* Spacer */}
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-slate-800">{level.name} - {activeClass.name}</h1>
            <p className="text-slate-500 mt-1">منهج الفصل والمواد التعليمية</p>
        </div>
        <button onClick={handleBack} className="btn btn-secondary">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>رجوع</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">المواد التعليمية</h2>
        <div className="flex gap-4 mb-6">
          <button onClick={() => imageInputRef.current?.click()} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5"/>
            <span>إضافة صورة</span>
          </button>
          <input type="file" ref={imageInputRef} onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" className="hidden"/>

          <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
            <FileTextIcon className="w-5 h-5"/>
            <span>إضافة ملف</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'file')} className="hidden"/>
        </div>

        {currentMaterials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentMaterials.map(material => (
              <div key={material.id} className="relative group border rounded-lg overflow-hidden shadow-sm">
                 <button onClick={() => setSelectedMaterial(material)} className="w-full h-full text-left cursor-pointer">
                    {material.type === 'image' ? (
                    <img src={material.data} alt={material.name} className="w-full h-40 object-cover"/>
                    ) : (
                    <div className="flex flex-col items-center justify-center w-full h-40 bg-slate-100 hover:bg-slate-200 transition-colors p-4 text-center">
                        <FileTextIcon className="w-16 h-16 text-slate-400 mb-2"/>
                        <p className="text-sm text-slate-600 font-semibold break-all">{material.name}</p>
                    </div>
                    )}
                </button>
                <button onClick={() => handleDeleteMaterial(material.id)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="حذف الملف">
                  <TrashIcon className="w-4 h-4"/>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-4">لا توجد مواد تعليمية مضافة.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">خطة الدروس</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right p-3 font-semibold text-slate-600">التاريخ</th>
                <th className="text-right p-3 font-semibold text-slate-600">اسم الدرس</th>
                <th className="text-right p-3 font-semibold text-slate-600">الخادم</th>
                <th className="p-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentSyllabus.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${editingLesson?.id === item.id ? 'bg-blue-50' : ''}`}>
                    <td className="p-3 whitespace-nowrap font-bold text-lg text-slate-800">{new Date(item.date).toLocaleDateString('ar-EG-u-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'long' })}</td>
                    <td className="p-3 font-medium text-slate-800">
                        <Link to={`/app/schedule/lesson/${item.id}`} className="hover:underline text-blue-600 font-semibold">
                            {item.lessonName}
                        </Link>
                    </td>
                    <td className="p-3 text-slate-600">{item.servantName}</td>
                    <td className="p-3 text-left">
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => handleEditLesson(item)} className="text-blue-500 hover:text-blue-700" title="تعديل الدرس">
                                <EditIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleDeleteLesson(item.id)} className="text-red-500 hover:text-red-700" title="حذف الدرس">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          {currentSyllabus.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد دروس مضافة في الخطة.</p>}
        </div>

        <div className="mt-6 pt-4 border-t space-y-3 bg-slate-50 p-4 rounded-lg">
          <h3 className="font-semibold text-slate-700">{editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="date" className="block text-xs font-medium text-slate-600 mb-1">التاريخ</label>
              <input type="date" name="date" value={lessonForm.date} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"/>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="lessonName" className="block text-xs font-medium text-slate-600 mb-1">اسم الدرس</label>
              <input type="text" name="lessonName" placeholder="مثال: درس الخلق" value={lessonForm.lessonName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"/>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="servantName" className="block text-xs font-medium text-slate-600 mb-1">الخادم</label>
              <input type="text" name="servantName" placeholder="اسم الخادم" value={lessonForm.servantName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"/>
            </div>
            <div className="md:col-span-1 flex items-end gap-2">
              {editingLesson && (
                <button onClick={handleCancelEdit} className="p-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 transition-colors flex items-center justify-center" title="إلغاء التعديل">
                    <XIcon className="w-5 h-5"/>
                </button>
              )}
              <button onClick={handleSaveLesson} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                {editingLesson ? 'حفظ التعديلات' : <PlusIcon className="w-5 h-5"/>}
                <span>{editingLesson ? 'حفظ' : 'إضافة درس'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

       {selectedMaterial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedMaterial(null)} role="dialog" aria-modal="true">
          <button onClick={() => setSelectedMaterial(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors z-[51]" aria-label="إغلاق">
            <XIcon className="w-8 h-8"/>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {selectedMaterial.type === 'image' ? (
              <img src={selectedMaterial.data} alt={selectedMaterial.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"/>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <iframe src={selectedMaterial.data} title={selectedMaterial.name} className="w-full h-[85%] bg-white rounded-lg border-4 border-white"/>
                   <a href={selectedMaterial.data} download={selectedMaterial.name} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                      <DownloadIcon className="w-5 h-5"/>
                      <span>تحميل الملف ({selectedMaterial.name})</span>
                  </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ClassSyllabusPage;