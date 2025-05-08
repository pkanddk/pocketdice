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

  // State for Tie-Breaker rounds
  const [isTieBreakerActive, setIsTieBreakerActive] = useState(false);
  const [tieBreakerPlayerIndices, setTieBreakerPlayerIndices] = useState<number[]>([]);
  const [tieBreakerTurnScores, setTieBreakerTurnScores] = useState<{ [playerIndex: number]: number }>({});
  const [tieBreakerRoundCompleted, setTieBreakerRoundCompleted] = useState<boolean[]>([]);

  // State for Farkle rule enforcement
  const [mustSelectDie, setMustSelectDie] = useState(false);
  const [canRollHotDice, setCanRollHotDice] = useState(false); // State for Hot Dice condition
  const [currentRollIndices, setCurrentRollIndices] = useState<number[]>([]); // Track indices of dice in current roll segment
  // TODO: Add state for currentRollScoringDice indices if needed for highlighting/selection

  // State for Rules Modal
  const [showRulesModal, setShowRulesModal] = useState(false);

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

    // Check for special 6-dice combinations first
    if (initialDiceCount === 6) {
      // Check 1: Straight (1-2-3-4-5-6)
      // To check for a straight, we need to see if all dice from 1 to 6 are present exactly once.
      const uniqueSortedDice = Array.from(new Set(dice)).sort((a, b) => a - b);
      if (uniqueSortedDice.length === 6 && uniqueSortedDice.every((val, index) => val === index + 1)) {
        return { score: 1500, hasScoringOption: true }; // Standard score for a 1-6 straight
      }

      // Check 2: Three Pairs
      // e.g., counts are {2:2, 3:2, 5:2} -> 3 distinct numbers, each appearing twice.
      const countsValuesForThreePairs = Object.values(currentCounts);
      if (Object.keys(currentCounts).length === 3 && countsValuesForThreePairs.every(c => c === 2)) {
        return { score: 1500, hasScoringOption: true }; // Standard score for three pairs
      }

      // Check 3: Two Triplets
      // e.g., counts are {2:3, 4:3} -> 2 distinct numbers, each appearing thrice.
      const countsValuesForTwoTriplets = Object.values(currentCounts);
      if (Object.keys(currentCounts).length === 2 && countsValuesForTwoTriplets.every(c => c === 3)) {
        // Score for two triplets can sometimes be a fixed value (e.g., 2500)
        // or sum of individual triplets. Let's use a fixed 2500 for now.
        // If individual triplet scores were variable (e.g. 1s = 1000, others = N*100), this would be more complex.
        // Assuming standard 2500 for two triplets.
        return { score: 2500, hasScoringOption: true };
      }
    }
    
    // If not a special 6-dice combo, or if fewer than 6 dice, proceed with existing N-of-a-kind and singles logic
    // Score and hasScoringOption are already initialized to 0 and false respectively.
    let diceUsedInCombos = 0; // Keep track of dice used in higher-order combos

    // --- Check for highest N-of-a-kind first ---
    // Iterate over actual dice values present
    const diceNumbersPresent = Object.keys(currentCounts).map(Number).sort((a, b) => b - a); // Process higher numbers first, or sort as needed

    for (const num of diceNumbersPresent) {
      let count = currentCounts[num]!; // We know num exists in currentCounts here

      if (count >= 6) {
        score += 3000;
        hasScoringOption = true;
        currentCounts[num]! -= 6;
        diceUsedInCombos += 6;
        // If six of a kind, we might consider these dice fully accounted for that number.
        // For rules where 6 of a kind is the ONLY thing counted for those dice, we can `continue` or `break` if appropriate.
        // Here, we assume 6 of a kind means those 6 dice are done for this number.
        continue; // Move to next dice number, as these 6 are fully scored
      }
      if (count >= 5) {
        score += 2000;
        hasScoringOption = true;
        currentCounts[num]! -= 5;
        diceUsedInCombos += 5;
        count -=5; // Update count for further checks on same number if any dice remain
      }
      if (count >= 4) {
        score += 1000;
        hasScoringOption = true;
        currentCounts[num]! -= 4;
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
        currentCounts[num]! -= 3;
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
    const tiedWinnerIndices: number[] = [];

    playerStates.forEach((ps, index) => {
      if (ps.total > maxScore) {
        maxScore = ps.total;
        tiedWinnerIndices.length = 0; // Clear previous, found a new high score
        tiedWinnerIndices.push(index);
      } else if (ps.total === maxScore && maxScore !== -1) { // Check maxScore !== -1 to avoid issues if all scores are 0 or negative
        tiedWinnerIndices.push(index);
      }
    });

    if (tiedWinnerIndices.length === 0 && playerStates.some(ps => ps.total > 0)) {
      // This case should ideally not be reached if there are scores, but as a fallback.
      console.error("Error determining winner, no one found with maxScore but scores exist.");
      setGameOver(true);
      setWinningPlayerName("Error: Winner determination failed");
      return;
    } else if (tiedWinnerIndices.length === 0) {
      // All players have 0 or less, or no players with scores
      console.log("Game Over! No winner could be determined based on scores (all zero or less, or no scorable players).");
      setWinningPlayerName("N/A - No clear winner"); 
      setGameOver(true);
      return;
    }

    if (tiedWinnerIndices.length === 1) {
      // Single winner, no tie
      const winnerIdx = tiedWinnerIndices[0];
      // Assuming winnerIdx from tiedWinnerIndices[0] is valid if length === 1 and array contains valid indices
      const potentialWinnerName = (winnerIdx !== undefined && winnerIdx >= 0 && winnerIdx < playerNames.length) ? playerNames[winnerIdx] : undefined;
      if (potentialWinnerName) {
        setWinningPlayerName(potentialWinnerName);
        console.log(`Game Over! Winner is ${potentialWinnerName} with ${maxScore} points!`);
      } else {
        setWinningPlayerName("Error: Winner name not found");
        console.log(`Game Over! Winner index ${winnerIdx} was valid, but no name found (or index out of bounds).`);
      }
      setGameOver(true);
    } else {
      // Tie detected, initiate tie-breaker round
      console.log(`Tie detected at ${maxScore} points between players: ${
        tiedWinnerIndices.map(tempIdx => {
            if (tempIdx !== undefined) {
                const idx: number = tempIdx; // Explicitly typed
                if (playerNames && idx >= 0 && idx < playerNames.length) {
                    return playerNames[idx];
                }
                return `P${idx}`;
            }
            return 'InvalidPlayerIndex'; // Fallback if tempIdx was undefined
        }).join(', ')
    }. Initiating tie-breaker round.`);
      setIsTieBreakerActive(true);
      setTieBreakerPlayerIndices(tiedWinnerIndices);
      
      const initialTieScores: { [playerIndex: number]: number } = {};
      tiedWinnerIndices.forEach(index => {
        initialTieScores[index] = 0; // Initialize tie-breaker turn scores to 0
      });
      setTieBreakerTurnScores(initialTieScores);
      
      setTieBreakerRoundCompleted(Array(playerNames.length).fill(true).map((_, i) => !tiedWinnerIndices.includes(i)));
      setFinalRoundTriggeredBy(null); 
      setGameOver(false); 

      setCurrentRollScore(0);
      setCurrentTurnTotal(0);
      setDiceStates(Array(6).fill('available'));
      setDiceValues([1, 1, 1, 1, 1, 1]); 
      setIsFarkle(false);
      
      if (tiedWinnerIndices.length > 0 && tiedWinnerIndices[0] !== undefined) {
        setCurrentPlayerIndex(tiedWinnerIndices[0]);
      } else {
        // Fallback or error: should not happen if tiedWinnerIndices has entries
        console.error("Cannot set current player for tie-breaker: no valid player index.");
        // Potentially set to a default or handle error state
        setCurrentPlayerIndex(0); // Or some other safe default
      }
      console.log("Transitioning to tie-breaker round...");
      nextTurn(); 
    }
  };

  const checkForGameEndOrAdvanceTurn = () => {
    if (isTieBreakerActive) {
      const allTiedPlayersCompleted = tieBreakerPlayerIndices.every(idx => tieBreakerRoundCompleted[idx]);
      if (allTiedPlayersCompleted) {
        console.log("All tied players have completed their tie-breaker turn.");
        let maxTieScore = -1;
        const ultimateWinnerIndices: number[] = [];
        tieBreakerPlayerIndices.forEach(tempIdx => {
          // Ensure tempIdx is treated as a number for keying into tieBreakerTurnScores
          if (tempIdx !== undefined) {
            const idx: number = tempIdx;
            const playerScore = tieBreakerTurnScores[idx] || 0;
            if (playerScore > maxTieScore) {
              maxTieScore = playerScore;
              ultimateWinnerIndices.length = 0;
              ultimateWinnerIndices.push(idx);
            } else if (playerScore === maxTieScore) {
              ultimateWinnerIndices.push(idx);
            }
          }
        });

        if (ultimateWinnerIndices.length === 1) {
          const tempWinnerIdx = ultimateWinnerIndices[0];
          if (tempWinnerIdx !== undefined) {
            const winnerIdx: number = tempWinnerIdx; // Explicitly typed

            if (winnerIdx >= 0 && winnerIdx < playerNames.length && winnerIdx < playerStates.length) {
                const winnerName = playerNames[winnerIdx];
                const winnerState = playerStates[winnerIdx];

                if (winnerName && winnerState) { // Check for truthiness of actual retrieved values
                    setWinningPlayerName(winnerName);
                    console.log(`Tie-breaker resolved! Winner is ${winnerName} with a tie-breaker score of ${maxTieScore}. Final total: ${winnerState.total}`);
                } else {
                    setWinningPlayerName("Error: Tie-breaker winner data inconsistent");
                    console.error("Error resolving tie-breaker: Winner name or state is undefined for a valid index", winnerIdx);
                }
            } else {
                setWinningPlayerName("Error: Tie-breaker winner data missing");
                console.error("Error resolving tie-breaker: winner index invalid or data not found for index", winnerIdx);
            }
          } else {
            // This case means ultimateWinnerIndices was empty or its first element was undefined (should not happen if length is 1)
            setWinningPlayerName("Error: No tie-breaker winner index found (undefined)");
            console.error("Error resolving tie-breaker: ultimateWinnerIndices[0] is undefined.");
          }
          setIsTieBreakerActive(false); 
          setGameOver(true); 
        } else if (ultimateWinnerIndices.length > 1) {
          console.log(`Still tied in tie-breaker round with score ${maxTieScore} between ${ultimateWinnerIndices.map(tempIdx => {
            if (tempIdx !== undefined) {
                const idx: number = tempIdx;
                if (playerNames && idx >= 0 && idx < playerNames.length) {
                    return playerNames[idx];
                }
                return `P${idx}`;
            }
            return 'InvalidPlayerIndex';
        }).join(', ')}. Another tie-breaker round!`);
          setTieBreakerPlayerIndices(ultimateWinnerIndices);
          const nextTieScores: { [playerIndex: number]: number } = {};
          ultimateWinnerIndices.forEach(index => {
            nextTieScores[index] = 0;
          });
          setTieBreakerTurnScores(nextTieScores);
          setTieBreakerRoundCompleted(Array(playerNames.length).fill(true).map((_, i) => !ultimateWinnerIndices.includes(i)));
          
          if (ultimateWinnerIndices.length > 0 && ultimateWinnerIndices[0] !== undefined) {
            setCurrentPlayerIndex(ultimateWinnerIndices[0]);
          } else {
            console.error("Cannot set current player for subsequent tie-breaker: no valid player index.");
            setCurrentPlayerIndex(0); // Or some other safe default
          }
          setCurrentRollScore(0);
          setCurrentTurnTotal(0);
          setDiceStates(Array(6).fill('available'));
          setDiceValues([1, 1, 1, 1, 1, 1]); 
          setIsFarkle(false);
          nextTurn(); 
        } else { // Should not happen if there were tied players
          console.error("Error resolving tie-breaker: no winner found from tie-breaker scores.");
          setWinningPlayerName("Error in tie-breaker");
          setIsTieBreakerActive(false);
          setGameOver(true);
        }
        return; // Important to return after handling tie-breaker resolution
      }
      // If not all tied players completed, and game isn't over, advance to next tied player
      if (!gameOver) { // Ensure game isn't flagged as over from another path
        nextTurn(); 
      }
      return; // End here for tie-breaker active
    }

    // Original logic for final round (non-tie-breaker)
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
    if (gameOver && !isTieBreakerActive) return; // Allow nextTurn if game over but tie breaker is starting/active
    if (gameOver && isTieBreakerActive) { // If tie-breaker itself has led to gameOver, truly stop.
        // This condition might be hit if checkForGameEndOrAdvanceTurn sets gameOver after a tie-breaker resolution.
        console.log("[nextTurn] Game is definitively over, even post-tie-breaker. No next turn.");
        return;
    }

    // Reset common turn states
    setCurrentRollIndices([]); 
    setCurrentRollScore(0);
    setCurrentTurnTotal(0);
    setDiceStates(Array(6).fill('available'));
    setDiceValues([1, 1, 1, 1, 1, 1]); 
    setIsFarkle(false);

    if (isTieBreakerActive) {
      if (tieBreakerPlayerIndices.length === 0) {
        console.error("[nextTurn] Tie-breaker active, but no tied players listed. Aborting nextTurn.");
        setGameOver(true);
        setIsTieBreakerActive(false);
        setWinningPlayerName("Error in tie-breaker player progression");
        return;
      }

      const currentPrimaryIndex = currentPlayerIndex; 
      const currentIndexInTieArray = tieBreakerPlayerIndices.indexOf(currentPrimaryIndex);
      
      let potentialNextPlayerActualIndex: number | undefined;

      if (currentIndexInTieArray === -1 || tieBreakerPlayerIndices.length === 0) {
        // Current player not in tie list OR tie list is empty (should be caught by above check but defensive)
        // Start with the first player in the tieBreakerPlayerIndices list.
        potentialNextPlayerActualIndex = tieBreakerPlayerIndices[0];
      } else {
        // Find next player in the tie list
        const nextIndexInTieArray = (currentIndexInTieArray + 1) % tieBreakerPlayerIndices.length;
        potentialNextPlayerActualIndex = tieBreakerPlayerIndices[nextIndexInTieArray];
      }
      
      if (potentialNextPlayerActualIndex !== undefined) {
        const nextPlayerActualIndex: number = potentialNextPlayerActualIndex;
        setCurrentPlayerIndex(nextPlayerActualIndex);
        console.log(`[nextTurn] Tie-breaker: Advancing to player: ${playerNames[nextPlayerActualIndex] || `P${nextPlayerActualIndex}`}`);
      } else {
        console.error("[nextTurn] Tie-breaker: Could not determine next player. Aborting tie-breaker.");
        setGameOver(true);
        setIsTieBreakerActive(false);
        setWinningPlayerName("Error in tie-breaker player determination");
        return;
      }

    } else {
      // Standard game flow: cycle through all players
      setCurrentPlayerIndex(prevIndex => {
        const nextPlayer = (prevIndex + 1) % playerNames.length;
        console.log(`[nextTurn] Standard: Advancing to player ${playerNames[nextPlayer] || `P${nextPlayer}`}`);
        return nextPlayer;
      });
    }
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

    if (gameOver && !isTieBreakerActive) return; // Allow banking if game over but tie breaker active, e.g. final bank of tie-break round
    // If truly game over (e.g. already resolved), prevent further banking.
    if (gameOver && isTieBreakerActive && winningPlayerName) {
        console.log("[handleBankScore] Game is definitively over (winner decided). No more banking.");
        return;
    }

    if (isTieBreakerActive) {
      console.log(`[handleBankScore] Tie-breaker: Player ${playerNames[currentPlayerIndex] || `P${currentPlayerIndex}`} banking tie-breaker score: ${scoreToBank}`);
      setTieBreakerTurnScores(prevScores => ({
        ...prevScores,
        [currentPlayerIndex]: scoreToBank
      }));

      setTieBreakerRoundCompleted(prev => {
        const newCompletion = [...prev];
        // Ensure the array is long enough before assignment
        while (newCompletion.length <= currentPlayerIndex) {
            newCompletion.push(false); // Or some other default if needed, but should be pre-initialized
        }
        newCompletion[currentPlayerIndex] = true;
        console.log(`[handleBankScore] Tie-breaker completion status:`, newCompletion);
        return newCompletion;
      });

      // Reset turn-specific states before advancing or concluding tie-breaker
      setCurrentTurnTotal(0);
      setCurrentRollScore(0);
      // Dice states will be reset by nextTurn or if game ends

      checkForGameEndOrAdvanceTurn(); // This will check if all tied players are done and resolve/continue tie-breaker
      return; // End execution for tie-breaker banking
    }

    // --- Original Banking Logic (if not in tie-breaker) ---
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
    setPlayerStates(playerNames.map(() => initializePlayerState()));
    setIsFarkle(false);
    setGameOver(false);
    setWinningPlayerName(null);
    setFinalRoundTriggeredBy(null);
    setPlayersCompletedFinalRound(playerNames.map(() => false)); 
    setMustSelectDie(false);
    // Reset Tie-Breaker States
    setIsTieBreakerActive(false);
    setTieBreakerPlayerIndices([]);
    setTieBreakerTurnScores({});
    setTieBreakerRoundCompleted([]);
    console.log("Game reset with same players.");
  };
  
  const handleResetGameToNewPlayers = () => {
    console.log("Resetting game for new players. Navigating to setup...");
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
    // Reset Tie-Breaker States
    setIsTieBreakerActive(false);
    setTieBreakerPlayerIndices([]);
    setTieBreakerTurnScores({});
    setTieBreakerRoundCompleted([]);
    router.push('/'); 
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

  // --- Handler for Rules Modal ---
  const toggleShowRulesModal = () => {
    setShowRulesModal(prev => !prev);
  };

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
            showRulesModal={showRulesModal} 
            onToggleRulesModal={toggleShowRulesModal}
            scoreEntryMode="auto"
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

      {/* Container for reset buttons - constraining width and centering */}
      <div className="mt-8 w-full max-w-md mx-auto flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
        <Button 
          onClick={handleResetGameSamePlayers} 
          // Ensuring full width on mobile, auto on larger screens within the flex row
          className="w-full sm:flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out"
        >
          New Game, Same Players
        </Button>
        <Button 
          onClick={handleResetGameToNewPlayers} 
          // Ensuring full width on mobile, auto on larger screens within the flex row
          className="w-full sm:flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out"
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