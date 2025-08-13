
import React from 'react';
import { Link } from 'react-router-dom';
import type { Settings } from '../types';
import { ArrowLeftIcon } from '../components/Icons';

interface LandingPageProps {
  settings: Settings;
}

const LandingPage: React.FC<LandingPageProps> = ({ settings }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="text-center w-full max-w-md mx-auto">
        <div className="mb-12">
          {settings.schoolLogo ? (
            <img 
              src={settings.schoolLogo} 
              alt="شعار المدرسة" 
              className="w-48 h-48 mx-auto object-contain"
            />
          ) : (
            <div className="w-48 h-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-500 dark:text-slate-400">شعار المدرسة</span>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">
          نظام إدارة بيانات الخدمة
        </h1>

        <div className="space-y-4">
          <LandingButton to="/app/attendance" text="المتابعة" />
          <LandingButton to="/app/dashboard" text="ضبط الخدمة" />
          <LandingButton to="/app/settings" text="الإعدادات" />
        </div>
      </div>
    </div>
  );
};

interface LandingButtonProps {
    to: string;
    text: string;
}

const LandingButton: React.FC<LandingButtonProps> = ({ to, text }) => (
    <Link to={to} className="group flex items-center justify-between w-full p-4 bg-white/80 dark:bg-slate-800/50 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
        <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{text}</span>
        <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
            <ArrowLeftIcon className="w-6 h-6 transform transition-transform duration-300 group-hover:-translate-x-1" />
        </div>
    </Link>
);


export default LandingPage;