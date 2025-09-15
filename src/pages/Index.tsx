import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Settings, Volume2, VolumeX, LogOut, User as UserIcon } from 'lucide-react';
import TetrisBoard from '@/components/tetris/TetrisBoard';
import AdminPanel from '@/components/admin/AdminPanel';
import CombinedStartScreen from '@/components/game/CombinedStartScreen';
import GameResultModal from '@/components/game/DemoResultModal';
import { useCurrency } from '@/hooks/useCurrency.tsx';
import { useSound } from '@/hooks/useSound.tsx';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useRealMoneyGame } from '@/hooks/useRealMoneyGame';

type GameState = 'start' | 'playing' | 'gameOver';
type GameResult = {
  payout: number;
  isWin: boolean;
  isJackpot: boolean;
} | null;

const Index = () => {
  const { settings, isLoading } = useGameSettings();
  const {
    enabled,
    setEnabled,
    isPreloading,
    playMove,
    playRotate,
    playDrop,
    playLineClear,
    playGameOver,
    playDebrisFall,
    setVolume
  } = useSound();
  const { user, signOut } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { startRealMoneyGame, completeRealMoneyGame } = useRealMoneyGame(user?.id);

  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [isDemo, setIsDemo] = useState(true);
  const [currentBet, setCurrentBet] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [gameSession, setGameSession] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const { formatAmount, convertFromEUR } = useCurrency();

  const balance = isDemo ? 25000 : (wallet?.balance ?? 0);

  useEffect(() => {
    if (settings?.volumeLevel) {
      setVolume(settings.volumeLevel);
    }
  }, [settings?.volumeLevel, setVolume]);

  // Calculate earnings and multiplier based on bet
  const earnings = settings?.base_return_rate ? convertFromEUR((score / 1000) * settings.base_return_rate) : 0;

  const handleStartGame = async (betAmount: number, demo: boolean = true) => {
    setScore(0);
    setLines(0);
    setCurrentBet(betAmount);
    setIsDemo(demo);
    setGameResult(null);

    const session = await startRealMoneyGame(betAmount, demo);
    if (session) {
      setGameSession(session);
      setGameState('playing');
    }
  };

  const handleGameOver = async (finalScore: number) => {
    if (!gameSession) return;

    const result = await completeRealMoneyGame(finalScore, gameSession.id, isDemo);
    if (result) {
      setGameResult(result);
    }
    setGameState('gameOver');
  };

  const handleRealPlay = () => {
    setIsDemo(false);
    setGameState('start');
  };

  const handleBackToStart = () => {
    setGameState('start');
    setScore(0);
    setLines(0);
    setGameResult(null);
  };


  if (isLoading || !settings) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold gaming-text-gradient mb-4">PrimeGems</h1>
          <p className="text-muted-foreground">Chargement des paramètres du jeu...</p>
        </div>
      </div>
    );
  }


  if (gameState === 'start') {
    return (
      <CombinedStartScreen
        balance={balance}
        onStartGame={handleStartGame}
        isDemo={isDemo}
        onModeChange={setIsDemo}
      />
    );
  }

  if (gameState === 'gameOver' && gameResult) {
    return (
      <GameResultModal
        isOpen={true}
        score={score}
        payout={gameResult.payout}
        isWin={gameResult.isWin}
        isJackpot={gameResult.isJackpot}
        onPlayAgain={() => handleStartGame(currentBet, isDemo)}
        onPlayReal={handleRealPlay}
        onClose={handleBackToStart}
        isDemo={isDemo}
      />
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Unified Header */}
      <header className="flex items-center justify-between p-4 bg-surface/30 backdrop-blur-sm border-b border-border flex-shrink-0">
        <Button
          onClick={handleBackToStart}
          variant="ghost"
          size="icon"
          className="w-8 h-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold gaming-text-gradient">GameWin</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm font-bold text-secondary">
            {formatAmount(balance)}
          </div>
          <Button onClick={() => setEnabled(!enabled)} variant="ghost" size="icon">
            {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          {user && (
            <Button onClick={signOut} variant="ghost" size="icon" title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="lg:hidden grid grid-cols-4 gap-2 p-2 bg-surface/20 border-b border-border text-center">
        <div>
          <div className="text-xs text-muted-foreground">Mise</div>
          <div className="text-sm font-bold text-primary">{formatAmount(currentBet)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Score</div>
          <div className="text-sm font-bold text-primary">{score.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Lignes</div>
          <div className="text-sm font-bold text-accent">{lines}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Gains</div>
          <div className="text-sm font-bold text-success">{formatAmount(earnings)}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Stats Panel */}
        <aside className="hidden lg:flex w-80 bg-surface/30 backdrop-blur-sm border-r border-border p-6 flex-col space-y-4">
          {/* Current Bet */}
          <div className="gaming-card p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Mise actuelle</div>
            <div className="text-xl font-bold text-primary">
              {formatAmount(currentBet)}
            </div>
            {isDemo && (
              <div className="text-xs text-accent mt-1">Mode Démo</div>
            )}
          </div>

          {/* Game Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="gaming-card p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Score</div>
              <div className="text-2xl font-bold gaming-text-gradient">
                {score.toLocaleString()}
              </div>
            </div>
            <div className="gaming-card p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Lignes</div>
              <div className="text-2xl font-bold text-accent">
                {lines}
              </div>
            </div>
          </div>
          
          <div className="gaming-card p-4 text-center flex-1">
              <div className="text-sm text-muted-foreground mb-1">Gains actuels</div>
              <div className="text-2xl font-bold text-success">
                {formatAmount(earnings)}
              </div>
            </div>

           {/* Game Rules */}
           <div className="gaming-card p-4">
              <h3 className="font-semibold mb-3 text-center">💰 Gains</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>1 Point =</span>
                  <span className="text-success font-medium">
                    {formatAmount(settings.base_return_rate / 1000, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Multiplicateur Max:</span>
                  <span className="text-secondary font-medium">x{settings.max_win_multiplier}</span>
                </div>
              </div>
            </div>
        </aside>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-2 lg:p-4 overflow-hidden">
          <div className="w-full max-w-sm flex-1 relative">
            <TetrisBoard
              onScoreChange={setScore}
              onLinesChange={setLines}
              isDemo={isDemo}
              onGameOver={handleGameOver}
              playMove={playMove}
              playRotate={playRotate}
              playDrop={playDrop}
              playLineClear={playLineClear}
              playGameOver={playGameOver}
              playDebrisFall={playDebrisFall}
              gameSettings={settings}
            />
          </div>
        </main>
      </div>

      {/* Admin Panel & Button */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
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
