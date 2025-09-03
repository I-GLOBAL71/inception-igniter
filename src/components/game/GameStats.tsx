import React from 'react';
import { TrendingUp, Target, Zap, Star } from 'lucide-react';

interface GameStatsProps {
  score: number;
  lines: number;
  multiplier?: number;
  earnings?: number;
}

export default function GameStats({ score, lines, multiplier = 1, earnings = 0 }: GameStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
      {/* Score */}
      <div className="gaming-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Target className="w-5 h-5 text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Score</span>
        </div>
        <div className="text-xl font-bold gaming-text-gradient">
          {score.toLocaleString()}
        </div>
      </div>

      {/* Lines */}
      <div className="gaming-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Zap className="w-5 h-5 text-accent mr-2" />
          <span className="text-sm text-muted-foreground">Lignes</span>
        </div>
        <div className="text-xl font-bold text-accent">
          {lines}
        </div>
      </div>

      {/* Multiplier */}
      <div className="gaming-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Star className="w-5 h-5 text-secondary mr-2" />
          <span className="text-sm text-muted-foreground">Multiplicateur</span>
        </div>
        <div className="text-xl font-bold text-secondary">
          x{multiplier.toFixed(1)}
        </div>
      </div>

      {/* Earnings */}
      <div className="gaming-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-5 h-5 text-success mr-2" />
          <span className="text-sm text-muted-foreground">Gains</span>
        </div>
        <div className="text-xl font-bold text-success">
          {earnings.toLocaleString()} FCFA
        </div>
      </div>
    </div>
  );
}