import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { AppState } from '../types';
import type { Hymn } from '../types';
import { PlusIcon, EditIcon, TrashIcon, YouTubeIcon, DownloadIcon, MusicIcon, XIcon, FileTextIcon, ChevronDownIcon, QrCodeIcon, ArrowLeftIcon, SearchIcon } from '../components/Icons';
import Notification from '../components/Notification';
import { api } from '../services/api';

interface OutletContextType {
  appState: AppState;
}

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const jsQR = (window as any).jsQR;
    if (!jsQR) {
        alert("مكتبة مسح QR غير محملة.");
        onClose();
        return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    
    let animationFrameId: number;

    const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                if (code) {
                    onScan(code.data);
                }
            } catch (e) {
                console.error("Error processing QR code frame", e);
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    };

    const startStream = (stream: MediaStream) => {
      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true"); 
      video.play();
      animationFrameId = requestAnimationFrame(tick);
    };

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(startStream)
      .catch(err => {
        console.warn("Could not get environment camera, trying default camera.", err);
        // Fallback to any available camera
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(startStream)
            .catch(err2 => {
                console.error("Error accessing camera: ", err2);
                alert("لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.");
                onClose();
            });
      });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
        <div className="relative bg-black rounded-xl shadow-2xl overflow-hidden w-full max-w-md" onClick={e => e.stopPropagation()}>
            <video ref={videoRef} className="w-full h-auto" playsInline></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
                 <h3 className="text-white text-lg font-bold text-center">قم بتوجيه الكاميرا إلى QR Code</h3>
            </div>
             <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors z-[51]" aria-label="إغلاق">
                <XIcon className="w-6 h-6"/>
            </button>
        </div>
    </div>
  );
};

const HymnsPage: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { hymns, currentUser } = appState;
    const navigate = useNavigate();
    
    const getInitialFormState = (): Omit<Hymn, 'id'> => ({
        title: '',
        lyrics: '',
        category: 'أطفال',
        youtubeUrl: '',
        file: undefined,
    });

    const [formState, setFormState] = useState(getInitialFormState());
    const [editingHymn, setEditingHymn] = useState<Hymn | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [fileName, setFileName] = useState('');
    const [expandedLyrics, setExpandedLyrics] = useState<Record<string, boolean>>({});
    const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLetter, setFilterLetter] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const arabicAlphabet = "أبتثجحخدذرزسشصضطظعغفقكلمنهوي".split('');

    const isSiteAdmin = useMemo(() => {
        if (!currentUser) return false;
        return currentUser.roles.includes('general_secretary') && currentUser.nationalId === '29908241301363';
    }, [currentUser]);
    
    const filteredHymns = useMemo(() => {
        return hymns
            .filter(hymn => {
                if (!filterLetter) return true;
                return hymn.title.trim().startsWith(filterLetter);
            })
            .filter(hymn => {
                if (!searchTerm.trim()) return true;
                return hymn.title.trim().toLowerCase().includes(searchTerm.trim().toLowerCase());
            })
            .sort((a, b) => a.title.localeCompare(b.title, 'ar'));
    }, [hymns, searchTerm, filterLetter]);


    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate('/app', { replace: true });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({ ...prev, file: { name: file.name, data: reader.result as string } }));
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const clearFile = () => {
        setFormState(prev => ({...prev, file: undefined}));
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const resetForm = () => {
        setFormState(getInitialFormState());
        setEditingHymn(null);
        setFileName('');
        clearFile();
    }

    const handleSave = async () => {
        if (isSaving) return;
        if (!formState.title.trim()) {
            setNotification({ message: 'يرجى إدخال اسم الترنيمة.', type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            if (editingHymn) {
                await api.updateHymn(editingHymn.id, formState);
                setNotification({ message: 'تم تعديل الترنيمة بنجاح!', type: 'success' });
            } else {
                await api.addHymn(formState);
                setNotification({ message: 'تم إضافة الترنيمة بنجاح!', type: 'success' });
            }
            resetForm();
        } catch (error) {
            setNotification({ message: 'فشل حفظ الترنيمة.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleEdit = (hymn: Hymn) => {
        setEditingHymn(hymn);
        setFormState({
            title: hymn.title,
            lyrics: hymn.lyrics,
            category: hymn.category,
            youtubeUrl: hymn.youtubeUrl || '',
            file: hymn.file,
        });
        setFileName(hymn.file?.name || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الترنيمة؟')) {
            try {
                await api.deleteHymn(id);
                setNotification({ message: 'تم حذف الترنيمة.', type: 'success' });
                if (editingHymn?.id === id) {
                    resetForm();
                }
            } catch (error) {
                setNotification({ message: 'فشل حذف الترنيمة.', type: 'error' });
            }
        }
    };
    
    const toggleLyrics = (id: string) => {
        setExpandedLyrics(prev => ({ ...prev, [id]: !prev[id] }));
    }

    const toggleFile = (id: string) => {
        setExpandedFiles(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleQrScanComplete = (scannedData: string) => {
        setIsScannerOpen(false);
        if (scannedData.includes('youtube.com') || scannedData.includes('youtu.be')) {
            setFormState(prev => ({...prev, youtubeUrl: scannedData}));
            setNotification({ message: 'تم قراءة رابط اليوتيوب بنجاح!', type: 'success' });
        } else {
            setNotification({ message: 'QR Code لا يحتوي على رابط يوتيوب صحيح.', type: 'error' });
        }
    };

    return (
        <div className="space-y-8">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
            {isScannerOpen && <QrScanner onScan={handleQrScanComplete} onClose={() => setIsScannerOpen(false)} />}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">إدارة الترانيم</h1>
                    <p className="text-slate-500 mt-1">إضافة وتعديل الترانيم وربطها بالملفات والروابط.</p>
                </div>
                <button onClick={handleBack} className="btn btn-secondary self-start sm:self-auto">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 lg:sticky lg:top-24 bg-white p-6 rounded-xl shadow-md border">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">{editingHymn ? 'تعديل الترنيمة' : 'إضافة ترنيمة جديدة'}</h3>
                    <div className="space-y-4">
                        <InputField label="اسم الترنيمة" name="title" value={formState.title} onChange={handleInputChange} required />
                        <InputField label="التصنيف" name="category" value={formState.category} onChange={handleInputChange} />
                        
                        <div>
                            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-slate-700 mb-1">رابط يوتيوب</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    id="youtubeUrl"
                                    name="youtubeUrl"
                                    value={formState.youtubeUrl || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://youtube.com/..."
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="p-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                                    title="مسح QR Code"
                                >
                                    <QrCodeIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>

                        <TextAreaField label="كلمات الترنيمة" name="lyrics" value={formState.lyrics} onChange={handleInputChange} />
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ملف (صوت، صورة، PDF)</label>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors border border-dashed">
                                <DownloadIcon className="w-5 h-5"/>
                                <span>{fileName ? 'تغيير الملف' : 'اختيار ملف'}</span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,application/pdf,image/*" className="hidden"/>
                            {fileName && (
                                <div className="mt-2 flex items-center justify-between text-sm bg-green-100 text-green-800 p-2 rounded-md">
                                    <span className="truncate">{fileName}</span>
                                    <button type="button" onClick={clearFile} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-200" title="إزالة الملف">
                                        <XIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t">
                            {editingHymn && (
                                <button onClick={resetForm} className="btn btn-secondary" disabled={isSaving}>إلغاء</button>
                            )}
                            <button onClick={handleSave} className="btn btn-primary flex-1" disabled={isSaving}>
                                {isSaving ? 'جاري الحفظ...' : (
                                    <>
                                        <PlusIcon className="w-5 h-5"/>
                                        <span>{editingHymn ? 'حفظ التعديلات' : 'إضافة الترنيمة'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-md p-4 sticky top-[5.5rem] z-10 border">
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="ابحث عن اسم الترنيمة..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setFilterLetter('');
                                }}
                                className="form-input w-full pl-10"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <button
                                onClick={() => { setFilterLetter(''); setSearchTerm(''); }}
                                className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors ${
                                    !filterLetter ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                الكل
                            </button>
                            {arabicAlphabet.map(letter => (
                                <button
                                    key={letter}
                                    onClick={() => {
                                        setFilterLetter(letter);
                                        setSearchTerm('');
                                    }}
                                    className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors ${
                                        filterLetter === letter ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredHymns.length > 0 ? filteredHymns.map(hymn => (
                        <div key={hymn.id} className="bg-white rounded-xl shadow-md p-4 transition-all duration-300">
                           <div className="flex justify-between items-start gap-2">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800">{hymn.title}</h4>
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{hymn.category}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <ActionButton onClick={() => handleEdit(hymn)} icon={EditIcon} title="تعديل" className="text-orange-500 hover:bg-orange-100" />
                                    {isSiteAdmin && (
                                        <ActionButton onClick={() => handleDelete(hymn.id)} icon={TrashIcon} title="حذف" className="text-red-500 hover:bg-red-100" />
                                    )}
                                </div>
                           </div>

                           {hymn.lyrics && (
                               <div className="mt-3">
                                   <button onClick={() => toggleLyrics(hymn.id)} className="w-full flex justify-between items-center text-sm font-semibold text-slate-600 hover:text-slate-800 py-1">
                                       <span>عرض الكلمات</span>
                                       <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedLyrics[hymn.id] ? 'rotate-180' : ''}`} />
                                   </button>
                                   {expandedLyrics[hymn.id] && (
                                       <div className="mt-2 p-3 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap text-sm leading-relaxed border">
                                           {hymn.lyrics}
                                       </div>
                                   )}
                               </div>
                           )}
                           
                           {hymn.file && (
                                <div className="mt-2">
                                    <button onClick={() => toggleFile(hymn.id)} className="w-full flex justify-between items-center text-sm font-semibold text-slate-600 hover:text-slate-800 py-1">
                                        <span>عرض الملف المرفق</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedFiles[hymn.id] ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedFiles[hymn.id] && (
                                        <div className="mt-2 p-2 bg-slate-50 rounded-lg border">
                                            {(() => {
                                                const mimeType = hymn.file.data.substring(hymn.file.data.indexOf(':') + 1, hymn.file.data.indexOf(';'));
                                                if (mimeType.startsWith('image/')) {
                                                    return <img src={hymn.file.data} alt={hymn.file.name} className="max-w-full rounded-md mx-auto" />;
                                                } else if (mimeType.startsWith('audio/')) {
                                                    return <audio controls src={hymn.file.data} className="w-full">متصفحك لا يدعم عنصر الصوت.</audio>;
                                                } else if (mimeType === 'application/pdf') {
                                                    return <iframe src={hymn.file.data} title={hymn.file.name} className="w-full h-96 rounded-md border" />;
                                                } else {
                                                    return <p className="text-sm text-slate-500">نوع الملف غير مدعوم للعرض المباشر.</p>;
                                                }
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                           <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                               <MediaButton 
                                    href={hymn.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    disabled={!hymn.youtubeUrl}
                                    icon={YouTubeIcon}
                                    text="مشاهدة على يوتيوب"
                                    className="bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                               <MediaButton 
                                    href={hymn.file?.data}
                                    download={hymn.file?.name}
                                    disabled={!hymn.file}
                                    icon={DownloadIcon}
                                    text="تحميل الملف"
                                    className="bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                           </div>
                        </div>
                    )) : (
                        <div className="text-center py-16 text-slate-500 bg-white rounded-lg col-span-full">
                            <MusicIcon className="w-16 h-16 mx-auto text-slate-300" />
                            <p className="mt-4 font-semibold">
                                {hymns.length > 0 ? 'لم يتم العثور على ترانيم تطابق البحث.' : 'لا توجد ترانيم مضافة بعد.'}
                            </p>
                            <p className="text-sm">
                                {hymns.length > 0 ? 'جرّب كلمة بحث مختلفة أو فلتر حرف آخر.' : 'استخدم النموذج لإضافة أول ترنيمة.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Reusable components for this page
const InputField: React.FC<{label:string, name:string, value: string, onChange: (e:any)=>void, required?: boolean, placeholder?: string}> = ({label, name, value, onChange, required, placeholder}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type="text" id={name} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="form-input"/>
    </div>
);

const TextAreaField: React.FC<{label:string, name:string, value: string, onChange: (e:any)=>void}> = ({label, name, value, onChange}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea id={name} name={name} value={value} onChange={onChange} rows={4} className="form-textarea"/>
    </div>
);

const ActionButton: React.FC<{onClick: () => void, icon: React.ElementType, title: string, className?: string}> = ({onClick, icon: Icon, title, className}) => (
    <button onClick={onClick} title={title} className={`p-2 rounded-full transition-colors ${className}`}>
        <Icon className="w-5 h-5"/>
    </button>
);

const MediaButton: React.FC<{href?: string, download?: string, disabled: boolean, icon: React.ElementType, text: string, className?: string, target?: string, rel?: string}> = ({href, download, disabled, icon: Icon, text, className, target, rel}) => (
    <a 
        href={disabled ? undefined : href}
        download={download}
        target={target}
        rel={rel}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${className} ${disabled ? 'cursor-not-allowed' : ''}`}
        onClick={(e) => disabled && e.preventDefault()}
        aria-disabled={disabled}
    >
        <Icon className="w-5 h-5"/>
        <span>{text}</span>
    </a>
);


export default HymnsPage;