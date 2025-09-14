import { useState, useEffect } from 'react';
import { useGameEconomics, EconomicConfig } from './useGameEconomics';

export interface GameSettings {
  initialSpeed: number;
  speedIncrease: number;
  fastDropMultiplier: number;
  softDropMultiplier: number;
  baseEarningsRate: number;
  volumeLevel: number;
  // Economic config props
  player_share_percentage?: number;
  platform_share_percentage?: number;
  jackpot_share_percentage?: number;
  base_return_rate?: number;
  max_win_multiplier?: number;
  jackpot_trigger_rate?: number;
}

// Default settings to ensure the game can always start
const defaultSettings: GameSettings = {
  initialSpeed: 1000,
  speedIncrease: 100,
  fastDropMultiplier: 20,
  softDropMultiplier: 2,
  baseEarningsRate: 0.001,
  volumeLevel: 0.5,
  player_share_percentage: 70,
  platform_share_percentage: 20,
  jackpot_share_percentage: 10,
  base_return_rate: 0.001,
  max_win_multiplier: 15,
  jackpot_trigger_rate: 0.001,
};

export function useGameSettings() {
  const { economicConfig, fetchEconomicConfig } = useGameEconomics();
  const [gameSettings, setGameSettings] = useState<GameSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to get local settings
        const localSettingsRaw = localStorage.getItem('gameSettings');
        const localSettings = localSettingsRaw ? JSON.parse(localSettingsRaw) : {};
        
        // Try to get economic config (but don't block if it fails)
        const config = await fetchEconomicConfig();
        
        // Merge all settings with defaults
        const mergedSettings = {
          ...defaultSettings,
          ...config,
          ...localSettings
        };
        
        setGameSettings(mergedSettings);
      } catch (error) {
        console.warn('Failed to load settings, using defaults:', error);
        setGameSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [fetchEconomicConfig]);

  return { settings: gameSettings, isLoading };
}