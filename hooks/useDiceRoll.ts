import { useState, useCallback } from 'react';
import { DICE_COUNT, MAX_ROLLS } from '../constants/gameConstants';

interface UseDiceRollReturn {
  diceValues: number[];
  heldDice: boolean[];
  rollCount: number;
  rollDice: () => void;
  toggleHold: (index: number) => void;
  resetDice: () => void;
}

export const useDiceRoll = (): UseDiceRollReturn => {
  const [diceValues, setDiceValues] = useState<number[]>(Array(DICE_COUNT).fill(1));
  const [heldDice, setHeldDice] = useState<boolean[]>(Array(DICE_COUNT).fill(false));
  const [rollCount, setRollCount] = useState(0);

  const rollDice = useCallback(() => {
    if (rollCount < MAX_ROLLS) {
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

  const resetDice = useCallback(() => {
    setDiceValues(Array(DICE_COUNT).fill(1));
    setHeldDice(Array(DICE_COUNT).fill(false));
    setRollCount(0);
  }, []);

  return { diceValues, heldDice, rollCount, rollDice, toggleHold, resetDice };
};

