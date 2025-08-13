import React, { useEffect, useState, useCallback } from 'react';
import { CheckIcon, XIcon, HelpCircleIcon } from './Icons';
import type { Settings } from '../types';
import { playSound, playVibration } from '../utils/audio';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  appSettings: Settings;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, appSettings }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
        onClose();
    }, 400); // Animation duration
  }, [isClosing, onClose]);

  useEffect(() => {
    if (appSettings.enableSounds) {
        playSound(type);
    }
    if (appSettings.enableVibrations) {
      playVibration(type === 'error' ? 'error' : 'success');
    }

    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, type, appSettings, handleClose]);

  const typeClasses = {
      success: { bg: 'bg-green-500', icon: CheckIcon },
      error: { bg: 'bg-red-500', icon: XIcon },
      warning: { bg: 'bg-yellow-500', icon: HelpCircleIcon },
      info: { bg: 'bg-sky-500', icon: HelpCircleIcon }
  };

  const { bg: bgColor, icon: Icon } = typeClasses[type];

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center p-4 rounded-lg text-white shadow-lg w-full max-w-md ${bgColor} ${isClosing ? 'animate-slide-out-up' : 'animate-slide-in-down'}`}
      role="alert"
    >
      <div className="flex items-center">
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium mx-3 flex-1">{message}</span>
      <button onClick={handleClose} className="ml-auto -mr-1 p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Close">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;