export const playSound = (type: 'success' | 'error' | 'warning' | 'info' | 'click' | 'special') => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        let freq: number, oscType: OscillatorType, duration: number, volume: number;

        switch(type) {
            case 'success':
            case 'info':
                freq = 880; oscType = 'sine'; duration = 0.1; volume = 0.3;
                break;
            case 'error':
            case 'warning':
                freq = 440; oscType = 'square'; duration = 0.15; volume = 0.3;
                break;
            case 'click':
                freq = 1500; oscType = 'triangle'; duration = 0.05; volume = 0.1;
                break;
            case 'special':
                freq = 1200; oscType = 'sawtooth'; duration = 0.4; volume = 0.5;
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(freq / 2, audioContext.currentTime + duration);
                break;
            default:
                return;
        }

        if (type !== 'special') {
             gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
             oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
             gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
        }
        
        oscillator.type = oscType;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export const playVibration = (type: 'success' | 'error' | 'click' | 'special') => {
     if ('vibrate' in navigator) {
         let pattern: number | number[] = 100;
         switch(type) {
            case 'error':
                pattern = [100, 50, 100]; break;
            case 'click':
                pattern = 20; break;
            case 'special':
                pattern = [200, 100, 200]; break;
            default: // success
                pattern = 100;
         }
         navigator.vibrate(pattern);
     }
};
