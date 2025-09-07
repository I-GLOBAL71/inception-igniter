import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Play, Eye } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface DemoResultModalProps {
  score: number;
  lines: number;
  multiplier: number;
  onPlayReal: () => void;
  onPlayAgain: () => void;
  onClose: () => void;
}

export default function DemoResultModal({ 
  score, 
  lines, 
  multiplier, 
  onPlayReal, 
  onPlayAgain, 
  onClose 
}: DemoResultModalProps) {
  const { formatAmount } = useCurrency();

  // Calculate potential earnings (base rate from admin settings)
  const baseEarningsRate = 0.01; // EUR per 1000 points - should come from admin
  const potentialEarnings = (score / 1000) * baseEarningsRate * multiplier;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-accent/30">
        <CardHeader className="text-center bg-accent/5">
          <div className="flex items-center justify-center mb-3">
            <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 text-sm font-bold px-4 py-2">
              <Eye className="w-4 h-4 mr-2" />
              🎮 MODE DÉMO TERMINÉ
            </Badge>
          </div>
          <CardTitle className="gaming-text-gradient text-xl">Félicitations !</CardTitle>
          <p className="text-sm text-muted-foreground">
            Voici ce que vous auriez gagné en argent réel
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Demo Warning */}
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-center">
            <div className="text-accent font-bold text-sm mb-2">
              ⚠️ ATTENTION : SIMULATION DÉMO
            </div>
            <div className="text-xs text-muted-foreground">
              Aucun argent réel n'a été misé ou gagné dans cette partie
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-card/50 rounded-lg">
              <div className="text-2xl font-bold gaming-text-gradient">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Score démo</div>
            </div>
            <div className="text-center p-3 bg-card/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {lines}
              </div>
              <div className="text-sm text-muted-foreground">Lignes</div>
            </div>
          </div>

          {/* Potential Earnings */}
          <div className="p-4 bg-gradient-to-r from-success/10 to-secondary/10 rounded-lg border border-success/20">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-success mr-2" />
              <span className="font-bold text-success">Gains que vous auriez eus</span>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-1">
                {formatAmount(potentialEarnings)}
              </div>
              <div className="text-xs text-muted-foreground">
                Avec multiplicateur x{multiplier.toFixed(1)} en argent réel
              </div>
            </div>
          </div>

          {/* Strong Call to Action */}
          <div className="space-y-4">
            <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="text-primary font-bold text-sm mb-1">
                💰 Prêt à gagner de l'argent réel ?
              </div>
              <div className="text-xs text-muted-foreground">
                Utilisez nos méthodes de paiement sécurisées
              </div>
            </div>

            <Button 
              onClick={onPlayReal} 
              className="gaming-button-primary w-full h-14"
              size="lg"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              JOUER AVEC DE L'ARGENT RÉEL
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={onPlayAgain}
                variant="outline"
                className="border-accent/30 hover:bg-accent/10"
              >
                <Play className="w-3 h-3 mr-1" />
                Autre démo
              </Button>
              <Button 
                onClick={onClose}
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          </div>

          {/* Demo Disclaimer */}
          <div className="text-xs text-muted-foreground text-center p-3 bg-muted/50 rounded border">
            <div className="font-medium text-accent mb-1">Mode démo uniquement</div>
            <div>Cette partie était une simulation. Pour gagner de l'argent réel, 
            vous devez jouer en mode argent réel avec nos partenaires de paiement sécurisés.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}