export const calculateUpperSectionScore = (dice: number[], category: number): number => {
  return dice.filter(value => value === category).reduce((sum, value) => sum + value, 0)
}

export const calculateLowerSectionScore = (dice: number[], category: string): number => {
  // Implement lower section scoring logic here
  // ...
}

export const calculateTotalScore = (scores: Array<{ value: number | null; locked: boolean }>): number => {
  // Implement total score calculation logic here
  // ...
}

