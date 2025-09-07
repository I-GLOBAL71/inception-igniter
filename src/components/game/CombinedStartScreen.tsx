import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play, Coins, Zap, Gift, Target } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface CombinedStartScreenProps {
  balance: number;
  onStartGame: (betAmount: number, demo: boolean) => void;
}

const BET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function CombinedStartScreen({ balance, onStartGame }: CombinedStartScreenProps) {
  const [selectedBet, setSelectedBet] = useState(500);
  const [demoMode, setDemoMode] = useState(true);
  const { formatAmount } = useCurrency();

  const handleStartGame = () => {
    onStartGame(selectedBet, demoMode);
  };

  const getMultiplier = (amount: number, demo: boolean) => {
    if (demo) return 2.5;
    return 1.0 + (amount / 10000);
  };

  const getEstimatedGains = (amount: number, demo: boolean) => {
    const baseGain = 1000; // Score moyen estimé
    return Math.floor(baseGain * getMultiplier(amount, demo) * (demo ? 0.5 : 0.1));
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Panel - Game Introduction */}
        <div className="space-y-6">
          <div className="text-center lg:text-left space-y-4">
            <div className="flex justify-center lg:justify-start">
              <div className="w-20 h-20 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold gaming-text-gradient mb-2">
                🎮 Tetris Rémunéré
              </h1>
              <p className="text-muted-foreground text-lg">
                Gagnez de l'argent réel en jouant !
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Choisissez votre mode de jeu</h3>
            <div className="grid gap-3">
              <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${
                  demoMode 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setDemoMode(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Gift className="w-6 h-6 text-accent" />
                    <div>
                      <div className="font-semibold text-accent">Mode Démo GRATUIT</div>
                      <div className="text-sm text-muted-foreground">
                        Testez sans risque • Multiplicateur x2.5
                      </div>
                    </div>
                  </div>
                  {demoMode && (
                    <Badge variant="default" className="bg-accent text-accent-foreground">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${
                  !demoMode 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setDemoMode(false)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coins className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-semibold text-primary">Argent Réel</div>
                      <div className="text-sm text-muted-foreground">
                        Gains réels • Paiements sécurisés
                      </div>
                    </div>
                  </div>
                  {!demoMode && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Zap className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
              <span>Chaque point = argent réel</span>
            </div>
            <div className="flex items-center text-sm">
              <Target className="w-4 h-4 text-secondary mr-3 flex-shrink-0" />
              <span>Plus de lignes = plus de gains</span>
            </div>
            <div className="flex items-center text-sm">
              <Trophy className="w-4 h-4 text-success mr-3 flex-shrink-0" />
              <span>Multiplicateur selon votre mise</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Betting Interface */}
        <div className="space-y-6">
          
          {/* Balance Display */}
          <Card className="gaming-card p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-secondary mr-2" />
              <span className="text-sm text-muted-foreground">
                {demoMode ? 'Solde virtuel' : 'Solde disponible'}
              </span>
            </div>
            <div className="text-2xl font-bold text-secondary">
              {balance.toLocaleString()} FCFA
            </div>
            {demoMode && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                  MODE DÉMO • Aucun argent réel misé
                </Badge>
              </div>
            )}
          </Card>

          {/* Bet Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              {demoMode ? 'Mise virtuelle' : 'Choisissez votre mise'}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {BET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedBet === amount ? "default" : "outline"}
                  className={`h-14 text-sm font-semibold ${
                    selectedBet === amount 
                      ? 'gaming-button-primary' 
                      : 'border-border hover:border-primary/50'
                  } ${amount > balance && !demoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setSelectedBet(amount)}
                  disabled={amount > balance && !demoMode}
                >
                  <div className="text-center">
                    <div>{amount.toLocaleString()}</div>
                    <div className="text-xs opacity-75">FCFA</div>
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
                <span className="font-semibold text-primary">{selectedBet.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Multiplicateur:</span>
                <span className="font-semibold text-secondary flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  x{getMultiplier(selectedBet, demoMode).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gains estimés (1000 pts):</span>
                <span className="font-semibold text-success">
                  {getEstimatedGains(selectedBet, demoMode).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </Card>

          {/* Start Game Button */}
          <Button
            onClick={handleStartGame}
            className="w-full h-16 text-lg font-bold gaming-button-primary"
            disabled={selectedBet > balance && !demoMode}
          >
            <Play className="w-5 h-5 mr-2" />
            {demoMode ? 'Commencer en DÉMO' : 'Commencer la partie'}
          </Button>

          {/* Demo Notice */}
          {demoMode && (
            <div className="text-xs text-muted-foreground bg-surface/30 p-3 rounded-lg text-center">
              <p className="font-medium mb-1">💡 En mode démo :</p>
              <p>• Aucun argent réel n'est misé</p>
              <p>• Découvrez vos gains potentiels</p>
              <p>• Multiplicateur x2.5 pour simulation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}