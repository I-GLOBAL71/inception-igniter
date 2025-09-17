import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGameEconomics } from './useGameEconomics';
import { useWallet } from './useWallet';
import { toast } from 'sonner';

export const useRealMoneyGame = (userId?: string) => {
  const [currentGameSession, setCurrentGameSession] = useState<any>(null);
  const { getNextGame, completeGame } = useGameEconomics();
  const { processBet, processWin } = useWallet(userId);

  // Start a real money game
  const startRealMoneyGame = useCallback(async (betAmount: number, isDemo: boolean = false) => {
    if (!userId && !isDemo) {
      setTimeout(() => toast.error("Vous devez être connecté pour jouer avec de l'argent réel"), 0);
      return null;
    }

    // Handle Demo Game
    if (isDemo) {
      const demoGame = {
        id: `demo-${Date.now()}`,
        bet_amount: betAmount,
        is_demo: true,
        status: 'active',
        game: {
          id: 'demo-game-id',
          max_achievable_score: 20000, // Typical max score
          result_type: 'win', // Assume a 'win' type for demo
          expected_payout: betAmount * 2.5, // Demo multiplier
        },
      };
      setCurrentGameSession(demoGame);
      console.log('Demo game started:', demoGame);
      return demoGame;
    }

    // Handle Real Money Game
    try {
      const nextGame = await getNextGame(betAmount);
      if (!nextGame) {
        setTimeout(() => toast.error('Aucune partie disponible pour ce montant. Réessayez plus tard.'), 0);
        return null;
      }

      const betResult = await processBet(betAmount, nextGame.id);
      if (!betResult.success) {
        return null; // processBet should show a toast
      }

      const { data: gameSession, error } = await supabase
        .from('game_sessions')
        .insert({
          game_id: nextGame.id,
          user_id: userId,
          bet_amount: betAmount,
          is_demo: false,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating game session:', error);
        toast.error('Erreur lors de la création de la session de jeu.');
        // TODO: Consider refunding the bet here
        return null;
      }

      const sessionWithGame = { 
        ...gameSession, 
        game: nextGame,
        maxScore: nextGame.max_achievable_score // Pass max score to limit gameplay
      };
      setCurrentGameSession(sessionWithGame);
      console.log('Real money game started:', sessionWithGame);
      return sessionWithGame;

    } catch (error) {
      console.error('Error starting real money game:', error);
      toast.error('Une erreur technique est survenue au démarrage du jeu.');
      return null;
    }
  }, [userId, getNextGame, processBet]);

  // Complete a game and process winnings
  const completeRealMoneyGame = useCallback(async (score: number, sessionId: string, isDemo: boolean = false) => {
    if (!currentGameSession) {
      console.error('No active game session to complete.');
      return null;
    }

    const { game, bet_amount } = currentGameSession;
    let payout = 0;
    let isJackpot = false;

    // --- Payout Calculation ---
    if (isDemo) {
      // Permissive demo payout
      payout = (score / 500) * (bet_amount || 100) * 0.1;
    } else {
      // Real money payout logic - adapt to actual bet amount
      const scoreRatio = Math.min(score / (game.max_achievable_score || 20000), 1);
      const betRatio = bet_amount / game.bet_amount; // Ratio between actual and expected bet
      
      if (game.result_type === 'win' && scoreRatio >= 0.5) {
        // Scale payout based on both score performance and bet ratio
        payout = game.expected_payout * betRatio * scoreRatio;
      } else if (game.result_type === 'jackpot' && scoreRatio >= 0.8) {
        // Jackpot scaled by bet ratio
        payout = game.expected_payout * betRatio;
        isJackpot = true;
      }
      // For losses, no payout regardless of score
    }
    payout = Math.floor(payout);


    // --- Handle Demo Game Completion ---
    if (isDemo) {
      console.log(`Demo game completed - Score: ${score}, Payout: ${payout}`);
      setCurrentGameSession(null);
      return { success: true, payout, isWin: payout > 0, isJackpot: false };
    }

    // --- Handle Real Money Game Completion ---
    try {
      // Update game session in DB
      await supabase.from('game_sessions').update({
        score,
        payout_amount: payout,
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', sessionId);

      // Mark pre-generated game as used
      await completeGame(game.id, score, payout);

      // Process win and jackpot if applicable
      if (payout > 0) {
        await processWin(payout, game.id);
        if (isJackpot) {
          // (Optional) Add jackpot logic here if needed
        }
      }

      console.log(`Real money game completed - Score: ${score}, Payout: ${payout}`);
      setCurrentGameSession(null);
      return { success: true, payout, isWin: payout > 0, isJackpot };

    } catch (error) {
      console.error('Error completing real money game:', error);
      toast.error('Erreur lors de la finalisation du jeu.');
      return null;
    }
  }, [currentGameSession, userId, completeGame, processWin, supabase]);

  return {
    currentGameSession,
    startRealMoneyGame,
    completeRealMoneyGame,
    setCurrentGameSession
  };
};