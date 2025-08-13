import React, { useMemo, useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Child, Class, EducationLevel, Servant, AppState } from '../types';
import { EditIcon, TrashIcon, PlusIcon, FileTextIcon, UsersIcon, UserIcon, BookOpenIcon, IdIcon, SettingsIcon, XIcon, ArrowLeftIcon } from '../components/Icons';
import Notification from '../components/Notification';

interface OutletContextType {
  appState: AppState;
}

type NotificationType = {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
};

const ChildrenTable: React.FC<{
  classChildren: Child[];
  onEdit: (childId: string) => void;
  onDelete: (childId: string) => void;
  onViewCard: (childId: string) => void;
}> = ({ classChildren, onEdit, onDelete, onViewCard }) => {
 
  if (classChildren.length === 0) {
    return <p className="text-center text-slate-500 py-8">لا يوجد أطفال في هذا الفصل بعد.</p>;
  }

  return (
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
            <tr>
            {['#', 'الصورة', 'الاسم', 'تاريخ الميلاد', 'الهواتف', 'ملاحظات', 'إجراءات'].map(h => (
                <th key={h} className="text-right p-3 font-semibold text-slate-600">{h}</th>
            ))}
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
            {classChildren.map((child, index) => (
            <tr key={child.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-700">{index + 1}</td>
                <td className="p-3"><img src={child.image || 'https://picsum.photos/200'} alt={child.name} className="w-12 h-12 rounded-full object-cover" /></td>
                <td className="p-3 font-medium text-slate-800">
                    <Link to={`/app/edit-child/${child.id}`} className="hover:underline text-violet-600">
                        {child.name}
                    </Link>
                </td>
                <td className="p-3 text-slate-600">{child.birthDate ? new Date(child.birthDate).toLocaleDateString('ar-EG-u-nu-latn') : 'N/A'}</td>
                <td className="p-3 text-slate-600 text-xs leading-5">
                    {child.fatherPhone && <div><span className="font-semibold">الأب:</span> {child.fatherPhone}</div>}
                    {child.motherPhone && <div className="mt-1"><span className="font-semibold">الأم:</span> {child.motherPhone}</div>}
                </td>
                <td className="p-3 text-slate-600 truncate max-w-xs">{child.notes}</td>
                <td className="p-3">
                <div className="flex gap-1">
                    <button onClick={() => onEdit(child.id)} className="p-2 text-violet-600 hover:text-violet-800" aria-label={`تعديل ${child.name}`}><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => onDelete(child.id)} className="p-2 text-red-600 hover:text-red-800" aria-label={`حذف ${child.name}`}><TrashIcon className="w-5 h-5" /></button>
                    <button onClick={() => onViewCard(child.id)} className="p-2 text-violet-600 hover:text-violet-800" aria-label={`عرض كارت ${child.name}`}><IdIcon className="w-5 h-5" /></button>
                </div>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    </div>
  );
};


const ImageUploader: React.FC<{label: string, imageSrc?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void}> = ({label, imageSrc, onChange}) => (
  <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
        {imageSrc ? (
            <img src={imageSrc} alt={label} className="w-full h-full object-cover" />
        ) : (
            <span className="text-xs text-slate-500 text-center p-1">لا يوجد</span>
        )}
        </div>
        <div>
        <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm transition-colors">
            {imageSrc ? `تغيير` : `رفع`}
            <input type="file" onChange={onChange} accept="image/*" className="hidden" />
        </label>
        </div>
    </div>
  </div>
);


const ClassDetails: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { classes, children, setChildren, servants, setClasses } = appState;
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const location = useLocation();

  const [notification, setNotification] = useState<NotificationType | null>(location.state?.notification || null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const activeClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
  
  const [editableClass, setEditableClass] = useState<Class | null>(activeClass || null);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else if (activeClass) {
        navigate(`/app/level/${activeClass.level_id}`, { replace: true });
    } else {
        navigate('/app/dashboard', { replace: true });
    }
  };

  useEffect(() => {
    if (activeClass) {
        setEditableClass(JSON.parse(JSON.stringify(activeClass)));
    }
  }, [activeClass]);
  
  useEffect(() => {
    if (location.state?.notification) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const handleClassSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (!editableClass) return;
    
    if (type === 'radio') {
        setEditableClass({ ...editableClass, [name]: value });
    } else {
        setEditableClass({ ...editableClass, [name]: value });
    }
  };

  const handleClassColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editableClass) return;
      setEditableClass({ ...editableClass, cardBackgroundColor: e.target.value });
  };

  const handleClassFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Class) => {
    const file = e.target.files?.[0];
    if (file && editableClass) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditableClass({ ...editableClass, [fieldName]: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveClassSettings = () => {
    if (editableClass) {
        setClasses(prev => prev.map(c => c.id === classId ? editableClass : c));
        setNotification({ message: 'تم حفظ إعدادات الفصل بنجاح.', type: 'success' });
        setIsSettingsOpen(false);
    }
  };


  const handleDeleteChild = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف بيانات هذا الطفل؟')) {
      setChildren(prev => prev.filter(child => child.id !== id));
      setNotification({ message: 'تم حذف الطفل بنجاح.', type: 'success' });
    }
  };

  const handleViewCard = (childId: string) => {
    navigate(`/app/child/${childId}/card`);
  };

  const exportToCsv = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    const classChildren = children.filter(c => c.class_id === classId);
    if (classChildren.length === 0) {
        alert("لا يوجد أطفال للتصدير في هذا الفصل.");
        return;
    }
  
    const headers = ['id', 'name', 'age', 'birthDate', 'gender', 'school', 'address', 'fatherName', 'fatherPhone', 'motherName', 'motherPhone', 'confessionFather', 'siblings', 'hobbies', 'background', 'notes'];
    const csvContent = [
      headers.join(','),
      ...classChildren.map(child => headers.map(header => {
        const key = header as keyof Child;
        const value = child[key];
        if (key === 'siblings' && Array.isArray(value)) {
            return `"${value.join('; ')}"`;
        }
        return `"${value || ''}"`;
      }).join(','))
    ].join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const filename = `بيانات_اطفال_${classInfo?.grade?.replace(/\s/g, '_') || ''}_${classInfo?.name.replace(/\s/g, '_') || classId}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!activeClass) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-md">
            <BookOpenIcon className="w-24 h-24 text-violet-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-700">مرحباً بك في لوحة معلومات الفصل</h2>
            <p className="text-slate-500 mt-2">يرجى اختيار فصل من القائمة الجانبية لعرض بيانات الأطفال.</p>
        </div>
    );
  }

  const classChildren = children.filter(c => c.class_id === activeClass.id);
  const boys = classChildren.filter(c => c.gender === 'male').length;
  const girls = classChildren.filter(c => c.gender === 'female').length;

  return (
    <div className="space-y-6">
       {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          appSettings={appState.settings}
        />
       )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
                {activeClass.logo ? <img src={activeClass.logo} alt={activeClass.name} className="w-20 h-20 object-contain rounded-lg" /> : <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center"><UsersIcon className="w-10 h-10 text-slate-400"/></div>}
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{`${activeClass.grade} - ${activeClass.name}`}</h1>
                    <p className="text-md text-slate-600 flex items-center gap-2 mt-1">
                        <UserIcon className="w-4 h-4 text-slate-500"/>المسؤول: 
                        <span className="font-semibold">{activeClass.supervisorName || 'غير محدد'}</span>
                    </p>
                        {activeClass.servantNames.length > 0 && (
                        <div className="mt-1 text-sm text-slate-600 flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-slate-500"/>
                            <span className="font-medium">الخدام:</span>
                            <span className="text-xs">
                                {activeClass.servantNames.join('، ')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={handleBack} className="btn btn-secondary">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>رجوع</span>
            </button>
        </div>
       
       {isSettingsOpen && editableClass && (
        <div className="bg-white rounded-lg shadow p-6 relative animate-fade-in">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-3 left-3 text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6"/></button>
            <h3 className="font-bold text-xl mb-6 text-slate-800">إعدادات الفصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                    <h4 className="font-semibold text-lg text-slate-700 border-b pb-2">إعدادات عامة</h4>
                    <div>
                        <label htmlFor="className" className="block text-sm font-medium text-slate-700 mb-1">اسم الفصل</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={editableClass.name}
                            onChange={handleClassSettingChange}
                            className="form-input"
                        />
                    </div>
                    <ImageUploader label="شعار الفصل" imageSrc={editableClass.logo} onChange={(e) => handleClassFileChange(e, 'logo')} />
                </div>
                 <div className="space-y-6">
                    <h4 className="font-semibold text-lg text-slate-700 border-b pb-2">تصميم كارت الطفل</h4>
                    <ImageUploader label="شعار الكارت" imageSrc={editableClass.cardLogo} onChange={(e) => handleClassFileChange(e, 'cardLogo')} />
                    
                    <div className="space-y-2">
                         <label className="block text-sm font-medium text-slate-700">خلفية الكارت</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="cardBackgroundStyle" value="color" checked={editableClass.cardBackgroundStyle === 'color'} onChange={handleClassSettingChange} className="form-radio text-violet-600"/>
                                <span className="text-sm font-medium text-slate-700">لون ثابت</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="cardBackgroundStyle" value="image" checked={editableClass.cardBackgroundStyle === 'image'} onChange={handleClassSettingChange} className="form-radio text-violet-600"/>
                                <span className="text-sm font-medium text-slate-700">صورة</span>
                            </label>
                        </div>
                        {editableClass.cardBackgroundStyle === 'color' ? (
                             <div className="flex items-center gap-4 pt-2">
                                <label htmlFor="cardBackgroundColor" className="text-sm font-medium text-slate-700">اختر لون الخلفية:</label>
                                <input type="color" id="cardBackgroundColor" name="cardBackgroundColor" value={editableClass.cardBackgroundColor || '#ffffff'} onChange={handleClassColorChange} className="w-12 h-12 border-none rounded-lg cursor-pointer"/>
                            </div>
                        ) : (
                           <div className="pt-2">
                             <ImageUploader label="صورة خلفية الكارت" imageSrc={editableClass.cardBackground} onChange={(e) => handleClassFileChange(e, 'cardBackground')} />
                           </div>
                        )}
                    </div>
                </div>
            </div>
             <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button onClick={() => setIsSettingsOpen(false)} className="btn btn-secondary">إلغاء</button>
                <button onClick={handleSaveClassSettings} className="btn btn-primary">حفظ التغييرات</button>
            </div>
        </div>
       )}

       <div className="bg-white rounded-lg shadow">
        <div className="p-4 flex flex-wrap justify-between items-center border-b gap-4">
            <div className="flex items-baseline gap-3">
                <h3 className="font-bold text-lg">قائمة الأطفال</h3>
                <span className="text-sm text-slate-500">{classChildren.length} طلاب ({boys} أولاد / {girls} بنات)</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="btn btn-secondary"
                    aria-expanded={isSettingsOpen}
                >
                    <SettingsIcon className="w-4 h-4" />
                    إعدادات الفصل
                </button>
                <button
                    onClick={() => navigate(`/app/class/${activeClass.id}/cards`)}
                    className="btn btn-secondary"
                >
                    <IdIcon className="w-4 h-4" />
                    طباعة الكروت
                </button>
                <button
                    onClick={() => exportToCsv(activeClass.id)}
                    className="btn btn-secondary"
                >
                    <FileTextIcon className="w-4 h-4" />
                    تصدير
                </button>
                <button onClick={() => navigate(`/app/add-child/${activeClass.id}`)} className="btn btn-primary">
                    <PlusIcon className="w-5 h-5"/> إضافة طفل
                </button>
            </div>
        </div>
        <ChildrenTable classChildren={classChildren} onEdit={(id) => navigate(`/app/edit-child/${id}`)} onDelete={handleDeleteChild} onViewCard={handleViewCard} />
       </div>
    </div>
  );
};

export default ClassDetails;