import React, { useCallback, useRef, useState, useEffect, useContext, createContext } from 'react';

export interface SoundConfig {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
}

export const GAME_SOUNDS = {
  move: '/sounds/move.mp3',
  rotate: '/sounds/rotate.mp3',
  drop: '/sounds/drop.mp3',
  lineClear1: '/sounds/line-clear-1.mp3',
  lineClear2: '/sounds/line-clear-2.mp3',
  lineClear3: '/sounds/line-clear-3.mp3',
  tetris: '/sounds/tetris.mp3',
  gameOver: '/sounds/game-over.mp3',
  coin: '/sounds/coins.mp3',
  shapeChange: '/sounds/rotate.mp3',
  debrisFall: '/sounds/debris-fall.mp3',
};

type SoundName = keyof typeof GAME_SOUNDS;

interface SoundManager {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  isPreloading: boolean;
  preloadSounds: () => Promise<void>;
  setVolume: (level: number) => void;
  playMove: () => void;
  playRotate: () => void;
  playDrop: () => void;
  playLineClear: (lines: number) => void;
  playGameOver: () => void;
  playCoin: () => void;
  playShapeChange: () => void;
  playDebrisFall: () => void;
}

const SoundContext = createContext<SoundManager | null>(null);

export const useSound = (): SoundManager => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};

function useSoundManager(): SoundManager {
  const [enabled, setEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBuffersRef = useRef<Partial<Record<SoundName, AudioBuffer>>>({});
  const [isPreloading, setIsPreloading] = useState(false);

  const initAudioContext = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const context = new AudioContext();
          audioContextRef.current = context;
          const gainNode = context.createGain();
          gainNode.connect(context.destination);
          gainNode.gain.value = 0.5;
          gainNodeRef.current = gainNode;
        }
      } catch (error) {
        console.error("Failed to initialize AudioContext:", error);
      }
    }
  }, []);

  const playSound = useCallback((name: SoundName, config: SoundConfig = {}) => {
    initAudioContext();
    const context = audioContextRef.current;
    if (!enabled || !context || !gainNodeRef.current) return;

    if (context.state === 'suspended') {
      context.resume();
    }

    const audioBuffer = audioBuffersRef.current[name];
    const masterGain = gainNodeRef.current;

    if (audioBuffer) {
      try {
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = config.playbackRate || 1;
        source.loop = config.loop || false;

        let finalNode: AudioNode = source;
        if (config.volume !== undefined) {
          const volumeGain = context.createGain();
          volumeGain.gain.value = config.volume;
          finalNode.connect(volumeGain);
          finalNode = volumeGain;
        }
        
        finalNode.connect(masterGain);
        source.start();
      } catch (error) {
        console.error(`Error playing sound ${name}:`, error);
      }
    } else {
      console.warn(`Sound not preloaded: ${name}. Fetching on the fly.`);
      fetch(GAME_SOUNDS[name])
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
        .then(decodedBuffer => {
          audioBuffersRef.current[name] = decodedBuffer;
          playSound(name, config);
        })
        .catch(error => console.error(`Failed to fetch and play sound: ${name}`, error));
    }
  }, [enabled, initAudioContext]);

  const preloadSounds = useCallback(async () => {
    initAudioContext();
    const context = audioContextRef.current;
    if (!context || isPreloading) return;

    setIsPreloading(true);
    const soundEntries = Object.entries(GAME_SOUNDS) as [SoundName, string][];

    await Promise.all(soundEntries.map(async ([name, url]) => {
      if (!audioBuffersRef.current[name]) {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(arrayBuffer);
          audioBuffersRef.current[name] = audioBuffer;
        } catch (error) {
          console.warn(`Failed to load sound: ${name}`, error);
        }
      }
    }));
    setIsPreloading(false);
  }, [initAudioContext, isPreloading]);

  const setVolume = useCallback((level: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(1, level));
    }
  }, []);

  const playMove = useCallback(() => playSound('move', { volume: 0.5 }), [playSound]);
  const playRotate = useCallback(() => playSound('rotate', { volume: 0.6 }), [playSound]);
  const playDrop = useCallback(() => playSound('drop', { volume: 0.7 }), [playSound]);
  const playGameOver = useCallback(() => playSound('gameOver', { volume: 0.8 }), [playSound]);
  const playLineClear = useCallback((lines: number) => {
    if (lines === 4) playSound('tetris', { volume: 1.0, playbackRate: 1.1 });
    else if (lines === 3) playSound('lineClear3', { volume: 0.9, playbackRate: 1.2 });
    else if (lines === 2) playSound('lineClear2', { volume: 0.8, playbackRate: 1.1 });
    else if (lines > 0) playSound('lineClear1', { volume: 0.7, playbackRate: 1.0 });
  }, [playSound]);
  const playCoin = useCallback(() => playSound('coin', { volume: 0.8, playbackRate: 1.5 + Math.random() * 0.5 }), [playSound]);
  const playShapeChange = useCallback(() => playSound('shapeChange', { volume: 0.6 }), [playSound]);
  const playDebrisFall = useCallback(() => playSound('debrisFall', { volume: 0.7, playbackRate: 0.9 + Math.random() * 0.2 }), [playSound]);

  return {
    enabled, setEnabled, isPreloading, preloadSounds, setVolume,
    playMove, playRotate, playDrop, playLineClear, playGameOver,
    playCoin, playShapeChange, playDebrisFall,
  };
}

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soundManager = useSoundManager();

  useEffect(() => {
    // Preload sounds once when the provider mounts
    soundManager.preloadSounds();
  }, [soundManager]);

  return (
    <SoundContext.Provider value={soundManager}>
      {children}
    </SoundContext.Provider>
  );
};