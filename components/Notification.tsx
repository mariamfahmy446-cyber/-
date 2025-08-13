import React, { useEffect, useState, useCallback } from 'react';
import { CheckIcon, XIcon, HelpCircleIcon } from './Icons';
import type { Settings } from '../types';

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
        // Simple sound effect
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            
            oscillator.type = type === 'success' ? 'sine' : 'triangle';
            oscillator.frequency.setValueAtTime(type === 'success' ? 880 : 440, audioContext.currentTime);
            
            oscillator.start(audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }
    if (appSettings.enableVibrations && 'vibrate' in navigator) {
      navigator.vibrate(type === 'error' ? [100, 50, 100] : 100);
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