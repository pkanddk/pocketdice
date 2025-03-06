import { useCallback } from 'react';
import { useAppSettings } from './useAppSettings';

const SOUND_EFFECTS = {
  roll: '/sounds/dice-roll.mp3',
  score: '/sounds/score.mp3',
  win: '/sounds/win.mp3',
};

export const useSoundEffects = () => {
  const { settings } = useAppSettings();

  const playSound = useCallback((soundName: keyof typeof SOUND_EFFECTS) => {
    if (settings.soundEffects) {
      const audio = new Audio(SOUND_EFFECTS[soundName]);
      audio.play();
    }
  }, [settings.soundEffects]);

  return { playSound };
};

