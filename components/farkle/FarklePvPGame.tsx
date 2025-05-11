"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { FarkleScoreTable } from './FarkleScoreTable'; // Changed path
import { FarkleDiceArea } from './FarkleDiceArea';   // Import the new dice area
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Constants remain the same
const MINIMUM_TO_GET_ON_BOARD = 500;
const WINNING_SCORE = 10000;
const INITIAL_TURNS_TO_SHOW = 10;

// Scoring helper functions (can be moved to a separate utils file later)
const calculateScoreForDiceSet = (diceSet: number[]): number => {
  if (!diceSet || diceSet.length === 0) return 0;

  const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  diceSet.forEach(die => { 
    if (die >= 1 && die <= 6) counts[die] = (counts[die] || 0) + 1; // Ensure counts[die] exists before incrementing
  });

  let score = 0;
  const mutableCounts = { ...counts }; // Work with a copy

  // Score three-of-a-kind first
  if ((mutableCounts[1] || 0) >= 3) { score += 300; mutableCounts[1] = (mutableCounts[1] || 0) - 3; }
  if ((mutableCounts[2] || 0) >= 3) { score += 200; mutableCounts[2] = (mutableCounts[2] || 0) - 3; }
  if ((mutableCounts[3] || 0) >= 3) { score += 300; mutableCounts[3] = (mutableCounts[3] || 0) - 3; }
  if ((mutableCounts[4] || 0) >= 3) { score += 400; mutableCounts[4] = (mutableCounts[4] || 0) - 3; }
  if ((mutableCounts[5] || 0) >= 3) { score += 500; mutableCounts[5] = (mutableCounts[5] || 0) - 3; }
  if ((mutableCounts[6] || 0) >= 3) { score += 600; mutableCounts[6] = (mutableCounts[6] || 0) - 3; }

  // Score remaining individual 1s and 5s
  score += (mutableCounts[1] || 0) * 100;
  score += (mutableCounts[5] || 0) * 50;

  return score;
};

const hasScoringDice = (rolledDice: number[]): boolean => {
  if (!rolledDice || rolledDice.length === 0) return false;

  const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  rolledDice.forEach(die => { 
    if (die >= 1 && die <= 6) counts[die] = (counts[die] || 0) + 1; // Ensure counts[die] exists
  });

  // Check for any individual 1s or 5s
  if ((counts[1] || 0) > 0 || (counts[5] || 0) > 0) return true;

  // Check for any three-of-a-kind
  for (let i = 1; i <= 6; i++) {
    if ((counts[i] || 0) >= 3) return true;
  }

  return false;
};

// Interfaces remain the same
interface PlayerState {
  scores: Array<number | null>;
  total: number;
  isOnBoard: boolean;
}

interface FarklePvPGameProps { // Renamed interface
  players: string[];
}

const initializePlayerState = (): PlayerState => ({
  scores: Array(INITIAL_TURNS_TO_SHOW).fill(null),
  total: 0,
  isOnBoard: false,
});

const getRandomDiceValue = () => Math.floor(Math.random() * 6) + 1;

// Renamed Component
export const FarklePvPGame: React.FC<FarklePvPGameProps> = ({ players }) => { 
  const router = useRouter();

  // Existing State
  const [playerStates, setPlayerStates] = useState<PlayerState[]>(players.map(() => initializePlayerState()));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentTurnInput, setCurrentTurnInput] = useState(''); // May become less relevant
  const [currentGlobalTurn, setCurrentGlobalTurn] = useState(1);
  const [displayedTurnCount, setDisplayedTurnCount] = useState(INITIAL_TURNS_TO_SHOW);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showFinalTallyModal, setShowFinalTallyModal] = useState(false);
  const [winningPlayerName, setWinningPlayerName] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [finalRoundPlayerIndex, setFinalRoundPlayerIndex] = useState<number | null>(null);
  const [showFinalRoundInitiationNotice, setShowFinalRoundInitiationNotice] = useState(false);
  const [finalRoundInitiationMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCellToEdit] = useState<{ playerIndex: number; turnIndex: number; currentValue: number | null } | null>(null);
  const [editModalValue, setEditModalValue] = useState<string>('');
  const [lastPlayerToBank, setLastPlayerToBank] = useState<number | null>(null);

  // --- New State for Dice --- 
  const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1, 1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [diceStates, setDiceStates] = useState<Array<'available' | 'held'>>(Array(6).fill('available'));
  const [currentTurnScore, setCurrentTurnScore] = useState(0); // Track score accumulated in current roll sequence

  // --- Dice Handlers ---
  const handleRollDice = useCallback(() => {
    // TODO: Only roll dice whose state is 'available' or similar
    const diceToRollCount = diceStates.filter(s => s === 'available').length;
    if (diceToRollCount === 0) return; // Should not happen if button is enabled correctly

    setIsRolling(true);
    const newValues = [...diceValues];

    for(let i=0; i<6; i++) {
        if (diceStates[i] === 'available') {
            newValues[i] = getRandomDiceValue();
        }
    }
    
    // TODO: Implement FARKLE scoring check here based on newValues & diceStates
    // For now, assume something scored

    setTimeout(() => {
      setDiceValues(newValues);
      // Make all *just rolled* dice available for selection
      setDiceStates(prevStates => prevStates.map(state => state === 'available' ? 'available' : state)); // Index parameter removed as unused
      setIsRolling(false);
      
      const diceThatWereActuallyRolled = newValues.filter((_, idx) => diceStates[idx] === 'available');
      const currentRollHadScoringDice: boolean = hasScoringDice(diceThatWereActuallyRolled);

      if (currentRollHadScoringDice === false) {
        setGameMessage(`Oh no, ${players[currentPlayerIndex]} F#*KLED! Turn over.`);
        setCurrentTurnScore(0); // Lose current turn score on Farkle
        // TODO: Implement full turn ending logic for Farkle (pass turn to next player)
        // For now, just reset dice and show message.
        // This will be part of a more comprehensive handleEndTurn() or similar function later.
        setDiceValues([1,1,1,1,1,1]); // Reset visual dice
        setDiceStates(Array(6).fill('available')); // Reset dice states
        // Placeholder for advancing turn - will be improved
        // const nextPlayer = (currentPlayerIndex + 1) % players.length; // Unused, as setCurrentPlayerIndex is commented
        // setCurrentPlayerIndex(nextPlayer); // Don't advance yet, player needs to see Farkle message
        // if (nextPlayer === 0) setCurrentGlobalTurn(prev => prev + 1);
      } else {
          setGameMessage("Select scoring dice, or roll remaining dice.");
      }
    }, 500); 
  }, [diceValues, diceStates, currentPlayerIndex, players]);

  const handleToggleHold = useCallback((index: number) => {
    if (isRolling) return; 

    const newDiceStates = [...diceStates];
    if (newDiceStates[index] === 'available') {
      newDiceStates[index] = 'held';
    } else if (newDiceStates[index] === 'held') {
      newDiceStates[index] = 'available';
    } // Do nothing if die was already set aside from a previous part of this turn (not yet implemented)
    setDiceStates(newDiceStates);

    // Recalculate current turn score based on ALL currently held dice
    const heldDiceIndices = newDiceStates
      .map((state, i) => (state === 'held' ? i : -1))
      .filter(i => i !== -1);
    
    const heldDiceValues = heldDiceIndices.map(i => diceValues[i]).filter(v => typeof v === 'number') as number[]; // Ensure it's number[]
    const newTurnScore = calculateScoreForDiceSet(heldDiceValues);
    setCurrentTurnScore(newTurnScore);
    
    // Update game message based on selection
    if (newTurnScore > 0) {
        setGameMessage(`${players[currentPlayerIndex]} has selected dice worth ${newTurnScore} points.`);
    } else if (heldDiceIndices.length > 0) {
        setGameMessage("Selected dice do not form a scoring combination.");
    } else {
        setGameMessage("Select scoring dice, or roll remaining dice.");
    }

  }, [isRolling, diceStates, diceValues, players, currentPlayerIndex]);

  // --- Banking function implementation --- 
  const handleBankTurnScore = useCallback(() => {
      console.log("Bank Score clicked");
      
      // 1. Validate we have a score to bank
      if (currentTurnScore <= 0) return;
      
      // 2. Ensure we have a valid player index
      if (currentPlayerIndex < 0 || currentPlayerIndex >= playerStates.length) {
          console.error("Invalid player index:", currentPlayerIndex);
          return;
      }
      
      // 3. Update player states safely
      setPlayerStates(prevStates => {
          // Create a copy of all player states
          const newStates = [...prevStates];
          
          // Get the current player state
          const oldPlayerState = newStates[currentPlayerIndex];
          if (!oldPlayerState) {
              console.error("Player state not found at index:", currentPlayerIndex);
              return prevStates; // Return unchanged if something's wrong
          }
          
          // Check if this score gets them on board
          const wasOnBoard = oldPlayerState.isOnBoard;
          const getsOnBoard = !wasOnBoard && currentTurnScore >= MINIMUM_TO_GET_ON_BOARD;
          
          // Create a new scores array - we need to ensure this exists
          const newScores = [...oldPlayerState.scores];
          // Set the score for the current turn (adjusting for 0-based array indexing)
          newScores[currentGlobalTurn - 1] = currentTurnScore;
          
          // Create a completely new player state
          newStates[currentPlayerIndex] = {
              scores: newScores,
              total: oldPlayerState.total + currentTurnScore,
              isOnBoard: wasOnBoard || getsOnBoard
          };
          
          return newStates;
      });
      
      // 4. Set feedback message
      setGameMessage(`${players[currentPlayerIndex]} banked ${currentTurnScore} points!`);
      
      // 5. Reset current turn score
      setCurrentTurnScore(0);
      
      // 6. Advance to next player
      const nextPlayer = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextPlayer);
      
      // 7. Increment global turn if we've gone through all players
      if (nextPlayer === 0) {
          setCurrentGlobalTurn(prev => prev + 1);
      }
      
      // 8. Reset dice for next player
      setDiceValues([1, 1, 1, 1, 1, 1]);
      setDiceStates(Array(6).fill('available'));
      
      // 9. Keep track of who banked last (for final round logic)
      setLastPlayerToBank(currentPlayerIndex);
  }, [currentTurnScore, currentPlayerIndex, playerStates, players, currentGlobalTurn, MINIMUM_TO_GET_ON_BOARD]);


  // --- Existing useEffects and Handlers (needs review/modification) ---
  useEffect(() => {
    if (players.length > 0) {
      // Reset logic remains largely the same, add dice reset
      setPlayerStates(players.map(() => initializePlayerState()));
      setCurrentPlayerIndex(0);
      setCurrentGlobalTurn(1);
      setGameOver(false);
      if (players[0]) {
        setGameMessage(`${players[0]}'s turn! Roll the dice!`); // Updated message
      }
      setShowFinalTallyModal(false);
      setWinningPlayerName(null);
      setShowRulesModal(false);
      setFinalRoundPlayerIndex(null);
      setLastPlayerToBank(null);
      setDisplayedTurnCount(INITIAL_TURNS_TO_SHOW);
      setDiceValues([1, 1, 1, 1, 1, 1]);
      setDiceStates(Array(6).fill('available'));
      setCurrentTurnScore(0);
    }
  }, [players]);

  useEffect(() => {
    if (!gameOver && currentGlobalTurn >= displayedTurnCount - 2) {
      setDisplayedTurnCount(prev => prev + 5);
    }
  }, [currentGlobalTurn, displayedTurnCount, gameOver]);

  // // OLD handleBankScore - Reference, to be removed/replaced by handleBankTurnScore
  // const handleBankScore_OLD = useCallback(() => { ... }, []);

  // useEffect for game logic based on playerStates - NEEDS REVIEW for PvP context
  useEffect(() => {
      // This logic might need adjustments now that banking is separate
      // and based on currentTurnScore and dice states.
      // The core logic for final round triggering and ending might still apply
      // but needs to be called potentially from handleBankTurnScore or a turn-ending effect.
  }, [playerStates, currentGlobalTurn, currentPlayerIndex, players, finalRoundPlayerIndex, winningPlayerName, gameMessage, currentTurnInput, lastPlayerToBank]);

  const handleInputChange = () => { /* Parameter _value removed as unused. Probably remove for PvP */ };
  const handleResetGame = useCallback((isNewPlayers: boolean) => {
    if (isNewPlayers) {
      router.push('/');
      return;
    }
    setPlayerStates(players.map(() => initializePlayerState()));
    setCurrentPlayerIndex(0);
    setCurrentGlobalTurn(1);
    setCurrentTurnInput('');
    setGameMessage(players[0] ? `${players[0]}'s turn! Roll the dice!` : null);
    setGameOver(false);
    setShowFinalTallyModal(false);
    setWinningPlayerName(null);
    setShowRulesModal(false);
    setFinalRoundPlayerIndex(null); 
    setLastPlayerToBank(null); 
    setDisplayedTurnCount(INITIAL_TURNS_TO_SHOW);
    setDiceValues([1, 1, 1, 1, 1, 1]); // Reset dice
    setDiceStates(Array(6).fill('available'));
    setCurrentTurnScore(0);
  }, [router, players]);

  const toggleShowRulesModal = useCallback(() => {
    setShowRulesModal(prev => !prev);
  }, []);

  const handleDismissFinalRoundInitiationNotice = () => {
    setShowFinalRoundInitiationNotice(false);
  };

  // Score Editing might be disabled for live PvP game - keep handlers but maybe don't call?
  // const handleEditBankedScoreTrigger = (_playerIndex: number, _turnIndex: number) => { console.warn("Score editing disabled in PvP mode."); };
  const handleEditBankedScoreTrigger = () => { /* Parameters _playerIndex, _turnIndex removed as unused. */ console.warn("Score editing disabled in PvP mode."); };
  const handleConfirmScoreChange = () => { console.warn("Score editing disabled in PvP mode."); };
  const handleCancelScoreEdit = () => { setShowConfirmModal(false); };


  if (!players || players.length === 0) {
    // Use the specific loading message for PvP
    return <div className="text-center py-10">Loading F#*KLE PvP Game or No Players...</div>;
  }

  // Determine if Roll button should be enabled
  const canRoll = !isRolling && !gameOver; // Add more conditions later (e.g., must select scoring dice)
  // Determine if Bank button should be enabled
  const canBank = !isRolling && !gameOver && currentTurnScore > 0; // Basic condition

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 min-h-screen flex flex-col">
      
      {/* Render Dice Area */}
      <div className="mb-4 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
          <h3 className="text-lg font-semibold mb-2 text-center">
            {!playerStates[currentPlayerIndex]?.isOnBoard && currentTurnScore >= MINIMUM_TO_GET_ON_BOARD ? (
              <span className="text-green-600">Current Turn: {currentTurnScore} points (Ready to Board!) ✓</span>
            ) : !playerStates[currentPlayerIndex]?.isOnBoard ? (
              <span>Current Turn: {currentTurnScore} points 
                {currentTurnScore > 0 && <span className="text-gray-500"> ({MINIMUM_TO_GET_ON_BOARD - currentTurnScore} more to board)</span>}
              </span>
            ) : (
              <span>Current Turn: {currentTurnScore} points</span>
            )}
          </h3>
          <FarkleDiceArea 
            diceValues={diceValues}
            diceStates={diceStates}
            onToggleHold={handleToggleHold}
            isRolling={isRolling}
          />
          <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Button onClick={handleRollDice} disabled={!canRoll} className="flex-1">
                  {isRolling ? 'Rolling...' : 'Roll Available Dice'}
              </Button>
              <Button onClick={handleBankTurnScore} disabled={!canBank} variant="secondary" className="flex-1">
                  Bank Score ({currentTurnScore})
              </Button>
          </div>
          {/* Optional: Display message about selecting dice */}
          {!isRolling && diceStates.some(s => s === 'available') && currentTurnScore === 0 && 
            <p className="text-center text-sm text-gray-500 mt-2">
              {gameMessage?.includes("F#*KLED") ? " " : "Select scoring dice or roll again."}
            </p>}
           {currentTurnScore > 0 && 
            <p className="text-center text-sm text-green-600 mt-2">
                Current selection: {currentTurnScore} points. Bank or roll remaining!
            </p>}
      </div>

      {/* Render Score Table */}
      <div>
        <FarkleScoreTable
          players={players}
          turnScores={playerStates.map(ps => ps.scores)}
          playerTotals={playerStates.map(ps => ps.total)}
          isPlayerOnBoard={playerStates.map(ps => ps.isOnBoard)}
          currentPlayerIndex={currentPlayerIndex}
          currentGlobalTurn={currentGlobalTurn}
          displayedTurnCount={displayedTurnCount}
          currentTurnInput={currentTurnInput} // Keep for now, maybe remove later
          gameMessage={gameMessage}
          gameOver={gameOver}
          onInputChange={handleInputChange} // Keep for now
          onBankScore={() => {}} // No longer triggered from table input
          minimumToGetOnBoard={MINIMUM_TO_GET_ON_BOARD}
          winningScore={WINNING_SCORE}
          showFinalTallyModal={showFinalTallyModal}
          winningPlayerName={winningPlayerName}
          onCloseFinalTallyModal={() => setShowFinalTallyModal(false)}
          showRulesModal={showRulesModal} 
          onToggleRulesModal={toggleShowRulesModal} 
          onEditBankedScore={handleEditBankedScoreTrigger} // Keep, but handler disables it
          showConfirmModal={showConfirmModal}
          onConfirmScoreChange={handleConfirmScoreChange}
          onCancelScoreEdit={handleCancelScoreEdit}
          editModalValue={editModalValue}
          onEditModalValueChange={setEditModalValue}
          selectedCellToEdit={selectedCellToEdit}
          showFinalRoundInitiationNotice={showFinalRoundInitiationNotice}
          finalRoundInitiationMessage={finalRoundInitiationMessage}
          onDismissFinalRoundInitiationNotice={handleDismissFinalRoundInitiationNotice}
          liveTurnScore={currentTurnScore}
          isFarkleTurn={gameMessage?.includes("F#*KLED") || false}
        />
      </div>

      {/* New Game / Reset Buttons */}
      <div className="mt-auto pt-3 pb-0 text-center space-y-3 sm:space-y-0 sm:space-x-4">
        <Button onClick={() => handleResetGame(false)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg">
          Reset Game
        </Button>
        <Button onClick={() => handleResetGame(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg">
         Exit to Main Screen
        </Button>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto pt-4 text-center text-sm text-gray-500"> 
        <p>Pocket Score © {new Date().getFullYear()} | a pk and dk app</p>
      </footer>
    </div>
  );
}; 