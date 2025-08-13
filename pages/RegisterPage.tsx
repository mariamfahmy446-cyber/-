

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Settings } from '../types';
import { UserPlusIcon, ArrowLeftIcon } from '../components/Icons';
import { kidsLogoBase64 } from '../assets';

interface RegisterPageProps {
    onRegister: (displayName: string, nationalId: string, password: string) => { success: boolean; message: string };
    settings: Settings;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, settings }) => {
    const [displayName, setDisplayName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<React.ReactNode>('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        if (!/^\d{14}$/.test(nationalId)) {
            setError('يجب أن يتكون الرقم القومي من 14 رقمًا صحيحًا.');
            return;
        }
        
        const result = onRegister(displayName, nationalId, password);
        
        if (result.success) {
            navigate('/app');
        } else {
             if (result.message.includes('مسجل بالفعل')) {
                setError(
                    <>
                        <p>{result.message}</p>
                        <Link to="/login" className="font-bold hover:underline mt-1 inline-block">
                            هل تريد تسجيل الدخول بدلاً من ذلك؟
                        </Link>
                    </>
                );
            } else {
                setError(result.message);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                        <img src={settings.churchLogo || kidsLogoBase64} alt="Logo" className="w-32 h-auto mx-auto object-contain mb-4 drop-shadow-md"/>
                        <h1 className="text-2xl font-bold text-slate-800">إنشاء حساب جديد</h1>
                        <p className="text-slate-500 mt-1">انضم إلينا ببياناتك.</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">الاسم (للعرض)</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label htmlFor="nationalId" className="block text-sm font-medium text-slate-700 mb-1">الرقم القومي (14 رقمًا)</label>
                        <input
                            id="nationalId"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{14}"
                            maxLength={14}
                            value={nationalId}
                            onChange={e => setNationalId(e.target.value)}
                            required
                            className="form-input"
                            title="يجب إدخال 14 رقمًا"
                        />
                         <p className="text-xs text-slate-500 mt-1">سيتم استخدام الرقم القومي كاسم مستخدم لتسجيل الدخول.</p>
                    </div>
                    <div>
                        <label htmlFor="password-reg" className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                         <input
                            id="password-reg"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                     <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور</label>
                         <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    
                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300">
                        <UserPlusIcon className="w-5 h-5"/>
                        <span>إنشاء الحساب</span>
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
                            <span>لديك حساب بالفعل؟ تسجيل الدخول</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;