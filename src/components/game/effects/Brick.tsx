import React, { useEffect, useState } from 'react';

interface BrickProps {
  x: number;
  y: number;
  color: string;
  onComplete: () => void;
}

const Brick: React.FC<BrickProps> = ({ x, y, color, onComplete }) => {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const duration = 500 + Math.random() * 500;
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * 50;
    const endX = Math.cos(angle) * velocity;
    const endY = Math.sin(angle) * velocity;

    setStyle({
      position: 'absolute',
      left: x,
      top: y,
      width: '10px',
      height: '10px',
      backgroundColor: color,
      opacity: 1,
      transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`,
      transform: 'scale(1)',
    });

    setTimeout(() => {
      setStyle(prev => ({
        ...prev,
        transform: `translate(${endX}px, ${endY}px) scale(0)`,
        opacity: 0,
      }));
    }, 50);

    setTimeout(onComplete, duration);
  }, [x, y, color, onComplete]);

  return <div style={style} />;
};

export default Brick;