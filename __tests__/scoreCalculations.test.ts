import { calculateUpperSectionScore, calculateLowerSectionScore } from '../utils/scoreCalculations';

describe('Score Calculations', () => {
  test('calculateUpperSectionScore correctly calculates score for ones', () => {
    expect(calculateUpperSectionScore([1, 1, 2, 3, 4], 1)).toBe(2);
  });

  test('calculateLowerSectionScore correctly calculates score for full house', () => {
    expect(calculateLowerSectionScore([2, 2, 3, 3, 3], 'Full House')).toBe(25);
  });

  // Add more tests for other score calculations
});

