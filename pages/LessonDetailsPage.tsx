import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import type { SyllabusItem, LessonAid } from '../types';
import { ImageIcon, TrashIcon, PlusIcon, XIcon, ArrowLeftIcon, BookOpenIcon, VideoIcon, LinkIcon, CheckIcon } from '../components/Icons';
import Notification from '../components/Notification';
import { api } from '../services/api';

interface OutletContextType {
  appState: AppState;
}

const LessonDetailsPage: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { syllabus, lessonAids } = appState;
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const lesson = useMemo(() => syllabus.find(s => s.id === lessonId), [syllabus, lessonId]);

  const [editableLesson, setEditableLesson] = useState<SyllabusItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [selectedAidForLightbox, setSelectedAidForLightbox] = useState<LessonAid | null>(null);
  const [newStoryLink, setNewStoryLink] = useState('');

  const imageAidInputRef = useRef<HTMLInputElement>(null);
  const videoAidInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else if (lesson) {
        navigate(`/app/schedule/class/${lesson.classId}`, { replace: true });
    } else {
        navigate('/app/schedule', { replace: true });
    }
  };

  useEffect(() => {
    if (lesson) {
      setEditableLesson(JSON.parse(JSON.stringify(lesson)));
      setIsDirty(false);
    }
  }, [lesson]);

  useEffect(() => {
    if (!lesson || !editableLesson) {
      setIsDirty(false);
      return;
    }
    const originalLessonForCompare = {
        lessonImage: lesson.lessonImage || '',
        storyText: lesson.storyText || '',
        storyLinks: lesson.storyLinks || [],
    };
    const editableLessonForCompare = {
        lessonImage: editableLesson.lessonImage || '',
        storyText: editableLesson.storyText || '',
        storyLinks: editableLesson.storyLinks || [],
    };

    setIsDirty(JSON.stringify(originalLessonForCompare) !== JSON.stringify(editableLessonForCompare));
  }, [editableLesson, lesson]);


  const aids = useMemo(() => lessonAids.filter(a => a.lessonId === lessonId), [lessonAids, lessonId]);

  const handleLocalUpdate = (updates: Partial<SyllabusItem>) => {
    setEditableLesson(prev => prev ? { ...prev, ...updates } : null);
  };
  
  const handleSaveChanges = async () => {
    if (editableLesson) {
        try {
            await api.updateSyllabusItem(lessonId!, editableLesson);
            setIsDirty(false);
            setNotification({ message: 'تم حفظ التعديلات بنجاح!', type: 'success' });
        } catch(error) {
            setNotification({ message: 'فشل حفظ التعديلات.', type: 'error' });
        }
    }
  };

  const handleCancelChanges = () => {
    if (lesson) {
        setEditableLesson(JSON.parse(JSON.stringify(lesson)));
    }
    setIsDirty(false);
  };

  const handleLessonImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleLocalUpdate({ lessonImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStoryLink = () => {
    if (newStoryLink.trim()) {
        const currentLinks = editableLesson?.storyLinks || [];
        handleLocalUpdate({ storyLinks: [...currentLinks, newStoryLink.trim()] });
        setNewStoryLink('');
    }
  };

  const handleDeleteStoryLink = (index: number) => {
    if(!editableLesson?.storyLinks) return;
    const updatedLinks = editableLesson.storyLinks.filter((_, i) => i !== index);
    handleLocalUpdate({ storyLinks: updatedLinks });
  };

  const handleAddAid = (type: 'image' | 'video') => {
    if (type === 'image') {
        imageAidInputRef.current?.click();
    } else if (type === 'video') {
        videoAidInputRef.current?.click();
    }
  };

  const handleAidFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
     const file = e.target.files?.[0];
     if (file) {
         const reader = new FileReader();
         reader.onloadend = async () => {
            const newAidData = {
                lessonId: lessonId!,
                type: type,
                data: reader.result as string,
                title: file.name
            };
            try {
                await api.addLessonAid(newAidData);
                setNotification({ message: 'تم رفع الملف بنجاح.', type: 'success' });
            } catch (error) {
                setNotification({ message: 'فشل رفع الملف.', type: 'error' });
            }
         };
         reader.readAsDataURL(file);
     }
     e.target.value = '';
  };

  const handleDeleteAid = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف وسيلة الإيضاح هذه؟')) {
        try {
            await api.deleteLessonAid(id);
            setNotification({ message: 'تم حذف الملف.', type: 'success' });
        } catch (error) {
            setNotification({ message: 'فشل حذف الملف.', type: 'error' });
        }
    }
  };

  if (!lesson || !editableLesson) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-md">
            <BookOpenIcon className="w-24 h-24 text-red-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-700">لم يتم العثور على الدرس</h2>
            <p className="text-slate-500 mt-2">قد يكون الرابط غير صحيح أو تم حذف الدرس.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
        {isDirty && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t p-4 z-20 animate-slide-in-down flex justify-center items-center gap-4">
                <p className="font-semibold text-slate-700">لديك تغييرات غير محفوظة.</p>
                <button onClick={handleCancelChanges} className="btn btn-secondary">إلغاء</button>
                <button onClick={handleSaveChanges} className="btn btn-primary">
                    <CheckIcon className="w-5 h-5"/>
                    حفظ التعديلات
                </button>
            </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             <button onClick={handleBack} className="btn btn-secondary self-start sm:self-center">
                <ArrowLeftIcon className="w-4 h-4"/>
                <span>رجوع</span>
             </button>
             <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-800 text-center flex-grow">{lesson.lessonName}</h1>
             <div className="w-24 hidden sm:block"></div>
        </div>

      <div className="bg-white p-6 rounded-xl shadow-md text-center">
        <div className="group relative">
            {editableLesson.lessonImage ? (
                <img 
                    src={editableLesson.lessonImage} 
                    alt="صورة الدرس" 
                    className="w-full max-w-lg mx-auto h-64 object-cover rounded-lg mb-4 group-hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => setSelectedAidForLightbox({ id: 'lessonImage', lessonId: lesson.id, type: 'image', data: editableLesson.lessonImage!, title: 'صورة الدرس' })}
                />
            ) : (
                <label htmlFor="lessonImage" className="w-full max-w-lg mx-auto h-64 flex flex-col items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 hover:bg-slate-200 transition-colors mb-4 cursor-pointer">
                    <ImageIcon className="w-16 h-16 text-slate-400"/>
                    <p className="text-slate-500 mt-2">انقر لإضافة صورة للدرس</p>
                </label>
            )}
            <input id="lessonImage" type="file" onChange={handleLessonImageUpload} accept="image/*" className="hidden"/>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
            تعديل محتوى الدرس
        </h2>
        <div className="space-y-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div>
                <label htmlFor="storyText" className="block text-sm font-semibold text-slate-700 mb-2">القصة</label>
                <textarea 
                    id="storyText"
                    value={editableLesson.storyText || ''}
                    onChange={(e) => handleLocalUpdate({ storyText: e.target.value })}
                    placeholder="اكتب نص قصة الدرس هنا..."
                    rows={10}
                    className="form-textarea"
                />
            </div>
            <div className="pt-4 border-t">
                <h3 className="font-semibold text-slate-700 mb-2">روابط خارجية للقصة</h3>
                <div className="space-y-2">
                    {editableLesson.storyLinks?.map((link, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded-md border">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{link}</a>
                            <button onClick={() => handleDeleteStoryLink(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-3">
                    <input 
                        type="text" 
                        value={newStoryLink} 
                        onChange={(e) => setNewStoryLink(e.target.value)}
                        placeholder="https://example.com"
                        className="form-input"
                    />
                    <button onClick={handleAddStoryLink} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"><PlusIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">وسائل الإيضاح</h2>
        <div className="flex gap-4 mb-6">
            <button onClick={() => handleAddAid('image')} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <ImageIcon className="w-5 h-5"/> <span>إضافة صورة</span>
            </button>
            <input type="file" ref={imageAidInputRef} onChange={(e) => handleAidFileUpload(e, 'image')} accept="image/*" className="hidden"/>
            <button onClick={() => handleAddAid('video')} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <VideoIcon className="w-5 h-5"/> <span>إضافة فيديو</span>
            </button>
            <input type="file" ref={videoAidInputRef} onChange={(e) => handleAidFileUpload(e, 'video')} accept="video/*" className="hidden"/>
        </div>
        
        {aids.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aids.map(aid => (
              <div key={aid.id} className="relative group border rounded-lg overflow-hidden shadow-sm">
                <button onClick={() => setSelectedAidForLightbox(aid)} className="w-full h-40 bg-black text-white text-left cursor-pointer block relative">
                    {aid.type === 'image' ? (
                        <img src={aid.data} alt={aid.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                        <>
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                <VideoIcon className="w-16 h-16 text-white/50" />
                            </div>
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                 <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            </div>
                        </>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                        <p className="text-sm font-semibold break-words">{aid.title}</p>
                    </div>
                </button>
                <button onClick={() => handleDeleteAid(aid.id)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" title="حذف">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            ))}
            </div>
        ) : (
            <p className="text-center text-slate-500 py-4">لا توجد وسائل إيضاح مضافة.</p>
        )}
      </div>

      {selectedAidForLightbox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedAidForLightbox(null)} role="dialog" aria-modal="true">
            <button onClick={() => setSelectedAidForLightbox(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors z-[51]" aria-label="إغلاق">
                <XIcon className="w-8 h-8"/>
            </button>
            <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {selectedAidForLightbox.type === 'image' ? (
                    <img src={selectedAidForLightbox.data} alt={selectedAidForLightbox.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"/>
                ) : (
                    <video src={selectedAidForLightbox.data} controls autoPlay className="max-w-full max-h-full object-contain rounded-lg shadow-2xl outline-none">
                        متصفحك لا يدعم عرض الفيديو.
                    </video>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetailsPage;
