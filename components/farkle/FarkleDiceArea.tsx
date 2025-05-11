"use client";

import React from 'react';
// import { motion } from 'framer-motion'; // Linter: 'motion' is defined but never used.
import { Dice } from '../Dice'; // Assuming Dice.tsx is in the parent components folder
import { Button } from '@/components/ui/button'; // Import Button

// Define PlayerState locally or import if defined globally
// Minimal definition needed for button logic
interface MinimalPlayerState {
  isOnBoard: boolean;
  // Add other fields if needed by more complex button logic later
}

interface FarkleDiceAreaProps {
  diceValues: number[]; // Expecting an array of 6 numbers
  diceStates?: Array<'available' | 'held'>; // State for visual feedback (held)
  onToggleHold: (index: number) => void; // Function to handle clicking a die
  isRolling: boolean;

  // Props for moved buttons - Make these optional with ?
  handleRollDice?: () => void;
  handleBankScore?: () => void;
  isFarkle?: boolean;
  gameOver?: boolean;
  mustSelectDie?: boolean;
  currentTurnTotal?: number;
  playerStates?: MinimalPlayerState[]; // Use minimal interface or import full
  currentPlayerIndex?: number;
  MINIMUM_TO_GET_ON_BOARD?: number;
  finalRoundTriggeredBy?: number | null;
  playersCompletedFinalRound?: boolean[];
  canRollHotDice?: boolean; // Add prop for hot dice
  isComputerThinking?: boolean; // Added prop for AI turn
}

export const FarkleDiceArea: React.FC<FarkleDiceAreaProps> = ({
  diceValues,
  diceStates = [], // Default to empty array if not provided
  onToggleHold,
  isRolling,
  // Destructure button props with defaults
  handleRollDice = () => {},
  handleBankScore = () => {},
  isFarkle = false,
  gameOver = false,
  mustSelectDie = false,
  currentTurnTotal = 0,
  playerStates = [],
  currentPlayerIndex = 0,
  MINIMUM_TO_GET_ON_BOARD = 500,
  finalRoundTriggeredBy = null,
  playersCompletedFinalRound = [],
  canRollHotDice = false, // Destructure prop
  isComputerThinking = false // Destructure and default to false
}) => {

  // Ensure diceValues has length 6 for rendering, provide defaults if not
  const displayDice = Array.from({ length: 6 }).map((_, i) => diceValues[i] ?? 1);
  const displayStates = Array.from({ length: 6 }).map((_, i) => diceStates[i] ?? 'available');

  // Determine if bank button should be disabled based on board status and minimum
  const currentPlayerState = playerStates[currentPlayerIndex];
  const canBankScore = !isComputerThinking && // Disable if AI is thinking
                       !isRolling && !isFarkle && !gameOver && !mustSelectDie && currentTurnTotal > 0 && 
                       (currentPlayerState?.isOnBoard || currentTurnTotal >= MINIMUM_TO_GET_ON_BOARD) &&
                       !(finalRoundTriggeredBy !== null && playersCompletedFinalRound[currentPlayerIndex]);

  // Determine if roll button should be disabled
  const canRollNormally = !isComputerThinking && // Disable if AI is thinking
                          !isRolling && !isFarkle && !gameOver && !mustSelectDie && 
                          !(finalRoundTriggeredBy !== null && playersCompletedFinalRound[currentPlayerIndex]);


  return (
    <div className="rounded-lg border border-gray-200 shadow-sm w-full max-w-2xl flex flex-col bg-white overflow-hidden">
      {/* Title Bar */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-lg">
        <h2 className="font-semibold text-lg">Dice Roller</h2>
        {/* Placeholder for a potential collapse/expand icon if desired later */}
      </div>

      {/* Content Area (dice + buttons) */}
      <div className="p-4 flex flex-col items-center">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 md:gap-4 py-4 w-full justify-items-center">
          {displayDice.map((value, index) => {
            // The dieSizeClasses variable and passing it to className is removed.
            // Instead, we pass the sizeVariant prop to the Dice component.
            return (
              <Dice
                key={index}
                value={value}
                isHeld={displayStates[index] === 'held'} 
                isRolling={isRolling && displayStates[index] !== 'held'} // Only animate non-held dice
                onClick={() => onToggleHold(index)}
                isJerryGame={false} 
                isMernGame={false}
                sizeVariant="farkle" // Pass the "farkle" size variant
              />
            );
          })}
        </div>
        {/* --- Moved Buttons --- */}
        <div className="flex space-x-3 mt-4 mb-2"> { /* Added margin */ }
          <Button 
            onClick={handleRollDice} 
            disabled={isComputerThinking || !(canRollNormally || canRollHotDice)} // Updated: Disable if AI thinking or other conditions
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {canRollHotDice ? 'Roll Hot Dice!' : 'Roll Dice'} {/* Update button text */}
          </Button>
          <Button 
            onClick={handleBankScore} 
            disabled={isComputerThinking || !canBankScore} // Updated: Disable if AI thinking or other conditions
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Bank Score
          </Button>
        </div>
        {/* --- End Moved Buttons --- */}
      </div>
    </div>
  );
}; 