import { DiceValues } from './GameLogic' // TODO: Resolve: Module '"./GameLogic"' has no exported member 'DiceValues'.
// The 'DiceValues' type below needs to be correctly defined or imported.

export class ComputerPlayerAI {
  constructor() {}

  decideDiceToKeep(diceValues: DiceValues): boolean[] {
    return this.hardDecision(diceValues)
  }

  private hardDecision(diceValues: DiceValues): boolean[] {
    const counts = this.getCounts(diceValues)
    const maxCount = Math.max(...Object.values(counts))

    if (maxCount >= 3) {
      // Try for Three of a Kind, Four of a Kind, or Yahtzee
      return diceValues.map((value: number) => counts[value] === maxCount)
    } else if (this.isLargeStraightPossible(diceValues)) {
      // Try for Large Straight
      return diceValues.map((value: number) => value >= 2 && value <= 6)
    } else if (this.isSmallStraightPossible(diceValues)) {
      // Try for Small Straight
      return diceValues.map((value: number) => value >= 1 && value <= 5)
    } else if (Object.values(counts).filter(count => count === 2).length >= 2) {
      // Try for Full House
      return diceValues.map((value: number) => counts[value] === 2)
    } else {
      // Default to keeping the highest value dice
      const maxValue = Math.max(...diceValues) // Assumes diceValues is spreadable (e.g., number[])
      return diceValues.map((value: number) => value === maxValue)
    }
  }

  private getCounts(diceValues: DiceValues): Record<number, number> {
    return diceValues.reduce((counts: Record<number, number>, value: number) => {
      counts[value] = (counts[value] || 0) + 1
      return counts
    }, {} as Record<number, number>)
  }

  private isLargeStraightPossible(diceValues: DiceValues): boolean {
    const uniqueValues = new Set(diceValues)
    return uniqueValues.size >= 4 && ![1, 6].every(v => uniqueValues.has(v))
  }

  private isSmallStraightPossible(diceValues: DiceValues): boolean {
    const uniqueValues = new Set(diceValues)
    return uniqueValues.size >= 3 && (
      [1, 2, 3, 4].every(v => uniqueValues.has(v)) ||
      [2, 3, 4, 5].every(v => uniqueValues.has(v)) ||
      [3, 4, 5, 6].every(v => uniqueValues.has(v))
    )
  }

  decideCategory(availableCategories: string[], scores: number[]): string {
    // Basic strategy
    const priorities = ['Yahtzee', 'Large Straight', 'Small Straight', 'Full House', 'Four of a Kind', 'Three of a Kind']
    
    // First, check for high-scoring categories
    for (const priority of priorities) {
      const index = availableCategories.indexOf(priority)
      if (index !== -1 && scores[index] !== undefined && scores[index] > 0) {
        return availableCategories[index]!; // Asserting non-null as index is valid and string[]
      }
    }
    
    // If no high-scoring categories, find the highest score
    const maxScore = Math.max(...scores)
    const maxScoreIndex = scores.indexOf(maxScore)
    return availableCategories[maxScoreIndex]!; // Asserting non-null based on original logic
  }
}

