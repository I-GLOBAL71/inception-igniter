import { useState, useEffect } from 'react';
import { useGameEconomics, EconomicConfig } from './useGameEconomics';

export interface GameSettings {
  initialSpeed: number;
  speedIncrease: number;
  fastDropMultiplier: number;
  softDropMultiplier: number;
  baseEarningsRate: number;
  volumeLevel: number;
}

export function useGameSettings() {
  const { economicConfig, fetchEconomicConfig } = useGameEconomics();
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEconomicConfig();
  }, [fetchEconomicConfig]);

  useEffect(() => {
    const localSettingsRaw = localStorage.getItem('gameSettings');
    const localSettings = localSettingsRaw ? JSON.parse(localSettingsRaw) : null;

    if (economicConfig && localSettings) {
      setGameSettings({ ...localSettings });
      setIsLoading(false);
    } else if (localSettings) {
      setGameSettings(localSettings);
      setIsLoading(false);
    }

  }, [economicConfig]);

  return { settings: { ...economicConfig, ...gameSettings }, isLoading };
}