import { useState, useEffect } from 'react';

interface AppSettings {
  darkMode: boolean;
  soundEffects: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  soundEffects: true,
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const storedSettings = localStorage.getItem('yahtzeeSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('yahtzeeSettings', JSON.stringify(newSettings));
  };

  return { settings, updateSetting };
};

