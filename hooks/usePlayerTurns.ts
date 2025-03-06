import { useState, useCallback } from 'react';

export const usePlayerTurns = (players: string[]) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const nextTurn = useCallback(() => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  }, [players.length]);

  const resetTurns = useCallback(() => {
    setCurrentPlayerIndex(0);
  }, []);

  return {
    currentPlayer: players[currentPlayerIndex],
    currentPlayerIndex,
    nextTurn,
    resetTurns,
  };
};

