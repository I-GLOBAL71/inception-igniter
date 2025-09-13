import React, { useEffect, useState } from 'react';
import { useSound } from '@/hooks/useSound.tsx';

interface CoinProps {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  delay: number;
  onComplete: () => void;
}

const Coin: React.FC<CoinProps> = ({ x, y, targetX, targetY, delay, onComplete }) => {
  const { playCoin } = useSound();
  const [style, setStyle] = useState<React.CSSProperties>({
    opacity: 0, // Start invisible
  });

  useEffect(() => {
    const soundTimer = setTimeout(() => {
      playCoin();
    }, delay);

    const animationDuration = 800 + Math.random() * 200;

    // Create a random control point to form a curve
    const controlX = x + (targetX - x) * 0.5 + (Math.random() - 0.5) * 150;
    const controlY = y + (targetY - y) * 0.25 - Math.random() * 100;

    // Unique animation name to avoid conflicts
    const animationName = `coin-fly-${Math.random().toString(36).slice(2)}`;

    const keyframes = `
      @keyframes ${animationName} {
        0% {
          transform: translate(0, 0) scale(0.8);
          opacity: 1;
        }
        50% {
          transform: translate(${controlX - x}px, ${controlY - y}px) scale(1.2);
          opacity: 0.9;
        }
        100% {
          transform: translate(${targetX - x}px, ${targetY - y}px) scale(0.1);
          opacity: 0;
        }
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);

    setStyle({
      position: 'absolute',
      left: x,
      top: y,
      width: '20px',
      height: '20px',
      backgroundImage: 'radial-gradient(circle, #FFD700, #FDB813)',
      borderRadius: '50%',
      boxShadow: '0 0 10px #FFD700',
      willChange: 'transform, opacity',
      animationName,
      animationDuration: `${animationDuration}ms`,
      animationDelay: `${delay}ms`,
      animationTimingFunction: 'cubic-bezier(0.3, 0, 0.6, 1)',
      animationFillMode: 'forwards',
    });

    const totalDuration = delay + animationDuration;
    const timer = setTimeout(() => {
      onComplete();
      document.head.removeChild(styleSheet);
    }, totalDuration);

    return () => {
      clearTimeout(timer);
      clearTimeout(soundTimer);
      try {
        document.head.removeChild(styleSheet);
      } catch (e) {
        // Ignore error if stylesheet was already removed
      }
    };
  }, [x, y, targetX, targetY, delay, onComplete, playCoin]);

  return <div style={style} />;
};

export default Coin;