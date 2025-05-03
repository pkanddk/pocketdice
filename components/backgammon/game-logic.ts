import { BoardState, GameState, Move, Player, BarState, BorneOffState } from './types';
import { 
  BLACK, WHITE, BEARING_OFF_POSITION, BAR_POSITION, 
  HOME_BOARDS, MOVEMENT_PATHS, BAR_ENTRY_POINTS, BEARING_OFF_DICE 
} from './constants';

export class BackgammonRules {
  static PIECES_PER_PLAYER = 15;
  
  /**
   * Gets all available legal moves given the current state
   */
  public static getAvailableMoves(gameState: GameState): Move[] {
    const { board, currentPlayer, bar } = gameState;
    const moves: Move[] = [];
    
    // Get dice for this function (use remainingDice if available, otherwise use dice)
    const activeDice = gameState.remainingDice?.length ? gameState.remainingDice : gameState.dice;
    
    console.log(`Getting available moves for player ${currentPlayer}. Active dice:`, activeDice);
    
    // Check if player has pieces on the bar
    if (bar[currentPlayer] > 0) {
      // Only moves from the bar are valid
      this.getBarEntryMoves(gameState, moves);
      return moves;
    }
    
    // Check if player can bear off
    const canBearOff = this.canBearOff(board, bar, currentPlayer);
    
    // Get single die moves
    this.getSingleDieMoves(gameState, moves, canBearOff);
    
    // Get combined moves if we have exactly 2 dice with different values
    if (activeDice.length === 2 && activeDice[0] !== activeDice[1]) {
      this.getCombinedMoves(gameState, moves, canBearOff);
    }
    
    // Log the available moves for debugging
    console.log(`Available moves for player ${currentPlayer}:`, moves);
    
    return moves;
  }

  /**
   * Get moves from the bar for re-entry
   */
  private static getBarEntryMoves(gameState: GameState, moves: Move[]): void {
    const { board, currentPlayer, dice } = gameState;
    
    // Check each die to see if it allows entry
    for (const die of dice) {
      if (typeof die !== 'number') continue;
      
      // Use the BAR_ENTRY_POINTS constant to determine entry point
      // Cast die to a keyof to fix TypeScript error
      const entryPoint = BAR_ENTRY_POINTS[currentPlayer][die as keyof typeof BAR_ENTRY_POINTS[typeof currentPlayer]];
      
      // Add debug log for troubleshooting
      console.log(`Bar re-entry check: Player=${currentPlayer}, Die=${die}, Entry point=${entryPoint}`);
      
      if (entryPoint) {
        // Check if the entry point is valid (not blocked)
        if (this.isValidRegularMoveTarget(board, currentPlayer, entryPoint)) {
          // Add the move (from bar)
          console.log(`Valid bar re-entry: Player ${currentPlayer} can enter at point ${entryPoint} with die ${die}`);
          moves.push({ from: BAR_POSITION, to: entryPoint, die });
        } else {
          console.log(`Entry point ${entryPoint} is blocked for player ${currentPlayer}`);
        }
      } else {
        console.log(`No valid entry point for die ${die} for player ${currentPlayer}`);
      }
    }
  }

  /**
   * Get single die moves (using each die value separately)
   * This helper method is called by getAvailableMoves
   */
  private static getSingleDieMoves(
    gameState: GameState, 
    moves: Move[], 
    canBearOff: boolean
  ): void {
    const { board, currentPlayer } = gameState;
    
    // Get dice for this function (use remainingDice if available, otherwise use dice)
    const activeDice = gameState.remainingDice?.length ? gameState.remainingDice : gameState.dice;
    
    console.log(`Calculating single die moves for player ${currentPlayer} with dice [${activeDice.join(', ')}]`);
    
    // Process each die individually
    for (const die of activeDice) {
      if (typeof die !== 'number') continue; // Skip if die is not a number
      
      console.log(`Checking moves with die value ${die}`);
      
      // Check each board position
      for (let from = 1; from <= 24; from++) {
        const point = board[from];
        
        // Skip empty points or opponent's points
        if (!point || point.player !== currentPlayer || point.count === 0) {
          continue;
        }
        
        // Find the position in the movement path
        const fromPathIndex = MOVEMENT_PATHS[currentPlayer].indexOf(from);
        if (fromPathIndex === -1) {
          console.log(`Position ${from} not found in path for player ${currentPlayer}`);
          continue; // Skip invalid positions
        }
        
        // Calculate the destination index in the path
        const toPathIndex = fromPathIndex + die;
        
        // Check if the move would go beyond the end of the path (bearing off)
        if (toPathIndex >= MOVEMENT_PATHS[currentPlayer].length) {
          if (canBearOff && this.isInHomeBoard(from, currentPlayer)) {
            // Check if bearing off is valid
            if (this.isValidBearingOffMove(board, currentPlayer, from, die)) {
              console.log(`Valid bearing off move: ${from} → off`);
              moves.push({ from, to: BEARING_OFF_POSITION, die });
            }
          }
          continue; // Skip further processing for this position
        }
        
        // Get the destination point from the path
        const to = MOVEMENT_PATHS[currentPlayer][toPathIndex];
        if (to === undefined) {
          console.log(`Invalid destination at index ${toPathIndex} for player ${currentPlayer}`);
          continue;
        }
        
        // For regular moves, check if the destination is valid
        if (to >= 0 && to <= 24 && to !== from && this.isValidRegularMoveTarget(board, currentPlayer, to)) {
          console.log(`Valid move: ${from} → ${to} (die ${die})`);
          moves.push({ from, to, die });
        } else {
          if (to < 0 || to > 24) {
            console.log(`Destination ${to} is out of valid range`);
          } else if (to === from) {
            console.log(`Destination ${to} is same as source ${from}`);
          } else {
            console.log(`Destination ${to} is not a valid target: `, board[to]);
          }
        }
      }
    }
    
    console.log(`Found ${moves.length} valid single die moves`);
  }
  
  /**
   * Get combined moves (using both dice values as a single move)
   * This helper method is called by getAvailableMoves
   */
  private static getCombinedMoves(
    gameState: GameState, 
    moves: Move[], 
    canBearOff: boolean
  ): void {
    const { board, currentPlayer } = gameState;
    
    // Get dice for this function (use remainingDice if available, otherwise use dice)
    const activeDice = gameState.remainingDice?.length ? gameState.remainingDice : gameState.dice;
    
    // We need exactly two dice for combined moves
    if (activeDice.length !== 2) {
      console.log("Combined moves require exactly two dice");
      return;
    }
    
    // Combined die value - ensure both dice are numbers
    const die1 = typeof activeDice[0] === 'number' ? activeDice[0] : 0;
    const die2 = typeof activeDice[1] === 'number' ? activeDice[1] : 0;
    const combinedValue = die1 + die2;
    
    console.log(`Calculating combined moves for player ${currentPlayer} with dice [${die1}, ${die2}] = ${combinedValue}`);
    
    // Check each board position
    for (let from = 1; from <= 24; from++) {
      const point = board[from];
      
      // Skip empty points or opponent's points
      if (!point || point.player !== currentPlayer || point.count === 0) {
        continue;
      }
      
      // Find position in movement path
      const fromPathIndex = MOVEMENT_PATHS[currentPlayer].indexOf(from);
      if (fromPathIndex === -1) {
        console.log(`Position ${from} not found in path for player ${currentPlayer}`);
        continue; // Skip invalid positions
      }
      
      // Calculate destination index for the combined move
      const toPathIndex = fromPathIndex + combinedValue;
      
      // Check for bearing off
      if (toPathIndex >= MOVEMENT_PATHS[currentPlayer].length) {
        if (canBearOff && this.isInHomeBoard(from, currentPlayer)) {
          if (this.isValidBearingOffMove(board, currentPlayer, from, combinedValue)) {
            console.log(`Valid combined bearing off move: ${from} → off (${combinedValue})`);
            // Mark this as a combined move that uses both dice
            moves.push({ 
              from, 
              to: BEARING_OFF_POSITION, 
              die: combinedValue,
              usesBothDice: true // Flag indicating this is a combined move
            });
          }
        }
        continue; // Skip further processing for this position
      }
      
      // Get the destination point on the board
      const to = MOVEMENT_PATHS[currentPlayer][toPathIndex];
      if (to === undefined) {
        console.log(`Invalid destination at index ${toPathIndex} for player ${currentPlayer}`);
        continue;
      }
      
      // Check if the combined move is valid
      // For a combined move to be valid:
      // 1. We need to check if intermediate point is open (not blocked)
      // 2. The final destination must be valid (not blocked)
      
      // First check the intermediate point (after using the first die)
      const intermediateTo = this.getIntermediatePosition(from, die1, currentPlayer);
      
      // Skip combined move if we can't calculate intermediate position
      if (intermediateTo === null) {
        console.log(`Could not calculate intermediate position for ${from} + ${die1}`);
        continue;
      }
      
      // Check if intermediate position is valid
      const intermediateValid = this.isValidRegularMoveTarget(board, currentPlayer, intermediateTo);
      if (!intermediateValid) {
        console.log(`Intermediate position ${intermediateTo} is not valid for ${currentPlayer}`);
        continue;
      }
      
      // Check if final destination is valid
      if (to >= 0 && to <= 24 && to !== from && this.isValidRegularMoveTarget(board, currentPlayer, to)) {
        console.log(`Valid combined move: ${from} → ${to} (${die1}+${die2}=${combinedValue})`);
        // Add the combined move, marking it with the combined dice value
        // and flag it as using both dice
        moves.push({ 
          from, 
          to, 
          die: combinedValue,
          usesBothDice: true // Flag indicating this is a combined move
        });
      } else {
        if (to < 0 || to > 24) {
          console.log(`Combined move destination ${to} is out of valid range`);
        } else if (to === from) {
          console.log(`Combined move destination ${to} is same as source ${from}`);
        } else {
          console.log(`Combined move destination ${to} is not a valid target:`, board[to]);
        }
      }
    }
    
    console.log(`Found ${moves.filter(m => m.usesBothDice).length} valid combined moves`);
  }
  
  /**
   * Helper method to find the intermediate position after using one die
   */
  private static getIntermediatePosition(from: number, die: number, player: Player): number | null {
    if (typeof from !== 'number' || typeof die !== 'number' || typeof player !== 'number') {
      console.log(`Invalid parameters for getIntermediatePosition: from=${from}, die=${die}, player=${player}`);
      return null;
    }
    
    // Get the movement path for this player
    const playerPath = MOVEMENT_PATHS[player];
    if (!playerPath || !Array.isArray(playerPath)) {
      console.log(`Invalid movement path for player ${player}`);
      return null;
    }
    
    // Get the index of the current position in the movement path
    const currentIndex = playerPath.indexOf(from);
    if (currentIndex === -1) {
      console.log(`Position ${from} not found in movement path for player ${player}`);
      return null; // Invalid position
    }
    
    // Calculate the intermediate index
    const intermediateIndex = currentIndex + die;
    
    // Check if intermediate index is valid
    if (intermediateIndex < 0 || intermediateIndex >= playerPath.length) {
      console.log(`Intermediate index ${intermediateIndex} is outside of path range (0-${playerPath.length-1})`);
      return null;
    }
    
    // Get the intermediate position from the movement path
    const intermediatePosition = playerPath[intermediateIndex];
    if (typeof intermediatePosition !== 'number') {
      console.log(`Invalid intermediate position at index ${intermediateIndex}`);
      return null;
    }
    
    console.log(`Calculated intermediate position: ${from} + ${die} = ${intermediatePosition} (path index ${intermediateIndex})`);
    return intermediatePosition;
  }

  /**
   * Check if the bearing off move is valid according to the rules
   * - If exact die matches position, always valid
   * - If die is larger than position, valid only if no pieces on higher points
   */
  static isValidBearingOffMove(board: BoardState, player: Player, from: number, die: number): boolean {
    const homeBoardRange = HOME_BOARDS[player];
    
    // For BLACK:
    if (player === BLACK) {
      // If die exactly matches the position, it's valid
      if (die === from) return true;
      
      // If die is larger than needed, check if no pieces on higher points
      if (die > from) {
        // Look for any piece on higher points in home board
        for (let pos = from + 1; pos <= homeBoardRange.max; pos++) {
          const pointState = board[pos];
          if (pointState && pointState.player === player && pointState.count > 0) {
            return false; // Can't use larger die if pieces on higher points
          }
        }
        return true; // No pieces on higher points, can use larger die
      }
      
      return false; // Die is smaller than position, not valid
    }
    
    // For WHITE:
    else {
      // Calculate the die needed based on white's bearing off rule
      const bearingOffDice = BEARING_OFF_DICE[WHITE];
      const dieNeeded = bearingOffDice[from as keyof typeof bearingOffDice];
      
      // If die exactly matches what's needed, it's valid
      if (die === dieNeeded) return true;
      
      // If die is larger than needed, check if no pieces on higher points
      if (die > dieNeeded) {
        // Look for any piece on higher points in home board
        for (let pos = homeBoardRange.min; pos < from; pos++) {
          const pointState = board[pos];
          if (pointState && pointState.player === player && pointState.count > 0) {
            return false; // Can't use larger die if pieces on higher points
          }
        }
        return true; // No pieces on higher points, can use larger die
      }
      
      return false; // Die is smaller than needed, not valid
    }
  }
  
  /**
   * Apply a move to the game state and return the new state
   */
  static applyMove(
    board: BoardState, 
    bar: BarState, 
    borneOff: BorneOffState, 
    player: Player, 
    move: Move
  ): { newBoard: BoardState; newBar: BarState; newBorneOff: BorneOffState } {
    // Create copies to avoid modifying original state
    const newBoard = [...board];
    const newBar = { ...bar };
    const newBorneOff = { ...borneOff };
    
    // Handle piece coming from the bar
    if (move.from === BAR_POSITION) {
      console.log(`Moving piece FROM BAR to ${move.to} for player ${player} using die ${move.die}`);
      console.log(`Current bar state: ${JSON.stringify(newBar)}`);
      
      // Decrement bar count
      newBar[player]--;
      
      console.log(`New bar state after decrementing: ${JSON.stringify(newBar)}`);
      
      // Set up destination point
      const destPoint = newBoard[move.to];
      if (!destPoint) {
        newBoard[move.to] = { player, count: 1 };
        console.log(`Created new point at ${move.to} with player ${player} and count 1`);
      } else if (destPoint.player === player) {
        destPoint.count++;
        console.log(`Added to existing stack at ${move.to}, new count: ${destPoint.count}`);
      } else if (destPoint.count === 1) {
        // Hit opponent's piece
        const opponent = player === BLACK ? WHITE : BLACK;
        newBar[opponent]++;
        newBoard[move.to] = { player, count: 1 };
        console.log(`Hit opponent at ${move.to}, moved to bar. Bar now has ${newBar[opponent]} ${opponent === BLACK ? 'black' : 'white'} pieces`);
      }
      
      console.log(`After bar move to ${move.to}: Destination has ${newBoard[move.to]?.count || 0} ${player === BLACK ? 'black' : 'white'} pieces`);
    }
    // Handle bearing off
    else if (move.to === BEARING_OFF_POSITION) {
      // Decrement source point
      const sourcePoint = newBoard[move.from];
      if (sourcePoint) {
        sourcePoint.count--;
        if (sourcePoint.count === 0) {
          newBoard[move.from] = { player: 0, count: 0 };
        }
      }
      
      // Increment borne off count
      newBorneOff[player]++;
    }
    // Handle regular move
    else {
      // Decrement source point
      const sourcePoint = newBoard[move.from];
      if (sourcePoint) {
        sourcePoint.count--;
        if (sourcePoint.count === 0) {
          newBoard[move.from] = { player: 0, count: 0 };
        }
      }
      
      // Set up destination point
      const destPoint = newBoard[move.to];
      if (!destPoint) {
        // Create a new point with the player's piece
        newBoard[move.to] = { player, count: 1 };
        console.log(`Created new point at ${move.to} with player ${player} and count 1`);
      } else if (destPoint.player === player) {
        // Add to existing player stack
        destPoint.count++;
        console.log(`Added to existing stack at ${move.to}, new count: ${destPoint.count}`);
      } else if (destPoint.player === 0 || destPoint.count === 0) {
        // Empty point - place piece here
        newBoard[move.to] = { player, count: 1 };
        console.log(`Moved to empty point at ${move.to}`);
      } else if (destPoint.player !== player && destPoint.count === 1) {
        // Hit opponent's piece
        const opponent = player === BLACK ? WHITE : BLACK;
        newBar[opponent]++;
        newBoard[move.to] = { player, count: 1 };
        console.log(`Hit opponent at ${move.to}, moved to bar`);
      } else {
        console.error(`Invalid move to ${move.to} - occupied by opponent with ${destPoint.count} pieces`);
      }
      
      // Verify the move was applied correctly
      console.log(`After move ${move.from}->${move.to}: Source has ${newBoard[move.from]?.count || 0}, Destination has ${newBoard[move.to]?.count || 0}`);
    }
    
    return { newBoard, newBar, newBorneOff };
  }
  
  /**
   * Check if a player can bear off (all pieces in home board and none on bar)
   */
  static canBearOff(board: BoardState, bar: BarState, player: Player): boolean {
    // No pieces should be on the bar
    if (bar[player] > 0) return false;
    
    // All pieces must be in the home board
    return this.allPiecesInHomeBoard(board, player);
  }
  
  /**
   * Check if all player's pieces are in their home board
   */
  static allPiecesInHomeBoard(board: BoardState, player: Player): boolean {
    const homeBoard = HOME_BOARDS[player];
    
    // Check if any pieces exist outside home board
    for (let pos = 1; pos <= 24; pos++) {
      // Skip positions in home board
      if (pos >= homeBoard.min && pos <= homeBoard.max) continue;
      
      // If any piece exists outside home board, return false
      const point = board[pos];
      if (point && point.player === player && point.count > 0) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if a position is in a player's home board
   */
  static isInHomeBoard(position: number, player: Player): boolean {
    const homeBoard = HOME_BOARDS[player];
    return position >= homeBoard.min && position <= homeBoard.max;
  }
  
  /**
   * Get initial board setup for backgammon
   */
  static getInitialBoard(): BoardState {
    // Create a board with 25 positions (0 is unused, 1-24 are actual positions)
    const board: BoardState = Array(25).fill(null);
    
    // Initialize each position with a valid empty state
    for (let i = 0; i < 25; i++) {
      board[i] = { player: 0, count: 0 };
    }
    
    // Log the board before setting up pieces
    console.log("Board initialized with empty points:", 
      board.map((p, i) => i > 0 && i <= 24 ? { pos: i, player: p?.player, count: p?.count } : null).filter(Boolean));
    
    // Set up Black pieces (Player 1)
    board[24] = { player: BLACK, count: 2 };  // 2 pucks at position 24
    board[13] = { player: BLACK, count: 5 };  // 5 pucks at position 13
    board[8] = { player: BLACK, count: 3 };   // 3 pucks at position 8
    board[6] = { player: BLACK, count: 5 };   // 5 pucks at position 6
    
    // Set up White pieces (Player 2)
    board[1] = { player: WHITE, count: 2 };   // 2 pucks at position 1
    board[12] = { player: WHITE, count: 5 };  // 5 pucks at position 12
    board[17] = { player: WHITE, count: 3 };  // 3 pucks at position 17
    board[19] = { player: WHITE, count: 5 };  // 5 pucks at position 19
    
    // Debug: Count total pieces to ensure we have all 15 per player
    const blackCount = board.reduce((sum, point) => 
      point && point.player === BLACK ? sum + point.count : sum, 0);
    const whiteCount = board.reduce((sum, point) => 
      point && point.player === WHITE ? sum + point.count : sum, 0);
    
    console.log(`Initial board: ${blackCount} black pieces, ${whiteCount} white pieces`);
    
    // Verify each position
    for (let pos = 1; pos <= 24; pos++) {
      if (!board[pos]) {
        console.error(`Position ${pos} is null or undefined - fixing`);
        board[pos] = { player: 0, count: 0 };
      }
    }
    
    return board;
  }
  
  /**
   * Get initial bar state (no pieces on bar)
   */
  static getInitialBarState(): BarState {
    return { [BLACK]: 0, [WHITE]: 0 };
  }
  
  /**
   * Get initial borne off state (no pieces borne off)
   */
  static getInitialBorneOffState(): BorneOffState {
    return { [BLACK]: 0, [WHITE]: 0 };
  }
  
  /**
   * Check if a position is a valid move target (not occupied by 2+ opponent pieces)
   */
  static isValidRegularMoveTarget(board: BoardState, player: Player, destination: number): boolean {
    if (destination < 1 || destination > 24) {
      return false;
    }
    
    const destPoint = board[destination];
    
    // If the destination point is empty (null or undefined), it's always valid
    if (!destPoint) return true;
    
    // Target is valid if:
    // - Owned by player (same player)
    // - Has at most 1 opponent piece (blot)
    return destPoint.player === 0 || destPoint.player === player || destPoint.count <= 1;
  }
  
  /**
   * Check if a gammon situation exists (loser hasn't borne off any pieces)
   */
  static isGammon(borneOff: BorneOffState, loser: Player): boolean {
    return borneOff[loser] === 0;
  }
  
  /**
   * Check if a mulligan situation exists (loser hasn't moved all pieces to home board)
   */
  static isMulligan(board: BoardState, loser: Player): boolean {
    // Check if any pieces exist outside loser's home board
    return !this.allPiecesInHomeBoard(board, loser);
  }

  /**
   * Determine the set of required moves for a turn
   * This is needed to validate moves when players attempt to move pieces
   */
  static determineRequiredMoves(gameState: GameState): Move[] {
    const { dice, remainingDice } = gameState;
    
    // Use remaining dice if available, otherwise use original dice
    const activeDice = remainingDice.length > 0 ? remainingDice : dice;
    
    // Get all available moves for the current dice
    const availableMoves = this.getAvailableMoves({
      ...gameState,
      dice: activeDice
    });
    
    // If there are no available moves, return empty array 
    if (availableMoves.length === 0) {
      return [];
    }
    
    console.log(`[Debug] Available moves with dice [${activeDice.join(',')}]:`, 
      JSON.stringify(availableMoves.map(m => `${m.from}->${m.to} (die ${m.die})`)));
    
    // For each remaining die, get all legal moves
    return availableMoves;
  }
  
  /**
   * Check if a specific move is valid in the current game state
   */
  static isMoveValid(gameState: GameState, move: Move): boolean {
    const availableMoves = this.getAvailableMoves(gameState);
    return availableMoves.some(m => 
      m.from === move.from && 
      m.to === move.to && 
      m.die === move.die
    );
  }
  
  /**
   * Get all available legal moves for doubles (when both dice show the same number)
   */
  static getDoublesMoves(gameState: GameState): Move[] {
    const { dice } = gameState;
    
    // If not doubles, return empty array
    if (dice.length !== 4 || dice[0] !== dice[1]) {
      return [];
    }
    
    // For doubles, just call getAvailableMoves with all four dice values
    return this.getAvailableMoves(gameState);
  }
} 