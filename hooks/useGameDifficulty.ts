import { useState, useCallback } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

export const useGameDifficulty = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  }, []);

  return { difficulty, changeDifficulty };
};

