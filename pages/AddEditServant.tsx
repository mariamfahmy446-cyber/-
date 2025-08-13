
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams, useNavigate, Navigate } from 'react-router-dom';
import type { Servant, AppState, UserRole } from '../types';
import { UserIcon, PhoneIcon, MailIcon, FileTextIcon, QrCodeIcon, BookOpenIcon, CalendarIcon, BriefcaseIcon, ArrowLeftIcon, PlusIcon, TrashIcon } from '../components/Icons';
import Notification from '../components/Notification';

interface OutletContextType {
  appState: AppState;
}

type ServantFormData = Omit<Servant, 'id' | 'age'> & { age: number | string };

const AddEditServant: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { servants, setServants, levels, classes, currentUser, setUsers, setCurrentUser } = appState;
  const { servantId } = useParams();
  const navigate = useNavigate();
  const isEditMode = servantId !== undefined;

  const isSecretary = useMemo(() => {
    if (!currentUser) return false;
    // Secretaries can edit their own profiles (for profile completion)
    if (currentUser.servantId === servantId) {
        return false;
    }
    const secretaryRoles: UserRole[] = ['secretary', 'assistant_secretary', 'level_secretary'];
    return secretaryRoles.some(role => currentUser.roles.includes(role));
  }, [currentUser, servantId]);

  const isNewUserSetup = useMemo(() => {
    return currentUser && !currentUser.profileComplete && currentUser.servantId === servantId;
  }, [currentUser, servantId]);


  const getInitialState = (): ServantFormData => ({
    name: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    notes: '',
    image: '',
    birthDate: '',
    age: '',
    confessionFather: '',
    maritalStatus: 'single',
    professionalStatus: 'not_working',
    jobTitle: '',
    workplace: '',
    college: '',
    professionalStatusNotes: '',
    serviceAssignments: [],
  });
  
  const [servantData, setServantData] = useState<ServantFormData>(getInitialState());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; } | null>(null);

  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const [newAssignment, setNewAssignment] = useState<{ levelId: string; classId: string }>({ levelId: '', classId: '' });

  const handleBack = () => {
    if (isNewUserSetup) return;
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        navigate('/app/settings', { replace: true, state: { activeTab: 'users' } });
    }
  };

  const calculateAge = (birthDate: string): number | '' => {
    if (!birthDate) return '';
    try {
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        return age >= 0 ? age : '';
    } catch(e) {
        return '';
    }
  };

  useEffect(() => {
    if (isEditMode && servantId) {
      const existingServant = servants.find(s => s.id === servantId);
      if (existingServant) {
        setServantData({
            ...getInitialState(), // ensure all fields are present
            ...existingServant,
            age: existingServant.birthDate ? calculateAge(existingServant.birthDate) : '',
            serviceAssignments: existingServant.serviceAssignments || [],
        });
        if (existingServant.birthDate) {
            try {
                const [year, month, day] = existingServant.birthDate.split('-');
                setBirthYear(year || '');
                setBirthMonth(parseInt(month, 10).toString());
                setBirthDay(parseInt(day, 10).toString());
            } catch (e) {
                console.error("Error parsing birth date:", e);
            }
        }
      } else {
        alert('لم يتم العثور على الخادم!');
        navigate('/app/settings');
      }
    }
  }, [servantId, isEditMode, servants, navigate]);

  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
        const formattedMonth = birthMonth.padStart(2, '0');
        const formattedDay = birthDay.padStart(2, '0');
        const dateString = `${birthYear}-${formattedMonth}-${formattedDay}`;
        
        const d = new Date(dateString);
        if (d && (d.getMonth() + 1) === parseInt(birthMonth)) {
             setServantData(prev => ({
                ...prev,
                birthDate: dateString,
                age: calculateAge(dateString)
            }));
        }
    }
  }, [birthDay, birthMonth, birthYear]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'professionalStatus') {
        setServantData(prev => ({
            ...prev,
            professionalStatus: value as Servant['professionalStatus'],
            jobTitle: '',
            workplace: '',
            college: '',
            professionalStatusNotes: ''
        }));
    } else {
        setServantData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setServantData(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servantData.name.trim()) {
        alert('يرجى إدخال اسم الخادم.');
        return;
    }

    let wasProfileCompletion = false;
    const finalServantData = {
        ...servantData,
        age: Number(servantData.age) || undefined,
    };

    if (isEditMode && servantId) {
      setServants(prev => prev.map(s => (s.id === servantId ? { id: servantId, ...finalServantData } : s)));

      if (isNewUserSetup) {
          const updatedUser = { ...currentUser, profileComplete: true };
          setCurrentUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
          wasProfileCompletion = true;
      }

      setNotification({ message: 'تم حفظ البيانات بنجاح!', type: 'success' });
    } else {
      const newServant: Servant = {
        id: Date.now().toString(),
        ...finalServantData,
      };
      setServants(prev => [...prev, newServant]);
      setNotification({ message: 'تم إضافة الخادم بنجاح!', type: 'success' });
    }

    setTimeout(() => {
        if (wasProfileCompletion) {
            navigate('/app/dashboard', { replace: true });
        } else {
            handleBack();
        }
    }, 500);
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف بيانات هذا الخادم؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setServants(prev => prev.filter(s => s.id !== servantId));
      alert('تم حذف الخادم بنجاح.');
      navigate('/app/settings', { state: { activeTab: 'users' } });
    }
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 100; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, []);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString(),
      name: new Date(0, i).toLocaleString('ar-EG', { month: 'long' }),
    }));
  }, []);
  
  const dayOptions = useMemo(() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const daysInMonth = new Date(parseInt(birthYear), parseInt(birthMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  }, [birthYear, birthMonth]);
  
  const availableClasses = useMemo(() => {
    if (!newAssignment.levelId) return [];
    return classes.filter(c => c.level_id === newAssignment.levelId);
  }, [newAssignment.levelId, classes]);

  useEffect(() => {
    if (dayOptions.length > 0 && birthDay && parseInt(birthDay) > dayOptions.length) {
        setBirthDay(dayOptions.length.toString());
    }
  }, [dayOptions, birthDay]);

  const handleNewAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAssignment(prev => {
        const updated = { ...prev, [name]: value };
        if (name === 'levelId') {
            updated.classId = '';
        }
        return updated;
    });
  };

  const handleAddAssignment = () => {
    const { levelId, classId } = newAssignment;
    if (!levelId || !classId) {
        setNotification({ message: 'يرجى اختيار المرحلة والفصل.', type: 'error' });
        return;
    }

    const currentAssignments = servantData.serviceAssignments || [];
    const isDuplicate = currentAssignments.some(a => a.levelId === levelId && a.classId === classId);

    if (isDuplicate) {
        setNotification({ message: 'هذه الخدمة معينة بالفعل.', type: 'warning' });
        return;
    }

    setServantData(prev => ({
        ...prev,
        serviceAssignments: [...currentAssignments, { levelId, classId }]
    }));
    setNewAssignment({ levelId: '', classId: '' });
  };
  
  const handleRemoveAssignment = (indexToRemove: number) => {
    setServantData(prev => ({
        ...prev,
        serviceAssignments: (prev.serviceAssignments || []).filter((_, index) => index !== indexToRemove)
    }));
  };
  
  if (isSecretary) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto">
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
        
        {isNewUserSetup && (
            <div className="bg-violet-100 border-l-4 border-violet-500 text-violet-800 p-4 rounded-md mb-8 flex items-start gap-3">
                <FileTextIcon className="w-6 h-6 shrink-0 mt-1"/>
                <div>
                    <h3 className="font-bold">مرحباً بك في الخدمة!</h3>
                    <p>يرجى استكمال بياناتك الشخصية وبيانات خدمتك لتتمكن من استخدام باقي أجزاء التطبيق.</p>
                </div>
            </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
                {isNewUserSetup ? 'استكمال بيانات الخدمة' : isEditMode ? 'تعديل بيانات الخادم' : 'إضافة خادم جديد'}
            </h1>
            {!isNewUserSetup && (
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            )}
        </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                 <div className="bg-white p-6 rounded-xl shadow-md text-center space-y-4">
                     <img 
                        src={servantData.image || 'https://i.pravatar.cc/150?u=placeholder'} 
                        alt="صورة الخادم" 
                        className="w-48 h-48 mx-auto rounded-full object-cover border-8 border-slate-100 shadow-sm"
                     />
                     <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg text-sm inline-block transition-colors">
                         <span>{servantData.image ? 'تغيير الصورة' : 'رفع صورة'}</span>
                         <input type="file" name="image" onChange={handlePhotoChange} accept="image/*" className="hidden"/>
                     </label>
                 </div>
                 {isEditMode && servantId && (
                     <div className="bg-white p-6 rounded-xl shadow-md space-y-4 text-center">
                         <h3 className="font-semibold text-lg text-slate-800">QR Code</h3>
                         <div className="p-2 border rounded-lg bg-white inline-block">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${servantId}`}
                                alt={`QR Code for servant ${servantId}`}
                                className="w-40 h-40"
                            />
                         </div>
                         <p className="text-xs text-slate-500">كود الخادم: <span className="font-mono">{servantId}</span></p>
                     </div>
                 )}
            </div>
            
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3">البيانات الشخصية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="الاسم" name="name" value={servantData.name} onChange={handleChange} Icon={UserIcon} required containerClassName="md:col-span-2"/>
                        <InputField label="رقم الهاتف الأساسي" name="phone" value={servantData.phone} onChange={handleChange} type="tel" Icon={PhoneIcon} required/>
                        <InputField label="رقم هاتف إضافي" name="phone2" value={servantData.phone2 || ''} onChange={handleChange} type="tel" Icon={PhoneIcon} />
                        <InputField label="البريد الإلكتروني" name="email" value={servantData.email || ''} onChange={handleChange} type="email" Icon={MailIcon} containerClassName="md:col-span-2"/>
                        <InputField label="العنوان" name="address" value={servantData.address || ''} onChange={handleChange} Icon={UserIcon} containerClassName="md:col-span-2"/>
                        
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الميلاد</label>
                            <div className="grid grid-cols-3 gap-2">
                                <select id="birthDay" name="birthDay" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="form-select">
                                    <option value="" disabled>اليوم</option>
                                    {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select id="birthMonth" name="birthMonth" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="form-select">
                                    <option value="" disabled>الشهر</option>
                                    {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                                </select>
                                <select id="birthYear" name="birthYear" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="form-select">
                                    <option value="" disabled>السنة</option>
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">السن</label>
                            <div className="form-input bg-slate-100 text-slate-500">{servantData.age || '-'}</div>
                        </div>
                         <InputField label="أب الاعتراف" name="confessionFather" value={servantData.confessionFather || ''} onChange={handleChange} Icon={UserIcon} containerClassName="md:col-span-2"/>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3">الحالة الاجتماعية والمهنية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <SelectField label="الحالة الاجتماعية" name="maritalStatus" value={servantData.maritalStatus || 'single'} onChange={handleChange}>
                           <option value="single">أعزب</option>
                           <option value="engaged">خاطب</option>
                           <option value="married">متزوج</option>
                       </SelectField>
                       <SelectField label="الحالة المهنية" name="professionalStatus" value={servantData.professionalStatus || 'not_working'} onChange={handleChange}>
                           <option value="student">طالب</option>
                           <option value="working">يعمل</option>
                           <option value="not_working">لا يعمل</option>
                           <option value="other">غير ذلك</option>
                       </SelectField>
                    </div>

                    {servantData.professionalStatus === 'working' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                             <InputField label="الوظيفة" name="jobTitle" value={servantData.jobTitle || ''} onChange={handleChange} Icon={BriefcaseIcon} />
                             <InputField label="مكان العمل" name="workplace" value={servantData.workplace || ''} onChange={handleChange} Icon={BriefcaseIcon} />
                        </div>
                    )}
                    {servantData.professionalStatus === 'student' && (
                        <div className="pt-4 border-t">
                            <InputField label="الكلية / المدرسة" name="college" value={servantData.college || ''} onChange={handleChange} Icon={BookOpenIcon} />
                        </div>
                    )}
                    {servantData.professionalStatus === 'other' && (
                        <div className="pt-4 border-t">
                            <TextAreaField 
                                label="ملاحظات مهنية (غير ذلك)"
                                name="professionalStatusNotes" 
                                value={servantData.professionalStatusNotes || ''} 
                                onChange={handleChange} 
                                Icon={FileTextIcon} 
                            />
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3">المراحل والفصول التي يخدم بها</h3>
                    
                    <div className="space-y-2">
                        {(servantData.serviceAssignments || []).map((assignment, index) => {
                            const level = levels.find(l => l.id === assignment.levelId);
                            const aClass = classes.find(c => c.id === assignment.classId);
                            return (
                                <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                                    <span className="text-sm font-medium text-slate-800">
                                        {level?.name || 'مرحلة غير معروفة'} - {aClass?.name || 'فصل غير معروف'}
                                    </span>
                                    <button type="button" onClick={() => handleRemoveAssignment(index)} className="text-red-500 hover:text-red-700 p-1">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            );
                        })}
                        {(servantData.serviceAssignments || []).length === 0 && (
                            <p className="text-sm text-center text-slate-500 py-2">لم يتم تعيين خدمات بعد.</p>
                        )}
                    </div>

                    <div className="pt-4 border-t space-y-3">
                        <h4 className="text-md font-semibold text-slate-700">إضافة خدمة جديدة</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">المرحلة</label>
                                <select name="levelId" value={newAssignment.levelId} onChange={handleNewAssignmentChange} className="form-select">
                                    <option value="" disabled>-- اختر مرحلة --</option>
                                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">الفصل / القسم</label>
                                <select name="classId" value={newAssignment.classId} onChange={handleNewAssignmentChange} className="form-select" disabled={!newAssignment.levelId}>
                                    <option value="" disabled>-- اختر فصل --</option>
                                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="button" onClick={handleAddAssignment} className="w-full mt-2 btn btn-secondary text-sm">
                            <PlusIcon className="w-4 h-4"/>
                            إضافة
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                     <TextAreaField label="ملاحظات" name="notes" value={servantData.notes || ''} onChange={handleChange} Icon={FileTextIcon} />
                </div>
            </div>
        </div>
        
        <div className="flex justify-center items-center gap-4 pt-6 mt-4 border-t border-slate-200">
          {isEditMode && !isNewUserSetup && (
            <button type="button" onClick={handleDelete} className="btn btn-danger">
              حذف الخادم
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {isNewUserSetup ? 'حفظ ومتابعة' : isEditMode ? 'حفظ التعديلات' : 'إضافة خادم'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  Icon: React.ElementType;
  type?: string;
  required?: boolean;
  containerClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, Icon, type = 'text', required = false, containerClassName = '' }) => (
  <div className={containerClassName}>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon className="h-5 w-5 text-slate-400" />
        </div>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="form-input w-full pl-3 pr-10"
        />
    </div>
  </div>
);

interface SelectFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="form-select"
        >
            {children}
        </select>
    </div>
);


interface TextAreaFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    Icon: React.ElementType;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, name, value, onChange, Icon }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
         <div className="relative">
             <div className="pointer-events-none absolute top-3 right-0 flex items-center pr-3">
                <Icon className="h-5 w-5 text-slate-400" />
            </div>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                className="form-textarea w-full pl-3 pr-10"
            />
        </div>
    </div>
);


export default AddEditServant;