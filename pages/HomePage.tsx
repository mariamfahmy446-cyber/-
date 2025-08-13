import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { AppState } from '../types';
import { ArrowLeftIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const LandingButton: React.FC<{ to: string; text: string; }> = ({ to, text }) => (
    <ReactRouterDOM.Link to={to} className="group flex items-center justify-between w-full p-4 bg-white/80 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
        <span className="text-lg font-semibold text-slate-700">{text}</span>
        <div className="p-2 bg-slate-200 rounded-full group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300">
            <ArrowLeftIcon className="w-6 h-6 transform transition-transform duration-300 group-hover:-translate-x-1" />
        </div>
    </ReactRouterDOM.Link>
);

const HomePage: React.FC = () => {
  const { appState } = ReactRouterDOM.useOutletContext<OutletContextType>();
  const { settings } = appState;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
        <div className="text-center w-full max-w-md mx-auto">
            <div className="mb-12">
            {settings.schoolLogo ? (
                <img 
                src={settings.schoolLogo} 
                alt="شعار المدرسة" 
                className="w-48 h-48 mx-auto object-contain"
                />
            ) : (
                <div className="w-48 h-48 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-slate-500">شعار المدرسة</span>
                </div>
            )}
            </div>
             <h1 className="text-3xl font-bold text-slate-800 mb-8">
                نظام إدارة بيانات الخدمة
            </h1>
            <div className="space-y-4">
                <LandingButton to="/app/attendance" text="المتابعة" />
                <LandingButton to="/app/schedule" text="جدول الخدمة" />
                <LandingButton to="/app/settings" text="الإعدادات" />
            </div>
        </div>
    </div>
  );
};

export default HomePage;