import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Play, Coins, Zap, Gift } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency.tsx';

interface LandingOverlayProps {
  onStartDemo: () => void;
  onStartReal: () => void;
}

export default function LandingOverlay({ onStartDemo, onStartReal }: LandingOverlayProps) {
  const { formatAmount } = useCurrency();

  return (
    <div className="fixed inset-0 z-50 bg-background/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Main Card */}
        <Card className="gaming-card p-6 text-center space-y-6 border-2 border-primary/30">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold gaming-text-gradient">
              🎮 Tetris Rémunéré
            </h1>
            <p className="text-muted-foreground text-sm">
              Gagnez de l'argent réel en jouant !
            </p>
          </div>

          {/* Demo Mode Notice */}
          <Card className="bg-accent/10 border-accent/30 p-4">
            <div className="flex items-center justify-center mb-2">
              <Gift className="w-5 h-5 text-accent mr-2" />
              <span className="font-semibold text-accent">Mode Démo Gratuit</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Testez le jeu gratuitement et voyez vos gains potentiels !
            </p>
          </Card>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Zap className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
              <span className="text-left">Chaque point = argent réel</span>
            </div>
            <div className="flex items-center text-sm">
              <Coins className="w-4 h-4 text-secondary mr-3 flex-shrink-0" />
              <span className="text-left">Multiplicateur selon votre mise</span>
            </div>
            <div className="flex items-center text-sm">
              <Trophy className="w-4 h-4 text-success mr-3 flex-shrink-0" />
              <span className="text-left">Plus de lignes = plus de gains</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onStartDemo}
              variant="outline"
              className="w-full h-12 text-sm border-accent/30 hover:bg-accent/10"
            >
              <Play className="w-4 h-4 mr-2" />
              Essayer gratuitement (Mode Démo)
            </Button>
            
            <Button
              onClick={onStartReal}
              className="w-full h-12 text-sm gaming-button-primary"
            >
              <Coins className="w-4 h-4 mr-2" />
              Jouer avec de l'argent réel
            </Button>
          </div>

          {/* Demo Disclaimer */}
          <div className="text-xs text-muted-foreground bg-surface/30 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 En mode démo :</p>
            <p>• Aucun argent réel n'est misé</p>
            <p>• Voyez exactement ce que vous auriez gagné</p>
            <p>• Multiplicateur x2.5 pour simulation</p>
          </div>
        </Card>
      </div>
    </div>
  );
}