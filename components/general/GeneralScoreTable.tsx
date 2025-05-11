"use client";

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import confetti from 'canvas-confetti';
import { X as LucideX } from 'lucide-react'; // Removed unused icons like Dice, Info, etc.

const hideSpinnerClass = "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface GeneralScoreTableProps { // Renamed interface
  players: string[];
  turnScores: Array<Array<number | null>>;
  playerTotals: number[];
  currentPlayerIndex: number;
  actualCurrentTurnIndex: number; 
  displayedTurnCount: number; 
  currentTurnInput: string;
  gameMessage: string | null; 
  gameOver: boolean; // May be simplified or used for a manual "end game" state
  onInputChange: (value: string) => void;
  onBankScore: () => void; // This will be the generic "submit score for turn"

  // Score editing props (can be kept)
  onEditBankedScore: (playerIndex: number, turnIndex: number) => void;
  showConfirmModal: boolean;
  onConfirmScoreChange: () => void; 
  onCancelScoreEdit: () => void; 
  editModalValue: string;
  onEditModalValueChange: (value: string) => void;
  selectedCellToEdit: { playerIndex: number; turnIndex: number; currentValue: number | null } | null;

  // Props for a simplified "Game Over" or summary modal (if kept)
  showFinalTallyModal?: boolean;
  winningPlayerName?: string | null; // Or just highest scorer
  onCloseFinalTallyModal?: () => void;
}

export const GeneralScoreTable: React.FC<GeneralScoreTableProps> = ({ // Renamed component
  players,
  turnScores,
  playerTotals,
  currentPlayerIndex,
  actualCurrentTurnIndex,
  displayedTurnCount,
  currentTurnInput,
  gameMessage, // Keep for general messages
  gameOver,
  onInputChange,
  onBankScore, // This is the generic submit turn score function

  onEditBankedScore,
  showConfirmModal,
  onConfirmScoreChange,
  onCancelScoreEdit,
  editModalValue,
  onEditModalValueChange,
  selectedCellToEdit,

  // Simplified modal props
  showFinalTallyModal,
  winningPlayerName, 
  onCloseFinalTallyModal,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable div

  // Confetti effect for winning/game end (can be kept if desired for a general summary)
  useEffect(() => {
    if (showFinalTallyModal && winningPlayerName) { // Or just if showFinalTallyModal is true
      // @ts-ignore
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
  }, [showFinalTallyModal, winningPlayerName]);

  useEffect(() => {
    if (showConfirmModal && confirmInputRef.current) {
      confirmInputRef.current.focus();
      confirmInputRef.current.select();
    }
  }, [showConfirmModal]);

  useEffect(() => {
    if (scrollContainerRef.current && players.length > 0 && currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
      const namesColHeader = document.getElementById('names-column-header') as HTMLElement | null;
      const currentPlayerHeaderId = `player-col-header-${currentPlayerIndex}`;
      const currentPlayerHeaderElement = document.getElementById(currentPlayerHeaderId) as HTMLElement | null;

      if (namesColHeader && currentPlayerHeaderElement) {
        const namesColumnWidth = namesColHeader.offsetWidth;
        let scrollTarget = currentPlayerHeaderElement.offsetLeft - namesColumnWidth;
        
        // Ensure scrollTarget is not negative. If player is in the first few columns already visible, 
        // we might not need to scroll, or scroll to 0 if it's the very first player column.
        // This also handles the case for the first actual player column if its offsetLeft is less than namesColumnWidth (it shouldn't be).
        scrollTarget = Math.max(0, scrollTarget);

        // Using setTimeout to ensure other DOM updates potentially affecting offsetLeft/offsetWidth are settled
        setTimeout(() => {
          if(scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollTarget;
          }
        }, 0);
      }
    }
  }, [currentPlayerIndex, players]); // Re-run when currentPlayerIndex or players array changes

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!gameOver && currentTurnInput && parseInt(currentTurnInput, 10) >= 0) {
        onBankScore(); // Call the passed generic submit function
      }
    }
  };

  const handleInputBlur = () => {
    if (!showConfirmModal && !gameOver && currentTurnInput.trim() !== '' && parseInt(currentTurnInput, 10) >= 0) {
      onBankScore(); // Call the passed generic submit function
    }
  };

  return (
    <>
      <div ref={scrollContainerRef} className="overflow-x-auto relative pb-4 w-full">
        <table className="w-full border-collapse rounded-lg">
          <thead className={`sticky z-20 top-0`}> 
            <tr className="bg-blue-600 text-white">
              <th id="names-column-header" className="p-2 sm:p-3 text-left sticky left-0 z-20 bg-blue-600 min-w-[100px] sm:min-w-[160px] border-r border-blue-500 rounded-tl-lg">
                <span className="px-2 py-1 font-semibold text-sm sm:text-base">Names</span>
              </th>
              {players.map((player, index) => (
                <th 
                    id={`player-col-header-${index}`}
                    key={index} 
                    className={`p-2 sm:p-3 text-center min-w-[80px] sm:min-w-[100px] border-r border-blue-500 ${
                  index === players.length - 1 ? 'border-r-0 rounded-tr-lg' : ''
                } ${
                  index === currentPlayerIndex && !gameOver ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-semibold text-sm sm:text-base break-words">{player}</span>
                    <span className="block text-[10px] sm:text-xs opacity-90 font-normal">
                        Total: {playerTotals[index]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="font-mono">
            {Array.from({ length: displayedTurnCount }).map((_, turnIndex) => {
              const turnNumber = turnIndex + 1;
              return (
                <tr key={`turn-${turnIndex}`} className={`${turnIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100`}>
                  <td className={`p-2 text-left sticky left-0 z-[25] font-semibold border-r border-gray-100 ${turnIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} flex justify-between items-center`}>
                    <span>Turn {turnNumber}</span>
                  </td>
                  {players.map((_, playerIdx) => {
                    const isCurrentPlayerCell = playerIdx === currentPlayerIndex;
                    const isCurrentTurnCell = turnIndex === actualCurrentTurnIndex;
                    const isActiveInputCell = isCurrentPlayerCell && isCurrentTurnCell && !gameOver;
                    const cellScoreValue = turnScores[playerIdx]?.[turnIndex];
                    const canEditCell = cellScoreValue !== null && cellScoreValue !== undefined && !isActiveInputCell && !gameOver;
                    
                    // Simplified renderAsLiveInput for general scorecard (always manual)
                    const renderAsLiveInput = isActiveInputCell && !showConfirmModal;

                    return (
                      <td 
                        key={`score-${turnIndex}-${playerIdx}`} 
                        className={`p-2 text-center border-r border-gray-100 ${playerIdx === players.length -1 ? 'border-r-0' : ''} relative ${
                          isCurrentPlayerCell && !gameOver ? 'bg-red-50' : '' 
                        }`}
                        onClick={() => {
                          if (canEditCell) {
                            onEditBankedScore(playerIdx, turnIndex);
                          }
                        }}
                      >
                        {renderAsLiveInput ? (
                          <Input
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={currentTurnInput}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleInputBlur}
                            className={`w-full h-full text-center text-lg p-1 border-2 ${hideSpinnerClass} ${
                              parseInt(currentTurnInput, 10) === 0 && currentTurnInput.length > 0
                                ? 'border-red-500 focus:border-red-700' // Can keep style for 0 input
                                : 'border-blue-300 focus:border-blue-500'
                            } !bg-white rounded-md shadow-inner`}
                            placeholder="0"
                            autoFocus
                            min="0"
                          />
                        ) : cellScoreValue !== null && cellScoreValue !== undefined ? (
                          <span 
                            className={`${canEditCell ? 'cursor-pointer hover:bg-yellow-100 p-1 rounded' : ''} ${cellScoreValue === 0 ? 'text-gray-500' : ''}`}
                            onClick={canEditCell ? () => onEditBankedScore(playerIdx, turnIndex) : undefined}
                          >
                            {cellScoreValue}
                          </span>
                        ) : (
                          <span className="text-gray-300"></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="bg-blue-700 text-white font-bold text-lg sticky bottom-0 z-20">
              <td className="p-2 sm:p-3 text-left sticky left-0 z-[25] bg-blue-700 border-r border-blue-500 rounded-bl-lg">TOTAL</td>
              {players.map((_, playerIdx) => (
                <td key={`total-${playerIdx}`} className={`p-2 sm:p-3 text-center border-r border-blue-500 ${playerIdx === players.length -1 ? 'border-r-0 rounded-br-lg' : ''}`}>
                  {playerTotals[playerIdx]}
                  {/* Optional: Display a trophy if gameOver is true and this player is the winner/highest scorer */}
                  {gameOver && winningPlayerName === players[playerIdx] && <span className="ml-1">🏆</span>} 
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Simplified Final Tally Modal */}
        <AnimatePresence>
          {showFinalTallyModal && onCloseFinalTallyModal && (
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
                <h2 className="text-3xl font-bold mb-4 text-blue-700">🎉 Scores Tallied!</h2>
                {winningPlayerName && (
                    <p className="text-xl mb-2 text-gray-700">
                        {winningPlayerName} has the highest score!
                    </p>
                )}
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
                  onClick={onCloseFinalTallyModal} // Use the passed function
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150"
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Change Confirmation Modal (Structure remains) */}
        <AnimatePresence>
          {showConfirmModal && selectedCellToEdit && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4" onClick={onCancelScoreEdit}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-red-600 p-5 sm:p-6 rounded-xl shadow-2xl max-w-xs w-full mx-auto border-2 border-red-400" onClick={(e) => e.stopPropagation()}>
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
                    ref={confirmInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={editModalValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
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
                  />
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button onClick={onCancelScoreEdit} className="flex-1 bg-gray-100 text-red-700 hover:bg-red-100 rounded-md py-2.5 px-4 text-sm sm:text-base font-medium border border-gray-300 hover:border-red-300 transition-colors duration-150 shadow-sm">
                      Keep ({selectedCellToEdit?.currentValue ?? 'N/A'})
                    </Button>
                    <Button onClick={onConfirmScoreChange} className="flex-1 bg-red-700 text-white hover:bg-red-800 rounded-md py-2.5 px-4 text-sm sm:text-base font-semibold border border-red-500 hover:border-red-600 transition-colors duration-150 shadow-sm" disabled={editModalValue.trim() === '' || parseInt(editModalValue, 10) < 0 || isNaN(parseInt(editModalValue, 10))}>
                      Save ({editModalValue || '0'})
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}; 