import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenIcon, ArrowLeftIcon } from '../components/Icons';

interface PlaceholderPageProps {
    title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate('/app/dashboard', { replace: true });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                <button
                    onClick={handleBack}
                    className="btn btn-secondary"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            </div>
            <div className="flex flex-col items-center justify-start text-center pt-8">
                <div className="bg-white rounded-2xl shadow-md p-12 w-full max-w-xl">
                    <BookOpenIcon className="w-24 h-24 text-purple-300 mb-6 mx-auto" />
                    <p className="text-slate-500 mt-2 text-lg">هذه الصفحة قيد الإنشاء حالياً.</p>
                    <p className="text-slate-400 text-sm mt-1">ترقبوا التحديثات القادمة!</p>
                </div>
            </div>
        </div>
    );
};

export default PlaceholderPage;