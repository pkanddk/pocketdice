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
  currentGlobalTurn: number; // Renamed from actualCurrentTurnIndex
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
  isComputerThinking?: boolean; // Added prop
  showFinalRoundModal?: boolean; // Added prop for the main modal state
}

export const FarkleScoreTable: React.FC<FarkleScoreTableProps> = ({
  players,
  turnScores,
  playerTotals,
  isPlayerOnBoard,
  currentPlayerIndex,
  currentGlobalTurn,
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
  isComputerThinking,
  showFinalRoundModal,
}) => {
  // --- Add Log --- 
  // console.log("[FarkleScoreTable] Received props: turnScores:", JSON.stringify(turnScores), " liveTurnScore:", liveTurnScore, " isFarkleTurn:", isFarkleTurn, " scoreEntryMode: ", scoreEntryMode);
  // --------------- 

  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null); // Ref for modal input
  const scrollContainerRef = useRef<HTMLDivElement>(null); // ADDED: Ref for the scrollable div

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

  // ADDED: useEffect for smart horizontal scrolling
  useEffect(() => {
    if (scrollContainerRef.current && players.length > 0 && currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
      const scrollContainer = scrollContainerRef.current;
      const namesColHeader = document.getElementById('farkle-rules-header') as HTMLElement | null; // Use the ID of the first sticky header
      const currentPlayerHeaderId = `farkle-player-col-header-${currentPlayerIndex}`;
      const currentPlayerHeaderElement = document.getElementById(currentPlayerHeaderId) as HTMLElement | null;

      if (namesColHeader && currentPlayerHeaderElement) {
        // Scroll fully left if it's the first player's turn
        if (currentPlayerIndex === 0) {
          setTimeout(() => {
            scrollContainer.scrollLeft = 0;
          }, 0);
          return; // Don't do further calculations for the first player
        }

        const containerWidth = scrollContainer.offsetWidth;
        const currentScrollLeft = scrollContainer.scrollLeft;
        const playerLeft = currentPlayerHeaderElement.offsetLeft;
        const playerWidth = currentPlayerHeaderElement.offsetWidth;
        const playerRight = playerLeft + playerWidth;

        const visibleRightEdge = currentScrollLeft + containerWidth;
        const padding = 20; // Pixels of padding from the right edge

        // Check if the player's right edge is outside the visible area
        if (playerRight > visibleRightEdge - padding) {
          let targetScrollLeft = playerRight - containerWidth + padding;
          targetScrollLeft = Math.max(0, targetScrollLeft);

          if (Math.abs(targetScrollLeft - currentScrollLeft) > 1) {
            setTimeout(() => {
              scrollContainer.scrollLeft = targetScrollLeft;
            }, 0);
          }
        }
      }
    }
  }, [currentPlayerIndex, players]);

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
      <div ref={scrollContainerRef} className="overflow-x-auto relative pb-4 w-full">
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

        {/* REMOVE table-fixed for consistent column widths based on content */}
        <table className="w-full border-collapse rounded-lg">
          {/* Main Sticky Header for Player Names and Rules */}
          <thead className={`sticky z-20 top-0`}> 
            <tr className="bg-blue-600 text-white">
              {/* Use min-w and consistent padding - MATCHING GeneralScoreTable */}
              <th id="farkle-rules-header" className="p-1 sm:p-2 text-left sticky top-0 left-0 z-30 bg-blue-600 min-w-[80px] sm:min-w-[160px] border-r border-blue-500 rounded-tl-lg">
                <Button
                  onClick={onToggleRulesModal}
                  variant="ghost"
                  className={`w-full h-full text-left font-semibold text-xs sm:text-sm flex justify-between items-center text-white hover:text-red-600 transition-colors duration-200 rounded-none ${
                    showRulesModal 
                      ? 'bg-red-600 hover:bg-red-600' 
                      : 'bg-blue-600 hover:bg-blue-600'
                  }`}
                >
                  Game Rules
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </th>
              {players.map((player, index) => (
                <th key={index} 
                    id={`farkle-player-col-header-${index}`}
                    // Use min-w and consistent padding - MATCHING GeneralScoreTable
                    className={`p-1 sm:p-2 text-center min-w-[70px] sm:min-w-[100px] border-r border-blue-500 ${
                  index === players.length - 1 ? 'border-r-0 rounded-tr-lg' : ''
                } ${
                  index === currentPlayerIndex && !gameOver ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  <div className="flex flex-col items-center justify-center">
                    {/* Adjusted font size for player name - MATCHING GeneralScoreTable */}
                    <span className="font-semibold text-xs sm:text-sm break-words">{player}</span>
                    {isPlayerOnBoard[index] ? (
                      // Adjusted font size - MATCHING GeneralScoreTable
                      <span className="block text-[9px] sm:text-xs opacity-90 font-normal">
                        Total: {playerTotals[index]}
                        {index === currentPlayerIndex && liveTurnScore > 0 && !isFarkleTurn &&
                          <span className="ml-1 text-green-300">(+{liveTurnScore})</span>
                        }
                      </span>
                    ) : !gameOver ? (
                      // Adjusted font size - MATCHING GeneralScoreTable
                      <span className="block text-[9px] sm:text-xs opacity-70 font-normal">
                        {index === currentPlayerIndex && liveTurnScore > 0 && !isFarkleTurn
                          ? (liveTurnScore >= minimumToGetOnBoard 
                             ? <span className="text-green-300">Score: {liveTurnScore}</span> 
                             : `(${minimumToGetOnBoard - liveTurnScore} to board)`)
                          : `(${minimumToGetOnBoard} to board)`}
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
                  {/* Adjust padding - MATCHING GeneralScoreTable */}
                  <td className={`p-1 sm:p-2 text-xs sm:text-sm text-left sticky left-0 z-20 font-semibold ${turnIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span>Turn {turnNumber}</span>
                  </td>
                  {players.map((_, playerIdx) => {
                    const isCurrentPlayerCell = playerIdx === currentPlayerIndex;
                    const isCurrentTurnCell = turnIndex === currentGlobalTurn;
                    // const isActiveInputCellFramework = isCurrentPlayerCell && isCurrentTurnCell && !gameOver; // Removed logging variable
                    
                    // --- Add Cell Log --- 
                    // console.log(`Cell: P${playerIdx}, T${turnIndex}`, {
                    //   isCurrentPlayerCell: isCurrentPlayerCell,
                    //   isCurrentTurnCell: isCurrentTurnCell,
                    //   pIdx: playerIdx,
                    //   cpIdx: currentPlayerIndex,
                    //   tIdx: turnIndex,
                    //   actualCurrentTIdx: actualCurrentTurnIndex,
                    //   gameOver: gameOver,
                    //   showFinalRoundModal: showFinalRoundModal,
                    //   scoreEntryMode: scoreEntryMode,
                    //   playersPIdxName: players[playerIdx]
                    // });
                    
                    const isActiveInputCell = isCurrentPlayerCell && isCurrentTurnCell && !gameOver; // Proper declaration for use

                    const cellScoreValue = turnScores[playerIdx]?.[turnIndex];
                    const canEditCell = cellScoreValue !== null && cellScoreValue !== undefined && !isActiveInputCell && !gameOver;

                    const renderAsLiveInput = isActiveInputCell && 
                                              !showFinalRoundModal && 
                                              (scoreEntryMode === 'manual' || 
                                               (players[playerIdx] !== 'Computer') || 
                                               (players[playerIdx] === 'Computer' && isComputerThinking));

                    // console.log(`Cell: P${playerIdx}, T${turnIndex} - isActiveInputCell: ${isActiveInputCell}, renderAsLiveInput: ${renderAsLiveInput}, player: ${players[playerIdx]}, scoreEntryMode: ${scoreEntryMode}`);

                    return (
                      <td 
                        key={`score-${turnIndex}-${playerIdx}`} 
                        // Adjusted padding to p-2 to match GeneralScoreTable, and text size
                        className={`p-2 text-xs sm:text-sm text-center border-r border-gray-100 ${playerIdx === players.length -1 ? 'border-r-0' : ''} ${
                          isActiveInputCell ? 'bg-blue-50' : // Simple highlighting
                          isCurrentPlayerCell && !gameOver ? 'bg-red-50' : '' 
                        }`}
                        onClick={() => {
                          if (canEditCell) {
                            onEditBankedScore(playerIdx, turnIndex);
                          } else if (isActiveInputCell) {
                            // Focus the input when clicking on the active cell
                            if (inputRef.current) {
                              inputRef.current.focus();
                            }
                          }
                        }}
                        style={{ 
                          cursor: isActiveInputCell || canEditCell ? 'pointer' : 'default'
                        }}
                      >
                        {renderAsLiveInput ? (
                          <Input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={currentTurnInput}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleInputBlur}
                            className={`w-full h-full text-center text-base sm:text-lg p-1 border ${hideSpinnerClass} 
                              bg-white rounded-md
                              ${parseInt(currentTurnInput, 10) === 0 && currentTurnInput.length > 0
                                ? 'border-red-400 focus:border-red-600'
                                : 'border-blue-300 focus:border-blue-500'}`}
                            placeholder="0"
                            autoFocus
                            min="0"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.currentTarget.focus();
                            }}
                          />
                        ) : cellScoreValue !== null && cellScoreValue !== undefined ? (
                          <span 
                            className={`${canEditCell ? 'cursor-pointer hover:bg-yellow-100 p-1 rounded' : ''} ${cellScoreValue === 0 ? 'text-orange-500 font-semibold' : ''}`}
                            onClick={canEditCell ? () => onEditBankedScore(playerIdx, turnIndex) : undefined}
                          >
                            {cellScoreValue === 0 ? 'F#*KLED!' : cellScoreValue}
                          </span>
                        ) : (
                          <span className="text-gray-300"></span> // Empty or future placeholder
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Total Scores Row */}
            <tr className="bg-blue-700 text-white font-bold text-base sm:text-lg sticky bottom-0 z-20">
              <td className="p-1 sm:p-2 text-left sticky left-0 z-30 bg-blue-700 border-r border-blue-500 rounded-bl-lg">TOTAL</td>
              {players.map((_, playerIdx) => (
                <td key={`total-${playerIdx}`} className={`p-1 sm:p-2 text-center border-r border-blue-500 ${playerIdx === players.length -1 ? 'border-r-0 rounded-br-lg' : ''}`}>
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
            
            // --- MODIFIED LOGIC START ---
            let loserScore = 0;
            let finalMessage = "";
            const isPvCGame = players.some(p => p === "Computer");

            if (isPvCGame && players.length === 2) {
              // Specific PvC logic (keep existing detailed message)
              const computerName = "Computer";
              const humanName = players.find(p => p !== computerName) ?? "Human";
              const humanScore = playerTotals[players.indexOf(humanName)] ?? 0;
              const computerScore = playerTotals[players.indexOf(computerName)] ?? 0;

              if (winningPlayerName === computerName) {
                loserScore = humanScore;
                const marginOfVictory = computerScore - loserScore;
                finalMessage = `${computerName} wins over ${humanName} by ${marginOfVictory} points! Maybe try less silliness next time?`;
              } else { // Human wins
                loserScore = computerScore;
                const marginOfVictory = humanScore - loserScore;
                finalMessage = `Smarty pants ${humanName} wins over ${computerName} by ${marginOfVictory} points! Well done!`;
              }
              // Handle PvC tie
              if (winnerScore === loserScore) { 
                 finalMessage = `It's a tie between ${humanName} and ${computerName} at ${winnerScore} points! This calls for a tie-breaker!`;
              }

            } else {
              // Generic Scorecard / Multi-Player Logic
              if (players.length > 1) {
                // Find highest score among losers for potential margin, though not strictly needed for simple message
                 loserScore = Math.max(...playerTotals.filter((_, i) => i !== winnerIndex));
                 if (winnerScore === loserScore) {
                     // Find all players tied at the winning score
                     const tiedWinners = players.filter((_, i) => playerTotals[i] === winnerScore);
                     if (tiedWinners.length > 1) {
                        finalMessage = `It's a tie between ${tiedWinners.join(' and ')} at ${winnerScore} points! Amazing!`;
                     } else {
                        // Should not happen if winnerScore === loserScore but only one winner found, but fallback:
                        finalMessage = `Congratulations, ${winningPlayerName}! You won with ${winnerScore} points!`;
                     }
                 } else {
                    finalMessage = `🎉 Hooray for ${winningPlayerName}! You won with ${winnerScore} points! 🎉`;
                 }
              } else { // Single player game (shouldn't happen in scorecard, but safe fallback)
                 finalMessage = `Game complete! ${winningPlayerName} finished with ${winnerScore} points!`;
              }
            }
            // --- MODIFIED LOGIC END ---

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
