

import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import type { Settings, User } from '../types';
import { LogInIcon } from '../components/Icons';
import { kidsLogoBase64 } from '../assets';

interface LoginPageProps {
    onLogin: (username: string, password: string) => { success: boolean; message: string };
    settings: Settings;
    currentUser: User | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, settings, currentUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // If user is already logged in, redirect them away from the login page.
    if (currentUser) {
        return <Navigate to="/app" replace />;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('يرجى إدخال اسم المستخدم وكلمة المرور.');
            return;
        }
        const result = onLogin(username, password);
        if (result.success) {
            navigate('/app');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                        <img src={settings.churchLogo || kidsLogoBase64} alt="Logo" className="w-32 h-auto mx-auto object-contain mb-4"/>
                        <h1 className="text-2xl font-bold text-slate-800">تسجيل الدخول</h1>
                        <p className="text-slate-500 mt-1">مرحباً بعودتك! الرجاء إدخال بياناتك.</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm" role="alert">
                            <p>{error}</p>
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">اسم المستخدم</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            className="form-input"
                            autoComplete="username"
                            placeholder="اسم المستخدم أو الرقم القومي"
                        />
                    </div>
                    <div>
                        <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                         <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="form-input"
                            autoComplete="current-password"
                        />
                    </div>
                    
                    <button type="submit" className="w-full btn btn-primary py-3">
                        <LogInIcon className="w-5 h-5"/>
                        <span>دخول</span>
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/register" className="text-sm text-sky-600 hover:underline">
                            ليس لديك حساب؟ إنشاء مستخدم جديد
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
