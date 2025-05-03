// New file to define all the global constants clearly

// Player types
export const BLACK = 1;
export const WHITE = 2;

// Board numbering (1-24)
export const BEARING_OFF_POSITION = 25; // Special position for bearing off
export const BAR_POSITION = 0; // Special position for the bar

// Board layout by quadrant (1-based numbering)
export const BOARD_LAYOUT = {
  TOP_LEFT: [13, 14, 15, 16, 17, 18],   // White's outer board
  TOP_RIGHT: [19, 20, 21, 22, 23, 24],  // White's home board
  BOTTOM_LEFT: [12, 11, 10, 9, 8, 7],   // Black's outer board
  BOTTOM_RIGHT: [6, 5, 4, 3, 2, 1]      // Black's home board
};

// Define home boards with explicit min/max values
export const HOME_BOARDS = {
  [BLACK]: { min: 1, max: 6 },     // BLACK's home board: 1-6
  [WHITE]: { min: 19, max: 24 }    // WHITE's home board: 19-24
};

// Define paths (direction of movement) based on user's specific sequence
export const MOVEMENT_PATHS = {
  // Black: 24→23→...→1
  [BLACK]: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  // White: 1→2→...→24 (remove BAR_POSITION(0) from the path)
  [WHITE]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
};

// Define entry points from bar (die value → point number)
export const BAR_ENTRY_POINTS = {
  [BLACK]: { 6: 19, 5: 20, 4: 21, 3: 22, 2: 23, 1: 24 },
  [WHITE]: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }
};

// Define bearing off mappings (point number → die value needed)
export const BEARING_OFF_DICE = {
  [BLACK]: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 },
  [WHITE]: { 19: 6, 20: 5, 21: 4, 22: 3, 23: 2, 24: 1 }
};

// Scoring constants
export const POINTS_FOR_WIN = 1;
export const POINTS_FOR_MULLIGAN = 3;
export const GAMES_TO_WIN_MATCH = 3; // Best of 5 