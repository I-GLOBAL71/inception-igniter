import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, Zap, TrendingUp, Settings } from 'lucide-react';
import BettingScreen from '@/components/game/BettingScreen';
import TetrisBoard from '@/components/tetris/TetrisBoard';
import AdminPanel from '@/components/admin/AdminPanel';
import LandingOverlay from '@/components/game/LandingOverlay';
import { useCurrency } from '@/hooks/useCurrency';

type GameState = 'landing' | 'betting' | 'playing';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [balance] = useState(25000);
  const [isDemo, setIsDemo] = useState(true);
  const [currentBet, setCurrentBet] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const { formatAmount } = useCurrency();

  // Calculate earnings and multiplier based on bet
  const multiplier = isDemo ? 2.5 : 1.0 + (currentBet / 10000);
  const earnings = isDemo ? Math.floor(score * 0.5) : Math.floor(score * 0.1);

  const handleStartGame = (betAmount: number, demo: boolean = true) => {
    setCurrentBet(betAmount);
    setIsDemo(demo);
    setScore(0);
    setLines(0);
    setGameState('playing');
  };

  const handleRealPlay = () => {
    setIsDemo(false);
    setGameState('betting');
  };

  const handleBackToBetting = () => {
    setGameState('betting');
    setScore(0);
    setLines(0);
  };

  const handleStartDemo = () => {
    setIsDemo(true);
    setGameState('betting');
  };

  const handleStartReal = () => {
    setIsDemo(false);
    setGameState('betting');
  };

  if (gameState === 'landing') {
    return (
      <div className="h-screen bg-background overflow-hidden">
        {/* Background Game Preview */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <TetrisBoard onScoreChange={() => {}} onLinesChange={() => {}} isDemo={true} />
        </div>
        
        {/* Landing Overlay */}
        <LandingOverlay 
          onStartDemo={handleStartDemo}
          onStartReal={handleStartReal}
        />
      </div>
    );
  }

  if (gameState === 'betting') {
    return (
      <BettingScreen 
        balance={balance} 
        demoMode={isDemo} 
        onStartGame={handleStartGame} 
      />
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-surface/30 backdrop-blur-sm border-b border-border">
        <Button
          onClick={handleBackToBetting}
          variant="ghost"
          size="sm"
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold gaming-text-gradient">GameWin</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary">
            {currentBet.toLocaleString()} FCFA
          </div>
          {isDemo && (
            <div className="text-xs text-accent">x{multiplier}</div>
          )}
        </div>
      </div>

      {/* Mobile Stats Bar */}
      <div className="lg:hidden flex justify-between p-2 bg-surface/20 border-b border-border text-center">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Score</div>
          <div className="text-sm font-bold text-primary">{score.toLocaleString()}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Lignes</div>
          <div className="text-sm font-bold text-accent">{lines}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Gains</div>
          <div className="text-sm font-bold text-success">{earnings.toLocaleString()}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Solde</div>
          <div className="text-sm font-bold text-secondary">{balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex h-full lg:h-screen">
        {/* Desktop Left Sidebar - Stats */}
        <div className="hidden lg:flex w-80 bg-surface/30 backdrop-blur-sm border-r border-border p-6 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={handleBackToBetting}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold gaming-text-gradient">GameWin</span>
            </div>
          </div>

          {/* Current Bet */}
          <div className="gaming-card p-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Mise actuelle</div>
              <div className="text-xl font-bold text-primary">
                {currentBet.toLocaleString()} FCFA
              </div>
              {isDemo && (
                <div className="text-xs text-accent mt-1">Mode Démo x{multiplier}</div>
              )}
            </div>
          </div>

          {/* Game Stats */}
          <div className="space-y-4 flex-1">
            <div className="gaming-card p-4">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Score</span>
              </div>
              <div className="text-2xl font-bold gaming-text-gradient">
                {score.toLocaleString()}
              </div>
            </div>

            <div className="gaming-card p-4">
              <div className="flex items-center mb-2">
                <Zap className="w-5 h-5 text-accent mr-2" />
                <span className="text-sm text-muted-foreground">Lignes</span>
              </div>
              <div className="text-2xl font-bold text-accent">
                {lines}
              </div>
            </div>

            <div className="gaming-card p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-success mr-2" />
                <span className="text-sm text-muted-foreground">Gains actuels</span>
              </div>
              <div className="text-2xl font-bold text-success">
                {earnings.toLocaleString()} FCFA
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="gaming-card p-4 mt-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Solde</div>
              <div className="text-lg font-bold text-secondary">
                {balance.toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex items-center justify-center p-2 lg:p-4">
          <div className="w-full max-w-sm">
            <TetrisBoard 
              onScoreChange={setScore}
              onLinesChange={setLines}
              isDemo={isDemo}
              onRealPlay={handleRealPlay}
            />
          </div>
        </div>

        {/* Desktop Right Panel */}
        <div className="hidden lg:flex w-80 bg-surface/30 backdrop-blur-sm border-l border-border p-6">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="gaming-card p-4">
              <h3 className="font-semibold mb-3 text-center">🎮 Contrôles</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary/20 rounded mr-2 flex items-center justify-center text-xs">📱</div>
                  <span>Glisser pour déplacer</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-secondary/20 rounded mr-2 flex items-center justify-center text-xs">👆</div>
                  <span>Tapoter pour tourner</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-accent/20 rounded mr-2 flex items-center justify-center text-xs">⌨️</div>
                  <span>Flèches + Espace</span>
                </div>
              </div>
            </div>

            {/* Game Rules */}
            <div className="gaming-card p-4">
              <h3 className="font-semibold mb-3 text-center">💰 Gains</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>1 Point =</span>
                  <span className="text-success font-medium">
                    {isDemo ? '0.5' : '0.1'} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Multiplicateur:</span>
                  <span className="text-secondary font-medium">x{multiplier.toFixed(1)}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="text-center text-xs">
                    Plus de lignes = Plus de gains !
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      
      {/* Admin Access Button */}
      <Button
        onClick={() => setShowAdmin(true)}
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 opacity-30 hover:opacity-100"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Index;
