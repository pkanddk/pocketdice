import { BoardState, GameState, Move, Player, BarState, BorneOffState, PointState } from './types';
import { 
  BLACK, WHITE, BEARING_OFF_POSITION, BAR_POSITION, 
  HOME_BOARDS, MOVEMENT_PATHS, BAR_ENTRY_POINTS, BEARING_OFF_DICE 
} from './constants';

export class BackgammonRules {
  static PIECES_PER_PLAYER = 15;
  
  // Helper to clone board (simple version)
  private static cloneBoard(board: BoardState): BoardState {
    return board.map(point => (point ? { ...point } : { player: 0, count: 0 }));
  }

  /**
   * NEW: Get compound moves if multiple identical dice are available (from doubles)
   */
  private static getCompoundMovesFromIdenticalDice(
    gameState: GameState,
    moves: Move[],
    canBearOff: boolean
  ): void {
    const { board, currentPlayer, remainingDice } = gameState;

    if (!remainingDice || remainingDice.length < 2 || !remainingDice.every(d => d === remainingDice[0])) {
      return; // Only proceed if there are 2 or more identical dice remaining
    }

    const dieValue = remainingDice[0] as number;
    const maxDiceToChain = remainingDice.length;

    // Iterate for chaining 2, 3, ..., up to maxDiceToChain
    for (let numDiceInChain = 2; numDiceInChain <= maxDiceToChain; numDiceInChain++) {
      console.log(`Checking compound moves for Player ${currentPlayer} using ${numDiceInChain} x ${dieValue}`);

      for (let from = 1; from <= 24; from++) {
        const startPoint = board[from];
        if (!startPoint || startPoint.player !== currentPlayer || startPoint.count === 0) {
          continue;
        }

        let currentPos = from;
        let tempBoard = this.cloneBoard(board); // Fresh temp board for each 'from' and 'numDiceInChain'
        let possibleChain = true;
        let finalDestinationPathIndex = -1; // Initialize to an invalid state
        let actualToPointForMove = -1;

        // Simulate the chain of moves for numDiceInChain
        for (let i = 0; i < numDiceInChain; i++) {
          const currentPathIndex = MOVEMENT_PATHS[currentPlayer].indexOf(currentPos);
          if (currentPathIndex === -1) { possibleChain = false; break; }

          const nextStepPathIndex = currentPathIndex + dieValue;

          if (nextStepPathIndex >= MOVEMENT_PATHS[currentPlayer].length) { // Potential bear-off for this die segment
            if (canBearOff && this.isInHomeBoard(currentPos, currentPlayer) && this.isValidBearingOffMove(tempBoard, currentPlayer, currentPos, dieValue)) {
              // If this segment is a bear-off, it must be the last segment of the chain
              if (i === numDiceInChain - 1) {
                actualToPointForMove = BEARING_OFF_POSITION;
                break; // Valid chain ending in bear-off
              } else {
                // Cannot bear-off mid-chain for a single compound move of one piece
                possibleChain = false;
                break;
              }
            } else {
              possibleChain = false; break; // Invalid bear-off attempt for this segment
            }
          } else { // Regular move to another point for this die segment
            const nextToPoint = MOVEMENT_PATHS[currentPlayer][nextStepPathIndex];
            if (nextToPoint === undefined || !this.isValidRegularMoveTarget(tempBoard, currentPlayer, nextToPoint as number)) {
              possibleChain = false; break;
            }
            // Simulate taking the piece on tempBoard for the next segment's validity check
            const tempCurrentPoint = tempBoard[currentPos] as PointState;
            if (tempCurrentPoint) tempCurrentPoint.count--; // Decrement count at current segment start
            
            const opponentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
            let tempNextPoint = tempBoard[nextToPoint] as PointState;
            if (!tempNextPoint) { // Should be initialized by cloneBoard, but defensive
                tempBoard[nextToPoint] = { player: currentPlayer, count: 1 };
            } else if (tempNextPoint.player === opponentPlayer && tempNextPoint.count === 1) { // Hit
              tempNextPoint.player = currentPlayer;
              tempNextPoint.count = 1;
              // Note: bar update for opponent is not simulated here, only board validity for pathing
            } else {
              tempNextPoint.player = currentPlayer;
              tempNextPoint.count++;
            }
            currentPos = nextToPoint; // Update currentPos for the next segment
            if (i === numDiceInChain - 1) { // If this is the last segment
                actualToPointForMove = nextToPoint;
            }
          }
        }

        if (possibleChain && actualToPointForMove !== -1) {
          if (actualToPointForMove === BEARING_OFF_POSITION) {
            moves.push({
              from: from,
              to: BEARING_OFF_POSITION,
              die: dieValue, // The value of one die from the double
              diceUsed: numDiceInChain, // How many dice segments this move represents
              isChainedDouble: true
            });
            console.log(`  Added compound bear-off: ${from} -> Off, using ${numDiceInChain}x${dieValue}`);
          } else if (actualToPointForMove !== from) { // Ensure it's a valid board point and a move actually occurred
            moves.push({
              from: from,
              to: actualToPointForMove,
              die: dieValue, // The value of one die from the double
              diceUsed: numDiceInChain, // How many dice segments this move represents
              isChainedDouble: true
            });
            console.log(`  Added compound move: ${from} -> ${actualToPointForMove}, using ${numDiceInChain}x${dieValue}`);
          }
        }
      }
    }
  }
  
  /**
   * Gets all available legal moves given the current state
   */
  public static getAvailableMoves(gameState: GameState): Move[] {
    const { board, currentPlayer, bar, remainingDice } = gameState;
    const moves: Move[] = [];
    
    const activeDice = remainingDice?.length ? remainingDice : gameState.dice;
    
    console.log(`Getting available moves for player ${currentPlayer}. Active dice:`, activeDice);
    
    if (bar[currentPlayer] > 0) {
      this.getBarEntryMoves(gameState, moves);
      return moves;
    }
    
    const canBearOff = this.canBearOff(board, bar, currentPlayer);
    
    this.getSingleDieMoves(gameState, moves, canBearOff);
    
    if (activeDice.length >= 2 && activeDice.every(d => d === activeDice[0])) {
      this.getCompoundMovesFromIdenticalDice(gameState, moves, canBearOff);
    }
    else if (activeDice.length === 2 && activeDice[0] !== activeDice[1]) {
      this.getCombinedMoves(gameState, moves, canBearOff);
    }
    
    console.log(`Available moves for player ${currentPlayer}:`, moves.map(m => `${m.from}->${m.to} (d:${m.die} du:${m.diceUsed || (m.usesBothDice ? 2 : 1)})`));
    
    return moves;
  }

  /**
   * Get moves from the bar for re-entry
   */
  private static getBarEntryMoves(gameState: GameState, moves: Move[]): void {
    const { board, currentPlayer, remainingDice, dice } = gameState;
    const activeDiceForEntry = remainingDice?.length ? remainingDice : dice;
    const uniqueDiceArray = Array.from(new Set(activeDiceForEntry.filter(d => typeof d === 'number')));

    for (const die of uniqueDiceArray) {
      const entryPoint = BAR_ENTRY_POINTS[currentPlayer][die as keyof typeof BAR_ENTRY_POINTS[typeof currentPlayer]];
      if (entryPoint) {
        if (this.isValidRegularMoveTarget(board, currentPlayer, entryPoint)) {
          moves.push({ from: BAR_POSITION, to: entryPoint, die, diceUsed: 1 });
        }
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
    const { board, currentPlayer, remainingDice, dice } = gameState;
    
    const activeDiceForSingle = remainingDice?.length ? remainingDice : dice;
    
    console.log(`Calculating single die moves for player ${currentPlayer} with dice [${activeDiceForSingle.join(', ')}]`);
    
    const diceToConsider = [...activeDiceForSingle];

    for (let dieIndex = 0; dieIndex < diceToConsider.length; dieIndex++) {
      const die = diceToConsider[dieIndex];
      if (typeof die !== 'number') continue;
      
      console.log(`Checking moves with die value ${die}`);
      
      for (let from = 1; from <= 24; from++) {
        const point = board[from];
        
        if (!point || point.player !== currentPlayer || point.count === 0) {
          continue;
        }
        
        const fromPathIndex = MOVEMENT_PATHS[currentPlayer].indexOf(from);
        if (fromPathIndex === -1) {
          console.log(`Position ${from} not found in path for player ${currentPlayer}`);
          continue;
        }
        
        const toPathIndex = fromPathIndex + die;
        
        if (toPathIndex >= MOVEMENT_PATHS[currentPlayer].length) {
          if (canBearOff && this.isInHomeBoard(from, currentPlayer) && this.isValidBearingOffMove(board, currentPlayer, from, die)) {
            console.log(`Valid bearing off move: ${from} → off`);
            moves.push({ from, to: BEARING_OFF_POSITION, die, diceUsed: 1 });
          }
          continue;
        }
        
        const to = MOVEMENT_PATHS[currentPlayer][toPathIndex];
        if (to === undefined) {
          console.log(`Invalid destination at index ${toPathIndex} for player ${currentPlayer}`);
          continue;
        }
        
        if (to >= 0 && to <= 24 && to !== from && this.isValidRegularMoveTarget(board, currentPlayer, to as number)) {
          console.log(`Valid move: ${from} → ${to} (die ${die})`);
          moves.push({ from, to: to as number, die, diceUsed: 1 });
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
    const { board, currentPlayer, remainingDice, dice } = gameState;
    
    const activeDiceForCombined = remainingDice?.length ? remainingDice : dice;
    
    if (activeDiceForCombined.length !== 2 || activeDiceForCombined[0] === activeDiceForCombined[1]) {
      console.log("Combined moves require exactly two different dice");
      return;
    }
    
    const die1 = activeDiceForCombined[0] as number;
    const die2 = activeDiceForCombined[1] as number;
    const combinedValue = die1 + die2;
    
    console.log(`Calculating combined moves for player ${currentPlayer} with dice [${die1}, ${die2}] = ${combinedValue}`);
    
    for (let from = 1; from <= 24; from++) {
      const point = board[from];
      
      if (!point || point.player !== currentPlayer || point.count === 0) {
        continue;
      }
      
      const fromPathIndex = MOVEMENT_PATHS[currentPlayer].indexOf(from);
      if (fromPathIndex === -1) {
        console.log(`Position ${from} not found in path for player ${currentPlayer}`);
        continue;
      }
      
      const toPathIndex = fromPathIndex + combinedValue;
      
      if (toPathIndex >= MOVEMENT_PATHS[currentPlayer].length) {
        if (canBearOff && this.isInHomeBoard(from, currentPlayer)) {
          if (this.isValidBearingOffMove(board, currentPlayer, from, combinedValue)) {
            console.log(`Valid combined bearing off move: ${from} → off (${combinedValue})`);
            moves.push({ 
              from, 
              to: BEARING_OFF_POSITION, 
              die: combinedValue,
              usesBothDice: true,
              diceUsed: 2
            });
          }
        }
        continue;
      }
      
      const to = MOVEMENT_PATHS[currentPlayer][toPathIndex];
      if (to === undefined) {
        console.log(`Invalid destination at index ${toPathIndex} for player ${currentPlayer}`);
        continue;
      }
      
      const intermediateTo1 = this.getIntermediatePosition(from, die1, currentPlayer);
      
      if (intermediateTo1 === null) {
        console.log(`Could not calculate intermediate position for ${from} + ${die1}`);
        continue;
      }
      
      const intermediateValid1 = this.isValidRegularMoveTarget(board, currentPlayer, intermediateTo1 as number);
      if (!intermediateValid1) {
        console.log(`Intermediate position ${intermediateTo1} is not valid for ${currentPlayer}`);
        continue;
      }
      
      if (to >= 0 && to <= 24 && to !== from && this.isValidRegularMoveTarget(board, currentPlayer, to as number)) {
        console.log(`Valid combined move: ${from} → ${to} (${die1}+${die2}=${combinedValue})`);
        moves.push({ 
          from, 
          to: to as number, 
          die: combinedValue,
          usesBothDice: true,
          diceUsed: 2
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
    
    const playerPath = MOVEMENT_PATHS[player];
    if (!playerPath || !Array.isArray(playerPath)) {
      console.log(`Invalid movement path for player ${player}`);
      return null;
    }
    
    const currentIndex = playerPath.indexOf(from);
    if (currentIndex === -1) {
      console.log(`Position ${from} not found in movement path for player ${player}`);
      return null;
    }
    
    const intermediateIndex = currentIndex + die;
    
    if (intermediateIndex < 0 || intermediateIndex >= playerPath.length) {
      console.log(`Intermediate index ${intermediateIndex} is outside of path range (0-${playerPath.length-1})`);
      return null;
    }
    
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
    
    if (player === BLACK) {
      if (die === from) return true;
      
      if (die > from) {
        for (let pos = from + 1; pos <= homeBoardRange.max; pos++) {
          const pointState = board[pos];
          if (pointState && pointState.player === player && pointState.count > 0) {
            return false;
          }
        }
        return true;
      }
      
      return false;
    }
    
    else {
      const bearingOffDice = BEARING_OFF_DICE[WHITE];
      if (String(from) in bearingOffDice) {
        const dieNeeded = bearingOffDice[from as keyof typeof bearingOffDice];
        if (die === dieNeeded) return true;
        
        if (die > dieNeeded) {
          for (let pos = homeBoardRange.min; pos < from; pos++) {
            const pointState = board[pos];
            if (pointState && pointState.player === player && pointState.count > 0) {
              return false;
            }
          }
          return true;
        }
      }
      
      return false;
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
    const newBoard = [...board];
    const newBar = { ...bar };
    const newBorneOff = { ...borneOff };
    
    if (move.from === BAR_POSITION) {
      console.log(`Moving piece FROM BAR to ${move.to} for player ${player} using die ${move.die}`);
      console.log(`Current bar state: ${JSON.stringify(newBar)}`);
      
      newBar[player]--;
      
      console.log(`New bar state after decrementing: ${JSON.stringify(newBar)}`);
      
      const destPoint = newBoard[move.to];
      if (!destPoint) {
        newBoard[move.to] = { player, count: 1 };
        console.log(`Created new point at ${move.to} with player ${player} and count 1`);
      } else if (destPoint.player === player) {
        destPoint.count++;
        console.log(`Added to existing stack at ${move.to}, new count: ${destPoint.count}`);
      } else if (destPoint.player === 0 || destPoint.count === 0) { // Moving to an empty point
        newBoard[move.to] = { player, count: 1 };
        console.log(`Moved from bar to empty point ${move.to}`);
      } else if (destPoint.count === 1) { // Hitting an opponent's blot
        const opponent = player === BLACK ? WHITE : BLACK;
        newBar[opponent]++;
        newBoard[move.to] = { player, count: 1 };
        console.log(`Hit opponent at ${move.to}, moved to bar. Bar now has ${newBar[opponent]} ${opponent === BLACK ? 'black' : 'white'} pieces`);
      }
      
      console.log(`After bar move to ${move.to}: Destination has ${newBoard[move.to]?.count || 0} ${player === BLACK ? 'black' : 'white'} pieces`);
    }
    else if (move.to === BEARING_OFF_POSITION) {
      const sourcePoint = newBoard[move.from];
      if (sourcePoint) {
        sourcePoint.count--;
        if (sourcePoint.count === 0) {
          newBoard[move.from] = { player: 0, count: 0 };
        }
      }
      
      newBorneOff[player]++;
    }
    else {
      const sourcePoint = newBoard[move.from];
      if (sourcePoint) {
        sourcePoint.count--;
        if (sourcePoint.count === 0) {
          newBoard[move.from] = { player: 0, count: 0 };
        }
      }
      
      const destPoint = newBoard[move.to];
      if (!destPoint) {
        newBoard[move.to] = { player, count: 1 };
        console.log(`Created new point at ${move.to} with player ${player} and count 1`);
      } else if (destPoint.player === player) {
        destPoint.count++;
        console.log(`Added to existing stack at ${move.to}, new count: ${destPoint.count}`);
      } else if (destPoint.player === 0 || destPoint.count === 0) {
        newBoard[move.to] = { player, count: 1 };
        console.log(`Moved to empty point at ${move.to}`);
      } else if (destPoint.player !== player && destPoint.count === 1) {
        const opponent = player === BLACK ? WHITE : BLACK;
        newBar[opponent]++;
        newBoard[move.to] = { player, count: 1 };
        console.log(`Hit opponent at ${move.to}, moved to bar`);
      } else {
        console.error(`Invalid move to ${move.to} - occupied by opponent with ${destPoint.count} pieces`);
      }
      
      console.log(`After move ${move.from}->${move.to}: Source has ${newBoard[move.from]?.count || 0}, Destination has ${newBoard[move.to]?.count || 0}`);
    }
    
    return { newBoard, newBar, newBorneOff };
  }
  
  /**
   * Check if a player can bear off (all pieces in home board and none on bar)
   */
  static canBearOff(board: BoardState, bar: BarState, player: Player): boolean {
    if (bar[player] > 0) return false;
    
    return this.allPiecesInHomeBoard(board, player);
  }
  
  /**
   * Check if all player's pieces are in their home board
   */
  static allPiecesInHomeBoard(board: BoardState, player: Player): boolean {
    const homeBoard = HOME_BOARDS[player];
    
    for (let pos = 1; pos <= 24; pos++) {
      if (pos >= homeBoard.min && pos <= homeBoard.max) continue;
      
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
    const board: BoardState = Array(25).fill(null);
    
    for (let i = 0; i < 25; i++) {
      board[i] = { player: 0, count: 0 };
    }
    
    console.log("Board initialized with empty points:", 
      board.map((p, i) => i > 0 && i <= 24 ? { pos: i, player: p?.player, count: p?.count } : null).filter(Boolean));
    
    board[24] = { player: BLACK, count: 2 };
    board[13] = { player: BLACK, count: 5 };
    board[8] = { player: BLACK, count: 3 };
    board[6] = { player: BLACK, count: 5 };
    
    board[1] = { player: WHITE, count: 2 };
    board[12] = { player: WHITE, count: 5 };
    board[17] = { player: WHITE, count: 3 };
    board[19] = { player: WHITE, count: 5 };
    
    const blackCount = board.reduce((sum, point) => 
      point && point.player === BLACK ? sum + point.count : sum, 0);
    const whiteCount = board.reduce((sum, point) => 
      point && point.player === WHITE ? sum + point.count : sum, 0);
    
    console.log(`Initial board: ${blackCount} black pieces, ${whiteCount} white pieces`);
    
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
    
    if (!destPoint) return true;
    
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
    return !this.allPiecesInHomeBoard(board, loser);
  }

  /**
   * Determine the set of required moves for a turn
   * This is needed to validate moves when players attempt to move pieces
   */
  static determineRequiredMoves(gameState: GameState): Move[] {
    const { dice, remainingDice } = gameState;
    
    const activeDice = remainingDice.length > 0 ? remainingDice : dice;
    
    const availableMoves = this.getAvailableMoves({
      ...gameState,
      dice: activeDice
    });
    
    if (availableMoves.length === 0) {
      return [];
    }
    
    console.log(`[Debug] Available moves with dice [${activeDice.join(',')}]:`, 
      JSON.stringify(availableMoves.map(m => `${m.from}->${m.to} (die ${m.die})`)));
    
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
    
    if (dice.length !== 4 || dice[0] !== dice[1]) {
      return [];
    }
    
    return this.getAvailableMoves(gameState);
  }
} 