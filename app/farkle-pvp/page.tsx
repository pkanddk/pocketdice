"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FarkleScoreTable } from '@/components/farkle/FarkleScoreTable';
import { FarkleDiceArea } from '@/components/farkle/FarkleDiceArea';
import { Button } from '@/components/ui/button';
import { Dice3 } from 'lucide-react';
import { UniversalFooter } from '@/components/common/UniversalFooter';

console.log("Rendering Farkle PvP page!");

const MINIMUM_TO_GET_ON_BOARD = 500;
const WINNING_SCORE = 10000;

// DEBUG: Set to true to start all players at 9800 points for endgame testing. Set to false or remove to disable.
const DEBUG_MODE = true;

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
  const initializePlayerState = (): PlayerState => (
    DEBUG_MODE
      ? { total: 9800, isOnBoard: true, scores: [] }
      : { total: 0, isOnBoard: false, scores: [] }
  );
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

  // --- Final Round Modal State ---
  const [showFinalRoundModal, setShowFinalRoundModal] = useState(false);
  const [finalRoundMessage, setFinalRoundMessage] = useState<string | null>(null);

  // --- Winner Modal State ---
  const [displayWinnerModal, setDisplayWinnerModal] = useState(false);

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

    setGameOver(true);
  };

  const checkForGameEndOrAdvanceTurn = (currentCompletionStatusForCheck?: boolean[]) => {
    if (isTieBreakerActive) {
      const allTiedPlayersCompleted = tieBreakerPlayerIndices.every(idx => {
        const completionSource = currentCompletionStatusForCheck || tieBreakerRoundCompleted; // Tiebreaker also might need this
        return completionSource.length > idx && completionSource[idx];
      });
      if (allTiedPlayersCompleted && tieBreakerPlayerIndices.length > 0) { // Ensure there were tied players
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
          setDisplayWinnerModal(true); // Show winner modal
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
          nextTurn(Array(playerNames.length).fill(true)); 
        } else { // Should not happen if there were tied players
          console.error("Error resolving tie-breaker: no winner found from tie-breaker scores.");
          setWinningPlayerName("Error in tie-breaker");
          setIsTieBreakerActive(false);
          setGameOver(true);
          setDisplayWinnerModal(true); // Show modal even for error states
        }
        return; // Important to return after handling tie-breaker resolution
      }
      // If not all tied players completed, and game isn't over, advance to next tied player
      if (!gameOver) { // Ensure game isn't flagged as over from another path
        nextTurn(Array(playerNames.length).fill(true)); 
      }
      return; // End here for tie-breaker active
    }

    // Final round logic: end game as soon as all non-triggering players are done
    if (finalRoundTriggeredBy !== null) {
      // Use the passed-in status if available, otherwise use state.
      const completionStatusToUse = currentCompletionStatusForCheck || playersCompletedFinalRound;

      // Only consider non-triggering players
      const allNonTriggeringDone = completionStatusToUse.every((done, idx) => idx === finalRoundTriggeredBy || done);
      
      // Ensure the completion array has the correct length, corresponding to the number of players
      if (allNonTriggeringDone && completionStatusToUse.length === playerNames.length && playerNames.length > 0) {
        console.log("[checkForGameEndOrAdvanceTurn] All eligible players have completed their final round. Ending game. Status used:", completionStatusToUse);
        endGame();
        return;
      }
      // Only call nextTurn if not all are done
      if (!gameOver && !allNonTriggeringDone) {
        nextTurn(completionStatusToUse); // Pass the status used for the check
      }
      return;
    }

    // Normal game flow, no final round yet, and game not over
    if (!gameOver) {
      nextTurn(); // No specific completion status to pass here for normal turns
    }
    // If gameOver is true, no further turns should be initiated from here.
  };

  const nextTurn = (currentCompletionStatusForTurnCycle?: boolean[]) => {
    if (gameOver && !isTieBreakerActive) return; // Allow nextTurn if game over but tie breaker is starting/active
    if (gameOver && isTieBreakerActive) {
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

    } else if (finalRoundTriggeredBy !== null) {
      // Final round: skip the player who triggered the final round
      // Use the passed-in status if available, otherwise use state.
      const completionStatusToUse = currentCompletionStatusForTurnCycle || playersCompletedFinalRound;

      let nextIndex = (currentPlayerIndex + 1) % playerNames.length;
      let attempts = 0;
      // Ensure completionStatusToUse is valid for indexing
      while (
        playerNames.length > 0 && // Ensure playerNames is not empty
        attempts < playerNames.length &&
        (nextIndex === finalRoundTriggeredBy || (completionStatusToUse.length > nextIndex && completionStatusToUse[nextIndex]))
      ) {
        nextIndex = (nextIndex + 1) % playerNames.length;
        attempts++;
      }

      const allNonTriggeringDone = completionStatusToUse.length === playerNames.length && 
                                 completionStatusToUse.every((done, idx) => idx === finalRoundTriggeredBy || done);

      if (allNonTriggeringDone && playerNames.length > 0) {
        checkForGameEndOrAdvanceTurn(completionStatusToUse); // Pass the status used for the check
        return;
      }
      setCurrentPlayerIndex(nextIndex);
      console.log(`[nextTurn] Final round: Advancing to player ${playerNames[nextIndex] || `P${nextIndex}`}`);
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
          let completionStatusAfterHotDiceFarkle: boolean[] | undefined = undefined;
          if (finalRoundTriggeredBy !== null) {
            const newCompletion = [...playersCompletedFinalRound];
            if (newCompletion.length > currentPlayerIndex && !newCompletion[currentPlayerIndex]) {
              newCompletion[currentPlayerIndex] = true;
              setPlayersCompletedFinalRound(newCompletion);
              completionStatusAfterHotDiceFarkle = newCompletion;
              console.log(`[handleRollDice-HotFarkle] ${playerNames[currentPlayerIndex]} Farkled (Hot Dice) in final round. Completion:`, newCompletion);
            } else {
              completionStatusAfterHotDiceFarkle = playersCompletedFinalRound; // Already marked or no change
            }
          }

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
          checkForGameEndOrAdvanceTurn(completionStatusAfterHotDiceFarkle);
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
        let completionStatusAfterFarkle: boolean[] | undefined = undefined;
        if (finalRoundTriggeredBy !== null) {
          const newCompletion = [...playersCompletedFinalRound];
          if (newCompletion.length > currentPlayerIndex && !newCompletion[currentPlayerIndex]) {
            newCompletion[currentPlayerIndex] = true;
            setPlayersCompletedFinalRound(newCompletion);
            completionStatusAfterFarkle = newCompletion;
            console.log(`[handleRollDice-Farkle] ${playerNames[currentPlayerIndex]} Farkled in final round. Completion:`, newCompletion);
          } else {
            completionStatusAfterFarkle = playersCompletedFinalRound; // Already marked or no change
          }
        }

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
        checkForGameEndOrAdvanceTurn(completionStatusAfterFarkle);
      }
    }, farkleDetected ? 1500 : 500); 
  };

  // Helper: Get indices of scoring dice in a roll (for current roll only)
  function getScoringDiceIndices(dice: number[]): number[] {
    // This function returns the indices of dice that are part of any valid scoring combination in the given dice array.
    // It checks for all Farkle scoring rules: 1s, 5s, three/four/five/six of a kind, straight, three pairs, two triplets.
    const indices: number[] = [];
    if (!dice || dice.length === 0) return indices;
    const counts: { [key: number]: number } = {};
    dice.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });

    // Special 6-dice combos
    if (dice.length === 6) {
      const uniqueSorted = Array.from(new Set(dice)).sort((a, b) => a - b);
      if (uniqueSorted.length === 6 && uniqueSorted.every((v, i) => v === i + 1)) {
        return [0, 1, 2, 3, 4, 5];
      }
      if (Object.values(counts).filter((c) => c === 2).length === 3) {
        return [0, 1, 2, 3, 4, 5];
      }
      if (Object.values(counts).filter((c) => c === 3).length === 2) {
        return [0, 1, 2, 3, 4, 5];
      }
    }
    // N-of-a-kind (work on a copy to avoid mutating input)
    const diceCopy = [...dice];
    for (let n = 6; n >= 3; n--) {
      for (let die = 1; die <= 6; die++) {
        if ((counts[die] ?? 0) >= n) {
          let found = 0;
          for (let i = 0; i < diceCopy.length; i++) {
            if (diceCopy[i] === die && found < n) {
              indices.push(i);
              found++;
            }
          }
          // Remove these dice from further consideration
          for (let i = 0; i < diceCopy.length && found > 0; i++) {
            if (diceCopy[i] === die) {
              diceCopy[i] = -1; // Mark as used
              found--;
            }
          }
        }
      }
    }
    // 1s and 5s (not already used)
    for (let i = 0; i < diceCopy.length; i++) {
      if (diceCopy[i] === 1 || diceCopy[i] === 5) {
        indices.push(i);
      }
    }
    // Remove duplicates and sort
    return Array.from(new Set(indices)).sort((a, b) => a - b);
  }

  const handleToggleHold = (index: number) => {
    if (isRolling) {
      console.log("[ToggleHold] Cannot interact during roll.");
      return;
    }
    // If no dice have been rolled in the current segment (e.g., start of turn, or after banking before new roll)
    // then don't allow holding/unholding.
    if (currentRollIndices.length === 0) {
        console.log("[ToggleHold] Cannot hold dice before rolling in the current turn segment.");
        return;
    }
    // Only allow toggling dice that are part of the current roll
    if (!currentRollIndices.includes(index)) {
      console.log("[ToggleHold] Can only hold dice from the current roll.");
      return;
    }
    // Get the values of the dice in the current roll
    const currentRollValues = currentRollIndices
      .filter(i => typeof i === 'number' && typeof diceValues[i] === 'number')
      .map(i => diceValues[i] as number);
    // Get which indices (relative to currentRollIndices) are valid scoring dice
    const scoringIndicesInRoll = getScoringDiceIndices([...currentRollValues]);
    // Map these back to the actual dice indices
    const validScoringDiceIndices = scoringIndicesInRoll.reduce<number[]>((acc, i) => {
      if (
        typeof i === 'number' &&
        i >= 0 &&
        i < currentRollIndices.length &&
        typeof currentRollIndices[i] === 'number'
      ) {
        acc.push(currentRollIndices[i] as number);
      }
      return acc;
    }, []);
    // Only allow holding if this die is a valid scoring die in this roll
    if (!validScoringDiceIndices.includes(index)) {
      console.log("[ToggleHold] Can only hold valid scoring dice from the current roll.");
      return;
    }
    // Once a die is held, it cannot be unheld in subsequent rolls
    if (diceStates[index] === 'held') {
      // Prevent unholding if this die was held in a previous roll
      if (!mustSelectDie) {
        console.log("[ToggleHold] Cannot unhold dice held in previous rolls.");
        return;
      }
    }
    // Tentatively toggle the state of the clicked die (only for current roll and only if valid)
    const newTentativeDiceStates = [...diceStates];
    newTentativeDiceStates[index] = diceStates[index] === 'held' ? 'available' : 'held';

    if (mustSelectDie) {
      // --- Phase 1: Must select scoring dice from the current roll segment ---
      setDiceStates(newTentativeDiceStates); // COMMIT IMMEDIATELY

      // Evaluate based on this newly committed state (using newTentativeDiceStates as it's synchronous)
      const currentSegmentHeldIndices = currentRollIndices.filter(i => newTentativeDiceStates[i] === 'held');
      const currentSegmentHeldValues = currentSegmentHeldIndices.map(i => diceValues[i]).filter((v): v is number => typeof v === 'number');
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
        .filter((v): v is number => typeof v === 'number');

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

    let finalRoundTriggeredThisCall = false; // <--- NEW: local guard

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

      checkForGameEndOrAdvanceTurn(Array(playerNames.length).fill(true)); // This will check if all tied players are done and resolve/continue tie-breaker
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

        let completionForMinScoreFarkle: boolean[] | undefined = undefined;
        if (finalRoundTriggeredBy !== null) {
          const newCompletion = [...playersCompletedFinalRound];
          if (newCompletion.length > currentPlayerIndex && !newCompletion[currentPlayerIndex]) {
            newCompletion[currentPlayerIndex] = true;
            setPlayersCompletedFinalRound(newCompletion);
            completionForMinScoreFarkle = newCompletion;
            console.log(`[handleBankScore-MinScoreFarkle] ${playerNames[currentPlayerIndex]} Farkled (min score) in final round. Completion:`, newCompletion);
          } else {
            completionForMinScoreFarkle = playersCompletedFinalRound; // Already marked or no change
          }
        }

        setPlayerStates(prev =>
          prev.map((ps, index) => {
            if (index === currentPlayerIndex) {
              return { ...ps, scores: [...ps.scores, 0] };
            } else {
              return ps;
            }
          })
        );
        checkForGameEndOrAdvanceTurn(completionForMinScoreFarkle);
        return;
      }
    }

    if (canBank) {
      const newPlayerTotalAfterBank = (playerStates[currentPlayerIndex]?.total || 0) + scoreToBank;
      let updatedCompletionStatusForBank: boolean[] = [...playersCompletedFinalRound];
      let finalRoundJustTriggeredByThisBank = false;

      // Determine if final round is triggered or ongoing
      if (finalRoundTriggeredBy === null && newPlayerTotalAfterBank >= WINNING_SCORE && playerNames.length > 0) {
        finalRoundJustTriggeredByThisBank = true;
        setFinalRoundTriggeredBy(currentPlayerIndex);
        const initialCompletion = Array(playerNames.length).fill(false);
        if (initialCompletion.length > currentPlayerIndex) {
          initialCompletion[currentPlayerIndex] = true; // Triggering player is marked complete for final round
        }
        updatedCompletionStatusForBank = initialCompletion;
        setPlayersCompletedFinalRound(updatedCompletionStatusForBank); // Set state
        setFinalRoundMessage(`🚨 Final Round! 🚨
${playerNames[currentPlayerIndex]} just hit ${WINNING_SCORE}!
Everyone else gets one last shot to steal the win!`);
        setShowFinalRoundModal(true);
        console.log(`${playerNames[currentPlayerIndex]} reached ${WINNING_SCORE} and triggered the final round! Completion:`, updatedCompletionStatusForBank);
      } else if (finalRoundTriggeredBy !== null) {
        // Player is taking their turn in an ongoing final round
        if (updatedCompletionStatusForBank.length > currentPlayerIndex && !updatedCompletionStatusForBank[currentPlayerIndex]) {
          updatedCompletionStatusForBank = [...updatedCompletionStatusForBank]; // Create a new array for state update
          updatedCompletionStatusForBank[currentPlayerIndex] = true;
          setPlayersCompletedFinalRound(updatedCompletionStatusForBank); // Set state
          console.log(`${playerNames[currentPlayerIndex]} completed their final round turn by banking. Updated completion:`, updatedCompletionStatusForBank);
        }
      }
      // If not in final round and not triggering it, updatedCompletionStatusForBank remains as a copy of playersCompletedFinalRound

      // Update player scores and totals
      setPlayerStates(prev => {
        return prev.map((ps, index) => {
          if (index === currentPlayerIndex) {
            return {
              ...ps,
              total: newPlayerTotalAfterBank,
              isOnBoard: true,
              scores: [...ps.scores, scoreToBank]
            };
          }
          return ps;
        });
      });

      console.log(`${playerNames[currentPlayerIndex]} banked ${scoreToBank} points!`);
      checkForGameEndOrAdvanceTurn(updatedCompletionStatusForBank); // Pass the determined completion status
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
    setDisplayWinnerModal(false); // Hide winner modal
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
    setDisplayWinnerModal(false); // Hide winner modal
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

  useEffect(() => {
    // Trigger endGame when all final round turns are completed
    if (
      finalRoundTriggeredBy !== null &&
      playersCompletedFinalRound.length === playerNames.length &&
      playersCompletedFinalRound.every(completed => completed) &&
      !gameOver
    ) {
      console.log("[useEffect] All players have completed their final round. Triggering endGame.");
      endGame();
    }
  }, [finalRoundTriggeredBy, playersCompletedFinalRound, playerNames.length, gameOver]);

  // --- Function to initiate a tie-breaker round ---
  const initiateTieBreaker = useCallback((tiedIndices: number[]) => {
    console.log(`Tie detected at game end between players: ${tiedIndices.map(idx => playerNames[idx]).join(', ')}. Initiating tie-breaker.`);
    setWinningPlayerName(null); // Clear any previous winner name
    setGameOver(false); // Re-open the game for the tie-breaker round

    setIsTieBreakerActive(true);
    setTieBreakerPlayerIndices(tiedIndices);

    const initialTieScores: { [playerIndex: number]: number } = {};
    tiedIndices.forEach(index => {
      initialTieScores[index] = 0; // Scores for the tie-breaker round start at 0
    });
    setTieBreakerTurnScores(initialTieScores);

    // Mark only non-tied players as "completed" for this tie-breaker round's perspective
    // All tied players need a turn, so their 'completed' status for this round is initially false.
    setTieBreakerRoundCompleted(
      Array(playerNames.length).fill(true).map((_, i) => !tiedIndices.includes(i))
    );
    
    // Reset turn-specific states for the start of the tie-breaker
    setCurrentRollScore(0);
    setCurrentTurnTotal(0);
    setDiceStates(Array(6).fill('available'));
    setDiceValues([1,1,1,1,1,1]);
    setIsFarkle(false);
    setMustSelectDie(false);
    setCanRollHotDice(false);
    setCurrentRollIndices([]);

    // Reset final round states as they are not relevant for tie-breaker
    setFinalRoundTriggeredBy(null);
    setPlayersCompletedFinalRound(Array(playerNames.length).fill(false));

    // Set current player to the first player in the tie-breaker list
    if (tiedIndices.length > 0 && tiedIndices[0] !== undefined) {
      setCurrentPlayerIndex(tiedIndices[0]);
      console.log(`[Tie-breaker] Starting tie-breaker round with player: ${playerNames[tiedIndices[0]]}`);
      // nextTurn() will be called naturally by game flow after this player banks/farkles
    } else {
      console.error("Tie-breaker initiated but no valid player indices found in tied list.");
      // Fallback: declare it an error to prevent loops
      setWinningPlayerName("Error: Tie-breaker setup failed");
      setGameOver(true); // Re-set gameOver if tie-breaker setup fails
      setIsTieBreakerActive(false);
    }
  }, [ playerNames, setWinningPlayerName, setGameOver, setIsTieBreakerActive,
       setTieBreakerPlayerIndices, setTieBreakerTurnScores, setTieBreakerRoundCompleted,
       setCurrentRollScore, setCurrentTurnTotal, setDiceStates, setDiceValues, setIsFarkle,
       setMustSelectDie, setCanRollHotDice, setCurrentRollIndices, setCurrentPlayerIndex,
       setFinalRoundTriggeredBy, setPlayersCompletedFinalRound ]);

  // --- Winner Calculation Effect ---
  useEffect(() => {
    // Only run if game is marked as over AND not already in a tie-breaker that is resolving.
    // If a tie-breaker is active, it will set gameOver to true and set the winner itself.
    if (gameOver && !isTieBreakerActive && playerStates.length > 0 && playerNames.length > 0) {
      let maxScore = -1;
      const tiedWinnerIndicesList: number[] = [];
      playerStates.forEach((ps, index) => {
        if (ps.total > maxScore) {
          maxScore = ps.total;
          tiedWinnerIndicesList.length = 0;
          tiedWinnerIndicesList.push(index);
        } else if (ps.total === maxScore && maxScore !== -1) { // maxScore !== -1 ensures we don't push all players if scores are 0 or all negative.
          tiedWinnerIndicesList.push(index);
        }
      });

      if (tiedWinnerIndicesList.length === 1 && tiedWinnerIndicesList[0] !== undefined) {
        const winnerIdx = tiedWinnerIndicesList[0];
        const potentialWinnerName = (winnerIdx >= 0 && winnerIdx < playerNames.length) ? playerNames[winnerIdx] : undefined;
        setWinningPlayerName(potentialWinnerName ?? "Error: Winner name not found");
        console.log(`[WinnerCalc] Game ended. Winner: ${potentialWinnerName}`);
        setDisplayWinnerModal(true); // Show winner modal
        // Game truly ends with one winner. Pop-up should show.
      } else if (tiedWinnerIndicesList.length > 1) {
        // Tie detected at the end of the regular game or final round. Initiate tie-breaker.
        // Do not show winner modal here, tie-breaker will handle it.
        initiateTieBreaker(tiedWinnerIndicesList);
      } else if (maxScore <= 0 && tiedWinnerIndicesList.length === 0) {
        // This case covers if all players have 0 or negative scores.
        setWinningPlayerName("No winner - all scores zero or less.");
        console.log("[WinnerCalc] Game ended. No winner - all scores zero or less.");
        setDisplayWinnerModal(true); // Show modal
      } else {
        // Should ideally not be reached if playerStates is populated and scores are positive.
        // This could happen if maxScore is positive but tiedWinnerIndicesList is empty (logic error elsewhere)
        // or if playerStates was empty (but guarded by useEffect condition).
        setWinningPlayerName("N/A - No clear winner");
        console.log("[WinnerCalc] Game ended. Could not determine a clear winner.");
        setDisplayWinnerModal(true); // Show modal
      }
    }
  }, [gameOver, playerStates, playerNames, isTieBreakerActive, initiateTieBreaker]);

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
  // const currentRound = (playerStates[0]?.scores?.length || 0) + 1;
  const headerDisplayTurn = playerStates.length > 0 
    ? Math.min(...playerStates.map(ps => ps.scores.length)) + 1 
    : 1;

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
            {playerNames.length} Player{playerNames.length > 1 ? 's' : ''} | Turn {headerDisplayTurn}
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
            currentGlobalTurn={actualCurrentTurnIndex}
            displayedTurnCount={displayTurnCount}
            currentTurnInput=""
            gameOver={gameOver}
            liveTurnScore={currentTurnTotal}
            isFarkleTurn={isFarkle}
            onInputChange={() => {}}
            onBankScore={() => {}}
            minimumToGetOnBoard={MINIMUM_TO_GET_ON_BOARD}
            showFinalTallyModal={displayWinnerModal}
            winningPlayerName={winningPlayerName}
            gameMessage={null}
            winningScore={WINNING_SCORE}
            onCloseFinalTallyModal={() => { 
              console.log("Final tally modal closed by user.");
              setDisplayWinnerModal(false); // Actually hide the modal
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
      <div className="mt-3 mb-4 w-full max-w-md mx-auto flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
        <Button 
          onClick={handleResetGameSamePlayers} 
          className="w-full sm:flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out"
        >
          Reset Game
        </Button>
        <Button 
          onClick={handleResetGameToNewPlayers} 
          className="w-full sm:flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out"
        >
          Exit to Main Screen
        </Button>
      </div>

      {/* Final Round Modal */}
      {showFinalRoundModal && finalRoundMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-auto text-center border-2 border-blue-400">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">Final Round!</h2>
            <p className="text-lg mb-6 text-gray-700 whitespace-pre-line">{finalRoundMessage}</p>
            <Button
              onClick={() => setShowFinalRoundModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150"
            >
              Bring it on!
            </Button>
          </div>
        </div>
      )}

      <UniversalFooter />

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