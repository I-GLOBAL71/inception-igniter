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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Eye className="w-3 h-3 mr-1" />
              MODE DÉMO
            </Badge>
          </div>
          <CardTitle className="gaming-text-gradient">Partie terminée !</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-card/50 rounded-lg">
              <div className="text-2xl font-bold gaming-text-gradient">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gains potentiels :</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-success mb-1">
              {formatAmount(potentialEarnings)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avec multiplicateur x{multiplier.toFixed(1)}
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-3">
            <Button 
              onClick={onPlayReal} 
              className="gaming-button-primary w-full"
              size="lg"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Jouer avec de l'argent réel
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={onPlayAgain}
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
              >
                <Play className="w-3 h-3 mr-1" />
                Rejouer en démo
              </Button>
              <Button 
                onClick={onClose}
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
            Les gains affichés sont calculés sur la base du taux de change actuel. 
            Les gains réels peuvent varier.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}