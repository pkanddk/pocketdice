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

  // State for score accumulation within a turn segment
  const [scoreAtTurnSegmentStart, setScoreAtTurnSegmentStart] = useState(0);

  // State for game over and final round logic
  const [gameOver, setGameOver] = useState(false);
  const [winningPlayerName, setWinningPlayerName] = useState<string | null>(null);
  const [finalRoundTriggeredBy, setFinalRoundTriggeredBy] = useState<number | null>(null);
  const [playersCompletedFinalRound, setPlayersCompletedFinalRound] = useState<boolean[]>([]);

  // State for Farkle rule enforcement
  const [mustSelectDie, setMustSelectDie] = useState(false);
  const [canRollHotDice, setCanRollHotDice] = useState(false); // State for Hot Dice condition
  const [currentRollIndices, setCurrentRollIndices] = useState<number[]>([]); // Track indices of dice in current roll segment
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
    const initialDiceCount = dice.length;
    let diceUsedInCombos = 0; // Keep track of dice used in higher-order combos

    // --- Check for highest N-of-a-kind first ---
    // Iterate over actual dice values present
    const diceNumbersPresent = Object.keys(currentCounts).map(Number).sort((a, b) => b - a); // Process higher numbers first, or sort as needed

    for (const num of diceNumbersPresent) {
      let count = currentCounts[num]; // We know num exists in currentCounts here

      if (count >= 6) {
        score += 3000;
        hasScoringOption = true;
        currentCounts[num] -= 6;
        diceUsedInCombos += 6;
        // If six of a kind, we might consider these dice fully accounted for that number.
        // For rules where 6 of a kind is the ONLY thing counted for those dice, we can `continue` or `break` if appropriate.
        // Here, we assume 6 of a kind means those 6 dice are done for this number.
        continue; // Move to next dice number, as these 6 are fully scored
      }
      if (count >= 5) {
        score += 2000;
        hasScoringOption = true;
        currentCounts[num] -= 5;
        diceUsedInCombos += 5;
        count -=5; // Update count for further checks on same number if any dice remain
      }
      if (count >= 4) {
        score += 1000;
        hasScoringOption = true;
        currentCounts[num] -= 4;
        diceUsedInCombos += 4;
        count -=4;
      }
      if (count >= 3) {
        hasScoringOption = true;
        if (num === 1) {
          score += 1000;
        } else {
          score += num * 100;
        }
        currentCounts[num] -= 3;
        diceUsedInCombos += 3;
      }
    }

    // --- Check for individual 1s and 5s remaining ---
    const count1 = currentCounts[1] || 0;
    if (count1 > 0) {
      hasScoringOption = true;
      score += count1 * 100;
    }
    const count5 = currentCounts[5] || 0;
    if (count5 > 0) {
      hasScoringOption = true;
      score += count5 * 50;
    }

    // TODO: Add Straights, Three Pairs, Two Triplets, and ensure hasScoringOption is robustly set.
    // For now, if any score was added, or if specific dice (1s, 5s) exist, assume scoring option.
    // A more robust hasScoringOption would also check for presence of these other combos.

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

    setCurrentRollIndices([]); // Clear for new turn
    setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % playerNames.length);
    setCurrentRollScore(0);
    setCurrentTurnTotal(0);
    setDiceStates(Array(6).fill('available'));
    setDiceValues([1, 1, 1, 1, 1, 1]); 
    setIsFarkle(false);
    console.log(`Advancing to player ${ (currentPlayerIndex + 1) % playerNames.length }`); // This log might be off by one if called after setCurrentPlayerIndex completes
  };

  const handleRollDice = () => {
    // Check if we are rolling hot dice first
    if (canRollHotDice) {
      console.log("Rolling Hot Dice!");
      // Set dice to available FIRST, then trigger roll animation
      setDiceStates(Array(6).fill('available')); 
      setIsRolling(true);
      setCanRollHotDice(false); // Consume the hot dice state
      setMustSelectDie(false); // Reset this flag
      setIsFarkle(false); // Reset Farkle state

      // Roll all 6 dice
      const newDiceValues = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);
      const justRolledDiceValues = [...newDiceValues]; // All dice were just rolled

      // Calculate score from the 6 new dice
      const scoreResult = calculateFarkleScore(justRolledDiceValues);

      console.log('Hot Dice Roll Values:', newDiceValues);
      console.log('Hot Dice Score Result:', scoreResult);

      let farkleDetected = false;
      if (!scoreResult.hasScoringOption) {
        // Hot Dice Farkle! Lose the entire turn total.
        console.log("HOT DICE FARKLE!");
        setCurrentTurnTotal(0); // Reset entire turn total
        farkleDetected = true;
        setIsFarkle(true); 
        setCurrentRollScore(0);
      } else {
        // Scored on hot dice roll
        setScoreAtTurnSegmentStart(currentTurnTotal); // Current total becomes the start for this new segment
        setCurrentRollScore(scoreResult.score); // Show potential score from this new roll
        setMustSelectDie(true); // Must select from the new roll
        setCurrentRollIndices([0, 1, 2, 3, 4, 5]); // All dice are part of the new segment
      }

      // Update dice visually after delay, then advance turn if Farkle
      setTimeout(() => {
        setDiceValues(newDiceValues);
        // setDiceStates(Array(6).fill('available')); // No longer needed here, set when roll initiated
        setIsRolling(false);
        if (farkleDetected) {
          // Hot Dice Farkle turn ends
          setPlayerStates(prev => 
            prev.map((ps, index) => {
              if (index === currentPlayerIndex) {
                const currentScores = Array.isArray(ps.scores) ? ps.scores : [];
                return { ...ps, scores: [...currentScores, 0] }; // Record 0 for the turn
              }
              return ps;
            })
          );
          console.log("Advancing turn due to Hot Dice Farkle...");
          checkForGameEndOrAdvanceTurn(); 
        }
        // If not Farkle, wait for player to select new dice
      }, 500); // Shorter delay for hot dice outcome? Or keep farkleDetected ? 1500 : 500

      return; // End execution here for hot dice roll
    }

    // --- Normal Roll Logic (if not Hot Dice) ---
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
    if (!scoreResult.hasScoringOption) { // Normal Farkle Condition
      console.log("FARKLE!");
      // setCurrentTurnTotal(0); // REMOVED - Farkle resets turn total via bank failure or next turn initiation
      farkleDetected = true;
      setIsFarkle(true); 
      setCurrentRollScore(0); 
      // currentTurnTotal for a Farkle is handled when advancing turn or if banking fails due to min score not met.
    } else {
      // Scoring dice exist! Player must select.
      setScoreAtTurnSegmentStart(currentTurnTotal); // Capture score before new selections from this roll
      setCurrentRollScore(scoreResult.score); // Display potential score from this fresh roll
      setMustSelectDie(true); // Force player to select a die
      setIsFarkle(false); // Ensure Farkle visual state is off
      setCurrentRollIndices(diceToRollIndices); // Store indices of the dice just rolled
      // Disable Roll button implicitly via mustSelectDie state
    }

    // Update dice values visually after a delay
    setTimeout(() => {
      setDiceValues(newDiceValues);
      setDiceStates(prevStates => prevStates.map((state, i) => { 
        if (state === 'held') return 'held';
        return 'available'; 
      })); 
      setIsRolling(false);
      
      if (farkleDetected) {
        // Normal Farkle - just record score 0 and advance
        setPlayerStates(prev => 
          prev.map((ps, index) => {
            if (index === currentPlayerIndex) {
              const currentScores = Array.isArray(ps.scores) ? ps.scores : [];
              return { ...ps, scores: [...currentScores, 0] }; 
            }
            return ps;
          })
        );
        console.log("Advancing turn due to Farkle...");
        checkForGameEndOrAdvanceTurn(); 
      }
    }, farkleDetected ? 1500 : 500); 
  };

  const handleToggleHold = (index: number) => {
    if (isRolling) {
      console.log("[ToggleHold] Cannot interact during roll.");
      return;
    }

    // Tentatively toggle the state of the clicked die
    const newTentativeDiceStates = [...diceStates];
    newTentativeDiceStates[index] = diceStates[index] === 'held' ? 'available' : 'held';

    if (mustSelectDie) {
      // --- Phase 1: Must select scoring dice from the current roll segment ---
      // Commit the current click to diceStates immediately so the player sees their selection
      // and can build up a scoring combination.
      setDiceStates(newTentativeDiceStates); // COMMIT IMMEDIATELY

      // Evaluate based on this newly committed state (using newTentativeDiceStates as it's synchronous)
      const currentSegmentHeldIndices = currentRollIndices.filter(i => newTentativeDiceStates[i] === 'held');
      const currentSegmentHeldValues = currentSegmentHeldIndices.map(i => diceValues[i]).filter((v): v is number => v !== undefined);
      const { score: currentSegmentScore, hasScoringOption: segmentHasScore } = calculateFarkleScore(currentSegmentHeldValues);

      console.log(`[ToggleHold - MustSelect] Index: ${index}, Current Segment Selection: ${JSON.stringify(currentSegmentHeldValues)}, Segment Score: ${currentSegmentScore}, Has Score: ${segmentHasScore}`);
      
      // Update scores based on the current selection in the segment
      setCurrentTurnTotal(scoreAtTurnSegmentStart + currentSegmentScore);
      setCurrentRollScore(currentSegmentScore);

      if (segmentHasScore && currentSegmentScore > 0) {
        // A scoring combination has been selected from the current roll.
        // The 'mustSelectDie' condition is now satisfied for this decision point.
        setMustSelectDie(false); 
        console.log(`   -> VALID scoring selection. Segment score: ${currentSegmentScore}. 'mustSelectDie' is now false. Player can roll/bank.`);
        
        if (newTentativeDiceStates.every(state => state === 'held')) {
          console.log("   -> HOT DICE! All dice scored.");
          setCanRollHotDice(true);
        } else {
          setCanRollHotDice(false);
        }
      } else {
        // The current selection from the segment does not score. 
        // 'mustSelectDie' remains true. Player must continue to select/unselect dice from this segment
        // until a scoring combination is formed or they Farkle (which is handled by roll if no selection made).
        console.log(`   -> Current selection for segment does not score. 'mustSelectDie' remains true.`);
        setCanRollHotDice(false); // Ensure Hot Dice is off if current selection isn't scoring
      }
    } else {
      // --- Phase 2: Optionally adding more dice or unselecting (mustSelectDie is false) ---
      // In this phase, any click updates the dice state, and the score is re-evaluated.
      // The player is responsible for the validity of their final selection before rolling/banking.
      setDiceStates(newTentativeDiceStates); // COMMIT IMMEDIATELY

      const currentSegmentTentativelyHeldIndices = currentRollIndices.filter(i => newTentativeDiceStates[i] === 'held');
      const currentSegmentTentativelyHeldValues = currentSegmentTentativelyHeldIndices
        .map(i => diceValues[i])
        .filter((v): v is number => v !== undefined);

      const { score: newSegmentScore, hasScoringOption: newSegmentHasScore } = calculateFarkleScore(currentSegmentTentativelyHeldValues);
      console.log(`[ToggleHold - Optional] Index: ${index}, Current Segment Selection: ${JSON.stringify(currentSegmentTentativelyHeldValues)}, New Segment Score: ${newSegmentScore}, Has Score: ${newSegmentHasScore}`);
        
      setCurrentTurnTotal(scoreAtTurnSegmentStart + newSegmentScore);
      setCurrentRollScore(newSegmentScore); 

      if (newTentativeDiceStates.every(state => state === 'held')) {
        console.log("   -> HOT DICE! All dice scored.");
        setCanRollHotDice(true);
      } else {
        setCanRollHotDice(false);
      }
      // The old validity check based on score improvement or clearing the segment is removed.
      // console.log(`   -> VALID optional action. Segment Score: ${newSegmentScore}. New Turn Total: ${scoreAtTurnSegmentStart + newSegmentScore}`);
    }
  };

  const handleBankScore = () => {
    const scoreToBank = currentTurnTotal; 
    setCurrentRollIndices([]); // Clear when banking

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

      // --- Add Log --- 
      console.log(`[handleBankScore] Player ${currentPlayerIndex} banking score: ${scoreToBank}`);
      // --------------- 

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

  const ROWS_CHUNK_SIZE = 5;
  const INITIAL_DISPLAY_TURNS = 10; // Should ideally be a multiple of ROWS_CHUNK_SIZE

  const actualMaxTurnsCompleted = playerStates.length > 0
    ? Math.max(0, ...playerStates.map(ps => ps.scores.length))
    : 0;

  const highestTurnNumberRequiringRow = actualMaxTurnsCompleted + 1;
  let calculatedDisplayTurnCount = INITIAL_DISPLAY_TURNS;

  if (highestTurnNumberRequiringRow > INITIAL_DISPLAY_TURNS) {
    calculatedDisplayTurnCount = Math.ceil(highestTurnNumberRequiringRow / ROWS_CHUNK_SIZE) * ROWS_CHUNK_SIZE;
  }
  const displayTurnCount = Math.max(INITIAL_DISPLAY_TURNS, calculatedDisplayTurnCount);

  const currentYear = new Date().getFullYear(); // Get current year

  // Calculate current round for header display
  const currentRound = (playerStates[0]?.scores?.length || 0) + 1;

  // Calculate the index of the turn the current player is on (0-based)
  const actualCurrentTurnIndex = playerStates[currentPlayerIndex]?.scores?.length || 0;

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
          canRollHotDice={canRollHotDice}
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
            actualCurrentTurnIndex={actualCurrentTurnIndex}
            displayedTurnCount={displayTurnCount}
            currentTurnInput=""
            gameOver={gameOver}
            liveTurnScore={currentTurnTotal}
            isFarkleTurn={isFarkle}
            onInputChange={() => {}}
            onBankScore={() => {}}
            minimumToGetOnBoard={MINIMUM_TO_GET_ON_BOARD}
            showFinalTallyModal={gameOver}
            winningPlayerName={winningPlayerName}
            gameMessage={null}
            winningScore={WINNING_SCORE}
            onCloseFinalTallyModal={() => { 
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
            showFinalRoundInitiationNotice={finalRoundTriggeredBy !== null && !gameOver}
            finalRoundInitiationMessage={finalRoundTriggeredBy !== null ? `${playerNames[finalRoundTriggeredBy]} has reached ${WINNING_SCORE}! All other players get one more turn.` : null}
            onDismissFinalRoundInitiationNotice={() => { }}
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