import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper, Trophy, DollarSign, Play, Eye } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency.tsx';

interface GameResultModalProps {
  isOpen: boolean;
  score: number;
  payout: number;
  isWin: boolean;
  isJackpot: boolean;
  isDemo: boolean;
  onPlayAgain: () => void;
  onPlayReal: () => void;
  onClose: () => void;
}

export default function GameResultModal({
  isOpen,
  score,
  payout,
  isWin,
  isJackpot,
  isDemo,
  onPlayAgain,
  onPlayReal,
  onClose,
}: GameResultModalProps) {
  const { formatAmount } = useCurrency();

  if (!isOpen) {
    return null;
  }

  const title = isDemo ? "Mode Démo Terminé" : "Partie Terminée";
  const subTitle = isWin ? (isJackpot ? "JACKPOT !" : "Félicitations !") : "Dommage !";

  const renderEarnings = () => {
    if (isDemo) {
      return (
        <div className="p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-lg border border-accent/20">
          <div className="flex items-center justify-center mb-2">
            <Eye className="w-5 h-5 text-accent mr-2" />
            <span className="font-bold text-accent">Gains simulés</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-1">
              {formatAmount(payout)}
            </div>
            <div className="text-xs text-muted-foreground">
              Ceci est une simulation. Jouez en réel pour gagner.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-4 bg-gradient-to-r rounded-lg border ${isWin ? 'from-success/10 to-secondary/10 border-success/20' : 'from-destructive/10 to-secondary/10 border-destructive/20'}`}>
        <div className="flex items-center justify-center mb-2">
          {isWin ? <PartyPopper className="w-5 h-5 text-success mr-2" /> : <Trophy className="w-5 h-5 text-destructive mr-2" />}
          <span className={`font-bold ${isWin ? 'text-success' : 'text-destructive'}`}>
            {isWin ? 'Vos Gains' : 'Aucun Gain'}
          </span>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${isWin ? 'text-success' : 'text-destructive'} mb-1`}>
            {formatAmount(payout)}
          </div>
          <div className="text-xs text-muted-foreground">
            {isJackpot ? "Vous avez décroché le jackpot !" : (isWin ? "Bien joué !" : "Meilleure chance la prochaine fois.")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md border-2 ${isDemo ? 'border-accent/30' : (isWin ? 'border-success/30' : 'border-destructive/30')}`}>
        <CardHeader className="text-center">
          <CardTitle className="gaming-text-gradient text-2xl">{subTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{title}</p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {/* Game Stats */}
          <div className="text-center p-3 bg-card/50 rounded-lg">
            <div className="text-3xl font-bold gaming-text-gradient">
              {score.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Score Final</div>
          </div>

          {/* Earnings */}
          {renderEarnings()}

          {/* Actions */}
          <div className="space-y-3">
            {isDemo && (
              <Button 
                onClick={onPlayReal} 
                className="gaming-button-primary w-full h-12"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                PASSER EN MODE RÉEL
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={onPlayAgain}
                variant="outline"
                className="h-12"
              >
                <Play className="w-4 h-4 mr-2" />
                Rejouer
              </Button>
              <Button 
                onClick={onClose}
                variant="secondary"
                className="h-12"
              >
                Fermer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}