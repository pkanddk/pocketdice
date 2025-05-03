export type Player = 1 | 2;

export interface PointState {
  player: 0 | Player;  // 0 for empty, 1 for Black, 2 for White
  count: number;
}

export type BoardState = PointState[];

export type BarState = { [key in Player]: number };

export type BorneOffState = { [key in Player]: number };

export interface Move {
  from: number;  // BAR_POSITION (0) for bar, 1-24 for board points
  to: number;    // 1-24 for board points, BEARING_OFF_POSITION (25) for bearing off
  die: number;   // The die value being used for this move
  usesBothDice?: boolean; // Flag indicating if this move uses both dice (combined move)
}

export type DiceRoll = number[];  // Array of 1-2 dice values

export interface GameState {
  board: BoardState;
  bar: BarState;
  borneOff: BorneOffState;  // Track pieces that have been borne off
  currentPlayer: Player;
  dice: DiceRoll; // Stores the original dice roll
  remainingDice: DiceRoll; // Stores the dice yet to be used in the current turn
  gameStarted: boolean;
  mustUseAllDice: boolean;
  isRolling: boolean;
  isSwitching?: boolean; // Optional flag to manage turn switching effect timing
  diceRolled: boolean;
} 