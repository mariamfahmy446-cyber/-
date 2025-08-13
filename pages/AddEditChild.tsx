import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { Child, Class, AppState } from '../types';
import { TrashIcon, PlusIcon, ArrowLeftIcon, CameraIcon, XIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const CameraCaptureModal: React.FC<{
    onCapture: (imageDataUrl: string) => void;
    onClose: () => void;
}> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startStream = (stream: MediaStream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        };

        const openCamera = async () => {
            // Try user-facing camera first
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then(startStream)
                .catch(err => {
                    console.warn("Could not get user-facing camera, trying any camera.", err);
                    // Fallback to any available camera
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(startStream)
                        .catch(err2 => {
                            console.error("Error accessing camera: ", err2);
                            setError("لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.");
                        });
                });
        };

        openCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for user-facing camera to un-mirror it
                if (streamRef.current?.getVideoTracks()[0].getSettings().facingMode === 'user') {
                    context.translate(video.videoWidth, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                onCapture(imageDataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">التقاط صورة</h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
                {error ? (
                    <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg bg-black transform scale-x-[-1]"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                )}
                <div className="mt-4 flex justify-center">
                    <button onClick={handleCapture} disabled={!!error} className="btn btn-primary">
                        <CameraIcon className="w-5 h-5" />
                        <span>التقاط</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


const AddEditChild: React.FC = () => {
  const { appState } = useOutletContext<OutletContextType>();
  const { children, setChildren, classes, currentUser } = appState;
  const { childId, classId } = useParams();
  const navigate = useNavigate();
  const isEditMode = childId !== undefined;

  const isSiteAdmin = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.roles.includes('general_secretary') && currentUser.nationalId === '29908241301363';
  }, [currentUser]);

  const [childData, setChildData] = useState<Omit<Child, 'id' | 'age'> & { age: string | number }>({
    class_id: classId || '',
    name: '',
    age: 6,
    birthDate: '',
    gender: 'male',
    school: '',
    address: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    siblings: [],
    confessionFather: '',
    hobbies: '',
    background: '',
    notes: '',
    image: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
        navigate(-1);
    } else {
        const fallbackUrl = childData.class_id ? `/app/class/${childData.class_id}` : '/app/dashboard';
        navigate(fallbackUrl, { replace: true });
    }
  };

  useEffect(() => {
    if (isEditMode && childId) {
      const existingChild = children.find(c => c.id === childId);
      if (existingChild) {
        setChildData(existingChild);
        if(existingChild.image) setPhotoPreview(existingChild.image);
      } else {
        alert('لم يتم العثور على الطفل!');
        navigate('/app/dashboard');
      }
    } else if (!isEditMode && classId) {
      setChildData(prev => ({ ...prev, class_id: classId }));
    }
  }, [childId, classId, isEditMode, children, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'birthDate' && value) {
        const birthYear = new Date(value).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        setChildData(prev => ({...prev, age: isNaN(age) ? '' : age, [name]: value}));
    } else {
        const isNumber = type === 'number';
        setChildData(prev => ({ ...prev, [name]: isNumber ? parseInt(value) || 0 : value }));
    }
  };

  const handleCapturePhoto = (imageDataUrl: string) => {
    setChildData(prev => ({ ...prev, image: imageDataUrl }));
    setPhotoPreview(imageDataUrl);
    setIsCameraOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childData.class_id) {
        alert('يرجى اختيار فصل للطفل.');
        return;
    }
    const targetClassId = childData.class_id;
    let notification;
    const finalChildData = { ...childData, age: Number(childData.age) };

    if (isEditMode && childId) {
      setChildren(prev => prev.map(c => (c.id === childId ? { id: childId, ...finalChildData } : c)));
      notification = { message: 'تم حفظ التعديلات بنجاح!', type: 'success' };
    } else {
      const newChild: Child = {
        id: Date.now().toString(),
        ...finalChildData,
      };
      setChildren(prev => [...prev, newChild]);
      notification = { message: 'تم إضافة الطفل بنجاح!', type: 'success' };
    }
    navigate(`/app/class/${targetClassId}`, { state: { notification } });
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف بيانات هذا الطفل؟')) {
      const targetClassId = childData.class_id;
      setChildren(prev => prev.filter(c => c.id !== childId));
      const notification = { message: 'تم حذف الطفل بنجاح.', type: 'success' };
      navigate(`/app/class/${targetClassId}`, { state: { notification } });
    }
  };
  
  const currentClass = classes.find(c => c.id === childData.class_id);

  return (
    <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
                {isEditMode ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'}
            </h1>
            <button type="button" onClick={handleBack} className="btn btn-secondary self-start sm:self-auto">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>رجوع</span>
            </button>
        </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="text-center">
            {currentClass && <p className="text-slate-600 mt-1 mb-4">
                الفصل: {`${currentClass.grade} - ${currentClass.name}`}
            </p>}
             <input
                type="text"
                id="name"
                name="name"
                placeholder="اكتب اسم الطفل هنا..."
                value={childData.name}
                onChange={handleChange}
                required
                className="w-full max-w-lg mx-auto px-4 py-3 border-0 border-b-2 border-slate-300 bg-transparent text-center text-4xl font-extrabold text-slate-800 focus:ring-0 focus:border-violet-500 transition"
                />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                 <div className="bg-white p-6 rounded-xl shadow-md text-center space-y-4">
                     <img 
                        src={photoPreview || 'https://picsum.photos/seed/placeholder/200'} 
                        alt="صورة الطفل" 
                        className="w-48 h-48 mx-auto rounded-full object-cover border-8 border-slate-100 shadow-sm"
                     />
                    <button type="button" onClick={() => setIsCameraOpen(true)} className="btn btn-primary">
                        <CameraIcon className="w-5 h-5" />
                        <span>{photoPreview ? 'التقاط صورة جديدة' : 'التقاط صورة'}</span>
                    </button>
                 </div>

                 {isEditMode && childId && (
                     <div className="bg-white p-6 rounded-xl shadow-md space-y-4 text-center">
                         <h3 className="font-semibold text-lg text-slate-800">QR Code</h3>
                         <div className="p-2 border rounded-lg bg-white inline-block">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${childId}`}
                                alt={`QR Code for child ${childId}`}
                                className="w-40 h-40"
                            />
                         </div>
                         <p className="text-xs text-slate-500">كود الطفل: <span className="font-mono">{childId}</span></p>
                     </div>
                 )}
            </div>
            
            <div className="lg:col-span-2 space-y-6">
                {!isEditMode && !classId && (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <label htmlFor="class_id" className="block text-sm font-medium text-slate-700 mb-1">
                            اختر الفصل <span className="text-red-500">*</span>
                        </label>
                        <select 
                            name="class_id" 
                            id="class_id" 
                            value={childData.class_id} 
                            onChange={handleChange}
                            required
                            className="form-select"
                        >
                            <option value="" disabled>-- يرجى اختيار فصل --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.grade} - {c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            
                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3">البيانات الأساسية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="السن" name="age" type="number" value={childData.age.toString()} onChange={handleChange} required />
                        <InputField label="تاريخ الميلاد" name="birthDate" type="date" value={childData.birthDate} onChange={handleChange} />
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">الجنس</label>
                            <select name="gender" id="gender" value={childData.gender} onChange={handleChange} className="form-select">
                                <option value="male">ذكر</option>
                                <option value="female">أنثى</option>
                                <option value="other">آخر</option>
                            </select>
                        </div>
                        <InputField label="المدرسة" name="school" value={childData.school} onChange={handleChange} />
                        <InputField label="العنوان" name="address" value={childData.address} onChange={handleChange} containerClassName="md:col-span-2" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                     <h3 className="text-xl font-bold text-slate-800 border-b pb-3">بيانات العائلة</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="اسم الأب" name="fatherName" value={childData.fatherName} onChange={handleChange} />
                        <InputField label="هاتف الأب" name="fatherPhone" value={childData.fatherPhone} onChange={handleChange} />
                        <InputField label="اسم الأم" name="motherName" value={childData.motherName} onChange={handleChange} />
                        <InputField label="هاتف الأم" name="motherPhone" value={childData.motherPhone} onChange={handleChange} />
                        <InputField label="أب الإعتراف" name="confessionFather" value={childData.confessionFather} onChange={handleChange} containerClassName="md:col-span-2" />
                     </div>
                     <SiblingsManager 
                        siblings={childData.siblings} 
                        setSiblings={(newSiblings) => setChildData(prev => ({...prev, siblings: newSiblings}))} 
                    />
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                     <h3 className="text-xl font-bold text-slate-800 border-b pb-3">بيانات إضافية</h3>
                     <InputField label="الهوايات" name="hobbies" value={childData.hobbies} onChange={handleChange} />
                     <TextAreaField label="خلفية الطفل (مثلاً: يتيم، من ذوي الاحتياجات)" name="background" value={childData.background} onChange={handleChange} />
                     <TextAreaField label="ملاحظات إضافية" name="notes" value={childData.notes} onChange={handleChange} />
                </div>
            </div>
        </div>
        
        <div className="flex justify-center items-center gap-4 pt-6 mt-4 border-t border-slate-200">
          {isEditMode && isSiteAdmin && (
            <button type="button" onClick={handleDelete} className="btn btn-danger">
              حذف الطفل
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'حفظ التعديلات' : 'إضافة الطفل'}
          </button>
        </div>
      </form>
      {isCameraOpen && <CameraCaptureModal onCapture={handleCapturePhoto} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};

// Reusable Input Field Component
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  containerClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = 'text', required = false, containerClassName = '' }) => (
  <div className={containerClassName}>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="form-input"
    />
  </div>
);

// Reusable Text Area Field Component
interface TextAreaFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={3}
            className="form-textarea"
        />
    </div>
);

const SiblingsManager: React.FC<{siblings: string[], setSiblings: (s: string[]) => void}> = ({siblings, setSiblings}) => {
    const [name, setName] = useState('');

    const handleAddSibling = () => {
        if(name.trim()) {
            setSiblings([...siblings, name.trim()]);
            setName('');
        }
    }

    const handleRemoveSibling = (index: number) => {
        setSiblings(siblings.filter((_, i) => i !== index));
    }
    
    return (
        <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700">الأخوة ({siblings.length})</h4>
            <div className="space-y-2">
                {siblings.map((s, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-slate-100 p-2 rounded-md">
                        <span>{s}</span>
                        <button type="button" onClick={() => handleRemoveSibling(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
                {siblings.length === 0 && <p className="text-xs text-slate-500">لا يوجد أخوة مسجلين.</p>}
            </div>
            <div className="flex gap-2 items-end">
                <div className="w-full">
                  <label htmlFor="sibling_name" className="block text-xs font-medium text-slate-700 mb-1">إضافة اسم أخ/أخت</label>
                  <input
                      type="text"
                      id="sibling_name"
                      name="sibling_name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="form-input text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSibling(); }}}
                  />
                </div>
                <button type="button" onClick={handleAddSibling} className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 shrink-0"><PlusIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
}

export default AddEditChild;