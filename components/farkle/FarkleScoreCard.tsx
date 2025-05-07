"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { FarkleScoreTable } from '../farkle/FarkleScoreTable';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'; // For Reset Game (New Players)
// import { toast } from 'react-hot-toast'; // Removed for now to avoid dependency issues

const MINIMUM_TO_GET_ON_BOARD = 500;
const WINNING_SCORE = 10000;
const INITIAL_TURNS_TO_SHOW = 10; // New: Initial number of turns to display

interface PlayerState {
  scores: Array<number | null>;
  total: number;
  isOnBoard: boolean;
}

interface FarkleScoreCardProps {
  players: string[];
}

// Helper to initialize player state
const initializePlayerState = (): PlayerState => ({
  scores: Array(INITIAL_TURNS_TO_SHOW).fill(null), // Use INITIAL_TURNS_TO_SHOW for initial array size, though it will grow
  total: 0,
  isOnBoard: false,
});

export const FarkleScoreCard: React.FC<FarkleScoreCardProps> = ({ players }) => {
  const router = useRouter();

  const [playerStates, setPlayerStates] = useState<PlayerState[]>(players.map(() => initializePlayerState()));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentTurnInput, setCurrentTurnInput] = useState('');
  const [currentGlobalTurn, setCurrentGlobalTurn] = useState(1); // 1-indexed for display
  const [displayedTurnCount, setDisplayedTurnCount] = useState(INITIAL_TURNS_TO_SHOW); // New state for displayed turns
  
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showFinalTallyModal, setShowFinalTallyModal] = useState(false);
  const [winningPlayerName, setWinningPlayerName] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // State to manage the final round
  const [finalRoundPlayerIndex, setFinalRoundPlayerIndex] = useState<number | null>(null);

  // State for the final round initiation notice modal
  const [showFinalRoundInitiationNotice, setShowFinalRoundInitiationNotice] = useState(false);
  const [finalRoundInitiationMessage, setFinalRoundInitiationMessage] = useState<string | null>(null);

  // New state variables for score change confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCellToEdit, setSelectedCellToEdit] = useState<{ playerIndex: number; turnIndex: number; currentValue: number | null } | null>(null);
  const [editModalValue, setEditModalValue] = useState<string>('');

  // Re-adding state to track the last player who successfully banked a score
  const [lastPlayerToBank, setLastPlayerToBank] = useState<number | null>(null);

  useEffect(() => {
    // Initialize player states when players array is set (e.g., from PlayerSetup or URL params)
    if (players.length > 0) {
      setPlayerStates(players.map(() => initializePlayerState()));
      setCurrentPlayerIndex(0);
      setCurrentGlobalTurn(1);
      setGameOver(false);
      if (players[0]) { // Ensure players[0] exists before accessing
        setGameMessage(`${players[0]}'s turn to roll!`);
      }
      setShowFinalTallyModal(false);
      setWinningPlayerName(null);
      setShowRulesModal(false);
      setFinalRoundPlayerIndex(null); // Reset final round marker
      setLastPlayerToBank(null); // Reset on game reset
      setDisplayedTurnCount(INITIAL_TURNS_TO_SHOW); // Reset displayed turns on game reset
    }
  }, [players]); // Depend only on players array

  // useEffect to dynamically add more turns to display
  useEffect(() => {
    if (!gameOver && currentGlobalTurn >= displayedTurnCount - 2) {
      setDisplayedTurnCount(prev => prev + 5);
    }
  }, [currentGlobalTurn, displayedTurnCount, gameOver]);

  const handleBankScore = useCallback(() => {
    // Prevent banking if the game is TRULY over (after final round completion)
    if (gameOver) { 
      setGameMessage("The game has ended. No more scores can be banked.");
      return;
    }
    // Prevent banking if it's another player's turn during the final round before cycling back
    if (finalRoundPlayerIndex !== null && currentPlayerIndex !== finalRoundPlayerIndex && playerStates[currentPlayerIndex]?.scores[currentGlobalTurn -1] !== null) {
        // This case needs to be handled by useEffect turn advancement. Avoid double banking for same slot.
    }

    if (!players[currentPlayerIndex]) return;

    const score = parseInt(currentTurnInput, 10);
    const currentPlayerName = players[currentPlayerIndex]!;

    if (isNaN(score) || score < 0) {
      setGameMessage("Please enter a valid score (0 or more).");
      setTimeout(() => setGameMessage(null), 3000);
      return;
    }

    let messageText = "";

    setPlayerStates(prevStates => {
      const newStates = prevStates.map(ps => ({ ...ps, scores: [...ps.scores] }));
      const playerState = newStates[currentPlayerIndex];
      if (!playerState) return prevStates;

      while (playerState.scores.length < currentGlobalTurn) {
        playerState.scores.push(null);
      }

      let effectiveScoreForTurn = score;

      if (score === 0) {
        messageText = `Oh no, ${currentPlayerName} F#*KLED!`;
        effectiveScoreForTurn = 0;
      } else if (!playerState.isOnBoard) {
        if (score >= MINIMUM_TO_GET_ON_BOARD) {
          playerState.isOnBoard = true;
          playerState.total += score;
          messageText = `${currentPlayerName} is on the board with ${score}!`;
        } else {
          messageText = `${currentPlayerName} needed ${MINIMUM_TO_GET_ON_BOARD} to get on board. Score of ${score} counts as 0 this turn. F#*KLED turn!`;
          effectiveScoreForTurn = 0;
        }
      } else {
        playerState.total += score;
        messageText = `${currentPlayerName} banked ${score} points.`;
      }
      playerState.scores[currentGlobalTurn - 1] = effectiveScoreForTurn;
      newStates[currentPlayerIndex] = playerState;
      // Set game message immediately based on banking action
      // This immediate message might be appended by useEffect for turn info
      setGameMessage(messageText);
      return newStates;
    });
    setCurrentTurnInput('');
    setLastPlayerToBank(currentPlayerIndex); // Set after successful bank

    // Check for game end condition if the current player is the one who initiated the final round
    // and they have just completed their banking action for their actual final turn.
    // We need to access the latest playerStates for this check, which might be tricky here due to closure.
    // Let's use a temporary variable to hold the potentially updated playerState after banking.
    
    // Re-access playerStates to get the most up-to-date version after setPlayerStates has processed.
    // This is still tricky because setPlayerStates is async. The useEffect is better for reacting to state changes.
    // However, if we end the game here, we need the final totals.

    // For now, let's defer game end logic to useEffect, but ensure handleBankScore provides enough info.
    // The main problem was that useEffect was ending the game prematurely for the initiator.
    // The initiator MUST get to the point where this handleBankScore is called for THEIR ACTUAL FINAL TURN.

  }, [currentPlayerIndex, players, currentTurnInput, gameOver, finalRoundPlayerIndex, currentGlobalTurn, playerStates]);

  useEffect(() => {
    const isPlayerInputting = currentTurnInput.trim() !== '';
    if (isPlayerInputting || players.length === 0) {
      return; // Don't run if input is active or no players
    }

    let turnLogicMessage = ""; 
    const playerIndexWhoJustBanked = lastPlayerToBank;

    if (playerIndexWhoJustBanked !== null) {
        setLastPlayerToBank(null); 
    }

    // Phase 1: It's the START of currentPlayerIndex's turn (or an effect run not tied to their direct bank action)
    if (playerIndexWhoJustBanked !== currentPlayerIndex) {
        if (gameOver) return; // Don't set messages if game is over

        const currentTurnPlayerName = players[currentPlayerIndex]!;
        if (finalRoundPlayerIndex !== null) {
            turnLogicMessage = `${currentTurnPlayerName}'s final turn!`;
        } else {
            // Normal play, start of turn
            // Preserve explicit bank message if it was just set and gameMessage is currently that bank message
            // This check is tricky. Let handleBankScore's message persist if it was very recent.
            // For simplicity now, always set the "Your turn" message if it's not the initial P1T1 message.
            if (currentPlayerIndex === 0 && currentGlobalTurn === 1 && (gameMessage === null || gameMessage.includes("turn to roll"))){
                turnLogicMessage = `${currentTurnPlayerName}'s turn to roll!`;
            } else {
                turnLogicMessage = `Now it's ${currentTurnPlayerName}'s turn.`;
            }
        }
        if (turnLogicMessage) setGameMessage(turnLogicMessage);
        return; 
    }
    
    // Phase 2: currentPlayerIndex JUST BANKED (playerIndexWhoJustBanked === currentPlayerIndex was true)
    const playerState = playerStates[currentPlayerIndex];
    const currentPlayerName = players[currentPlayerIndex]!;
    // Base message is what handleBankScore set, we append to it or replace it.
    const baseBankMessage = gameMessage || ""; 

    if (!playerState) {
        console.error("Error: Player state not found for current player after bank.");
        return;
    }

    const bankedScoreForThisTurn = (playerState.scores[currentGlobalTurn -1] !== null) 
                                   ? (playerState.scores[currentGlobalTurn -1] ?? 0) 
                                   : -1;
    console.log(`[FarkleScoreCard DEBUG] useEffect Phase 2 for ${currentPlayerName} (idx ${currentPlayerIndex}), Turn ${currentGlobalTurn}. bankedScoreForThisTurn: ${bankedScoreForThisTurn}, finalRoundPlayerIndex: ${finalRoundPlayerIndex}`);

    if (bankedScoreForThisTurn === -1 && !(finalRoundPlayerIndex !== null && currentPlayerIndex !== finalRoundPlayerIndex)) {
        console.warn("useEffect: bankedScoreForThisTurn is -1 after a supposed bank (and not a non-initiator in FR advancing). Player:", currentPlayerName, "Turn:", currentGlobalTurn);
        return; // Should not happen if bank was successful
    }

    let nextPlayerAdvanceTo = -1; 
    let gameWillEnd = false;
    let messageForThisTurnCompletion = baseBankMessage; 

    if (finalRoundPlayerIndex === null) { // Normal Play
      nextPlayerAdvanceTo = (currentPlayerIndex + 1) % players.length;
      if (playerState.total >= WINNING_SCORE && bankedScoreForThisTurn > 0) { 
        console.log(`[FarkleScoreCard] Player ${currentPlayerName} TRIGGERED FINAL ROUND. Total: ${playerState.total}, Banked: ${bankedScoreForThisTurn}, Current Global Turn: ${currentGlobalTurn}`);
        setFinalRoundPlayerIndex(currentPlayerIndex);
        setWinningPlayerName(currentPlayerName); 
        // Set message for the caption
        messageForThisTurnCompletion = `${baseBankMessage} ${currentPlayerName} has reached ${playerState.total}! Final round for others.`; 
        // Set state for the pop-up modal notice
        setFinalRoundInitiationMessage(`${currentPlayerName} has reached ${playerState.total} points! All other players now get one final turn to try and beat that score.`);
        setShowFinalRoundInitiationNotice(true);
      } else { // Standard bank, no 10k trigger (still in normal play)
        // messageForThisTurnCompletion remains baseBankMessage, Phase 1 will set next player's message.
      }
    } else { // ---- In Final Round ---- (finalRoundPlayerIndex is NOT null)
      // currentPlayerIndex is a player OTHER than the initiator, who just banked their final turn.
      // OR currentPlayerIndex IS the initiator who just banked their final turn (if rules were to give them one).
      // Based on new rule: Initiator does NOT get another turn unless tie. Game ends when turn *would* pass to initiator.
      nextPlayerAdvanceTo = (currentPlayerIndex + 1) % players.length;
      console.log(`[FarkleScoreCard] FINAL ROUND: Player ${currentPlayerName} (idx ${currentPlayerIndex}) banked. Global Turn ${currentGlobalTurn}. Next player is idx ${nextPlayerAdvanceTo}. Initiator was idx ${finalRoundPlayerIndex}.`);

      if (nextPlayerAdvanceTo === finalRoundPlayerIndex) {
          // All other players have had their final turn. Game ends now.
          gameWillEnd = true;
          
          // Determine true winner by finding the highest score after all final turns.
          let maxScore = -1; 
          let trueWinnerName = "";
          
          playerStates.forEach((ps, idx) => {
            if (ps.total > maxScore) {
                maxScore = ps.total;
                trueWinnerName = players[idx]!;
            }
          });

          setWinningPlayerName(trueWinnerName);
          messageForThisTurnCompletion = `Game Over! ${trueWinnerName} is the winner with ${maxScore} points!`;
          setShowFinalTallyModal(true);
          nextPlayerAdvanceTo = -1; // Prevent player advancement as game is ending
      } else {
          // Another player (non-initiator) still needs their final turn.
          // messageForThisTurnCompletion remains baseBankMessage; Phase 1 will set next player's message.
      }
    }

    // Apply Updates Block
    if (messageForThisTurnCompletion) { 
        setGameMessage(messageForThisTurnCompletion);
    }

    if (gameWillEnd) {
        setGameOver(true);
    } else if (nextPlayerAdvanceTo !== -1) {
        setCurrentPlayerIndex(nextPlayerAdvanceTo);
        if (nextPlayerAdvanceTo === 0) { 
            console.log(`[FarkleScoreCard] Advancing Global Turn from ${currentGlobalTurn} to ${currentGlobalTurn + 1}. Current player was ${currentPlayerName} (idx ${currentPlayerIndex}). Next player is idx 0.`);
            setCurrentGlobalTurn(prev => prev + 1);
        }
    }
    
  }, [playerStates, currentGlobalTurn, currentPlayerIndex, players, finalRoundPlayerIndex, winningPlayerName, gameMessage, currentTurnInput, gameOver, lastPlayerToBank]);

  const handleInputChange = (value: string) => {
    if (gameOver) return;
    if (/^\d*$/.test(value)) {
      setCurrentTurnInput(value);
      if(gameMessage && !gameMessage.toLowerCase().includes("final round") && !gameMessage.toLowerCase().includes("wins")) setGameMessage(null); // Clear simple messages on new input
    }
  };
  
  const handleResetGame = useCallback((isNewPlayers: boolean) => {
    if (isNewPlayers) {
      router.push('/');
      return;
    }
    // Reset for same players
    setPlayerStates(players.map(() => initializePlayerState()));
    setCurrentPlayerIndex(0);
    setCurrentGlobalTurn(1);
    setCurrentTurnInput('');
    setGameMessage(players[0] ? `${players[0]}'s turn to roll!` : null);
    setGameOver(false);
    setShowFinalTallyModal(false);
    setWinningPlayerName(null);
    setShowRulesModal(false);
    setFinalRoundPlayerIndex(null); // Reset final round marker
    setLastPlayerToBank(null); // Reset on game reset
    setDisplayedTurnCount(INITIAL_TURNS_TO_SHOW); // Reset displayed turns on game reset
  }, [router, players]);

  const toggleShowRulesModal = useCallback(() => {
    setShowRulesModal(prev => !prev);
  }, []);

  const handleDismissFinalRoundInitiationNotice = () => {
    setShowFinalRoundInitiationNotice(false);
    // Optional: auto-focus next player's input after dismissing, if not handled elsewhere
    // This might require passing inputRef or a focus function from FarkleScoreTable if we want to be very specific
    // For now, let FarkleScoreTable's own focus useEffect handle it.
  };

  // Handler to initiate score editing - called from FarkleScoreTable
  const handleEditBankedScoreTrigger = (playerIndex: number, turnIndex: number) => {
    const playerState = playerStates[playerIndex];
    // Ensure playerState exists and turnIndex is within the bounds of the scores array
    if (playerState && turnIndex < playerState.scores.length) {
      const currentValue = playerState.scores[turnIndex]; // currentValue is number | null

      // Check explicitly for null AND undefined before proceeding.
      // currentValue being undefined here would be unexpected if length check passed, but this satisfies TS.
      if (currentValue !== null && currentValue !== undefined && !gameOver) {
        setSelectedCellToEdit({ playerIndex, turnIndex, currentValue }); // currentValue is definitely a number here
        setEditModalValue(currentValue.toString()); // Safe to call .toString()
        setShowConfirmModal(true);
      } else if (currentValue === null && !gameOver) {
        // If the cell was empty (null) and game not over, we can still trigger edit to add a score to an old turn.
        // This might be desirable if a player missed a turn entry and wants to correct it.
        // For now, the original logic only triggered for non-null. We can adjust if needed.
        // To maintain original logic of only editing non-null, this else-if can be removed.
        // If we want to allow editing/filling empty past turns:
        // setSelectedCellToEdit({ playerIndex, turnIndex, currentValue: null });
        // setEditModalValue(''); 
        // setShowConfirmModal(true);
      }
    }
  };

  // Handler for confirming the score change from the modal
  const handleConfirmScoreChange = () => {
    if (!selectedCellToEdit || !players[selectedCellToEdit.playerIndex]) return;

    const { playerIndex, turnIndex, currentValue } = selectedCellToEdit;
    const newScoreInput = parseInt(editModalValue, 10);
    const playerName = players[playerIndex]!;

    if (isNaN(newScoreInput) || newScoreInput < 0) {
      setGameMessage(`Edit cancelled for ${playerName}: Invalid score '${editModalValue}'.`);
      setShowConfirmModal(false);
      setSelectedCellToEdit(null);
      setEditModalValue('');
      return;
    }

    let messageText = "";

    setPlayerStates(prevStates => {
      const newStates = prevStates.map((ps, idx) => 
        idx === playerIndex ? { ...ps, scores: [...ps.scores], total: ps.total } : ps
      );
      const playerState = newStates[playerIndex];
      if (!playerState) return prevStates;

      const oldTurnScoreEffective = playerState.scores[turnIndex] ?? 0;
      let effectiveNewScore = newScoreInput;
      let takenOffBoardByEdit = false;
      let boardStatusChangedByThisEdit = false;

      const wasOnBoardBeforeThisEdit = playerState.isOnBoard;

      // Determine if player was on board *before this specific turn being edited*
      let onBoardPriorToThisTurn = false;
      for (let i = 0; i < turnIndex; i++) {
        if ((playerState.scores[i] ?? 0) >= MINIMUM_TO_GET_ON_BOARD) {
          onBoardPriorToThisTurn = true;
          break;
        }
      }

      if (!onBoardPriorToThisTurn) { // This edit affects their first scoring attempt or subsequent if still not on board
        if (newScoreInput >= MINIMUM_TO_GET_ON_BOARD) {
          if (!playerState.isOnBoard) { boardStatusChangedByThisEdit = true; }
          playerState.isOnBoard = true;
          messageText = `${playerName} edited turn ${turnIndex + 1} to ${newScoreInput} and is on the board.`;
        } else {
          messageText = `${playerName} edited turn ${turnIndex + 1} to ${newScoreInput}. Needs ${MINIMUM_TO_GET_ON_BOARD} to get on board. Score for this turn is 0.`;
          effectiveNewScore = 0;
          if (playerState.isOnBoard) { // They were on board, but this edit (of a critical score) takes them off
             // Check if any *other* score would keep them on board
            const otherScoreKeepsThemOnBoard = playerState.scores.some((s, i) => i !== turnIndex && (s ?? 0) >= MINIMUM_TO_GET_ON_BOARD);
            if (!otherScoreKeepsThemOnBoard) {
                playerState.isOnBoard = false;
                takenOffBoardByEdit = true;
                boardStatusChangedByThisEdit = true;
            }
          }
        }
      } else { // Player was already on board before this specific turn
        if (newScoreInput === 0) {
          messageText = `${playerName} F#*KLED the edit for turn ${turnIndex + 1}! Score becomes 0.`;
          effectiveNewScore = 0;
        } else {
          messageText = `${playerName} updated score for turn ${turnIndex + 1} from ${currentValue ?? 'N/A'} to ${newScoreInput}.`;
        }
      }
      
      playerState.scores[turnIndex] = effectiveNewScore;
      playerState.total = playerState.total - oldTurnScoreEffective + effectiveNewScore;

      if (takenOffBoardByEdit) { // Recalculate total if they were taken off board by this edit
          playerState.total = 0;
          let tempOnBoard = false;
          playerState.scores.forEach(s => {
              if (s === null) return;
              if (!tempOnBoard && s >= MINIMUM_TO_GET_ON_BOARD) tempOnBoard = true;
              if (tempOnBoard) playerState.total += s; // Only add scores if on board
          });
          playerState.isOnBoard = tempOnBoard; // final check
          if (!playerState.isOnBoard && playerState.total > 0) playerState.total = 0; // safety
          messageText += ' Player taken off board by this edit.';
      }
      if (boardStatusChangedByThisEdit && playerState.isOnBoard && !wasOnBoardBeforeThisEdit) {
          messageText += ' Player now on board due to this edit.';
      }

      if (playerState.total < 0) playerState.total = 0;
      newStates[playerIndex] = playerState;
      
      // --- Win condition re-evaluation (this is tricky with final round logic) ---
      // The main win logic is now in the useEffect hook that watches playerStates.
      // This edit section should primarily focus on updating the current player's state
      // and then letting the useEffect determine game state implications.
      
      // However, if an edit causes a player to reach WINNING_SCORE and finalRound isn't active,
      // we should set finalRoundPlayerIndex here to ensure the useEffect picks it up.
      if (finalRoundPlayerIndex === null && playerState.total >= WINNING_SCORE && effectiveNewScore > 0) {
          setFinalRoundPlayerIndex(playerIndex); // Mark this player as triggering final round due to edit
          setWinningPlayerName(playerName);      // Tentative winner
          // messageText will be further appended by useEffect if needed
      }
      // If already in final round, or game is over, the useEffect will handle re-evaluation of winner.

      setGameMessage(messageText);
      return newStates;
    });

    setShowConfirmModal(false);
    setSelectedCellToEdit(null);
    setEditModalValue('');
  };

  // Handler for canceling the score edit from the modal
  const handleCancelScoreEdit = () => {
    setShowConfirmModal(false);
    setSelectedCellToEdit(null);
    setEditModalValue('');
    setGameMessage("Score change cancelled.");
  };

  if (!players || players.length === 0) {
    return <div className="text-center py-10">Loading F#*KLE Score Card or No Players...</div>;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 min-h-screen flex flex-col">
      <div>
        <FarkleScoreTable
          players={players}
          turnScores={playerStates.map(ps => ps.scores)}
          playerTotals={playerStates.map(ps => ps.total)}
          isPlayerOnBoard={playerStates.map(ps => ps.isOnBoard)}
          currentPlayerIndex={currentPlayerIndex}
          currentGlobalTurn={currentGlobalTurn}
          displayedTurnCount={displayedTurnCount}
          currentTurnInput={currentTurnInput}
          gameOver={gameOver}
          onInputChange={handleInputChange}
          onBankScore={handleBankScore}
          minimumToGetOnBoard={MINIMUM_TO_GET_ON_BOARD}
          showFinalTallyModal={showFinalTallyModal}
          winningPlayerName={winningPlayerName}
          onCloseFinalTallyModal={() => setShowFinalTallyModal(false)}
          showRulesModal={showRulesModal} 
          onToggleRulesModal={toggleShowRulesModal} 
          onEditBankedScore={handleEditBankedScoreTrigger}
          showConfirmModal={showConfirmModal}
          onConfirmScoreChange={handleConfirmScoreChange}
          onCancelScoreEdit={handleCancelScoreEdit}
          editModalValue={editModalValue}
          onEditModalValueChange={setEditModalValue}
          selectedCellToEdit={selectedCellToEdit}
          // Props for Final Round Initiation Notice Modal
          showFinalRoundInitiationNotice={showFinalRoundInitiationNotice}
          finalRoundInitiationMessage={finalRoundInitiationMessage}
          onDismissFinalRoundInitiationNotice={handleDismissFinalRoundInitiationNotice}
        />
      </div>
      <div className="mt-auto pt-3 pb-0 text-center space-y-3 sm:space-y-0 sm:space-x-4">
        <Button onClick={() => handleResetGame(false)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg">
          New Game (Same Players)
        </Button>
        <Button onClick={() => handleResetGame(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg">
          Reset Game (New Players)
        </Button>
      </div>
      <footer className="mt-auto pt-4 text-center text-sm text-gray-500"> 
        <p>Pocket Score © {new Date().getFullYear()} | a pk and dk app</p>
      </footer>
    </div>
  );
}; 