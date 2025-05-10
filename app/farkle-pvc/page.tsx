"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FarkleScoreTable } from '@/components/farkle/FarkleScoreTable';
import { FarkleDiceArea } from '@/components/farkle/FarkleDiceArea';
import { Button } from '@/components/ui/button';
import { Dice3 } from 'lucide-react';
import { UniversalFooter } from '@/components/common/UniversalFooter';
import { FarkleAI } from '@/components/FarkleAI';
// @ts-ignore - Suppress canvas-confetti type error for now
import confetti from 'canvas-confetti'; // For winner celebration

const MINIMUM_TO_GET_ON_BOARD = 500;
const WINNING_SCORE = 10000;

interface PlayerState {
  total: number;
  isOnBoard: boolean;
  scores: Array<number | null | undefined>; // Allow for undefined scores if not yet recorded
}

// Moved initializePlayerState outside the component to ensure it's stable
const createInitialPlayerState = (): PlayerState => ({ total: 0, isOnBoard: false, scores: [] });

// Updated to return score AND whether any scoring option exists
interface FarkleScoreResult {
  score: number;
  hasScoringOption: boolean;
  // TODO: Later add details about *which* dice scored and combinations
}

function FarklePvPPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [farkleAI] = useState(() => new FarkleAI());
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>(""); // Added state for AI status messages

  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1, 1, 1]);
  const [diceStates, setDiceStates] = useState<Array<'available' | 'held'>>(['available', 'available', 'available', 'available', 'available', 'available']);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRollScore, setCurrentRollScore] = useState(0);
  const [currentTurnTotal, setCurrentTurnTotal] = useState(0);
  const [isFarkle, setIsFarkle] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);

  // State for score accumulation within a turn segment
  const [scoreAtTurnSegmentStart, setScoreAtTurnSegmentStart] = useState(0);

  // State for game over and final round logic
  const [gameOver, setGameOver] = useState(false);
  const [winningPlayerName, setWinningPlayerName] = useState<string | null>(null);
  const [finalRoundTriggeredBy, setFinalRoundTriggeredBy] = useState<number | null>(null);
  const [playersCompletedFinalRound, setPlayersCompletedFinalRound] = useState<boolean[]>([]);
  const [finalRoundNoticeDismissed, setFinalRoundNoticeDismissed] = useState(false); // New state

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

  // Game Over Modal
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Final Round Initiation Notice Modal (Specific Content)
  const [showFinalRoundModal, setShowFinalRoundModal] = useState(false);

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

  // --- Helper for AI Dice Rolling ---
  const rollDiceForAI = (numDice: number): number[] => {
    return Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
  };

  // --- AI Turn Handler ---
  const handleComputerTurn = async () => {
    if (!gameStarted || gameOver || !playerNames.length || playerNames[currentPlayerIndex] !== "Computer" || isComputerThinking) {
      return;
    }

    if (finalRoundTriggeredBy !== null && playerNames[currentPlayerIndex] === "Computer" && !finalRoundNoticeDismissed && !playersCompletedFinalRound[currentPlayerIndex]) {
      console.log("AI is waiting for player to dismiss final round notice.");
      return;
    }

    setIsComputerThinking(true);
    const computerPlayerName = playerNames[currentPlayerIndex] ?? "Computer";
    setAiStatusMessage(`${computerPlayerName} is thinking...`);
    console.log(`%cAI Turn: Player ${currentPlayerIndex + 1} (${computerPlayerName}) starting...`, "color: blue; font-weight: bold;");

    let currentAITurnScore = 0;
    let aiFarkledThisTurn = false;
    
    // Initialize AI's dice based on current game dice (usually all available at turn start)
    let currentAIDiceValuesState = [...diceValues]; // AI starts with a fresh set or current board state if turn was interrupted (not typical here)
    let currentAIDiceStatesState = Array(6).fill('available') as Array<'available' | 'held'>;
    
    setDiceStates(currentAIDiceStatesState); // Ensure UI shows all available at start of AI turn segment
    setDiceValues(currentAIDiceValuesState); // And corresponding values
    setCurrentTurnTotal(0); 
    setIsFarkle(false);     

    await new Promise(res => setTimeout(res, 700)); 

    while (true) { 
      const diceToRollIndices = currentAIDiceStatesState.reduce((acc, state, index) => {
        if (state === 'available') acc.push(index);
        return acc;
      }, [] as number[]);

      if (diceToRollIndices.length === 0) {
        // This should ideally only happen if AI achieved Hot Dice previously and is now about to roll 6
        // Or if AI chose to bank (but that breaks the loop).
        // If it's not hot dice state and no dice to roll, means all are held - AI must bank or has Farkled (already handled).
        // For safety, if AI has 0 dice to roll and it's not because of hot dice, it must bank.
        console.log("AI has no dice to roll and not hot dice. Forcing bank.");
        break; // Break to bank currentAITurnScore
      }

      const numDiceToRollForAI = diceToRollIndices.length;
      setAiStatusMessage(`${computerPlayerName} is rolling ${numDiceToRollForAI} dice...`);
      console.log(`AI rolling ${numDiceToRollForAI} dice: Indices [${diceToRollIndices.join(',')}]`);
      setIsRolling(true); 
      
      const newlyRolledValues = rollDiceForAI(numDiceToRollForAI);
      
      // Update the AI's view of dice values with the newly rolled ones
      const nextAIDiceValuesState = [...currentAIDiceValuesState];
      newlyRolledValues.forEach((value, i) => {
        nextAIDiceValuesState[diceToRollIndices[i]!] = value;
      });
      currentAIDiceValuesState = nextAIDiceValuesState;
      
      await new Promise(res => setTimeout(res, 1000));
      setIsRolling(false); 
      setDiceValues(currentAIDiceValuesState); // Update main UI dice values
      // Dice states are still as they were (some held, some available that were just rolled)

      await new Promise(res => setTimeout(res, 800));

      // AI decides based on the dice that were JUST rolled in this segment
      const decision = farkleAI.decideDiceToKeep(newlyRolledValues, currentAITurnScore);

      if (decision === null) {
        setAiStatusMessage(`${computerPlayerName} FARKLED on this roll!`);
        console.log("%cAI FARKLED this roll!", "color: red; font-weight: bold;");
        // Display the Farkle roll: all dice involved in the roll are available, others remain as they were (held)
        const finalDiceStatesOnFarkle = [...currentAIDiceStatesState];
        diceToRollIndices.forEach(idx => finalDiceStatesOnFarkle[idx] = 'available');
        setDiceStates(finalDiceStatesOnFarkle);
        setDiceValues(currentAIDiceValuesState); // Show the dice that caused the Farkle
        currentAITurnScore = 0; 
        aiFarkledThisTurn = true;
        setIsFarkle(true); 
        await new Promise(res => setTimeout(res, 1800)); 
        break; 
      }

      setAiStatusMessage(`${computerPlayerName} kept: ${decision.descriptionOfKept} (${decision.scoreForKeptDice} pts).`);
      console.log(`AI kept: ${decision.descriptionOfKept} for ${decision.scoreForKeptDice} points from roll [${newlyRolledValues.join(',')}]`);
      
      currentAITurnScore += decision.scoreForKeptDice;
      setCurrentTurnTotal(currentAITurnScore); 

      // Update currentAIDiceStatesState to mark the newly kept dice as 'held'
      // decision.keptDice contains values from newlyRolledValues
      let tempNewlyRolledValues = [...newlyRolledValues];
      let tempDiceToRollIndices = [...diceToRollIndices];

      decision.keptDice.forEach(keptValue => {
        const indexInNewlyRolled = tempNewlyRolledValues.findIndex(d => d === keptValue);
        if (indexInNewlyRolled !== -1) {
          const originalGlobalIndex = tempDiceToRollIndices[indexInNewlyRolled]!;
          currentAIDiceStatesState[originalGlobalIndex] = 'held';
          tempNewlyRolledValues.splice(indexInNewlyRolled, 1);
          tempDiceToRollIndices.splice(indexInNewlyRolled, 1);
        } else {
          console.warn(`AI decision inconsistency: Could not find kept die ${keptValue} in newly rolled dice.`);
        }
      });
      setDiceStates(currentAIDiceStatesState); // Update main UI dice states
      // setDiceValues was already updated with the roll outcome

      // Check for Hot Dice: if all dice in currentAIDiceStatesState are now 'held'
      const allDiceHeld = currentAIDiceStatesState.every(state => state === 'held');
      let diceAvailableForNextAIRollCount;

      if (allDiceHeld) {
        setAiStatusMessage(`${computerPlayerName} got HOT DICE! Rolling all 6 again.`);
        console.log("AI got Hot Dice!");
        currentAIDiceStatesState = Array(6).fill('available'); // All become available
        setDiceStates(currentAIDiceStatesState); // Update UI
        diceAvailableForNextAIRollCount = 6;
        await new Promise(res => setTimeout(res, 1500)); 
      } else {
        diceAvailableForNextAIRollCount = currentAIDiceStatesState.filter(s => s === 'available').length;
      }

      const computerPlayerState = playerStates[currentPlayerIndex];
      const humanPlayerState = playerStates[playerNames.findIndex(name => name !== "Computer")];
      const computerTotalGameScore = computerPlayerState ? computerPlayerState.total : 0;
      const opponentTotalGameScore = humanPlayerState ? humanPlayerState.total : 0;

      if (diceAvailableForNextAIRollCount === 0) {
         // All dice scored or used, but not hot dice (this case means all dice are held)
         // AI Must bank.
         setAiStatusMessage(`${computerPlayerName} used all dice! Must bank ${currentAITurnScore} points.`);
         console.log("AI used all dice or no more dice to roll. Forcing bank.");
         await new Promise(res => setTimeout(res, 1500));
         break;
      }

      if (!farkleAI.shouldRollAgain(
          diceAvailableForNextAIRollCount, 
          currentAITurnScore,
          computerTotalGameScore,
          opponentTotalGameScore 
      )) {
        setAiStatusMessage(`${computerPlayerName} is banking ${currentAITurnScore} points.`);
        console.log(`AI decided to bank ${currentAITurnScore} points.`);
        await new Promise(res => setTimeout(res, 1500)); 
        break; 
      }
      await new Promise(res => setTimeout(res, 1200));
    }

    // Determine the final score the AI will bank for this turn
    let scoreToBankForThisTurn: number;
    if (aiFarkledThisTurn) {
        scoreToBankForThisTurn = 0;
        // AI Farkle message was set inside the roll loop
    } else {
        const currentAIPlayerState = playerStates[currentPlayerIndex]; 
        if (currentAIPlayerState && !currentAIPlayerState.isOnBoard && currentAITurnScore < MINIMUM_TO_GET_ON_BOARD) {
            setAiStatusMessage(`${computerPlayerName} needed ${MINIMUM_TO_GET_ON_BOARD} to get on board, but only scored ${currentAITurnScore}. Score for this turn is 0.`);
            await new Promise(res => setTimeout(res, 2000)); // Hold message
            scoreToBankForThisTurn = 0; 
        } else {
            scoreToBankForThisTurn = currentAITurnScore; 
        }
    }

    // Defer resetting currentTurnTotal/currentRollScore until nextTurn to avoid dash flash when AI triggers final round.
    // setCurrentTurnTotal(0); // Moved to nextTurn()
    // setCurrentRollScore(0); // Moved to nextTurn()

    // Calculate AI's potential new total to check for final round trigger
    const aiPlayerStateBeforeBank = playerStates[currentPlayerIndex];
    let potentialNewTotalForAI = aiPlayerStateBeforeBank ? aiPlayerStateBeforeBank.total : 0;
    let willActuallyBankScore = false; // Flag to see if AI's total will change

    if (scoreToBankForThisTurn > 0) {
        if (aiPlayerStateBeforeBank && (aiPlayerStateBeforeBank.isOnBoard || scoreToBankForThisTurn >= MINIMUM_TO_GET_ON_BOARD)) {
            potentialNewTotalForAI += scoreToBankForThisTurn;
            willActuallyBankScore = true;
        }
    }
    // If scoreToBankForThisTurn is 0, potentialNewTotalForAI remains unchanged.

    const shouldComputerTriggerFinalRound = potentialNewTotalForAI >= WINNING_SCORE && finalRoundTriggeredBy === null;

    // If AI is triggering the final round, set thinking to false BEFORE updating player states that cause re-render.
    // REVERTING THIS - caused immediate re-trigger
    // if (shouldComputerTriggerFinalRound) {
    //     console.log(`[handleComputerTurn] AI is about to trigger final round. Setting isComputerThinking to false early.`);
    //     setIsComputerThinking(false);
    // }

    // Now, update playerStates with the determined scoreToBankForThisTurn
    setPlayerStates(prevPlayerStates => {
        return prevPlayerStates.map((ps, index) => {
            if (index === currentPlayerIndex) {
                let newTotal = ps.total;
                let newIsOnBoard = ps.isOnBoard;
                if (scoreToBankForThisTurn > 0) { 
                    if (ps.isOnBoard || scoreToBankForThisTurn >= MINIMUM_TO_GET_ON_BOARD) {
                        newTotal += scoreToBankForThisTurn;
                        newIsOnBoard = true;
                    }
                }
                const scores = Array.isArray(ps.scores) ? ps.scores : [];
                console.log(`%cAI turn recorded: Player ${playerNames[index]}, Score for this turn: ${scoreToBankForThisTurn}, Prev Total: ${ps.total}, New Total: ${newTotal}, IsOnBoard: ${newIsOnBoard}`, "color: green; font-weight: bold;");
                return {
                    ...ps,
                    total: newTotal,
                    isOnBoard: newIsOnBoard,
                    scores: [...scores, scoreToBankForThisTurn]
                };
            }
            return ps;
        });
    });
    
    // Update status message based on the outcome
    if (willActuallyBankScore) { // Use the flag here, as scoreToBankForThisTurn > 0 doesn't mean total changed (if not on board)
        setAiStatusMessage(`${computerPlayerName} banked ${scoreToBankForThisTurn} points. Total: ${potentialNewTotalForAI}`);
        await new Promise(res => setTimeout(res, 1800));
    } // Messages for Farkle or not getting on board (where scoreToBankForThisTurn becomes 0) are handled above or in roll loop

    // If this was the AI's turn in the final round, or if AI is triggering it.
    if (shouldComputerTriggerFinalRound) {
        console.log(`[handleComputerTurn] Computer (${playerNames[currentPlayerIndex]}) IS TRIGGERING the final round with ${potentialNewTotalForAI} points!`);
        // setIsComputerThinking(false); // Reverted - moved back to end
        setFinalRoundTriggeredBy(currentPlayerIndex); // AI is triggering
        const initialCompletion = Array(playerNames.length).fill(false);
        if (currentPlayerIndex >= 0 && currentPlayerIndex < initialCompletion.length) {
            initialCompletion[currentPlayerIndex] = true; // Mark AI as completed their triggering turn
        }
        setPlayersCompletedFinalRound(initialCompletion);
        setFinalRoundNoticeDismissed(false); // Ensure the notice will show
    } else if (finalRoundTriggeredBy !== null) { // Final round was already active, AI is completing its turn
        console.log(`[handleComputerTurn] AI (${playerNames[currentPlayerIndex]}) completed its final round turn (already active).`);
        setPlayersCompletedFinalRound(prevCompletion => {
            const newCompletion = [...prevCompletion];
            if (newCompletion.length > currentPlayerIndex && currentPlayerIndex >= 0) {
                newCompletion[currentPlayerIndex] = true;
            } else {
                console.warn(`[handleComputerTurn] Attempted to update final round completion for invalid AI index: ${currentPlayerIndex}, length: ${newCompletion.length}`);
            }
            console.log(`[handleComputerTurn] Updated playersCompletedFinalRound after AI turn:`, JSON.parse(JSON.stringify(newCompletion)));
            return newCompletion;
        });
        // Ensure isComputerThinking is false if it wasn't set earlier (e.g. AI completes an already active final round)
        // Reverted - Setting this later now
        // if (isComputerThinking) setIsComputerThinking(false); 
    } else {
        // Normal turn, not a final round scenario for the AI
        // Reverted - Setting this later now
        // setIsComputerThinking(false);
    }

    // SET isComputerThinking to false AFTER all processing for the turn is done, right before advancing.
    setIsComputerThinking(false);

    // AiStatusMessage will be cleared in nextTurn() or when human player starts their action.
    
    checkForGameEndOrAdvanceTurn();
  };

  // Effect to trigger AI turn
  useEffect(() => {
    // --- ADDED: Absolute check for gameOver first --- 
    if (gameOver) {
      console.log("[AI useEffect] Game is over, preventing AI turn trigger.");
      return; 
    }
    // --------------------------------------------------

    // Ensure playerNames is populated before checking playerNames[currentPlayerIndex]
    // ADDED Check: Do not trigger AI if final round was JUST triggered by AI (wait for notice dismissal)
    const justTriggeredByAI = finalRoundTriggeredBy === currentPlayerIndex && !finalRoundNoticeDismissed;

    if (gameStarted && 
        playerNames.length > 0 && 
        playerNames[currentPlayerIndex] === "Computer" && 
        !isComputerThinking && 
        !gameOver &&
        !justTriggeredByAI) { // <-- Added condition
      console.log("useEffect triggering AI turn");
      handleComputerTurn();
    }
    // Adding handleComputerTurn to dependencies if it's stable (e.g., wrapped in useCallback or defined outside if static)
    // For now, keeping dependencies simple. If handleComputerTurn causes re-renders, we'll optimize.
  }, [currentPlayerIndex, gameStarted, playerNames, isComputerThinking, gameOver, finalRoundTriggeredBy, finalRoundNoticeDismissed]); // Added final round state dependencies

  // useEffect for player initialization - THIS IS THE NEW/MODIFIED HOOK
  useEffect(() => {
    const humanPlayerNameFromParams = searchParams.get("playerName") || "Player 1";
    const initialNames = [humanPlayerNameFromParams, "Computer"];
    
    console.log("[PlayerInit] Setting player names to:", initialNames);
    setPlayerNames(initialNames);

    let initialStates = initialNames.map(() => createInitialPlayerState()); 

    // Debug Mode: Start Player 1 near winning score
    const debugEndGame = searchParams.get("debug_endgame") === "true";
    if (debugEndGame) {
      console.log("%c[PlayerInit] DEBUG ENDGAME MODE ACTIVATED: Both players start near winning score.", "color: orange; font-weight: bold;");
      initialNames.forEach((name, index) => {
        if (initialStates[index]) {
          initialStates[index]!.total = 9800;
          initialStates[index]!.isOnBoard = true;
          console.log(`%c   -> ${name} starts at 9800 points.`, "color: orange;");
        }
      });
    }

    console.log("[PlayerInit] Setting player states to:", JSON.stringify(initialStates));
    setPlayerStates(initialStates);

    setPlayersCompletedFinalRound(new Array(initialNames.length).fill(false));
    setTieBreakerRoundCompleted(new Array(initialNames.length).fill(false));

    if (!gameStarted) {
      console.log("[PlayerInit] Game not started. Starting game and setting current player to 0.");
      setGameStarted(true);
      setCurrentPlayerIndex(0);
    }
  // createInitialPlayerState is now stable (defined outside), so not needed in dependency array.
  }, [searchParams, gameStarted]);

  // --- Game Flow Functions ---
  // Define endGame function BEFORE the useEffect that uses it
  const endGame = () => {
    // --- Add Log ---
    console.log(
      `[endGame - START] Game over condition met. playerStates: ${JSON.stringify(playerStates.map(p => ({ name: playerNames[playerStates.indexOf(p)], total: p.total, isOnBoard: p.isOnBoard, scores: p.scores })))}`
    );
    // ---------------
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

  // NEW useEffect to handle game end check after final round state updates
  useEffect(() => {
    // --- Add Log ---
    console.log(
      `[useEffect CheckForEnd - START] finalRoundTriggeredBy: P${finalRoundTriggeredBy}, gameOver: ${gameOver}. playersCompletedFinalRound: ${JSON.stringify(playersCompletedFinalRound)}. playerStates: ${JSON.stringify(playerStates.map(p => ({ total: p.total, isOnBoard: p.isOnBoard })))}
      `
    );
    // ---------------
    // Only run this check if the final round is active and the game isn't already over
    if (finalRoundTriggeredBy !== null && !gameOver) {
      console.log(`[useEffect CheckForEnd] Final round active (P${finalRoundTriggeredBy}). Checking completion: ${JSON.stringify(playersCompletedFinalRound)}`);
  
      // Check if the playersCompletedFinalRound array is fully populated and all are true
      const allPlayersAccountedFor = playersCompletedFinalRound.length === playerNames.length;
      const allTurnsCompleted = allPlayersAccountedFor && playersCompletedFinalRound.every(completed => completed);
  
      if (allTurnsCompleted) {
        // --- Add Log ---
        console.log(
          `[useEffect CheckForEnd - PRE endGame()] All turns completed. Calling endGame(). finalRoundTriggeredBy: P${finalRoundTriggeredBy}, playersCompletedFinalRound: ${JSON.stringify(playersCompletedFinalRound)}. playerStates: ${JSON.stringify(playerStates.map(p => ({ total: p.total, isOnBoard: p.isOnBoard })))}
          `
        );
        // ---------------
        console.log("[useEffect CheckForEnd] All players completed final turn. Ending game.");
        endGame(); // Call endGame from the effect after state has updated
      } else {
         console.log("[useEffect CheckForEnd] Not all players completed final turn yet.");
         // Do NOT call nextTurn() here. Turn advancement happens immediately after bank/farkle
         // if the game didn't end.
      }
    }
    // Ensure stable functions like endGame are included if defined within the component and not memoized.
    // Assuming endGame is stable (defined outside or wrapped in useCallback if necessary).
  }, [playersCompletedFinalRound, finalRoundTriggeredBy, gameOver, playerNames.length, endGame]); // Added relevant dependencies

  // REVISED checkForGameEndOrAdvanceTurn
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

    // If final round is active, check for completion *using the latest logic*
    if (finalRoundTriggeredBy !== null) {
      console.log(`[CheckForEnd REVISED] Final round active (P${finalRoundTriggeredBy}). Checking completion: ${JSON.stringify(playersCompletedFinalRound)}`);
      // Calculate the completion status based on the *current* state
      // Note: This might still read slightly stale state due to async nature right after set state.
      // The useEffect approach is generally safer for reacting *after* state update.
      // Let's stick to the useEffect approach for ending the game.
      // This function will only advance the turn if the game hasn't ended.
      
      // Determine if the game should end based on calculated next state (SAFER APPROACH)
      // This requires passing the potentially updated completion status to this function.
      // ALTERNATIVE: Stick to useEffect ending the game. This function ONLY calls nextTurn if game not over.
      if (!gameOver) {
        // If the useEffect hasn't set gameOver=true yet, we advance.
        console.log("[CheckForEnd REVISED] Final round active, game not marked over yet. Advancing turn.");
        nextTurn(); 
      } else {
        console.log("[CheckForEnd REVISED] Final round active, but game is marked over. No turn advance.");
      }
    } else if (!gameOver) { // Normal game flow (no final round, game not over)
      console.log("[CheckForEnd REVISED] Normal game flow. Advancing turn.");
      nextTurn();
    } else {
      // Game is over, do nothing.
      console.log("[CheckForEnd REVISED] Game is over. No turn advance.");
    }
  };

  const nextTurn = () => {
    if (gameOver && !isTieBreakerActive) {
      console.log("[nextTurn] Game is over and not in tie-breaker. No next turn.");
      return;
    } 
    // If tie-breaker is active, it has its own game over conditions within its flow.
    // If game is over AND tie-breaker also resolved to game over, this initial check handles it.

    // This log was already present, good for confirming state.
    // if (gameOver && isTieBreakerActive) { 
    //     console.log("[nextTurn] Game is definitively over, even post-tie-breaker. No next turn.");
    //     return;
    // }

    setCurrentRollIndices([]); 
    setCurrentTurnTotal(0); // Reset live scores for the incoming player
    setCurrentRollScore(0); // Reset live scores for the incoming player
    setDiceStates(Array(6).fill('available'));
    setDiceValues([1, 1, 1, 1, 1, 1]); 
    setIsFarkle(false);
    setAiStatusMessage(""); // Clear AI message at the start of any turn transition

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
        potentialNextPlayerActualIndex = tieBreakerPlayerIndices[0];
      } else {
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
        if (playerNames.length === 0) {
            console.error("[nextTurn] playerNames is empty. Cannot determine next player index.");
            return 0; // Fallback, though this state should be avoided
        }
        const nextPlayer = (prevIndex + 1) % playerNames.length;
        console.log(`[nextTurn] Standard: PrevIndex: ${prevIndex}, PlayerNames.length: ${playerNames.length}, NextPlayerIndex: ${nextPlayer}`);
        // Ensure playerNames[nextPlayer] exists before trying to log it, though the modulo should keep it in bounds.
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

      // --- ADDED SPECIFIC LOG FOR HOT DICE ROLL ---
      console.log(
        `%c[HOT DICE ROLL EVALUATION] Rolled: [${justRolledDiceValues.join(', ')}] -> ScoreResult: { score: ${scoreResult.score}, hasScoringOption: ${scoreResult.hasScoringOption} }`,
        "color: magenta; font-weight: bold; font-size: 1.1em;"
      );
      // -------------------------------------------

      console.log('Hot Dice Roll Values:', newDiceValues); // Keep existing log too
      console.log('Hot Dice Score Result:', scoreResult); // Keep existing log too

      let farkleDetected = false;
      if (!scoreResult.hasScoringOption) {
        console.log("HOT DICE FARKLE! Turn total reset.");
        setCurrentTurnTotal(0); // Lose everything from the turn
        farkleDetected = true;
        setIsFarkle(true); 
        setCurrentRollScore(0);
      } else { // Scored on Hot Dice roll
        console.log(`[Hot Dice Roll] Scored. currentTurnTotal before this segment: ${currentTurnTotal}. New roll score: ${scoreResult.score}`);
        setScoreAtTurnSegmentStart(currentTurnTotal); // Capture the score accumulated *before* this specific hot dice roll segment
        setCurrentRollScore(scoreResult.score);      // Score of the dice *just rolled* in the hot dice roll
        setMustSelectDie(true);
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

    // --- MODIFIED LOGGING for better visibility of dice values ---
    console.log('Rolled Dice Values (full set):', JSON.stringify(newDiceValues)); 
    console.log('Dice Just Rolled (current segment):', JSON.stringify(justRolledDiceValues));
    console.log('Score Result for Just Rolled:', JSON.stringify(scoreResult));
    // --- END MODIFIED LOGGING ---

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
        // Normal Farkle or Hot Dice Farkle - record score 0 and advance
        setPlayerStates(prev => 
          prev.map((ps, index) => {
            if (index === currentPlayerIndex) {
              const currentScores = Array.isArray(ps.scores) ? ps.scores : [];
              return { ...ps, scores: [...currentScores, 0] }; 
            }
            return ps;
          })
        );

        // If Farkle occurs during a final round, mark this player's final turn as completed
        if (finalRoundTriggeredBy !== null) {
          setPlayersCompletedFinalRound(prevCompletion => {
            const newCompletion = [...prevCompletion];
            if (playerNames.length > 0 && currentPlayerIndex >= 0 && currentPlayerIndex < newCompletion.length) {
              newCompletion[currentPlayerIndex] = true;
              console.log(`[handleRollDice - Farkle in Final Round] Player ${playerNames[currentPlayerIndex]} (Index: ${currentPlayerIndex}) completed final round due to Farkle. Completion:`, newCompletion);
            } else {
              console.warn("[handleRollDice - Farkle in Final Round] Could not update final round completion: Invalid index or playerNames empty.");
            }
            return newCompletion;
          });
        }

        console.log("Advancing turn due to Farkle (from handleRollDice)...");
        checkForGameEndOrAdvanceTurn(); 
      }
    }, farkleDetected ? 1500 : 500); 
  };

  const handleToggleHold = (index: number) => {
    if (isRolling) {
      console.log("[ToggleHold] Cannot interact during roll.");
      return;
    }

    if (mustSelectDie) {
      // --- Phase 1: Must select scoring dice from the current roll segment ---
      // Player MUST interact with dice from the currentRollIndices.
      if (!currentRollIndices.includes(index)) {
        console.log("[ToggleHold - MustSelect] Clicked die is not part of the current roll segment. Ignoring.");
        return; // Ignore clicks on dice not in the current active roll segment
      }

      const newTentativeDiceStates = [...diceStates];
      newTentativeDiceStates[index] = diceStates[index] === 'held' ? 'available' : 'held';
      setDiceStates(newTentativeDiceStates); // Commit toggle for die in current roll segment

      // Evaluate based on held dice *from the current roll segment*
      const currentSegmentHeldIndices = currentRollIndices.filter(i => newTentativeDiceStates[i] === 'held');
      const currentSegmentHeldValues = currentSegmentHeldIndices.map(i => diceValues[i]).filter((v): v is number => v !== undefined);
      const { score: currentSegmentScore, hasScoringOption: segmentHasScore } = calculateFarkleScore(currentSegmentHeldValues);

      console.log(`[ToggleHold - MustSelect] Index: ${index}, Current Segment Selection: ${JSON.stringify(currentSegmentHeldValues)}, Segment Score: ${currentSegmentScore}, Has Score: ${segmentHasScore}`);
      
      setCurrentTurnTotal(scoreAtTurnSegmentStart + currentSegmentScore);
      setCurrentRollScore(currentSegmentScore);

      if (segmentHasScore && currentSegmentScore > 0) {
        setMustSelectDie(false); 
        console.log(`   -> VALID scoring selection from current roll. Segment score: ${currentSegmentScore}. 'mustSelectDie' is now false.`);
      } else {
        console.log(`   -> Current selection from roll segment does not score. 'mustSelectDie' remains true.`);
        // mustSelectDie remains true, player needs to form a scoring selection from currentRollIndices
      }

      // Universal Hot Dice Check: After any valid toggle, check if ALL 6 dice are held and score.
      // This check is performed regardless of whether mustSelectDie just became false or was already false.
      const allSixDiceHeld = newTentativeDiceStates.every(state => state === 'held');
      if (allSixDiceHeld) {
        const allSixHeldDiceValues = diceValues.filter((val, i) => newTentativeDiceStates[i] === 'held');
        
        // Use FarkleAI to properly evaluate if all 6 held dice score and are fully utilized
        const aiEvaluation = farkleAI.decideDiceToKeep(allSixHeldDiceValues, 0); // currentTurnScore arg is not critical here

        if (aiEvaluation !== null && aiEvaluation.scoreForKeptDice > 0 && aiEvaluation.remainingDiceToRoll.length === 0) {
          console.log("   -> HOT DICE! All 6 dice are held and fully utilized in scoring combinations.");
          setCanRollHotDice(true);
        } else {
          let reason = "Not all 6 dice were fully utilized in scoring.";
          if (aiEvaluation === null || aiEvaluation.scoreForKeptDice === 0) {
            reason = "The 6 held dice do not form any score.";
          } else if (aiEvaluation.remainingDiceToRoll.length > 0) {
            reason = `Only ${6 - aiEvaluation.remainingDiceToRoll.length} of 6 held dice scored. Remaining: [${aiEvaluation.remainingDiceToRoll.join(',')}]`;
          }
          console.log(`   -> All 6 dice held, but NO Hot Dice. Reason: ${reason}`);
          setCanRollHotDice(false);
        }
      } else {
        setCanRollHotDice(false); // Not all 6 dice are held
      }

    } else {
      // --- Phase 2: Optionally adding more dice or unselecting (mustSelectDie is false) ---
      // Player has already made a valid selection from currentRollIndices for the current segment.
      // They can now toggle any die *within the currentRollIndices* to refine their selection for *this segment*,
      // or toggle dice *outside* currentRollIndices (previously scored dice) if we want to allow that (complex, not current design).
      // For now, let's assume they are still refining selection for the current segment or preparing to roll again.

      const newTentativeDiceStates = [...diceStates];
      newTentativeDiceStates[index] = diceStates[index] === 'held' ? 'available' : 'held';
      setDiceStates(newTentativeDiceStates); // Commit toggle

      // Score is based on dice selected *from the current roll segment* added to score accumulated *before* this segment.
      const currentSegmentHeldValues = currentRollIndices
        .filter(i => newTentativeDiceStates[i] === 'held')
        .map(i => diceValues[i])
        .filter((v): v is number => v !== undefined);
      
      const { score: currentSegmentScore, hasScoringOption: segmentHasScore } = calculateFarkleScore(currentSegmentHeldValues);
      
      console.log(`[ToggleHold - Optional] Index: ${index}, Current Segment Selection: ${JSON.stringify(currentSegmentHeldValues)}, Segment Score: ${currentSegmentScore}, Has Score: ${segmentHasScore}`);
      
      // currentTurnTotal is the score before this segment (scoreAtTurnSegmentStart) + score of what's selected from this segment.
      setCurrentTurnTotal(scoreAtTurnSegmentStart + currentSegmentScore);
      setCurrentRollScore(currentSegmentScore); // Roll score is just for this segment.

      // Universal Hot Dice Check (same as above)
      const allSixDiceHeldInOptionalPhase = newTentativeDiceStates.every(state => state === 'held');
      if (allSixDiceHeldInOptionalPhase) {
        const allSixHeldDiceValuesInOptionalPhase = diceValues.filter((val, i) => newTentativeDiceStates[i] === 'held');
        
        // Use FarkleAI for robust check
        const aiEvaluationOptional = farkleAI.decideDiceToKeep(allSixHeldDiceValuesInOptionalPhase, 0);

        if (aiEvaluationOptional !== null && aiEvaluationOptional.scoreForKeptDice > 0 && aiEvaluationOptional.remainingDiceToRoll.length === 0) {
          console.log("   -> HOT DICE! All 6 dice are held and fully utilized (optional phase).");
          setCanRollHotDice(true);
        } else {
          let reason = "Not all 6 dice were fully utilized in scoring (optional phase).";
          if (aiEvaluationOptional === null || aiEvaluationOptional.scoreForKeptDice === 0) {
            reason = "The 6 held dice do not form any score (optional phase).";
          } else if (aiEvaluationOptional.remainingDiceToRoll.length > 0) {
            reason = `Only ${6 - aiEvaluationOptional.remainingDiceToRoll.length} of 6 held dice scored. Remaining: [${aiEvaluationOptional.remainingDiceToRoll.join(',')}] (optional phase)`;
          }
          console.log(`   -> All 6 dice held, but NO Hot Dice. Reason: ${reason}`);
          setCanRollHotDice(false);
        }
      } else {
        setCanRollHotDice(false); // Not all 6 dice are held
      }
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
      // --- Refactored Final Round Trigger Logic ---
      const currentTotal = currentPlayerState.total; 
      const newTotal = currentTotal + scoreToBank;

      let isFRTBActuallyNullForThisCheck = finalRoundTriggeredBy === null;
      // Check for premature setting of finalRoundTriggeredBy specifically in debug/edge cases
      if (finalRoundTriggeredBy === currentPlayerIndex && currentTotal < WINNING_SCORE) {
          console.warn(`[handleBankScore] Correcting a potentially premature finalRoundTriggeredBy for player ${playerNames[currentPlayerIndex]}. Treating as null for this bank's trigger check.`);
          isFRTBActuallyNullForThisCheck = true;
      }

      const shouldTriggerFinalRound = newTotal >= WINNING_SCORE && isFRTBActuallyNullForThisCheck;
      console.log(`[handleBankScore - Pre-Check] Player ${playerNames[currentPlayerIndex]} banking ${scoreToBank}. Current: ${currentTotal}, NewTotal: ${newTotal}. Orig FRTB: ${finalRoundTriggeredBy}, isFRTBNullForCheck: ${isFRTBActuallyNullForThisCheck}, ShouldTriggerFinalRound: ${shouldTriggerFinalRound}`);
      // -----------------------------------------

      // Update player scores and totals first
      setPlayerStates(prev => {
        console.log(`[handleBankScore - setPlayerStates START] Prev playerStates for P${currentPlayerIndex}:`, JSON.parse(JSON.stringify(prev[currentPlayerIndex])));
        return prev.map((ps, index) => {
          if (index === currentPlayerIndex) {
            // Use the pre-calculated newTotal
            const updatedPlayerState = { 
              ...ps, 
              total: newTotal, 
              isOnBoard: true, 
              scores: [...ps.scores, scoreToBank]
            };
            console.log(`After update for ${playerNames[currentPlayerIndex]}, newTotal: ${newTotal}, scores:`, JSON.stringify(updatedPlayerState.scores));
            // Log if the condition *would* have been met here (for comparison/debug)
            if (newTotal >= WINNING_SCORE && finalRoundTriggeredBy === null) {
              console.log(`[handleBankScore - setPlayerStates] Condition met internally for Player ${playerNames[currentPlayerIndex]}. Actual trigger happens after state update.`);
            }
            return updatedPlayerState;
          }
          return ps;
        });
      });

      // Now, handle final round state updates based on the pre-calculated condition
      if (shouldTriggerFinalRound) { // Use the boolean calculated *before* setPlayerStates
        console.log(`[handleBankScore - Post-Update Check] Triggering final round for Player ${playerNames[currentPlayerIndex]}. Setting finalRoundTriggeredBy = ${currentPlayerIndex}`);
        setFinalRoundTriggeredBy(currentPlayerIndex);
        const initialCompletion = Array(playerNames.length).fill(false);
        if (currentPlayerIndex < initialCompletion.length) {
            initialCompletion[currentPlayerIndex] = true;
        }
        setPlayersCompletedFinalRound(initialCompletion);
        setFinalRoundNoticeDismissed(false);
      } else if (finalRoundTriggeredBy !== null) { // Final round was already active, current player is completing their turn
        console.log(`[handleBankScore - Post-Update Check] Final round was active (triggered by P${finalRoundTriggeredBy}). Player ${playerNames[currentPlayerIndex]} completed their final round turn.`);
        setPlayersCompletedFinalRound(prevCompletion => {
          const newCompletion = [...prevCompletion];
          if (currentPlayerIndex < newCompletion.length) {
            newCompletion[currentPlayerIndex] = true;
          }
          console.log("[handleBankScore] Updated playersCompletedFinalRound:", JSON.parse(JSON.stringify(newCompletion)));
          return newCompletion;
        });
      }

      // Log banked points (acknowledging potential staleness of direct state read here)
      const loggedPlayerState = playerStates[currentPlayerIndex]; // This read might still be stale right after setPlayerStates
      const loggedTotal = newTotal; // Use the reliably calculated newTotal for this log
      console.log(`${playerNames[currentPlayerIndex]} banked ${scoreToBank} points! New Total should be: ${loggedTotal}`);
      
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
    setPlayerStates(playerNames.map(() => createInitialPlayerState()));
    setIsFarkle(false);
    setGameOver(false);
    setWinningPlayerName(null);
    setFinalRoundTriggeredBy(null);
    setPlayersCompletedFinalRound(playerNames.map(() => false)); 
    setMustSelectDie(false);
    setFinalRoundNoticeDismissed(false); // Reset on game reset
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
    setFinalRoundNoticeDismissed(false); // Reset on game reset
    // Reset Tie-Breaker States
    setIsTieBreakerActive(false);
    setTieBreakerPlayerIndices([]);
    setTieBreakerTurnScores({});
    setTieBreakerRoundCompleted([]);
    router.push('/'); 
    console.log("Game reset, redirecting for new players.");
  };

  // Load player names from URL search params
  /* COMMENTING OUT THIS GENERIC PLAYER LOADING useEffect as it conflicts with PvC setup
  useEffect(() => {
    const namesQueryParam = searchParams.get('players');
    if (namesQueryParam) {
      try {
        const names = JSON.parse(namesQueryParam);
        if (Array.isArray(names) && names.every(name => typeof name === 'string') && names.length > 0) {
          setPlayerNames(names);
          setPlayerStates(names.map(() => createInitialPlayerState()));
        } else {
          console.error("Player names from URL are invalid. Expected a non-empty array of strings.");
          router.push('/'); 
        }
      } catch (error) {
        console.error("Failed to parse player names from URL:", error);
        router.push('/'); 
      }
    } else {
      console.warn("No player names found in URL. This is normal for PvC mode if not expecting URL params here.");
      // For PvC, we don't necessarily push to '/' if players param is missing,
      // as the dedicated PvC useEffect should handle setup.
      // router.push('/'); 
    }
    // setGameStarted(true); // This might also conflict if PvC setup handles it.
  }, [searchParams, router]);
  */

  // useEffect to handle AI's turn after final round notice is dismissed
  useEffect(() => {
    if (finalRoundNoticeDismissed && 
        finalRoundTriggeredBy !== null && 
        playerNames[currentPlayerIndex] === "Computer" && 
        !playersCompletedFinalRound[currentPlayerIndex] && 
        !gameOver &&
        !isComputerThinking) { // Ensure AI isn't already thinking
      console.log("Final round notice dismissed, and it is Computer's turn. Triggering AI turn.");
      handleComputerTurn();
    }
  }, [finalRoundNoticeDismissed, currentPlayerIndex, finalRoundTriggeredBy, playerNames, playersCompletedFinalRound, gameOver, isComputerThinking]);

  useEffect(() => {
    // This effect will control the visibility of the "Final Round Initiated" modal
    if (finalRoundTriggeredBy !== null && !gameOver && !finalRoundNoticeDismissed) {
      // Check if it's the *other* player's turn to see the notice,
      // or if it's the AI that triggered it, the human should see it.
      const humanPlayerIndex = playerNames.findIndex(name => name !== "Computer");
      const computerPlayerIndex = playerNames.findIndex(name => name === "Computer");

      if (finalRoundTriggeredBy === humanPlayerIndex && currentPlayerIndex === computerPlayerIndex) {
        // Human triggered, it's now computer's turn (but AI will wait due to `handleComputerTurn` logic)
        // The notice should be shown to the human that AI gets a final turn.
        setShowFinalRoundModal(true);
      } else if (finalRoundTriggeredBy === computerPlayerIndex && currentPlayerIndex === humanPlayerIndex) {
        // Computer triggered, it's now human's turn.
        // The notice should be shown to the human that they get a final turn.
        setShowFinalRoundModal(true);
      } else if (finalRoundTriggeredBy === currentPlayerIndex && !playersCompletedFinalRound[currentPlayerIndex]) {
        // This case handles if the player who triggered is the one currently up, and they haven't seen the notice.
        // (e.g. page refresh, or if the notice wasn't shown immediately upon banking)
        // This might be redundant if the above cases cover it, but good as a fallback.
        setShowFinalRoundModal(true);
      } else {
        setShowFinalRoundModal(false);
      }
    } else {
      setShowFinalRoundModal(false);
    }
  }, [finalRoundTriggeredBy, gameOver, finalRoundNoticeDismissed, currentPlayerIndex, playerNames, playersCompletedFinalRound]);

  useEffect(() => {
    if (gameOver && !isTieBreakerActive) {
      setShowGameOverModal(true);
    } else {
      setShowGameOverModal(false); // Hide if game not over or if tie-breaker is active
    }
  }, [gameOver, isTieBreakerActive]);

  const handleDismissFinalRoundNotice = () => {
    setFinalRoundNoticeDismissed(true);
    setShowFinalRoundModal(false); // Explicitly hide modal
    // The useEffect above will now trigger the AI's turn if appropriate.
  };

  // useEffect for Confetti on Game Over
  useEffect(() => {
    if (showGameOverModal && winningPlayerName) {
      // @ts-ignore
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, scalar: 1.2 });
      // You can try a second burst for more effect
      setTimeout(() => {
        // @ts-ignore
        confetti({ particleCount: 100, spread: 160, origin: { y: 0.5 }, angle: Math.random() * 180 - 90});
      }, 300);
    }
  }, [showGameOverModal, winningPlayerName]);

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
          isComputerThinking={isComputerThinking}
        />
      </div>

      {/* --- AI Status Message Area --- ALWAYS VISIBLE */}
      <div className="text-center mb-4 p-3 bg-white border border-gray-200 text-gray-800 rounded-lg shadow-sm w-full max-w-2xl mx-auto">
        <h4 className="text-sm font-medium text-gray-500 mb-1 tracking-wider">MY TURN, HUMAN!</h4>
        <p className="font-semibold text-lg min-h-[1.75rem]">
          {aiStatusMessage || "—"}
        </p>
      </div>

      {/* Score Table */}
      <div className="w-full max-w-4xl mt-4 mb-6"> {/* Outer wrapper */}
        {playerNames.length > 0 && playerStates.length > 0 && (
          <div className="w-full max-w-2xl mx-auto"> {/* Inner wrapper - ADDED mx-auto HERE */}
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
              showFinalTallyModal={false} 
              winningPlayerName={winningPlayerName}
              gameMessage={null}
              winningScore={WINNING_SCORE}
              onCloseFinalTallyModal={() => { 
                console.log("Final tally modal closed by user. Resetting game with same players.");
                handleResetGameSamePlayers(); // Call the reset function
              }} 
              showRulesModal={showRulesModal} 
              onToggleRulesModal={toggleShowRulesModal}
              scoreEntryMode="auto"
              isComputerThinking={playerNames[currentPlayerIndex] === 'Computer' && isComputerThinking} // Pass this down
              showFinalRoundModal={showFinalRoundModal} // Pass down the state controlling the main final round modal
              onEditBankedScore={() => {}} 
              showConfirmModal={false} 
              onConfirmScoreChange={() => {}} 
              onCancelScoreEdit={() => {}} 
              editModalValue="" 
              onEditModalValueChange={() => {}} 
              selectedCellToEdit={null} 
              showFinalRoundInitiationNotice={false} // Ensure this is false
              finalRoundInitiationMessage={null} // Can be nulled out as it won't show
              onDismissFinalRoundInitiationNotice={handleDismissFinalRoundNotice} // Keep for safety, though modal won't show
            />
          </div>
        )}
      </div>

      {/* Container for reset buttons - constraining width and centering */}
      <div className="mt-3 mb-1 w-full max-w-md mx-auto flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
        <Button 
          onClick={handleResetGameSamePlayers} 
          // Ensuring full width on mobile, auto on larger screens within the flex row
          className="w-full sm:flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out"
        >
          Exit to Main Screen
        </Button>
        <Button 
          onClick={handleResetGameToNewPlayers} 
          // Ensuring full width on mobile, auto on larger screens within the flex row
          className="w-full sm:flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out"
        >
          Exit to Main Screen
        </Button>
      </div>

      {/* Final Round Initiation Notice Modal */}
      {showFinalRoundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-xl shadow-2xl text-white max-w-md mx-4 transform transition-all duration-300 ease-out scale-100">
            <h2 className="text-3xl font-bold mb-6 text-center">Final Round!</h2>
            <p className="mb-6 text-lg text-center leading-relaxed">
              {finalRoundTriggeredBy !== null && playerNames[finalRoundTriggeredBy] ?
                (playerNames[finalRoundTriggeredBy] !== 'Computer' ?
                  `Congratulations, ${playerNames[finalRoundTriggeredBy]}! You've reached ${WINNING_SCORE} points! The Computer gets one more turn to try and beat your score.` :
                  `${playerNames[finalRoundTriggeredBy]} has reached ${WINNING_SCORE} points! You get one more turn to improve your score. Good luck!`
                ) : "The final round has begun!"}
            </p>
            <Button
              onClick={handleDismissFinalRoundNotice}
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-white focus:ring-opacity-75 py-3 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 hover:scale-105"
            >
              Okay
            </Button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-xl shadow-2xl text-white max-w-md mx-4 transform transition-all duration-300 ease-out scale-100">
            <h2 className="text-3xl font-bold mb-6 text-center">Game Over!</h2>
            <p className="mb-6 text-lg text-center leading-relaxed">
              {winningPlayerName ?
                `${winningPlayerName} wins the game!` :
                "The game has ended."}
              {/* Display scores if available */}
              {playerNames.map((name, index) => (
                <span key={index} className="block text-sm mt-1">
                  {name}: {playerStates[index]?.total || 0} points
                </span>
              ))}
            </p>
            <Button
              onClick={() => {
                setShowGameOverModal(false); // Hide modal first
                handleResetGameSamePlayers();
              }}
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-white focus:ring-opacity-75 py-3 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 hover:scale-105 mt-4"
            >
              Reset Game
            </Button>
            <Button
              onClick={() => {
                setShowGameOverModal(false); // Hide modal first
                handleResetGameToNewPlayers(); 
              }}
              className="w-full bg-transparent border border-white text-white hover:bg-white hover:text-indigo-600 focus:ring-2 focus:ring-white focus:ring-opacity-75 py-3 text-lg font-semibold rounded-lg shadow-md transition-transform duration-150 hover:scale-105 mt-3"
            >
              Exit to Main Screen
            </Button>
            <Button
              onClick={() => router.push('/')} // Navigate to homepage or game selection
              className="w-full bg-transparent text-white hover:bg-white/20 focus:ring-2 focus:ring-white focus:ring-opacity-50 py-3 text-sm font-medium rounded-lg mt-3"
            >
              Back to Game Selection
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