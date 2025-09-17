import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EconomicConfig {
  id: string;
  player_share_percentage: number;
  platform_share_percentage: number;
  jackpot_share_percentage: number;
  base_return_rate: number;
  max_win_multiplier: number;
  jackpot_trigger_rate: number;
}

export interface GameBatch {
  id: string;
  batch_name: string;
  total_games: number;
  total_investment: number;
  player_payout_target: number;
  platform_revenue_target: number;
  jackpot_contribution_target: number;
  games_played: number;
  actual_player_payout: number;
  actual_platform_revenue: number;
  actual_jackpot_contribution: number;
  is_active: boolean;
}

export interface PreGeneratedGame {
  id: string;
  batch_id: string;
  game_index: number;
  bet_amount: number;
  max_achievable_score: number;
  result_type: 'win' | 'loss' | 'jackpot';
  win_multiplier?: number;
  expected_payout: number;
  skill_requirement: number;
  is_played: boolean;
}

export interface JackpotPool {
  id: string;
  current_amount: number;
  last_winner_id?: string;
  last_win_amount?: number;
  last_win_date?: string;
  total_contributions: number;
  total_payouts: number;
}

const defaultEconomicConfig: EconomicConfig = {
  id: 'local',
  player_share_percentage: 70,
  platform_share_percentage: 20,
  jackpot_share_percentage: 10,
  base_return_rate: 0.01,
  max_win_multiplier: 15,
  jackpot_trigger_rate: 0.001,
};

export function useGameEconomics() {
  const [economicConfig, setEconomicConfig] = useState<EconomicConfig | null>(null);
  const [activeBatch, setActiveBatch] = useState<GameBatch | null>(null);
  const [jackpotPool, setJackpotPool] = useState<JackpotPool | null>(null);

  // Fetch economic configuration
  const fetchEconomicConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('economic_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching economic config:', error);
      setEconomicConfig(defaultEconomicConfig);
      return defaultEconomicConfig;
    }
    
    setEconomicConfig(data);
    return data;
  }, []);

  // Update economic configuration
  const updateEconomicConfig = useCallback(async (config: Partial<EconomicConfig>) => {
    if (!economicConfig) return null;

    const { data, error } = await supabase
      .from('economic_config')
      .update(config)
      .eq('id', economicConfig.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating economic config:', error);
      return null;
    }

    setEconomicConfig(data);
    return data;
  }, [economicConfig]);

  // Fetch active batch
  const fetchActiveBatch = useCallback(async () => {
    const { data, error } = await supabase
      .from('game_batches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active batch:', error);
      return null;
    }
    
    setActiveBatch(data);
    return data;
  }, []);

  // Fetch all batches
  const fetchAllBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('game_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
    
    return data || [];
  }, []);

  // Fetch jackpot pool
  const fetchJackpotPool = useCallback(async () => {
    const { data, error } = await supabase
      .from('jackpot_pool')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching jackpot pool:', error);
      return null;
    }
    
    setJackpotPool(data);
    return data;
  }, []);

  // Generate smart algorithm for pre-generating games
  const generateGameBatch = useCallback(async (
    batchName: string, 
    totalGames: number, 
    averageBetAmount: number
  ): Promise<GameBatch | null> => {
    if (!economicConfig) {
      console.error('Economic config not loaded');
      return null;
    }

    const totalInvestment = totalGames * averageBetAmount;
    const playerPayoutTarget = totalInvestment * (economicConfig.player_share_percentage / 100);
    const platformRevenueTarget = totalInvestment * (economicConfig.platform_share_percentage / 100);
    const jackpotContributionTarget = totalInvestment * (economicConfig.jackpot_share_percentage / 100);

    // Create the batch
    const { data: batch, error: batchError } = await supabase
      .from('game_batches')
      .insert({
        batch_name: batchName,
        total_games: totalGames,
        total_investment: totalInvestment,
        player_payout_target: playerPayoutTarget,
        platform_revenue_target: platformRevenueTarget,
        jackpot_contribution_target: jackpotContributionTarget,
        is_active: false
      })
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      return null;
    }

    // Generate individual games using sophisticated algorithm
    const games = generateSmartGameDistribution(
      batch.id,
      totalGames,
      averageBetAmount,
      playerPayoutTarget,
      economicConfig
    );

    // Insert all games
    const { error: gamesError } = await supabase
      .from('pre_generated_games')
      .insert(games);

    if (gamesError) {
      console.error('Error inserting games:', gamesError);
      return null;
    }

    return batch;
  }, [economicConfig]);

  // Activate a batch
  const activateBatch = useCallback(async (batchId: string) => {
    // Deactivate current batch
    if (activeBatch) {
      await supabase
        .from('game_batches')
        .update({ is_active: false })
        .eq('id', activeBatch.id);
    }

    // Activate new batch
    const { data, error } = await supabase
      .from('game_batches')
      .update({ is_active: true })
      .eq('id', batchId)
      .select()
      .single();

    if (error) {
      console.error('Error activating batch:', error);
      return null;
    }

    setActiveBatch(data);
    return data;
  }, [activeBatch]);

  // Get next game for a player
  const getNextGame = useCallback(async (
    betAmount: number, 
    playerSkillLevel: number = 5
  ): Promise<PreGeneratedGame | null> => {
    if (!activeBatch) {
      console.error('No active batch');
      return null;
    }

    // Try to find exact match first, then expand search range gradually
    const searchRanges = [
      { minVar: 0.9, maxVar: 1.1 }, // ±10%
      { minVar: 0.7, maxVar: 1.3 }, // ±30%
      { minVar: 0.5, maxVar: 2.0 }, // ±50% to 2x
      { minVar: 0.1, maxVar: 5.0 }  // Very flexible
    ];

    for (const range of searchRanges) {
      const { data, error } = await supabase
        .from('pre_generated_games')
        .select('*')
        .eq('batch_id', activeBatch.id)
        .eq('is_played', false)
        .gte('bet_amount', betAmount * range.minVar)
        .lte('bet_amount', betAmount * range.maxVar)
        .gte('skill_requirement', Math.max(1, playerSkillLevel - 2))
        .lte('skill_requirement', Math.min(10, playerSkillLevel + 2))
        .order('game_index')
        .limit(1)
        .single();

      if (!error && data) {
        return data;
      }
    }

    // If no game found with skill constraint, try without skill constraint
    const { data, error } = await supabase
      .from('pre_generated_games')
      .select('*')
      .eq('batch_id', activeBatch.id)
      .eq('is_played', false)
      .order('game_index')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching next game:', error);
      return null;
    }

    return data;
  }, [activeBatch]);

  // Mark game as played and update results
  const completeGame = useCallback(async (
    gameId: string, 
    actualScore: number, 
    actualPayout: number
  ) => {
    const { error } = await supabase
      .from('pre_generated_games')
      .update({
        is_played: true,
        played_at: new Date().toISOString(),
        actual_score: actualScore,
        actual_payout: actualPayout
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error completing game:', error);
      return false;
    }

    // Update batch statistics
    if (activeBatch) {
      const { error: updateError } = await supabase
        .from('game_batches')
        .update({
          games_played: activeBatch.games_played + 1,
          actual_player_payout: activeBatch.actual_player_payout + actualPayout
        })
        .eq('id', activeBatch.id);

      if (updateError) {
        console.error('Error updating batch stats:', updateError);
      }
    }

    return true;
  }, [activeBatch]);

  return {
    economicConfig,
    activeBatch,
    jackpotPool,
    fetchEconomicConfig,
    updateEconomicConfig,
    fetchActiveBatch,
    fetchAllBatches,
    fetchJackpotPool,
    generateGameBatch,
    activateBatch,
    getNextGame,
    completeGame
  };
}

// Smart algorithm for generating balanced game distribution
function generateSmartGameDistribution(
  batchId: string,
  totalGames: number,
  averageBetAmount: number,
  targetPayout: number,
  economicConfig: EconomicConfig
): Omit<PreGeneratedGame, 'id'>[] {
  const games: Omit<PreGeneratedGame, 'id'>[] = [];
  let remainingPayout = targetPayout;
  
  // Distribution strategy:
  // 60% small wins (1.1x - 2x multiplier)
  // 25% medium wins (2x - 5x multiplier)  
  // 10% big wins (5x - 10x multiplier)
  // 4% huge wins (10x - max multiplier)
  // 1% jackpots
  
  const distributions = [
    { percentage: 0.60, minMultiplier: 1.1, maxMultiplier: 2.0, skillRange: [1, 3] },
    { percentage: 0.25, minMultiplier: 2.0, maxMultiplier: 5.0, skillRange: [3, 6] },
    { percentage: 0.10, minMultiplier: 5.0, maxMultiplier: 10.0, skillRange: [6, 8] },
    { percentage: 0.04, minMultiplier: 10.0, maxMultiplier: economicConfig.max_win_multiplier, skillRange: [8, 10] },
    { percentage: 0.01, minMultiplier: economicConfig.max_win_multiplier * 2, maxMultiplier: economicConfig.max_win_multiplier * 5, skillRange: [9, 10] }
  ];

  for (let i = 0; i < totalGames; i++) {
    // Determine which distribution category this game falls into
    const rand = Math.random();
    let cumulativePercentage = 0;
    let selectedDistribution = distributions[0];
    
    for (const distribution of distributions) {
      cumulativePercentage += distribution.percentage;
      if (rand <= cumulativePercentage) {
        selectedDistribution = distribution;
        break;
      }
    }

    // Generate game parameters
    const betVariance = 0.8 + Math.random() * 0.4; // ±20% bet variance
    const betAmount = averageBetAmount * betVariance;
    
    const isJackpot = selectedDistribution === distributions[4];
    const isWin = Math.random() < 0.7; // 70% win rate overall
    
    let resultType: 'win' | 'loss' | 'jackpot' = 'loss';
    let winMultiplier = 0;
    let expectedPayout = 0;
    let maxAchievableScore = 0;
    
    if (isJackpot) {
      resultType = 'jackpot';
      winMultiplier = selectedDistribution.minMultiplier;
      expectedPayout = betAmount * winMultiplier;
      maxAchievableScore = Math.floor(expectedPayout / economicConfig.base_return_rate);
    } else if (isWin) {
      resultType = 'win';
      winMultiplier = selectedDistribution.minMultiplier + 
        Math.random() * (selectedDistribution.maxMultiplier - selectedDistribution.minMultiplier);
      expectedPayout = Math.min(betAmount * winMultiplier, remainingPayout * 0.1); // Don't exceed remaining budget
      maxAchievableScore = Math.floor(expectedPayout / economicConfig.base_return_rate);
    } else {
      resultType = 'loss';
      expectedPayout = 0;
      maxAchievableScore = Math.floor(betAmount * 0.3 / economicConfig.base_return_rate); // Some consolation points
    }

    // Skill requirement based on potential payout
    const skillRequirement = selectedDistribution.skillRange[0] + 
      Math.floor(Math.random() * (selectedDistribution.skillRange[1] - selectedDistribution.skillRange[0] + 1));

    remainingPayout -= expectedPayout;

    games.push({
      batch_id: batchId,
      game_index: i,
      bet_amount: parseFloat(betAmount.toFixed(2)),
      max_achievable_score: maxAchievableScore,
      result_type: resultType,
      win_multiplier: winMultiplier > 0 ? parseFloat(winMultiplier.toFixed(2)) : undefined,
      expected_payout: parseFloat(expectedPayout.toFixed(2)),
      skill_requirement: skillRequirement,
      is_played: false
    });
  }

  // Shuffle games to make distribution natural
  for (let i = games.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [games[i], games[j]] = [games[j], games[i]];
  }

  // Reassign game indices after shuffle
  games.forEach((game, index) => {
    game.game_index = index;
  });

  return games;
}