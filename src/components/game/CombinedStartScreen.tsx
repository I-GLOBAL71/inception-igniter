import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play, Coins, Gift, User, Wallet } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency.tsx';
import { useAuth } from '@/hooks/useAuth';
import { useGameEconomics } from '@/hooks/useGameEconomics';
import AuthModal from '@/components/auth/AuthModal';
import WalletModal from '@/components/wallet/WalletModal';

interface CombinedStartScreenProps {
  balance: number;
  onStartGame: (betAmount: number, demo: boolean) => void;
  isDemo: boolean;
  onModeChange: (isDemo: boolean) => void;
}

const BET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function CombinedStartScreen({
  balance,
  onStartGame,
  isDemo,
  onModeChange,
}: CombinedStartScreenProps) {
  const [selectedBet, setSelectedBet] = useState(500);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { formatAmount } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { economicConfig, fetchEconomicConfig } = useGameEconomics();

  useEffect(() => {
    fetchEconomicConfig();
  }, [fetchEconomicConfig]);

  const handleStartGame = () => {
    // Si mode réel mais pas connecté, ouvrir l'authentification
    if (!isDemo && !user) {
      setShowAuthModal(true);
      return;
    }

    // Si mode réel et solde insuffisant, ouvrir le portefeuille
    if (!isDemo && user && balance < selectedBet) {
      setShowWalletModal(true);
      return;
    }

    onStartGame(selectedBet, isDemo);
  };

  const getMultiplier = (amount: number, demo: boolean) => {
    if (demo) return economicConfig?.demo_multiplier || 2.5;
    return 1.0 + (amount / 10000);
  };

  const getEstimatedGains = (amount: number, demo: boolean) => {
    const referenceScore = economicConfig?.reference_score || 1000;
    const gainRate = demo 
      ? (economicConfig?.demo_gain_rate || 0.5)
      : (economicConfig?.real_gain_rate || 0.1);
    
    return Math.floor(referenceScore * getMultiplier(amount, demo) * gainRate);
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Header avec logo et toggle mode */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold gaming-text-gradient">🎮 Tetris Rémunéré</h1>
            <p className="text-xs text-muted-foreground">Gagnez de l'argent réel !</p>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWalletModal(true)}
                className="h-9"
              >
                <Wallet className="w-4 h-4 mr-1" />
                Wallet
              </Button>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="h-9"
            >
              <User className="w-4 h-4 mr-1" />
              Connexion
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center p-2 border-b border-border">
        <div className="flex items-center space-x-3">{/* Extra space for balance or other info */}</div>
        
        {/* Mode Toggle - Plus intuitif */}
        <div className="flex rounded-lg bg-muted p-1">
          <Button
            variant={isDemo ? "default" : "ghost"}
            size="sm"
            className={`px-3 py-1 text-xs font-semibold ${
              isDemo ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => onModeChange(true)}
          >
            <Gift className="w-3 h-3 mr-1" />
            DÉMO
          </Button>
          <Button
            variant={!isDemo ? "default" : "ghost"}
            size="sm"
            className={`px-3 py-1 text-xs font-semibold ${
              !isDemo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => onModeChange(false)}
          >
            <Coins className="w-3 h-3 mr-1" />
            RÉEL
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col justify-center p-4 space-y-6">
        
        {/* Badge mode actuel - Très visible */}
        <div className="text-center">
          {isDemo ? (
            <Badge variant="outline" className="bg-accent/20 text-accent border-accent text-base px-4 py-2">
              🎮 MODE DÉMO GRATUIT - Aucun argent réel misé
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary text-base px-4 py-2">
              💰 MODE ARGENT RÉEL - Gains réels
            </Badge>
          )}
        </div>

        {/* Solde */}
        <Card className="gaming-card p-4 text-center">
          <div className="text-sm text-muted-foreground mb-1">
            {isDemo ? 'Solde virtuel' : 'Solde disponible'}
          </div>
          <div className="text-2xl font-bold text-secondary">
            {formatAmount(balance / 655.96)}
          </div>
        </Card>

        {/* Sélection de mise - Simplifiée */}
        <div className="space-y-3">
          <h3 className="text-center font-semibold">
            {isDemo ? 'Mise virtuelle' : 'Choisissez votre mise'}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {BET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedBet === amount ? "default" : "outline"}
                className={`h-12 text-sm transition-all ${
                  selectedBet === amount
                    ? 'gaming-button-primary'
                    : 'border-border'
                } ${amount > balance && !isDemo ? 'text-destructive border-destructive hover:bg-destructive/10' : ''}`}
                onClick={() => {
                  if (amount > balance && !isDemo) {
                    setShowWalletModal(true);
                  } else {
                    setSelectedBet(amount);
                  }
                }}
              >
                <div className="text-center">
                  <div className="font-semibold">{amount.toLocaleString()}</div>
                  
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Info gains - Compacte */}
        <Card className="gaming-card p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gains estimés:</span>
            <span className="font-bold text-success">
              {formatAmount(getEstimatedGains(selectedBet, isDemo) / 655.96)}
            </span>
          </div>
        </Card>

        {/* Bouton de démarrage */}
        <Button
          onClick={handleStartGame}
          className="w-full h-14 text-lg font-bold gaming-button-primary"
          disabled={authLoading}
        >
          <Play className="w-5 h-5 mr-2" />
          {isDemo ? 'JOUER EN DÉMO' : (user ? 'JOUER AVEC ARGENT RÉEL' : 'SE CONNECTER ET JOUER')}
        </Button>

        {/* Notice selon le mode */}
        <div className="text-center text-xs text-muted-foreground">
          {isDemo ? (
            <p>💡 Mode démo : Découvrez le jeu sans risque</p>
          ) : user ? (
            <p>🔒 Paiements 100% sécurisés</p>
          ) : (
            <p>🔐 Connectez-vous pour jouer avec de l'argent réel</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {user && (
        <WalletModal 
          isOpen={showWalletModal} 
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
}