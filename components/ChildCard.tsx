import React from 'react';
import type { Child, Class, Settings } from '../types';

interface ChildCardProps {
  child: Child;
  activeClass: Class;
  settings: Settings;
  levelLogo?: string;
}

const ChildCard: React.FC<ChildCardProps> = ({ 
    child, 
    activeClass, 
    settings,
    levelLogo,
}) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(child.id)}&qzone=1&margin=0`;
  const logoToDisplay = activeClass.cardLogo || levelLogo || settings.churchLogo || settings.schoolLogo;
  
  const hasBgImage = activeClass.cardBackgroundStyle === 'image' && activeClass.cardBackground;
  
  const backgroundStyle = hasBgImage
    ? { backgroundImage: `url(${activeClass.cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: activeClass.cardBackgroundColor || '#F1F5F9' }; // fallback to slate-100

  const textColorClass = hasBgImage ? 'text-white' : 'text-slate-800';
  const subTextColorClass = hasBgImage ? 'text-slate-200' : 'text-slate-500';
  const headerFooterBg = hasBgImage ? 'bg-black/25 backdrop-blur-sm' : 'bg-white/50';

  return (
    <div
      className="rounded-2xl shadow-lg w-64 h-96 flex flex-col break-inside-avoid print:shadow-none print:border border-slate-200 overflow-hidden"
      style={backgroundStyle}
    >
      {/* Header */}
      <header className={`p-4 flex items-center gap-3 ${headerFooterBg}`}>
        {logoToDisplay && (
          <img src={logoToDisplay} alt="Logo" className="h-10 w-10 object-contain bg-white/70 p-1 rounded-md" />
        )}
        <div>
          <h2 className={`font-bold ${textColorClass}`}>
            خدمة مدارس الأحد
          </h2>
          <p className={`text-xs ${subTextColorClass}`}>
            بطاقة تعريف
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <img
          crossOrigin="anonymous"
          src={child.image || 'https://picsum.photos/seed/placeholder/200'}
          alt={child.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
        />
        <h1 className={`text-2xl mt-4 font-bold ${textColorClass} [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]`}>
          {child.name}
        </h1>
        <p className={`text-md font-medium ${subTextColorClass} [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]`}>
          {activeClass.grade} - {activeClass.name}
        </p>
      </main>

      {/* Footer */}
      <footer className={`p-4 mt-auto ${headerFooterBg}`}>
        <div className="flex items-center justify-between">
          <div className="text-right">
            <p className={`text-xs font-semibold ${subTextColorClass}`}>الكود الخاص</p>
            <p className={`font-mono font-bold text-lg ${textColorClass}`}>{child.id}</p>
          </div>
          <div className="p-1 bg-white rounded-md">
            <img src={qrCodeUrl} alt={`QR Code for ${child.name}`} className="w-16 h-16" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChildCard;