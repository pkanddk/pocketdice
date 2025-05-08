"use client";

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion'; // For modal
// @ts-ignore - Suppress canvas-confetti type error for now
import confetti from 'canvas-confetti'; // For winner celebration
import { ChevronUp, ChevronDown, X as LucideX, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Info } from 'lucide-react';
import { FarkleRulesDisplay } from './FarkleRulesDisplay'; // Import the new rules display component

const hideSpinnerClass = "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface FarkleScoreTableProps {
  players: string[];
  turnScores: Array<Array<number | null>>;
  playerTotals: number[];
  isPlayerOnBoard: boolean[]; // Added
  currentPlayerIndex: number;
  actualCurrentTurnIndex: number; // Added
  displayedTurnCount: number; // New prop for dynamic turn display
  currentTurnInput: string;
  gameMessage: string | null; // Added
  gameOver: boolean; // Added
  onInputChange: (value: string) => void;
  onBankScore: () => void;
  minimumToGetOnBoard: number; // Added
  winningScore: number; // Added
  showFinalTallyModal: boolean; // Added
  winningPlayerName: string | null; // Added
  onCloseFinalTallyModal: () => void; // Added
  showRulesModal: boolean; // Added
  onToggleRulesModal: () => void; // Added
  // showRules, setShowRules to be added later for a rules modal

  // Add missing props for live score display
  liveTurnScore: number;
  isFarkleTurn: boolean;

  // Props for score change confirmation modal
  onEditBankedScore: (playerIndex: number, turnIndex: number) => void;
  showConfirmModal: boolean;
  onConfirmScoreChange: () => void; // Confirms using the value in editModalValue
  onCancelScoreEdit: () => void; // Cancels, or can be used for "Keep Current"
  editModalValue: string;
  onEditModalValueChange: (value: string) => void;
  selectedCellToEdit: { playerIndex: number; turnIndex: number; currentValue: number | null } | null;

  // Props for Final Round Initiation Notice Modal
  showFinalRoundInitiationNotice: boolean;
  finalRoundInitiationMessage: string | null;
  onDismissFinalRoundInitiationNotice: () => void;
  scoreEntryMode?: 'manual' | 'auto'; // New prop for input mode
}

export const FarkleScoreTable: React.FC<FarkleScoreTableProps> = ({
  players,
  turnScores,
  playerTotals,
  isPlayerOnBoard,
  currentPlayerIndex,
  actualCurrentTurnIndex,
  displayedTurnCount,
  currentTurnInput,
  gameMessage,
  gameOver,
  onInputChange,
  onBankScore,
  minimumToGetOnBoard,
  winningScore,
  showFinalTallyModal,
  winningPlayerName,
  onCloseFinalTallyModal,
  showRulesModal,
  onToggleRulesModal,
  // Destructure new props for score editing
  onEditBankedScore,
  showConfirmModal,
  onConfirmScoreChange,
  onCancelScoreEdit,
  editModalValue,
  onEditModalValueChange,
  selectedCellToEdit,
  // Destructure props for Final Round Initiation Notice Modal
  showFinalRoundInitiationNotice,
  finalRoundInitiationMessage,
  onDismissFinalRoundInitiationNotice,
  // Add missing props for live score display
  liveTurnScore,
  isFarkleTurn,
  scoreEntryMode = 'auto', // Default to auto if not specified
}) => {
  // --- Add Log --- 
  console.log("[FarkleScoreTable] Received props: turnScores:", JSON.stringify(turnScores), " liveTurnScore:", liveTurnScore, " isFarkleTurn:", isFarkleTurn, " scoreEntryMode: ", scoreEntryMode);
  // --------------- 

  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null); // Ref for modal input

  useEffect(() => {
    if (showFinalTallyModal && winningPlayerName) {
      // @ts-ignore
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
  }, [showFinalTallyModal, winningPlayerName]);

  useEffect(() => {
    // Focus input inside confirm modal when it appears
    if (showConfirmModal && confirmInputRef.current) {
      confirmInputRef.current.focus();
      confirmInputRef.current.select(); // Select text for easy replacement
    }
  }, [showConfirmModal]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!gameOver && currentTurnInput && parseInt(currentTurnInput, 10) >= 0) {
        onBankScore();
      }
    }
  };

  const handleInputBlur = () => {
    // Only bank if not showing confirm modal, to prevent double actions
    // And only if currentTurnInput has a value that could be banked
    if (!showConfirmModal && !gameOver && currentTurnInput.trim() !== '' && parseInt(currentTurnInput, 10) >= 0) {
      onBankScore(); 
    }
  };

  return (
    <>
      {/* Scrollable Table Area - container for the whole table and its sticky parts */}
      <div className="overflow-x-auto relative pb-4 w-full">
        {/* Rules Modal - Kept outside the table, positioned fixed as before */}
        <AnimatePresence>
          {showRulesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
              onClick={onToggleRulesModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: -20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative bg-gray-50 p-1 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b bg-gray-100 rounded-t-lg">
                  <h2 className="text-xl font-semibold text-gray-700">F#*KLE Rules</h2>
                  <Button variant="ghost" size="sm" onClick={onToggleRulesModal} className="text-gray-500 hover:text-gray-800">
                    <LucideX className="h-5 w-5" />
                  </Button>
                </div>
                <div className="overflow-y-auto flex-grow">
                  <FarkleRulesDisplay />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore table-fixed for consistent column widths */}
        <table className="w-full border-collapse table-fixed rounded-lg">
          {/* Main Sticky Header for Player Names and Rules */}
          <thead className={`sticky z-20 top-0`}> 
            <tr className="bg-blue-600 text-white">
              {/* Use min-w and consistent padding */}
              <th className="p-2 sm:p-3 text-left sticky left-0 z-20 bg-blue-600 min-w-[90px] sm:min-w-[160px] border-r border-blue-500 rounded-tl-lg">
                <Button
                  onClick={onToggleRulesModal}
                  variant="ghost"
                  // MODIFIED: Text/icon to red-600 on hover. Background remains consistent.
                  className={`w-full h-full text-left font-semibold text-sm sm:text-base flex justify-between items-center text-white hover:text-red-600 transition-colors duration-200 rounded-none ${
                    showRulesModal 
                      ? 'bg-red-600 hover:bg-red-600' 
                      : 'bg-blue-600 hover:bg-blue-600'
                  }`}
                >
                  Game Rules
                  <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </th>
              {players.map((player, index) => (
                <th key={index} 
                    // Use min-w and consistent padding
                    className={`p-2 sm:p-3 text-center min-w-[70px] sm:min-w-[100px] border-r border-blue-500 ${
                  index === players.length - 1 ? 'border-r-0 rounded-tr-lg' : ''
                } ${
                  index === currentPlayerIndex && !gameOver ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  <div className="flex flex-col items-center justify-center">
                    {/* Keep adjusted font size for player name */}
                    <span className="font-semibold text-sm sm:text-base break-words">{player}</span>
                    {isPlayerOnBoard[index] ? (
                      <span className="block text-[10px] sm:text-xs opacity-90 font-normal">
                        Total: {playerTotals[index]}
                      </span>
                    ) : !gameOver ? (
                      <span className="block text-[10px] sm:text-xs opacity-70 font-normal">
                        ({minimumToGetOnBoard} to board)
                      </span>
                    ) : null} 
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Actual table body starts here */}
          <tbody className="font-mono">
            {/* Remove fixed height h-16 from tr */}
            {Array.from({ length: displayedTurnCount }).map((_, turnIndex) => {
              const turnNumber = turnIndex + 1;

              return (
                <tr key={`turn-${turnIndex}`} className={`${turnIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100`}>
                  {/* Adjust padding, remove fixed height */}
                  <td className={`p-2 text-left sticky left-0 z-[5] font-semibold border-r border-gray-100 ${turnIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} flex justify-between items-center`}>
                    <span>Turn {turnNumber}</span>
                    <div className="flex items-center">
                      {/* MODIFIED: Always show Dice1 */}
                      <Dice1 className="w-5 h-5 text-blue-600 ml-2" />
                    </div>
                  </td>
                  {players.map((_, playerIdx) => {
                    const isCurrentPlayerCell = playerIdx === currentPlayerIndex;
                    const isCurrentTurnCell = turnIndex === actualCurrentTurnIndex;
                    const isActiveInputCell = isCurrentPlayerCell && isCurrentTurnCell && !gameOver;
                    const cellScoreValue = turnScores[playerIdx]?.[turnIndex];
                    const canEditCell = cellScoreValue !== null && cellScoreValue !== undefined && !isActiveInputCell && !gameOver;

                    // --- Add Cell Log ---
                    if (isActiveInputCell) {
                      console.log(`[FarkleScoreTable Cell Render] Player ${playerIdx}, Turn ${turnIndex + 1}: isActiveInputCell=${isActiveInputCell}, liveTurnScore=${liveTurnScore}, isFarkleTurn=${isFarkleTurn}`);
                    }
                    // ---------------------

                    return (
                      <td 
                        key={`score-${turnIndex}-${playerIdx}`} 
                        // Adjust padding for body cells
                        className={`p-2 text-center border-r border-gray-100 ${playerIdx === players.length -1 ? 'border-r-0' : ''} relative ${
                          isActiveInputCell && scoreEntryMode === 'auto' ? 'bg-white' : // Changed from bg-yellow-100
                          isCurrentPlayerCell && !gameOver ? 'bg-red-50' : '' // Background for non-active cells in current player column
                        }`}
                        onClick={() => {
                          if (canEditCell) {
                            onEditBankedScore(playerIdx, turnIndex);
                          }
                        }}
                      >
                        {
                          isActiveInputCell ? (
                            scoreEntryMode === 'manual' ? (
                              <Input
                                ref={inputRef}
                                type="tel"
                                inputMode="numeric"
                                pattern="\d*"
                                value={currentTurnInput}
                                onChange={(e) => onInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleInputBlur}
                                autoFocus
                                className={`w-full h-full text-center text-lg font-bold ${hideSpinnerClass} bg-white text-blue-600 border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md p-0`}
                              />
                            ) : (
                              // Auto mode (for PvP game)
                              <span className={`block w-full h-full flex items-center justify-center text-lg font-bold py-1 ${isFarkleTurn ? 'text-red-500' : 'text-blue-600'} rounded-md`}>
                                {isFarkleTurn ? 'F#*KLED!' : (liveTurnScore > 0 ? liveTurnScore : '-')}
                              </span>
                            )
                          ) : (
                            // Non-active cell
                            <span className={`block w-full h-full flex items-center justify-center text-lg py-1 ${canEditCell ? 'cursor-pointer hover:bg-yellow-100 rounded-md transition-colors duration-150' : ''}`}>
                               {cellScoreValue === 0 ? <span className="text-red-500 font-bold">F#*KLED!</span> : (cellScoreValue !== null && cellScoreValue !== undefined ? cellScoreValue : '' )}
                            </span>
                          )
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Total Scores Row */}
            <tr className="bg-blue-700 text-white font-bold text-lg sticky bottom-0 z-20">
              <td className="p-2 sm:p-3 text-left sticky left-0 z-[25] bg-blue-700 border-r border-blue-500 rounded-bl-lg">TOTAL</td>
              {players.map((_, playerIdx) => (
                <td key={`total-${playerIdx}`} className={`p-2 sm:p-3 text-center border-r border-blue-500 ${playerIdx === players.length -1 ? 'border-r-0 rounded-br-lg' : ''}`}>
                  {playerTotals[playerIdx]}
                  {gameOver && winningPlayerName === players[playerIdx] && <span className="ml-1">🏆</span>} 
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Final Tally Modal */}
        <AnimatePresence>
          {showFinalTallyModal && winningPlayerName && (() => {
            const winnerIndex = players.indexOf(winningPlayerName);
            const winnerScore = playerTotals[winnerIndex] ?? 0;
            
            let loserScore = 0;
            let humanNameInMsg = "Human"; // General fallback
            let computerNameInMsg = "Computer"; // General fallback

            if (players.length === 2) {
              const p1Name = players[0] ?? "Player 1"; // Provide fallback if undefined
              const p2Name = players[1] ?? "Player 2"; // Provide fallback if undefined
              const p1Score = playerTotals[0] ?? 0;
              const p2Score = playerTotals[1] ?? 0;

              // Determine who is human and who is computer for the message
              if (p1Name === "Computer") {
                computerNameInMsg = p1Name;
                humanNameInMsg = p2Name;
              } else if (p2Name === "Computer") {
                computerNameInMsg = p2Name;
                humanNameInMsg = p1Name;
              } else {
                // If neither is named "Computer", assume p1 is human, p2 is opponent for messaging
                humanNameInMsg = p1Name;
                // computerNameInMsg remains "Computer" or could be p2Name if we want generic opponent
              }

              if (winningPlayerName === p1Name) { // Player 1 is winner
                loserScore = p2Score;
              } else { // Player 2 is winner
                loserScore = p1Score;
              }
            } else if (players.length === 1 && winnerIndex === 0) {
              loserScore = 0; 
              humanNameInMsg = winningPlayerName; // Winner is the only player
              // computerNameInMsg remains default as there's no explicit computer opponent
            } else {
              loserScore = 0;
              // Attempt to find a human and computer name if possible from a larger list
              const foundHuman = players.find(p => p && p !== "Computer");
              if (foundHuman) humanNameInMsg = foundHuman;
              if (players.includes("Computer")) computerNameInMsg = "Computer";
            }

            const marginOfVictory = winnerScore - loserScore;
            let finalMessage = "";

            if (winningPlayerName === computerNameInMsg) { // Check against the identified computer name
              finalMessage = `${computerNameInMsg} wins over ${humanNameInMsg} by ${marginOfVictory} points! Maybe try less silliness next time?`;
            } else {
              finalMessage = `Smarty pants ${winningPlayerName} wins over ${computerNameInMsg} by ${marginOfVictory} points! Well done!`;
            }
            
            if (winnerScore === loserScore && players.length > 1) { 
                 finalMessage = `It's a tie between ${players.join(' and ')} at ${winnerScore} points! This calls for a tie-breaker!`;
            } else if (marginOfVictory < 0 && players.length > 1 ) { 
                finalMessage = `${winningPlayerName} wins with ${winnerScore} points! (Margin may be miscalculated if scores are unusual)`;
            } else if (players.length <=1 && winnerIndex === 0) {
                finalMessage = `${winningPlayerName} finished with ${winnerScore} points!`;
            }

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-auto text-center border-2 border-yellow-400"
                >
                  <h2 className="text-3xl font-bold mb-4 text-blue-700">🎉 Game Over!</h2>
                  <p className="text-xl mb-6 text-gray-700 whitespace-pre-line">
                    {finalMessage}
                  </p>
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto px-2">
                    {players.map((player, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg ${player === winningPlayerName ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50 border border-gray-200'}`}
                      >
                        <span className={`text-lg font-medium ${player === winningPlayerName ? 'text-yellow-700' : 'text-gray-800'}`}>{player}</span>
                        <span className={`font-mono font-bold text-lg ${player === winningPlayerName ? 'text-yellow-700' : 'text-gray-600'}`}>{playerTotals[index]}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={onCloseFinalTallyModal}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150"
                  >
                    Close
                  </Button>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Score Change Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && selectedCellToEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
              onClick={onCancelScoreEdit} // Allow closing by clicking backdrop
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-red-600 p-5 sm:p-6 rounded-xl shadow-2xl max-w-xs w-full mx-auto border-2 border-red-400"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white text-center">Change Score?</h2>
                {selectedCellToEdit && (
                  <>
                    <div className="text-white mb-1 text-xs sm:text-sm">
                      Player: <span className="font-semibold">{players[selectedCellToEdit.playerIndex] ? players[selectedCellToEdit.playerIndex] : 'Error'}</span>
                    </div>
                    <div className="text-white mb-3 text-xs sm:text-sm">
                      Turn {selectedCellToEdit.turnIndex + 1}: Current <span className="font-semibold">{selectedCellToEdit.currentValue ?? 'N/A'}</span>
                    </div>
                  </>
                )}
                
                <div className="flex flex-col space-y-4">
                  <Input
                    ref={confirmInputRef} // Assign ref to modal input
                    type="text" // Keeping type=text here, maybe change later if needed for this specific modal
                    inputMode="numeric"
                    pattern="\d*"
                    value={editModalValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) { // Allow only numbers or empty string
                        onEditModalValueChange(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (editModalValue.trim() !== '' && parseInt(editModalValue, 10) >= 0) {
                          onConfirmScoreChange();
                        }
                      }
                    }}
                    className={`w-full text-center text-lg font-semibold ${hideSpinnerClass} bg-white text-red-700 border-2 border-red-300 focus:border-red-200 focus:ring-2 focus:ring-red-200 focus:outline-none rounded-lg placeholder-gray-400 py-2.5 px-3 shadow-inner`}
                    // autoFocus is handled by useEffect
                  />
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button
                      onClick={onCancelScoreEdit} 
                      className="flex-1 bg-gray-100 text-red-700 hover:bg-red-100 rounded-md py-2.5 px-4 text-sm sm:text-base font-medium border border-gray-300 hover:border-red-300 transition-colors duration-150 shadow-sm"
                    >
                      Keep ({selectedCellToEdit?.currentValue ?? 'N/A'})
                    </Button>
                    <Button
                      onClick={onConfirmScoreChange}
                      className="flex-1 bg-red-700 text-white hover:bg-red-800 rounded-md py-2.5 px-4 text-sm sm:text-base font-semibold border border-red-500 hover:border-red-600 transition-colors duration-150 shadow-sm"
                      disabled={editModalValue.trim() === '' || parseInt(editModalValue, 10) < 0 || isNaN(parseInt(editModalValue, 10))}
                    >
                      Save ({editModalValue || '0'})
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Round Initiation Notice Modal */}
        <AnimatePresence>
        {showFinalRoundInitiationNotice && finalRoundInitiationMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-[70] p-4 pt-20"
            // No onClick on backdrop
          >
            <motion.div
              initial={{ scale: 0.9, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-blue-600 p-6 rounded-xl shadow-2xl max-w-md w-full mx-auto text-center border-2 border-blue-400"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Final Round!</h2>
              <p className="text-white text-lg sm:text-xl mb-6 px-2">
                {finalRoundInitiationMessage}
              </p>
              <Button
                onClick={onDismissFinalRoundInitiationNotice}
                className="w-full bg-white hover:bg-blue-100 text-blue-700 font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150"
              >
                OK, Let's Go!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </>
  );
};
