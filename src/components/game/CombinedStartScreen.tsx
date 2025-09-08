import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play, Coins, Gift, User, Wallet } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import WalletModal from '@/components/wallet/WalletModal';

interface CombinedStartScreenProps {
  balance: number;
  onStartGame: (betAmount: number, demo: boolean) => void;
}

const BET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function CombinedStartScreen({ balance, onStartGame }: CombinedStartScreenProps) {
  const [selectedBet, setSelectedBet] = useState(500);
  const [demoMode, setDemoMode] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { formatAmount } = useCurrency();
  const { user, loading: authLoading } = useAuth();

  const handleStartGame = () => {
    // Si mode réel mais pas connecté, ouvrir l'authentification
    if (!demoMode && !user) {
      setShowAuthModal(true);
      return;
    }
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
            variant={demoMode ? "default" : "ghost"}
            size="sm"
            className={`px-3 py-1 text-xs font-semibold ${
              demoMode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setDemoMode(true)}
          >
            <Gift className="w-3 h-3 mr-1" />
            DÉMO
          </Button>
          <Button
            variant={!demoMode ? "default" : "ghost"}
            size="sm"
            className={`px-3 py-1 text-xs font-semibold ${
              !demoMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setDemoMode(false)}
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
          {demoMode ? (
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
            {demoMode ? 'Solde virtuel' : 'Solde disponible'}
          </div>
          <div className="text-2xl font-bold text-secondary">
            {balance.toLocaleString()} FCFA
          </div>
        </Card>

        {/* Sélection de mise - Simplifiée */}
        <div className="space-y-3">
          <h3 className="text-center font-semibold">
            {demoMode ? 'Mise virtuelle' : 'Choisissez votre mise'}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {BET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedBet === amount ? "default" : "outline"}
                className={`h-12 text-sm ${
                  selectedBet === amount 
                    ? 'gaming-button-primary' 
                    : 'border-border'
                } ${amount > balance && !demoMode ? 'opacity-50' : ''}`}
                onClick={() => setSelectedBet(amount)}
                disabled={amount > balance && !demoMode}
              >
                <div className="text-center">
                  <div className="font-semibold">{amount.toLocaleString()}</div>
                  <div className="text-xs opacity-75">FCFA</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Info gains - Compacte */}
        <Card className="gaming-card p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gains estimés (1000 pts):</span>
            <span className="font-bold text-success">
              {getEstimatedGains(selectedBet, demoMode).toLocaleString()} FCFA
            </span>
          </div>
        </Card>

        {/* Bouton de démarrage */}
        <Button
          onClick={handleStartGame}
          className="w-full h-14 text-lg font-bold gaming-button-primary"
          disabled={(selectedBet > balance && !demoMode) || authLoading}
        >
          <Play className="w-5 h-5 mr-2" />
          {demoMode ? 'JOUER EN DÉMO' : (user ? 'JOUER AVEC ARGENT RÉEL' : 'SE CONNECTER ET JOUER')}
        </Button>

        {/* Notice selon le mode */}
        <div className="text-center text-xs text-muted-foreground">
          {demoMode ? (
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
          userId={user.id}
        />
      )}
    </div>
  );
}