import React, { useState } from 'react';
import GameHeader from '@/components/game/GameHeader';
import GameStats from '@/components/game/GameStats';
import TetrisBoard from '@/components/tetris/TetrisBoard';

const Index = () => {
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [balance] = useState(25000); // Demo balance
  const [demoMode] = useState(true);

  // Calculate earnings based on score and demo mode
  const earnings = demoMode ? Math.floor(score * 0.5) : Math.floor(score * 0.1);
  const multiplier = demoMode ? 2.5 : 1.0 + (lines * 0.1);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <GameHeader balance={balance} demoMode={demoMode} />
        
        {/* Game Stats */}
        <div className="flex justify-center mb-6">
          <GameStats 
            score={score} 
            lines={lines} 
            multiplier={multiplier}
            earnings={earnings}
          />
        </div>

        {/* Main Game Area */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <TetrisBoard 
              onScoreChange={setScore}
              onLinesChange={setLines}
            />
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-8 text-center">
          <div className="gaming-card p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold gaming-text-gradient mb-4">
              🎮 Tetris Rémunéré
            </h2>
            <p className="text-muted-foreground mb-4">
              Jouez au Tetris classique et gagnez de l'argent réel ! Plus vous faites de lignes, 
              plus votre multiplicateur augmente et plus vos gains sont importants.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-surface/40 rounded-lg">
                <div className="font-semibold text-primary mb-1">Mode Démo</div>
                <div className="text-muted-foreground">
                  Gains x2.5 pour tester le jeu
                </div>
              </div>
              <div className="p-3 bg-surface/40 rounded-lg">
                <div className="font-semibold text-secondary mb-1">Mode Réel</div>
                <div className="text-muted-foreground">
                  Misez et gagnez de vrais FCFA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
