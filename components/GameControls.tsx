import React from 'react';
import { Button } from '@/components/ui/button';
import { Dice } from './Dice';
import { useTheme } from './ThemeProvider';

interface GameControlsProps {
  diceValues: number[];
  heldDice: boolean[];
  rollCount: number;
  rollDice: () => void;
  toggleHold: (index: number) => void;
  isRolling: boolean;
  disabled: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  diceValues,
  heldDice,
  rollCount,
  rollDice,
  toggleHold,
  isRolling,
  disabled,
}) => {
  const { isJerryGame, isMernGame } = useTheme();

  return (
    <div className="mb-6">
      <div className="grid grid-cols-5 gap-2 mb-4">
        {diceValues.map((value, index) => (
          <Dice
            key={index}
            value={value}
            isHeld={heldDice[index]}
            isRolling={isRolling}
            onClick={() => toggleHold(index)}
            isJerryGame={isJerryGame}
            isMernGame={isMernGame}
          />
        ))}
      </div>
      <Button
        onClick={rollDice}
        disabled={rollCount >= 3 || disabled}
        className={`w-full py-2 text-lg font-semibold ${
          isJerryGame
            ? 'bg-blue-600 hover:bg-blue-700'
            : isMernGame
            ? 'bg-pink-600 hover:bg-pink-700'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white rounded-lg`}
      >
        {isRolling ? 'Rolling...' : `Roll Dice (${rollCount + 1}/3)`}
      </Button>
    </div>
  );
};

