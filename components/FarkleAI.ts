type DiceValues = number[];

// Strategy Constants for FarkleAI
const MIN_SCORE_TO_GET_ON_BOARD = 500;
const SAFE_BANK_SCORE_HIGH = 1000;       // If current turn score is this high, strong bias to bank
const SAFE_BANK_SCORE_MODERATE = 600;
const AGGRESSIVE_ROLL_SCORE_LOW = 350;   // If current turn score is below this, strong bias to roll (if enough dice)

const DICE_COUNT_FEW = 2;                // 2 or less dice is considered few
const DICE_COUNT_MANY = 4;               // 4 or more dice is considered many

// Score differences for determining game state relative to opponent
const SCORE_DIFF_FAR_BEHIND = -1500;
const SCORE_DIFF_SLIGHTLY_BEHIND = -500;
const SCORE_DIFF_SLIGHTLY_AHEAD = 500;
const SCORE_DIFF_FAR_AHEAD = 1500;

// Type to represent a specific scoring combination found in a roll
export interface FarkleScoringOption {
  score: number;
  description: string; // e.g., "Three 1s", "Single 5"
  diceUsed: DiceValues; // The specific dice that make up this score
  // We might add more properties later, like a unique key for the rule
}

// Type to represent the computer's decision on what dice to keep from a roll
export interface KeptDiceDecision {
  keptDice: DiceValues;          // The dice the computer decides to keep
  remainingDiceToRoll: DiceValues; // Dice not part of the kept set, to be re-rolled
  scoreForKeptDice: number;    // The score achieved by the keptDice
  descriptionOfKept: string; // A summary of what was kept (e.g., "Kept Three 1s and a 5")
}

export class FarkleAI {
  constructor() {
    // Future: difficulty settings could adjust the constants above
  }

  /**
   * Identifies all possible scoring combinations from a given dice roll.
   * Based on farkle-rules.md
   */
  identifyScoringDice(dice: DiceValues): FarkleScoringOption[] {
    const scoringOptions: FarkleScoringOption[] = [];
    const counts: Record<number, number> = dice.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // --- Single 1s and 5s ---
    // Each individual 1 or 5 is a potential scoring option.
    // The decideDiceToKeep function will later handle how these might be combined
    // with sets (e.g., if a 1 is part of three 1s).
    dice.forEach((dieValue, index) => {
      if (dieValue === 1) {
        scoringOptions.push({
          score: 100,
          description: "Single 1",
          diceUsed: [1] // Represents one die with value 1
          // We might need a way to uniquely identify *which* die if we need to prevent double counting later,
          // but for now, diceUsed being [1] is fine for the AI to know it needs *a* 1.
        });
      }
      if (dieValue === 5) {
        scoringOptions.push({
          score: 50,
          description: "Single 5",
          diceUsed: [5] // Represents one die with value 5
        });
      }
    });

    // --- Three of a Kind ---
    // Note: If there are 4, 5, or 6 of a kind, this will identify the first three.
    // Higher-order kinds (4, 5, 6 of a kind) will be handled separately and 
    // the decideDiceToKeep logic will need to choose the best interpretation if dice are shared.
    for (let dieValue = 1; dieValue <= 6; dieValue++) {
      if ((counts[dieValue] || 0) >= 3) {
        let score = 0;
        let description = "";
        if (dieValue === 1) {
          score = 1000;
          description = "Three 1s";
        } else {
          score = dieValue * 100;
          description = `Three ${dieValue}s`;
        }
        scoringOptions.push({
          score,
          description,
          diceUsed: [dieValue, dieValue, dieValue]
        });
      }
    }

    // --- Four, Five, and Six of a Kind ---
    // These are checked after Three of a Kind. 
    // The AI will need to pick the best option if dice overlap (e.g. prefer Four of a Kind over Three of a Kind).
    for (let dieValue = 1; dieValue <= 6; dieValue++) {
      const count = counts[dieValue] || 0;
      if (count >= 4) {
        // Check for 6 of a kind first, then 5, then 4.
        if (count >= 6) {
          scoringOptions.push({
            score: 3000,
            description: `Six ${dieValue}s`,
            diceUsed: Array(6).fill(dieValue)
          });
        } else if (count >= 5) {
          scoringOptions.push({
            score: 2000,
            description: `Five ${dieValue}s`,
            diceUsed: Array(5).fill(dieValue)
          });
        } else { // count must be 4 if we reach here
          scoringOptions.push({
            score: 1000,
            description: `Four ${dieValue}s`,
            diceUsed: Array(4).fill(dieValue)
          });
        }
      }
    }

    // --- Straight (1-2-3-4-5-6) ---
    const isStraight = (counts[1] || 0) >= 1 &&
                       (counts[2] || 0) >= 1 &&
                       (counts[3] || 0) >= 1 &&
                       (counts[4] || 0) >= 1 &&
                       (counts[5] || 0) >= 1 &&
                       (counts[6] || 0) >= 1;

    if (isStraight) {
      scoringOptions.push({
        score: 1500,
        description: "Straight (1-2-3-4-5-6)",
        diceUsed: [1, 2, 3, 4, 5, 6]
      });
    }

    // --- Three Pairs (e.g., 2-2, 4-4, 5-5 or 1-1, 1-1, 2-2) ---
    // This rule uses exactly 6 dice.
    let numberOfPairsFound = 0;
    const diceFormingThePairs: DiceValues = [];
    for (let dieValue = 1; dieValue <= 6; dieValue++) {
      const count = counts[dieValue] || 0;
      if (count >= 2) {
        const pairsFromThisValue = Math.floor(count / 2);
        numberOfPairsFound += pairsFromThisValue;
        for (let i = 0; i < pairsFromThisValue * 2; i++) {
          diceFormingThePairs.push(dieValue);
        }
      }
    }

    if (numberOfPairsFound === 3 && diceFormingThePairs.length === 6) {
      scoringOptions.push({
        score: 1500,
        description: "Three Pairs",
        diceUsed: diceFormingThePairs.sort((a, b) => a - b) // Store sorted for consistency
      });
    }

    // --- Two Triplets (e.g., 2-2-2, 4-4-4) ---
    // This rule uses exactly 6 dice and requires two distinct die values, each appearing at least 3 times.
    const tripletValuesFound: number[] = [];
    for (let dieValue = 1; dieValue <= 6; dieValue++) {
      if ((counts[dieValue] || 0) >= 3) {
        tripletValuesFound.push(dieValue);
      }
    }
    // If there are at least two distinct die values that form triplets
    if (tripletValuesFound.length >= 2) {
        // Iterate through combinations of two found triplet values
        for (let i = 0; i < tripletValuesFound.length; i++) {
            for (let j = i + 1; j < tripletValuesFound.length; j++) {
                const val1 = tripletValuesFound[i]!; // Assert non-null
                const val2 = tripletValuesFound[j]!; // Assert non-null
                
                const usedDiceForTwoTriplets: DiceValues = [val1, val1, val1, val2, val2, val2];
                usedDiceForTwoTriplets.sort((a, b) => a - b); // Sort in place

                scoringOptions.push({
                    score: 2500,
                    description: `Two Triplets (${val1}s and ${val2}s)`,
                    diceUsed: usedDiceForTwoTriplets
                });
            }
        }
    }
    // Note: If a roll was [1,1,1,1,1,1], it's Six of a Kind (3000 pts).
    // It could also be seen as two triplets of 1s (2500 pts), but typically the highest score for the dice is taken.
    // Our current logic for "Two Triplets" requires two *distinct* die values, so it won't flag six of a kind as two triplets.
    // This is usually the desired behavior as Six of a Kind is a higher specific score.

    // TODO: Review for overlapping dice and ensuring AI chooses best options.
    // For now, identifyScoringDice lists all rule-based possibilities.

    return scoringOptions;
  }

  /**
   * Helper function to remove a specific set of dice from an available pool.
   * Handles duplicates correctly.
   * e.g., pool = [1,1,2,3], toRemove = [1,2] => returns [1,3]
   */
  private _removeSelectedDice(pool: DiceValues, toRemove: DiceValues): DiceValues {
    const mutablePool = [...pool];
    for (const dieToRemove of toRemove) {
      const index = mutablePool.indexOf(dieToRemove);
      if (index > -1) {
        mutablePool.splice(index, 1);
      }
    }
    return mutablePool;
  }

  /**
   * Decides which dice to keep from the current roll to maximize score or strategic advantage.
   * This will use identifyScoringDice and then apply some strategy.
   */
  decideDiceToKeep(
    currentRoll: DiceValues,
    currentTurnScore: number // Points accumulated so far THIS turn - unused for now by this function but good for context
  ): KeptDiceDecision | null { // Returns null if no scoring dice can be kept (Farkle)
    
    let diceAvailableForScoring = [...currentRoll];
    const overallKeptDice: DiceValues = [];
    let overallScoreForThisTurn = 0;
    const descriptionsOfKeptSets: string[] = [];

    // Iteratively select the best scoring option from the remaining dice
    while (true) {
      const currentScoringOptions = this.identifyScoringDice(diceAvailableForScoring);

      if (currentScoringOptions.length === 0) {
        // No more scoring options can be found with the remaining dice
        break;
      }

      // Select the best single scoring option from the current set
      // Strategy: Highest score, then uses most dice as a tie-breaker.
      currentScoringOptions.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score; // Higher score first
        }
        return b.diceUsed.length - a.diceUsed.length; // More dice used first
      });

      const bestOptionThisIteration = currentScoringOptions[0];

      if (!bestOptionThisIteration || bestOptionThisIteration.score === 0) {
        // Should not happen if identifyScoringDice is correct and options were found,
        // but as a safeguard, if best option has no score, stop.
        break;
      }

      // Add this option to our kept dice for the turn
      overallKeptDice.push(...bestOptionThisIteration.diceUsed);
      overallScoreForThisTurn += bestOptionThisIteration.score;
      descriptionsOfKeptSets.push(bestOptionThisIteration.description);
      
      // Remove the used dice from the available pool for the next iteration
      diceAvailableForScoring = this._removeSelectedDice(diceAvailableForScoring, bestOptionThisIteration.diceUsed);

      // If all dice have been used for scoring, break (could be hot dice if all 6 are used)
      if (diceAvailableForScoring.length === 0) {
        break;
      }
    }

    if (overallKeptDice.length === 0) {
      // No dice were scored from the roll - FARKLE for this roll.
      return null;
    }

    return {
      keptDice: overallKeptDice.sort((a,b) => a-b),
      remainingDiceToRoll: diceAvailableForScoring.sort((a,b) => a-b),
      scoreForKeptDice: overallScoreForThisTurn,
      descriptionOfKept: descriptionsOfKeptSets.join(", ")
    };
  }

  /**
   * Decides whether the computer should roll again or bank its current turn score.
   */
  shouldRollAgain(
    remainingDiceCount: number,
    currentTurnScore: number,
    computerTotalGameScore: number, // AI's current total score in the game
    opponentTotalGameScore: number  // Opponent's current total score
  ): boolean {
    // 1. Hot Dice - always roll if all dice scored
    // (This is typically when 0 dice are remaining *after* scoring dice were kept)
    if (remainingDiceCount === 0) {
      return true;
    }

    // 2. Getting on the Board (first score of the game for the AI)
    if (computerTotalGameScore === 0) {
      if (currentTurnScore < MIN_SCORE_TO_GET_ON_BOARD) {
        return true; // Must roll to try and get on board (if dice are available)
      } else {
        // Scored enough to get on the board. Generally, bank this first qualifying score.
        // Exception: if many dice are left, might be worth pushing a bit.
        if (remainingDiceCount >= DICE_COUNT_MANY -1 && currentTurnScore < SAFE_BANK_SCORE_MODERATE) { // e.g. >=3 dice left, score < 600
          return true; // Still have a good number of dice, try for a bit more if score isn't too high yet
        }
        return false; // Bank the qualifying score
      }
    }

    const scoreDifference = computerTotalGameScore - opponentTotalGameScore;
    let rollDesire = 0; // Positive favors rolling, negative favors banking

    // Factor 1: Game situation (ahead/behind)
    if (scoreDifference < SCORE_DIFF_FAR_BEHIND) {
      rollDesire += 3; // Far behind: aggressive
    } else if (scoreDifference < SCORE_DIFF_SLIGHTLY_BEHIND) {
      rollDesire += 1; // Slightly behind: moderately aggressive
    } else if (scoreDifference > SCORE_DIFF_FAR_AHEAD) {
      rollDesire -= 3; // Far ahead: conservative
    } else if (scoreDifference > SCORE_DIFF_SLIGHTLY_AHEAD) {
      rollDesire -= 1; // Slightly ahead: moderately conservative
    }

    // Factor 2: Current turn score
    if (currentTurnScore < AGGRESSIVE_ROLL_SCORE_LOW) {
      rollDesire += 2; // Low turn score: lean towards rolling
    } else if (currentTurnScore >= SAFE_BANK_SCORE_HIGH) {
      rollDesire -= 3; // Very high turn score: strong lean to bank
    } else if (currentTurnScore >= SAFE_BANK_SCORE_MODERATE) {
      rollDesire -= 1; // Moderately high turn score: slight lean to bank
    }

    // Factor 3: Remaining dice
    if (remainingDiceCount >= DICE_COUNT_MANY) {
      rollDesire += 2; // Many dice left: lean towards rolling
    } else if (remainingDiceCount <= DICE_COUNT_FEW) {
      rollDesire -= 2; // Few dice left: lean towards banking
      if (remainingDiceCount === 1) {
        rollDesire -= 1; // Extra caution with only 1 die left
      }
    }
    
    // Decision: Roll if the desire is positive.
    // A higher threshold (e.g., rollDesire > 1) would make the AI more cautious overall.
    return rollDesire > 0;
  }
} 