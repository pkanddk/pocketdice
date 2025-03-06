export interface PlayerTotal {
  upperTotal: number;
  bonus: number;
  upperTotalWithBonus: number;
  lowerTotal: number;
  grandTotal: number;
  pointsToBonus: number;
  pointsOverBonus: number;
}

export interface Score {
  value: number | null;
  locked: boolean;
}

export type Scores = Array<Array<Score>>;

