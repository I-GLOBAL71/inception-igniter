import React, { useState, useEffect } from 'react';
import Brick from './effects/Brick';
import Coin from './effects/Coin';

interface Effect {
  id: string;
  Component: React.FC<any>;
  props: any;
}

interface LineEffectProps {
  clearedLines: { y: number; row: (string | number)[] }[];
  cellSize: number;
  targetPosition: { x: number; y: number };
  onComplete: () => void;
}

const LineEffect: React.FC<LineEffectProps> = ({ clearedLines, cellSize, targetPosition, onComplete }) => {
  const [effects, setEffects] = useState<Effect[]>([]);

  useEffect(() => {
    if (clearedLines.length > 0) {
      let newEffects: Effect[] = [];
      clearedLines.forEach(({ y, row }) => {
        row.forEach((cell, x) => {
          if (cell !== 0) { // A block was here
            const centerX = (x + 0.5) * cellSize;
            const centerY = (y + 0.5) * cellSize;

            // Add brick explosion effects
            for (let i = 0; i < 10; i++) {
              const id = `brick-${y}-${x}-${i}-${Date.now()}`;
              newEffects.push({
                id,
                Component: Brick,
                props: {
                  x: centerX,
                  y: centerY,
                  color: cell as string, // Assuming cell stores color
                  onComplete: () => removeEffect(id),
                },
              });
            }

            // Add coin collection effects
            for (let i = 0; i < 3; i++) {
              const id = `coin-${y}-${x}-${i}-${Date.now()}`;
              newEffects.push({
                id,
                Component: Coin,
                props: {
                  x: centerX,
                  y: centerY,
                  targetX: targetPosition.x,
                  targetY: targetPosition.y,
                  delay: i * 50 + (y * 20), // Stagger the animation start
                  onComplete: () => removeEffect(id),
                },
              });
            }
          }
        });
      });

      setEffects(newEffects);

      // Call onComplete after a delay to allow animations to play
      const maxDelay = (clearedLines.length - 1) * 20 + 3 * 50;
      const animationDuration = 1000; // Corresponds to coin animation
      const totalDuration = maxDelay + animationDuration;
      
      const timer = setTimeout(() => {
        onComplete();
        setEffects([]); // Clear effects after animation
      }, totalDuration);
      
      return () => clearTimeout(timer);
    }
  }, [clearedLines, onComplete, cellSize, targetPosition]);

  const removeEffect = (id: string) => {
    setEffects(prev => prev.filter(effect => effect.id !== id));
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {effects.map(({ id, Component, props }) => (
        <Component key={id} {...props} />
      ))}
    </div>
  );
};

export default LineEffect;