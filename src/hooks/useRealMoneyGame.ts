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
      toast.error('Vous devez être connecté pour jouer avec de l\'argent réel');
      return null;
    }

    try {
      // Get next game from the batch
      const nextGame = await getNextGame(betAmount);
      if (!nextGame) {
        toast.error('Aucune partie disponible pour ce montant');
        return null;
      }

      let sessionData: any = {
        game_id: nextGame.id,
        bet_amount: betAmount,
        is_demo: isDemo,
        status: 'active'
      };

      if (!isDemo && userId) {
        // Process the bet (deduct from wallet)
        const betResult = await processBet(betAmount, nextGame.id);
        if (!betResult.success) {
          return null;
        }
        sessionData.user_id = userId;
      }

      // Create game session
      const { data: gameSession, error } = await supabase
        .from('game_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating game session:', error);
        toast.error('Erreur lors de la création de la session de jeu');
        return null;
      }

      setCurrentGameSession({
        ...gameSession,
        game: nextGame
      });

      console.log(`${isDemo ? 'Demo' : 'Real money'} game started:`, gameSession);
      return {
        ...gameSession,
        game: nextGame
      };
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Erreur lors du démarrage du jeu');
      return null;
    }
  }, [userId, getNextGame, processBet]);

  // Complete a game and process winnings
  const completeRealMoneyGame = useCallback(async (
    score: number,
    sessionId: string,
    isDemo: boolean = false
  ) => {
    if (!currentGameSession) {
      console.error('No active game session');
      return false;
    }

    try {
      const game = currentGameSession.game;
      
      // Calculate payout based on score vs max achievable score
      let payout = 0;
      const scoreRatio = Math.min(score / game.max_achievable_score, 1);
      
      if (game.result_type === 'win' && scoreRatio >= 0.5) {
        // Player wins if they achieve at least 50% of max score on a winning game
        payout = game.expected_payout * scoreRatio;
      } else if (game.result_type === 'jackpot' && scoreRatio >= 0.8) {
        // Jackpot if they achieve at least 80% of max score on a jackpot game
        payout = game.expected_payout;
        
        if (!isDemo) {
          // Update jackpot pool
          const { data: currentJackpot } = await supabase
            .from('jackpot_pool')
            .select('total_payouts')
            .single();
            
          await supabase
            .from('jackpot_pool')
            .update({
              current_amount: 0,
              last_winner_id: userId,
              last_win_amount: payout,
              last_win_date: new Date().toISOString(),
              total_payouts: (currentJackpot?.total_payouts || 0) + payout
            });
        }
      }

      // Update game session
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({
          score,
          payout_amount: payout,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error updating game session:', sessionError);
        return false;
      }

      // Mark the pre-generated game as completed
      await completeGame(game.id, score, payout);

      // Process winnings for real money games
      if (!isDemo && payout > 0 && userId) {
        await processWin(payout, game.id);
      }

      console.log(`Game completed - Score: ${score}, Payout: ${payout}`);
      
      setCurrentGameSession(null);
      return {
        success: true,
        payout,
        isWin: payout > 0,
        isJackpot: game.result_type === 'jackpot' && payout > 0
      };
    } catch (error) {
      console.error('Error completing game:', error);
      toast.error('Erreur lors de la finalisation du jeu');
      return false;
    }
  }, [currentGameSession, userId, completeGame, processWin]);

  return {
    currentGameSession,
    startRealMoneyGame,
    completeRealMoneyGame,
    setCurrentGameSession
  };
};