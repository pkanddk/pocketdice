import { useState, useCallback, useMemo } from 'react';
import { calculatePossibleScores, calculatePlayerTotals } from '../utils/scoreCalculations';
import { TOTAL_CATEGORIES } from '../constants/gameConstants';

interface UseYahtzeeGameProps {
  players: string[];
  isJerryGame: boolean;
  isMernGame: boolean;
}

export const useYahtzeeGame = ({ players, isJerryGame, isMernGame }: UseYahtzeeGameProps) => {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [scores, setScores] = useState<Array<Array<{ value: number | null; locked: boolean }>>>(
    Array(players.length).fill(null).map(() => 
      Array(TOTAL_CATEGORIES).fill(null).map(() => ({ value: null, locked: false }))
    )
  );
  const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1, 1]);
  const [heldDice, setHeldDice] = useState<boolean[]>([false, false, false, false, false]);
  const [rollCount, setRollCount] = useState(0);
  const [finalTally, setFinalTally] = useState(false);

  const possibleScores = useMemo(() => calculatePossibleScores(diceValues, isJerryGame, isMernGame), [diceValues, isJerryGame, isMernGame]);
  const playerTotals = useMemo(() => calculatePlayerTotals(scores), [scores]);

  const rollDice = useCallback(() => {
    if (rollCount < 3) {
      setDiceValues(prev => prev.map((value, index) => 
        heldDice[index] ? value : Math.floor(Math.random() * 6) + 1
      ));
      setRollCount(prev => prev + 1);
    }
  }, [rollCount, heldDice]);

  const toggleHold = useCallback((index: number) => {
    setHeldDice(prev => {
      const newHeldDice = [...prev];
      newHeldDice[index] = !newHeldDice[index];
      return newHeldDice;
    });
  }, []);

  const selectScore = useCallback((categoryIndex: number) => {
    if (rollCount > 0 && possibleScores[categoryIndex] !== null && !scores[currentPlayer][categoryIndex].locked) {
      setScores(prevScores => {
        const newScores = [...prevScores];
        newScores[currentPlayer] = [...newScores[currentPlayer]];
        newScores[currentPlayer][categoryIndex] = { value: possibleScores[categoryIndex], locked: true };
        return newScores;
      });
      setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length);
      setRollCount(0);
      setDiceValues([1, 1, 1, 1, 1]);
      setHeldDice([false, false, false, false, false]);
    }
  }, [rollCount, possibleScores, scores, currentPlayer, players.length]);

  const isGameComplete = useCallback(() => {
    return scores.every(playerScores => playerScores.every(score => score.locked));
  }, [scores]);

  const handleFinalTally = useCallback(() => {
    if (isGameComplete()) {
      setFinalTally(true);
    }
  }, [isGameComplete]);

  return {
    currentPlayer,
    scores,
    diceValues,
    heldDice,
    rollCount,
    finalTally,
    possibleScores,
    playerTotals,
    rollDice,
    toggleHold,
    selectScore,
    handleFinalTally,
    isGameComplete,
  };
};

