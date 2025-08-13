import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { EducationLevel, AppState, LevelDivision, Secretary } from '../types';
import { PlusIcon, TrashIcon, ImageIcon, ArrowLeftIcon } from '../components/Icons';
import Notification from '../components/Notification';

interface OutletContextType {
  appState: AppState;
}

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void, required?: boolean}> = ({label, name, value, onChange, required}) => (
    <div className="w-full">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="form-input"
        />
    </div>
);

const ImageUploader: React.FC<{label: string, imageSrc?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void}> = ({label, imageSrc, onChange}) => (
  <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
        {imageSrc ? (
            <img src={imageSrc} alt={label} className="w-full h-full object-contain" />
        ) : (
            <ImageIcon className="w-10 h-10 text-slate-400" />
        )}
        </div>
        <div>
        <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm transition-colors">
            {imageSrc ? `تغيير الشعار` : `رفع شعار`}
            <input type="file" onChange={onChange} accept="image/*" className="hidden" />
        </label>
        </div>
    </div>
  </div>
);

type FormData = Partial<EducationLevel & LevelDivision>;

const AddEditLevel: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { levels, setLevels, users } = appState;
    const { levelId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const divisionType = searchParams.get('division');
    const isEditMode = !!levelId;
    const isDivisionMode = isEditMode && !!divisionType;

    const getInitialState = (): FormData => ({
        name: '',
        sections: [],
        generalSecretary: { name: '', phone: '', email: '' },
        assistantSecretary: { name: '', phone: '', email: '' },
        logo: '',
        responsiblePriest: '',
    });

    const [formData, setFormData] = useState<FormData>(getInitialState());
    const [pageTitle, setPageTitle] = useState('إضافة خدمة جديدة');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; } | null>(null);

    const priests = useMemo(() => users.filter(u => u.roles.includes('priest')), [users]);

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate('/app/settings', { replace: true, state: { activeTab: 'levelsAndClasses' } });
        }
    };

    useEffect(() => {
        if (isEditMode && levelId) {
            const level = levels.find(l => l.id === levelId);
            if (!level) {
                alert('لم يتم العثور على الخدمة!');
                navigate('/app/settings', { state: { activeTab: 'levels' } });
                return;
            }

            if (isDivisionMode) {
                const division = level.divisions?.find(d => d.type === divisionType);
                if (division) {
                    setFormData(division);
                    setPageTitle(`تعديل: ${level.name} (${division.name})`);
                } else {
                     alert('لم يتم العثور على القسم!');
                     navigate(`/app/settings`, { state: { activeTab: 'levels' } });
                }
            } else {
                setFormData(level);
                setPageTitle(`تعديل الخدمة: ${level.name}`);
            }
        } else {
            setFormData(getInitialState());
            setPageTitle('إضافة خدمة جديدة');
        }
    }, [levelId, divisionType, levels, navigate, isEditMode, isDivisionMode]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'generalSecretaryName') {
            setFormData(prev => ({...prev, generalSecretary: { ...(prev.generalSecretary as Secretary), name: value }}));
        } else if (name === 'assistantSecretaryName') {
            setFormData(prev => ({...prev, assistantSecretary: { ...(prev.assistantSecretary as Secretary), name: value }}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, logo: base64String }));
          };
          reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isDivisionMode) {
            setLevels(prevLevels => prevLevels.map(level => {
                if (level.id === levelId) {
                    const updatedDivisions = (level.divisions || []).map(div => 
                        div.type === divisionType ? { ...div, ...formData } : div
                    );
                    return { ...level, divisions: updatedDivisions };
                }
                return level;
            }));
             setNotification({ message: 'تم حفظ تعديلات القسم بنجاح!', type: 'success' });
        } else if (isEditMode) {
             if (!formData.name?.trim()) {
                setNotification({ message: 'يرجى إدخال اسم الخدمة.', type: 'error' });
                return;
            }
            setLevels(prev => prev.map(l => (l.id === levelId ? { ...(l as EducationLevel), ...(formData as EducationLevel) } : l)));
            setNotification({ message: 'تم حفظ تعديلات الخدمة بنجاح!', type: 'success' });
        } else {
            if (!formData.name?.trim()) {
                setNotification({ message: 'يرجى إدخال اسم الخدمة.', type: 'error' });
                return;
            }
            const newLevel: EducationLevel = {
                id: `level-${Date.now()}`,
                name: formData.name,
                sections: formData.sections || [],
                generalSecretary: formData.generalSecretary || { name: '', phone: '', email: '' },
                assistantSecretary: formData.assistantSecretary || { name: '', phone: '', email: '' },
                logo: formData.logo,
                responsiblePriest: formData.responsiblePriest,
            };
            setLevels(prev => [...prev, newLevel]);
            setNotification({ message: 'تم إضافة الخدمة بنجاح!', type: 'success' });
        }
        
        setTimeout(() => navigate('/app/settings', { state: { activeTab: 'levelsAndClasses' } }), 500);
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
             <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
                    <button type="button" onClick={handleBack} className="btn btn-secondary">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>رجوع</span>
                    </button>
                </div>
                
                <div className="space-y-6">
                    {!isDivisionMode && (
                         <>
                            <InputField label="اسم الخدمة" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                            <div>
                                <label htmlFor="responsiblePriest" className="block text-sm font-medium text-slate-700 mb-1">الأب الكاهن المسؤول</label>
                                <select
                                    id="responsiblePriest"
                                    name="responsiblePriest"
                                    value={formData.responsiblePriest || ''}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="">-- اختر كاهن --</option>
                                    {priests.map(priest => (
                                        <option key={priest.id} value={priest.displayName}>{priest.displayName}</option>
                                    ))}
                                </select>
                            </div>
                         </>
                    )}
                    
                    <InputField label="اسم الأمين العام" name="generalSecretaryName" value={formData.generalSecretary?.name || ''} onChange={handleInputChange} />
                    <InputField label="اسم الأمين العام المساعد" name="assistantSecretaryName" value={formData.assistantSecretary?.name || ''} onChange={handleInputChange} />
                    
                    {isDivisionMode && (
                        <div>
                            <label htmlFor="responsiblePriestDivision" className="block text-sm font-medium text-slate-700 mb-1">الأب الكاهن المسؤول عن القسم</label>
                            <select
                                id="responsiblePriestDivision"
                                name="responsiblePriest"
                                value={formData.responsiblePriest || ''}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="">-- اختر كاهن --</option>
                                {priests.map(priest => (
                                    <option key={priest.id} value={priest.displayName}>{priest.displayName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <ImageUploader label={isDivisionMode ? 'شعار القسم' : 'شعار الخدمة'} imageSrc={formData.logo} onChange={handlePhotoChange} />
                </div>
                
                <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-200">
                    <button type="submit" className="btn btn-primary">
                        حفظ التعديلات
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEditLevel;