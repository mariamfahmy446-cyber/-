import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import type { AppState, EducationLevel, LevelSubgroup } from '../types';
import { ImageIcon, ArrowLeftIcon } from '../components/Icons';
import Notification from '../components/Notification';

interface OutletContextType {
  appState: AppState;
}

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
                    {imageSrc ? `تغيير الصورة` : `رفع صورة`}
                    <input type="file" onChange={onChange} accept="image/*" className="hidden" />
                </label>
            </div>
        </div>
    </div>
);

const EditLevelSubgroupPage: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { levels, setLevels } = appState;
    const { levelId, subgroupName: encodedSubgroupName } = useParams();
    const navigate = useNavigate();
    
    const subgroupName = decodeURIComponent(encodedSubgroupName || '');

    const [level, setLevel] = useState<EducationLevel | null>(null);
    const [subgroup, setSubgroup] = useState<LevelSubgroup | null>(null);
    const [formData, setFormData] = useState<{ secretaryName: string; logo: string; }>({ secretaryName: '', logo: '' });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate(`/app/level/${levelId}`, { replace: true });
        }
    };

    useEffect(() => {
        const currentLevel = levels.find(l => l.id === levelId);
        if (!currentLevel) {
            navigate('/app/settings', { replace: true });
            return;
        }
        setLevel(currentLevel);
        
        const currentSubgroup = currentLevel.subgroups?.find(sg => sg.name === subgroupName);
        if (!currentSubgroup) {
             navigate(`/app/level/${levelId}`, { replace: true });
             return;
        }
        setSubgroup(currentSubgroup);
        setFormData({
            secretaryName: currentSubgroup.secretaryName || '',
            logo: currentSubgroup.logo || '',
        });
    }, [levelId, subgroupName, levels, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({ ...prev, logo: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        setLevels(prevLevels => prevLevels.map(l => {
            if (l.id === levelId) {
                const updatedSubgroups = (l.subgroups || []).map(sg => 
                    sg.name === subgroupName ? { ...sg, ...formData } : sg
                );
                return { ...l, subgroups: updatedSubgroups };
            }
            return l;
        }));

        setNotification({ message: 'تم حفظ التعديلات بنجاح!', type: 'success' });
        setTimeout(() => navigate(`/app/level/${levelId}`), 500);
    };

    if (!level || !subgroup) {
        return <div className="text-center p-8">جاري التحميل...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} appSettings={appState.settings} />}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-8">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500">{level.name}</p>
                        <h1 className="text-3xl font-bold text-slate-900">{subgroup.name}</h1>
                    </div>
                     <button type="button" onClick={handleBack} className="btn btn-secondary">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>رجوع</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="secretaryName" className="block text-sm font-medium text-slate-700 mb-1">
                            أمين المرحلة
                        </label>
                        <input
                            type="text"
                            id="secretaryName"
                            name="secretaryName"
                            value={formData.secretaryName}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="أدخل اسم أمين المرحلة"
                        />
                    </div>
                    
                    <ImageUploader label="صورة للمرحلة" imageSrc={formData.logo} onChange={handlePhotoChange} />
                </div>

                 <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-200">
                    <button type="submit" className="btn btn-primary">
                        حفظ التعديل
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditLevelSubgroupPage;