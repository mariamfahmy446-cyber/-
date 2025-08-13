import React from 'react';
import type { User } from '../types';
import { AwardIcon } from './Icons';

interface WelcomeModalProps {
  user: User;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ user, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-heading"
    >
      <div 
        className="violet-welcome-modal w-[26rem] p-8 space-y-4 transform animate-scale-in-center flex flex-col items-center text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center border-4 border-violet-200">
            <AwardIcon className="w-10 h-10 text-violet-500" />
        </div>
        
        <h1 id="welcome-heading" className="text-3xl font-bold pt-2">
          اهلا بيك يا <span className="highlight-text">{user.displayName}</span>
        </h1>
        
        <p className="text-xl">
          الكنيسة فرحانة بخدامها
        </p>
        
        <p className="text-lg quote-text italic w-full">
          دمت خادما امينا محبا لكنيستك وخدمتك
        </p>

        <button
          onClick={onClose}
          className="mt-4 btn action-button w-full"
        >
          ابدأ
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;