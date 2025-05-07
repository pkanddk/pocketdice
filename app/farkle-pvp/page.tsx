"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FarkleScoreTable } from '@/components/farkle/FarkleScoreTable';
import { FarkleDiceArea } from '@/components/farkle/FarkleDiceArea';
import { Button } from '@/components/ui/button';
import { Dice3 } from 'lucide-react';

const MINIMUM_TO_GET_ON_BOARD = 500;
const WINNING_SCORE = 10000;

interface PlayerState {
  total: number;
  isOnBoard: boolean;
  scores: Array<number | null | undefined>; // Allow for undefined scores if not yet recorded
}

// Updated to return score AND whether any scoring option exists
interface FarkleScoreResult {
  score: number;
  hasScoringOption: boolean;
  // TODO: Later add details about *which* dice scored and combinations
}

function FarklePvPPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1, 1, 1]);
  const [diceStates, setDiceStates] = useState<Array<'available' | 'held'>>(['available', 'available', 'available', 'available', 'available', 'available']);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRollScore, setCurrentRollScore] = useState(0);
  const [currentTurnTotal, setCurrentTurnTotal] = useState(0);
  const [isFarkle, setIsFarkle] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const initializePlayerState = (): PlayerState => ({ total: 0, isOnBoard: false, scores: [] });
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);

  // State for game over and final round logic
  const [gameOver, setGameOver] = useState(false);
  const [winningPlayerName, setWinningPlayerName] = useState<string | null>(null);
  const [finalRoundTriggeredBy, setFinalRoundTriggeredBy] = useState<number | null>(null);
  const [playersCompletedFinalRound, setPlayersCompletedFinalRound] = useState<boolean[]>([]);

  // State for Farkle rule enforcement
  const [mustSelectDie, setMustSelectDie] = useState(false);
  // TODO: Add state for currentRollScoringDice indices if needed for highlighting/selection

  // Prepare props for FarkleScoreTable
  const playerTotals = playerStates.map(ps => ps.total);
  const isPlayerOnBoard = playerStates.map(ps => ps.isOnBoard);

  // --- Farkle Scoring Logic ---
  const calculateFarkleScore = (dice: number[]): FarkleScoreResult => {
    let score = 0;
    let hasScoringOption = false;
    
    if (!dice || dice.length === 0) {
      return { score: 0, hasScoringOption: false };
    }

    const currentCounts = dice.reduce((acc, num) => { acc[num] = (acc[num] || 0) + 1; return acc; }, {} as { [key: number]: number });

    // Check for three of a kind
    for (const numStr in currentCounts) {
      const num = parseInt(numStr, 10);
      // Check count exists before comparing
      const count = currentCounts[num]; 
      if (count !== undefined && count >= 3) { 
        hasScoringOption = true;
        if (num === 1) {
          score += 1000;
        } else {
          score += num * 100;
        }
        currentCounts[num] = count - 3; // Subtract from the locally tracked count
      }
    }

    // Check for individual 1s and 5s remaining
    const count1 = currentCounts[1];
    if (count1 !== undefined && count1 > 0) {
      hasScoringOption = true;
      score += count1 * 100;
    }
    const count5 = currentCounts[5];
    if (count5 !== undefined && count5 > 0) {
      hasScoringOption = true;
      score += count5 * 50;
    }

    // TODO: Add more scoring rules (straights, pairs, etc.) and update hasScoringOption accordingly
    
    // The returned score here is the *maximum potential* score from this roll based on current rules,
    // NOT necessarily what the player will take.
    // hasScoringOption indicates if *any* scoring is possible.
    return { score, hasScoringOption };
  };
  // --- End Farkle Scoring Logic ---

  // --- Game Flow Functions ---
  const endGame = () => {
    if (!playerStates.length || !playerNames.length) {
      console.log("Cannot end game: No player states or names available.");
      setGameOver(true);
      setWinningPlayerName("Error: No player data");
      return;
    } 

    let maxScore = -1;
    let winnerIdx = -1;

    playerStates.forEach((ps, index) => {
      if (ps.total > maxScore) {
        maxScore = ps.total;
        winnerIdx = index;
      } else if (ps.total === maxScore) {
        console.log(`Tie score detected at ${maxScore}. Current logic favors player listed earlier or who achieved score first if order is maintained.`);
      }
    });

    if (winnerIdx !== -1) {
      const potentialWinnerName = playerNames[winnerIdx];
      if (potentialWinnerName) { // Check if the name string is actually defined and not empty
        setWinningPlayerName(potentialWinnerName);
        console.log(`Game Over! Winner is ${potentialWinnerName} with ${maxScore} points!`);
      } else {
        // This case should be rare if playerNames and playerStates are synced
        console.log(`Game Over! Winner index ${winnerIdx} was valid, but no name found. Scores might be misaligned.`);
        setWinningPlayerName("Error: Winner name not found");
      }
    } else {
      console.log("Game Over! No winner could be determined based on scores.");
      setWinningPlayerName("N/A - No clear winner"); 
    }
    setGameOver(true);
  };

  const checkForGameEndOrAdvanceTurn = () => {
    if (finalRoundTriggeredBy !== null) {
      // Final round is active, check if all players have completed their turn
      const allTurnsCompleted = playersCompletedFinalRound.every(completed => completed);
      if (allTurnsCompleted && playersCompletedFinalRound.length === playerNames.length) { // Ensure array is populated
        console.log("All players have completed their final turn.");
        endGame();
      } else if (!gameOver) { // Game not over, but final round is on
        nextTurn(); // Advance to the next player for their final turn
      }
    } else if (!gameOver) { // Normal game flow, no final round yet, and game not over
      nextTurn();
    }
    // If gameOver is true, no further turns should be initiated from here.
  };

  const nextTurn = () => {
    if (gameOver) return; 

    setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % playerNames.length);
    setCurrentRollScore(0);
    setCurrentTurnTotal(0);
    setDiceStates(Array(6).fill('available'));
    setDiceValues([1, 1, 1, 1, 1, 1]); 
    setIsFarkle(false);
    console.log(`Advancing to player ${ (currentPlayerIndex + 1) % playerNames.length }`); // This log might be off by one if called after setCurrentPlayerIndex completes
  };

  const handleRollDice = () => {
    if (isRolling || mustSelectDie) return; // Don't roll if animating or must select die
    setIsRolling(true);
    setIsFarkle(false); // Reset Farkle visual state

    const diceToRollIndices = diceStates.map((state, index) => state === 'available' ? index : -1).filter(index => index !== -1);
    if (diceToRollIndices.length === 0) {
      // This case might happen if all dice are held - should potentially allow rolling all again (Hot Dice)
      // For now, just prevent roll if no dice are available.
      console.log("No available dice to roll.");
      setIsRolling(false);
      return;
    }

    // Generate new values ONLY for the dice being rolled
    const newDiceValues = [...diceValues]; // Start with current values
    const justRolledDiceValues: number[] = [];
    diceToRollIndices.forEach(index => {
      const newValue = Math.floor(Math.random() * 6) + 1;
      newDiceValues[index] = newValue;
      justRolledDiceValues.push(newValue);
    });

    // Calculate score based *only* on the dice that were just rolled
    const scoreResult = calculateFarkleScore(justRolledDiceValues);

    console.log('Rolled Dice Values:', newDiceValues); // Log the full set of dice values
    console.log('Dice Just Rolled:', justRolledDiceValues);
    console.log('Score Result:', scoreResult);

    let farkleDetected = false;
    if (!scoreResult.hasScoringOption) { // Farkle Condition
      console.log("FARKLE!");
      setCurrentTurnTotal(0); // Reset turn total
      farkleDetected = true;
      setIsFarkle(true); // Set visual Farkle state
      // No score added to currentTurnTotal
      setCurrentRollScore(0); // No score for this specific roll either
    } else {
      // Scoring dice exist! Player must select.
      setCurrentRollScore(scoreResult.score); // Display potential score from this roll
      // DO NOT add to currentTurnTotal yet.
      setMustSelectDie(true); // Force player to select a die
      // Disable Roll button implicitly via mustSelectDie state
    }

    // Update dice values visually after a delay
    setTimeout(() => {
      setDiceValues(newDiceValues);
      // Keep held dice as held, others available (animation handled by isRolling prop)
      // Make newly rolled dice available, keep held dice as held.
      setDiceStates(prevStates => prevStates.map((state, i) => {
        // If the die was held, it remains held.
        if (state === 'held') return 'held';
        // If the die was available and its value changed, it's now part of the new roll.
        // For simplicity, if it wasn't held, it's part of the roll, so 'available'.
        // This could be refined if we only wanted to mark dice that actually changed value.
        return 'available'; 
      })); 
      setIsRolling(false);
      
      if (farkleDetected) {
        // Player Farkled. Record their score as 0.
        setPlayerStates(prev => 
          prev.map((ps, index) => {
            if (index === currentPlayerIndex) {
              // Ensure ps.scores is an array before spreading
              const currentScores = Array.isArray(ps.scores) ? ps.scores : [];
              return { ...ps, scores: [...currentScores, 0] }; 
            }
            return ps;
          })
        );
        console.log("Advancing turn due to Farkle...");
        // Call checkForGameEndOrAdvanceTurn directly, removing the nested setTimeout.
        checkForGameEndOrAdvanceTurn(); 
      }
      // If not Farkle, the game state waits for the player to select a die (mustSelectDie is true)
    }, farkleDetected ? 1500 : 500); // Delay for dice animation and Farkle visibility
  };

  const handleToggleHold = (index: number) => {
    if (isRolling) return; // Can't interact during roll animation

    if (mustSelectDie) {
      // Player MUST select a scoring die from the recent roll
      const selectedValue = diceValues[index];
      const isSelectedDieAvailable = diceStates[index] === 'available';
      
      // Basic check: Is it a 1 or 5? (Expand later for combos)
      // Also ensure it's not already held from a previous selection in this roll sequence
      if (isSelectedDieAvailable && (selectedValue === 1 || selectedValue === 5)) {
        console.log(`Player selected scoring die: Index ${index}, Value ${selectedValue}`);
        
        // Mark as held
        setDiceStates(prevStates => {
          const newStates = [...prevStates];
          newStates[index] = 'held';
          return newStates;
        });

        // Add score to turn total
        const scoreToAdd = selectedValue === 1 ? 100 : 50;
        setCurrentTurnTotal(prev => prev + scoreToAdd);

        // Player has fulfilled the requirement
        setMustSelectDie(false);
        setCurrentRollScore(0); // Reset roll score display

      } else {
        console.log(`Invalid selection: Clicked die Index ${index} (Value ${selectedValue}) is not a valid scoring option or is already held.`);
        // Optionally provide user feedback (e.g., flash the die red?)
      }
    } else {
      // Normal hold/unhold logic (if player has already selected 
      // or if the roll resulted in no scoring options initially - though Farkle handles that)
      // For now, allow holding/unholding available dice freely if not forced to select.
      // This allows strategizing before rolling again.
       setDiceStates(prevStates => {
        const newStates = [...prevStates];
        if (newStates[index] === 'available') {
          newStates[index] = 'held';
        } else if (newStates[index] === 'held') {
          // Allow unholding dice previously selected *within the same turn sequence*?
          // Standard Farkle usually doesn't allow un-setting aside dice.
          // Let's enforce that: once held/set-aside, it stays held for the turn.
          console.log("Cannot un-hold die once selected in Farkle."); // Keep it simple
          // Or allow unholding: newStates[index] = 'available'; 
        } else {
          // If state is neither 'available' nor 'held', do nothing
        }
        console.log(`Toggled hold for die ${index}. New state: ${newStates[index]}.`);
        return newStates;
      });
    }
  };

  const handleBankScore = () => {
    const scoreToBank = currentTurnTotal; 

    if (gameOver) return; // Prevent banking if game is already over

    if (scoreToBank <= 0) {
         console.log("Cannot bank score <= 0.");
         return;
    }

    const currentPlayerState = playerStates[currentPlayerIndex];
    if (!currentPlayerState) {
        console.error("Error: Cannot find current player state to bank score.");
        return;
    }
    const currentBoardStatus = currentPlayerState.isOnBoard;
    let canBank = false;

    if (currentBoardStatus) {
      canBank = true;
    } else {
      if (scoreToBank >= MINIMUM_TO_GET_ON_BOARD) { 
        canBank = true;
      } else {
        console.log(`Need ${MINIMUM_TO_GET_ON_BOARD} to get on board. Score of ${scoreToBank} is lost. FARKLE!`);
        setCurrentTurnTotal(0); 
        setCurrentRollScore(0); 
        setIsFarkle(true); 

        // --- Record Farkle Score (0) --- START
        setPlayerStates(prev => 
          prev.map((ps, index) => {
            if (index === currentPlayerIndex) {
              // Clone player state and push 0 to scores
              return { ...ps, scores: [...ps.scores, 0] }; 
            } else {
              return ps;
            }
          })
        );
        // --- Record Farkle Score (0) --- END

        // Even if Farkle due to not meeting minimum, still check for game end / advance turn properly
        // because this action concludes the current player's turn.
        // We need to ensure player completion is marked if in final round.
        if (finalRoundTriggeredBy !== null) {
          setPlayersCompletedFinalRound(prevCompletion => {
            const newCompletion = [...prevCompletion];
            if (newCompletion.length > currentPlayerIndex) newCompletion[currentPlayerIndex] = true;
            return newCompletion;
          });
        }
        checkForGameEndOrAdvanceTurn(); 
        return; 
      }
    }

    if (canBank) {
      // New state derived functionally
      let nextPlayerStates: PlayerState[] = [];
      let playerTriggeredFinalRound: number | null = finalRoundTriggeredBy; // Keep track if triggered this bank
      let nextPlayersCompletedFinalRound: boolean[] = playersCompletedFinalRound;

      setPlayerStates(prev => {
        // Use map to create a new array based on the previous state
        nextPlayerStates = prev.map((ps, index) => {
          if (index === currentPlayerIndex) {
            // Clone the player state object to avoid mutation
            const updatedPlayerState = { ...ps }; 
            console.log(`Before update for ${playerNames[currentPlayerIndex]}, scores:`, JSON.stringify(updatedPlayerState.scores)); 
            
            const newTotal = updatedPlayerState.total + scoreToBank;
            updatedPlayerState.total = newTotal;
            updatedPlayerState.isOnBoard = true; 
            
            // Create a new scores array with the added score
            updatedPlayerState.scores = [...updatedPlayerState.scores, scoreToBank]; 
            
            console.log(`After update for ${playerNames[currentPlayerIndex]}, scores:`, JSON.stringify(updatedPlayerState.scores)); 

            // Check for final round trigger within the map (for calculation)
            if (newTotal >= WINNING_SCORE && finalRoundTriggeredBy === null) {
              playerTriggeredFinalRound = currentPlayerIndex;
              // Initialize completion status, mark current player
              const initialCompletion = Array(playerNames.length).fill(false);
              if(initialCompletion.length > currentPlayerIndex) initialCompletion[currentPlayerIndex] = true;
              nextPlayersCompletedFinalRound = initialCompletion;
            } else if (finalRoundTriggeredBy !== null) {
               // Mark current player's final turn complete
               const updatedCompletion = [...playersCompletedFinalRound]; // Start from existing state
               if(updatedCompletion.length > currentPlayerIndex) updatedCompletion[currentPlayerIndex] = true;
               nextPlayersCompletedFinalRound = updatedCompletion;
            }

            return updatedPlayerState; // Return the new state object for this player
          } else {
            return ps; // Return unchanged state object for other players
          }
        });
        return nextPlayerStates; // Return the new array of player states
      });

      // Update final round state variables *after* the main state update
      // This avoids calling setState inside the setState callback's map function
      if (playerTriggeredFinalRound === currentPlayerIndex && finalRoundTriggeredBy === null) { // Check if it was just triggered
         console.log(`${playerNames[currentPlayerIndex]} reached goal and triggered the final round!`);
         setFinalRoundTriggeredBy(playerTriggeredFinalRound);
         setPlayersCompletedFinalRound(nextPlayersCompletedFinalRound); 
      } else if (finalRoundTriggeredBy !== null) {
         console.log(`${playerNames[currentPlayerIndex]} completed their final round turn.`);
         setPlayersCompletedFinalRound(nextPlayersCompletedFinalRound);
      }

      console.log(`${playerNames[currentPlayerIndex]} banked ${scoreToBank} points!`);
      checkForGameEndOrAdvanceTurn();
    }
  };
  
  const handleResetGameSamePlayers = () => {
    if (!playerNames || playerNames.length === 0) {
      console.log("No player names to reset with. Redirecting to setup.");
      router.push('/'); // Go to setup if there are no players
      return;
    }
    console.log("Resetting game with same players:", playerNames);
    setCurrentPlayerIndex(0);
    setDiceValues([1, 1, 1, 1, 1, 1]);
    setDiceStates(Array(6).fill('available'));
    setIsRolling(false);
    setCurrentRollScore(0);
    setCurrentTurnTotal(0);
    // Re-initialize player states, keeping names but resetting scores and board status
    setPlayerStates(playerNames.map(() => initializePlayerState()));
    setIsFarkle(false);
    // gameStarted remains true
    setGameOver(false);
    setWinningPlayerName(null);
    setFinalRoundTriggeredBy(null);
    setPlayersCompletedFinalRound(playerNames.map(() => false)); // Reset based on current players
    setMustSelectDie(false);
    console.log("Game reset with same players.");
  };
  
  const handleResetGameToNewPlayers = () => {
    // This function will now always navigate to the root/setup page
    // to allow for new player entry.
    console.log("Resetting game for new players. Navigating to setup...");
    // Clearing all state related to current game before redirect
    setPlayerNames([]);
    setCurrentPlayerIndex(0);
    setDiceValues([1, 1, 1, 1, 1, 1]);
    setDiceStates(Array(6).fill('available'));
    setIsRolling(false);
    setCurrentRollScore(0);
    setCurrentTurnTotal(0);
    setPlayerStates([]);
    setIsFarkle(false);
    setGameStarted(false); 
    setGameOver(false);
    setWinningPlayerName(null);
    setFinalRoundTriggeredBy(null);
    setPlayersCompletedFinalRound([]);
    setMustSelectDie(false);
    router.push('/'); // Navigate to the main menu / setup page
    console.log("Game reset, redirecting for new players.");
  };

  // Load player names from URL search params
  useEffect(() => {
    const namesQueryParam = searchParams.get('players');
    if (namesQueryParam) {
      try {
        const names = JSON.parse(namesQueryParam);
        if (Array.isArray(names) && names.every(name => typeof name === 'string') && names.length > 0) {
          setPlayerNames(names);
          setPlayerStates(names.map(() => initializePlayerState()));
        } else {
          console.error("Player names from URL are invalid. Expected a non-empty array of strings.");
          router.push('/'); 
        }
      } catch (error) {
        console.error("Failed to parse player names from URL:", error);
        router.push('/'); 
      }
    } else {
      console.warn("No player names found in URL. Redirecting to home/setup.");
      router.push('/'); // Redirect if no players defined
    }
    setGameStarted(true);
  }, [searchParams, router]); // Added router dependency

  if (!gameStarted || playerNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-xl text-gray-700">Loading game setup...</p>
        <Button onClick={() => router.push('/')} className="mt-4">Back to Home</Button>
      </div>
    );
  }

  const INITIAL_DISPLAY_TURNS = 10; // Define the minimum number of turns to show

  // Calculate max turns completed for dynamic table display, ensuring minimum display count
  const actualMaxTurns = playerStates.length > 0 
    ? Math.max(0, ...playerStates.map(ps => ps.scores.length)) // Find the highest number of scores recorded by any player
    : 0;
  const displayTurnCount = Math.max(INITIAL_DISPLAY_TURNS, actualMaxTurns);

  const currentYear = new Date().getFullYear(); // Get current year

  // Calculate current round for header display
  const currentRound = (playerStates[0]?.scores?.length || 0) + 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-tight flex items-center justify-center">
          Pocket Sc
          <span className="relative px-1">
            <Dice3 className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 text-blue-600" />
            <span className="invisible">o</span>
          </span>
          re
        </h1>
        <p className="text-xl text-gray-600 mt-1">Game On!</p>
        {playerNames.length > 0 && (
          <p className="text-md text-gray-500 mt-1">
            {playerNames.length} Player{playerNames.length > 1 ? 's' : ''} | Round {currentRound}
          </p>
        )}
      </header>
      
      <div className="mb-6 w-full max-w-2xl">
        <FarkleDiceArea 
          diceValues={diceValues} 
          diceStates={diceStates} 
          onToggleHold={handleToggleHold} 
          isRolling={isRolling} 
          handleRollDice={handleRollDice}
          handleBankScore={handleBankScore}
          isFarkle={isFarkle}
          gameOver={gameOver}
          mustSelectDie={mustSelectDie}
          currentTurnTotal={currentTurnTotal}
          playerStates={playerStates}
          currentPlayerIndex={currentPlayerIndex}
          MINIMUM_TO_GET_ON_BOARD={MINIMUM_TO_GET_ON_BOARD}
          finalRoundTriggeredBy={finalRoundTriggeredBy}
          playersCompletedFinalRound={playersCompletedFinalRound}
        />
      </div>

      {playerNames.length > 0 && playerStates.length > 0 && (
        <div className="w-full max-w-2xl">
          <FarkleScoreTable 
            players={playerNames}
            turnScores={playerStates.map(ps => ps.scores.map(s => s ?? null))} 
            playerTotals={playerTotals} 
            isPlayerOnBoard={isPlayerOnBoard} 
            currentPlayerIndex={currentPlayerIndex}
            currentGlobalTurn={0} // This prop might be less relevant now
            displayedTurnCount={displayTurnCount} // Use the calculated count ensuring minimum
            currentTurnInput="" 
            gameOver={gameOver} // Pass gameOver state
            liveTurnScore={currentTurnTotal} // Pass current turn total for live display
            isFarkleTurn={isFarkle} // Pass Farkle status for potential active cell display
            onInputChange={() => {}} 
            onBankScore={() => {}}
            minimumToGetOnBoard={MINIMUM_TO_GET_ON_BOARD}
            showFinalTallyModal={gameOver} // Show modal when game is over
            winningPlayerName={winningPlayerName} // Pass winner's name
            onCloseFinalTallyModal={() => { 
              // Optionally, reset parts of game or allow viewing scores without interaction
              // For now, just log. Could also set gameOver to false to hide it, but that might be confusing.
              console.log("Final tally modal closed by user.");
            }} 
            showRulesModal={false} 
            onToggleRulesModal={() => console.log("Toggle rules modal")}
            onEditBankedScore={() => {}} 
            showConfirmModal={false} 
            onConfirmScoreChange={() => {}} 
            onCancelScoreEdit={() => {}} 
            editModalValue="" 
            onEditModalValueChange={() => {}} 
            selectedCellToEdit={null} 
            showFinalRoundInitiationNotice={finalRoundTriggeredBy !== null && !gameOver} // Show notice if final round active and game not over
            finalRoundInitiationMessage={finalRoundTriggeredBy !== null ? `${playerNames[finalRoundTriggeredBy]} has reached ${WINNING_SCORE}! All other players get one more turn.` : null}
            onDismissFinalRoundInitiationNotice={() => { /* Can allow dismissing this notice */ }}
          />
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button 
          onClick={handleResetGameSamePlayers} 
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out w-full sm:w-auto"
        >
          New Game, Same Players
        </Button>
        <Button 
          onClick={handleResetGameToNewPlayers} 
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out w-full sm:w-auto"
        >
          New Game, New Players
        </Button>
      </div>

      <footer className="mt-12 py-4 text-center text-sm text-gray-500 border-t border-gray-300 w-full max-w-2xl">
        <p>Pocket Score &copy; {currentYear} | a pk and dk app</p>
      </footer>

    </div>
  );
}

// Suspense wrapper for client components using searchParams
export default function FarklePvPPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <FarklePvPPageContent />
    </Suspense>
  );
}