import { useCallback, useRef, useState } from 'react';

export interface SoundConfig {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
}

export const GAME_SOUNDS = {
  move: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQaAzhBKCg==',
  rotate: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQaAzlBKChB',
  drop: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQaAzhBKChBKCg=',
  lineClear: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQaAzhBKChBKChBKChB',
  tetris: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQaAzlBKChBKChBKChBKChB',
  gameOver: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQaAzhBKChBKChBKChBKChBKChB'
};

export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 0.3;
    }
  }, []);

  const playSound = useCallback((soundData: string, config: SoundConfig = {}) => {
    if (!enabled) return;

    try {
      initAudioContext();
      
      const audioContext = audioContextRef.current!;
      const gainNode = gainNodeRef.current!;

      // Decode base64 to array buffer
      const binaryString = atob(soundData.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      audioContext.decodeAudioData(bytes.buffer.slice()).then(buffer => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = config.playbackRate || 1;
        source.loop = config.loop || false;
        
        if (config.volume !== undefined) {
          const volumeGain = audioContext.createGain();
          volumeGain.gain.value = config.volume;
          source.connect(volumeGain);
          volumeGain.connect(gainNode);
        } else {
          source.connect(gainNode);
        }
        
        source.start();
      }).catch(() => {
        // Fallback to simple beep
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        
        oscillator.connect(envelope);
        envelope.connect(gainNode);
        
        oscillator.frequency.value = 800;
        envelope.gain.setValueAtTime(0, audioContext.currentTime);
        envelope.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        envelope.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      });
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [enabled, initAudioContext]);

  const playMove = useCallback(() => playSound(GAME_SOUNDS.move, { volume: 0.2 }), [playSound]);
  const playRotate = useCallback(() => playSound(GAME_SOUNDS.rotate, { volume: 0.3 }), [playSound]);
  const playDrop = useCallback(() => playSound(GAME_SOUNDS.drop, { volume: 0.4 }), [playSound]);
  const playLineClear = useCallback((lines: number) => {
    if (lines === 4) {
      playSound(GAME_SOUNDS.tetris, { volume: 0.8, playbackRate: 1.2 });
    } else {
      playSound(GAME_SOUNDS.lineClear, { volume: 0.6, playbackRate: 1 + (lines * 0.1) });
    }
  }, [playSound]);
  const playGameOver = useCallback(() => playSound(GAME_SOUNDS.gameOver, { volume: 0.5 }), [playSound]);

  return {
    enabled,
    setEnabled,
    playMove,
    playRotate,
    playDrop,
    playLineClear,
    playGameOver
  };
}