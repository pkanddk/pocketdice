import { useState, useEffect } from 'react';

interface GameResult {
  date: string;
  players: string[];
  scores: number[];
}

export const useGameHistory = () => {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('yahtzeeHistory');
    if (storedHistory) {
      setGameHistory(JSON.parse(storedHistory));
    }
  }, []);

  const saveGameResult = (result: GameResult) => {
    const updatedHistory = [result, ...gameHistory].slice(0, 10); // Keep only the last 10 games
    setGameHistory(updatedHistory);
    localStorage.setItem('yahtzeeHistory', JSON.stringify(updatedHistory));
  };

  const clearGameHistory = () => {
    setGameHistory([]);
    localStorage.removeItem('yahtzeeHistory');
  };

  return { gameHistory, saveGameResult, clearGameHistory };
};

