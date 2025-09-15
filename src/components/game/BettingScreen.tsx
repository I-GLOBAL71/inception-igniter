import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Coins, Play, Trophy, Zap } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency.tsx';

interface BettingScreenProps {
  balance: number;
  demoMode: boolean;
  onStartGame: (betAmount: number) => void;
}

const BET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function BettingScreen({ balance, demoMode, onStartGame }: BettingScreenProps) {
  const [selectedBet, setSelectedBet] = useState(500);
  const { formatAmount } = useCurrency();

  const handleStartGame = () => {
    onStartGame(selectedBet);
  };

  const getMultiplier = (amount: number) => {
    if (demoMode) return 2.5;
    return 1.0 + (amount / 10000);
  };

  const getEstimatedGains = (amount: number) => {
    const baseGain = 1000; // Score moyen estimé
    return Math.floor(baseGain * getMultiplier(amount) * (demoMode ? 0.5 : 0.1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold gaming-text-gradient">
            🎮 Tetris Rémunéré
          </h1>
          <p className="text-muted-foreground">
            Choisissez votre mise pour commencer à jouer
          </p>
        </div>

        {/* Balance Display */}
        <Card className="gaming-card p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Coins className="w-6 h-6 text-secondary mr-2" />
            <span className="text-sm text-muted-foreground">Solde disponible</span>
          </div>
          <div className="text-2xl font-bold text-secondary">
            {formatAmount(balance / 655.96)}
          </div>
          {demoMode && (
            <div className="mt-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium inline-block">
              Mode Démo - Gains x2.5
            </div>
          )}
        </Card>

        {/* Bet Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Choisissez votre mise</h3>
          <div className="grid grid-cols-2 gap-3">
            {BET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedBet === amount ? "default" : "outline"}
                className={`h-16 text-base font-semibold ${
                  selectedBet === amount 
                    ? 'gaming-button-primary' 
                    : 'border-border hover:border-primary/50'
                } ${amount > balance ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setSelectedBet(amount)}
                disabled={amount > balance}
              >
                <div className="text-center">
                  <div>{formatAmount(amount / 655.96)}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Bet Info */}
        <Card className="gaming-card p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Mise sélectionnée:</span>
              <span className="font-semibold text-primary">{formatAmount(selectedBet / 655.96)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Multiplicateur:</span>
              <span className="font-semibold text-secondary flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                x{getMultiplier(selectedBet).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gains estimés (1000 pts):</span>
              <span className="font-semibold text-success">
                {formatAmount(getEstimatedGains(selectedBet) / 655.96)}
              </span>
            </div>
          </div>
        </Card>

        {/* Start Game Button */}
        <Button
          onClick={handleStartGame}
          className="w-full h-14 text-lg font-bold gaming-button-primary"
          disabled={selectedBet > balance}
        >
          <Play className="w-5 h-5 mr-2" />
          Commencer la partie
        </Button>

        {/* Game Rules */}
        <Card className="gaming-card p-4">
          <h4 className="font-semibold mb-2 text-center">🎯 Comment gagner ?</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              <span>Plus vous faites de lignes, plus votre multiplicateur augmente</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
              <span>Chaque point de score = gain en devise</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
              <span>Mises plus élevées = multiplicateurs plus élevés</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}