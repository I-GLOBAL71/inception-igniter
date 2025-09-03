import React from 'react';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Settings, User } from 'lucide-react';

interface GameHeaderProps {
  balance?: number;
  demoMode?: boolean;
}

export default function GameHeader({ balance = 0, demoMode = true }: GameHeaderProps) {
  return (
    <header className="w-full gaming-card p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold gaming-text-gradient">GameWin</h1>
            <p className="text-xs text-muted-foreground">Jeux Rémunérés</p>
          </div>
        </div>

        {/* Balance & Mode */}
        <div className="flex items-center space-x-4">
          <div className="gaming-card px-4 py-2 border border-secondary/20">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-secondary" />
              <div className="text-right">
                <div className="text-sm font-semibold text-secondary">
                  {balance.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-muted-foreground">
                  {demoMode ? '(Demo)' : 'Réel'}
                </div>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="p-2">
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-accent/10 border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-accent">
                🎯 Mode Démonstration Actif
              </p>
              <p className="text-xs text-muted-foreground">
                Gains généreux pour tester - Passez au mode réel pour gagner vraiment !
              </p>
            </div>
            <Button size="sm" className="gaming-button-secondary text-xs px-3">
              Mode Réel
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}