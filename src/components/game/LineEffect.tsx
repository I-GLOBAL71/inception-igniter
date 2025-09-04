import React, { useEffect, useState } from 'react';

interface LineEffectProps {
  lines: number[];
  onComplete: () => void;
}

export default function LineEffect({ lines, onComplete }: LineEffectProps) {
  const [phase, setPhase] = useState<'flash' | 'clear' | 'complete'>('flash');

  useEffect(() => {
    if (lines.length === 0) {
      onComplete();
      return;
    }

    // Flash phase
    const flashTimer = setTimeout(() => {
      setPhase('clear');
    }, 300);

    // Clear phase
    const clearTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 600);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(clearTimer);
    };
  }, [lines, onComplete]);

  if (lines.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {lines.map((lineY, index) => (
        <div
          key={lineY}
          className={`absolute left-0 right-0 h-6 ${
            phase === 'flash' 
              ? 'bg-white animate-pulse' 
              : phase === 'clear'
              ? 'bg-gradient-to-r from-primary via-secondary to-accent animate-pulse opacity-75'
              : 'opacity-0'
          }`}
          style={{
            top: `${(lineY + 1) * 24}px`, // Adjust based on your cell height
            animationDelay: `${index * 50}ms`,
            animationDuration: phase === 'flash' ? '150ms' : '300ms'
          }}
        >
          {phase === 'clear' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-ping" />
          )}
          {lines.length === 4 && phase === 'clear' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg animate-bounce shadow-lg">
                TETRIS!
              </span>
            </div>
          )}
        </div>
      ))}
      
      {/* Particle effects for Tetris */}
      {lines.length === 4 && phase === 'clear' && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-secondary rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 500}ms`,
                animationDuration: `${500 + Math.random() * 1000}ms`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}