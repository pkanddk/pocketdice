import { BackgammonRules } from './game-logic';
import { BLACK, WHITE, BEARING_OFF_POSITION, BAR_POSITION } from './constants';
import { BoardState, BarState, BorneOffState, GameState, Player } from './types';

describe('BackgammonRules edge cases', () => {
  function makeGameState(overrides: Partial<GameState>): GameState {
    return {
      board: Array(25).fill(null).map(() => ({ player: 0, count: 0 })),
      bar: { [BLACK]: 0, [WHITE]: 0 },
      borneOff: { [BLACK]: 0, [WHITE]: 0 },
      currentPlayer: BLACK,
      dice: [],
      remainingDice: [],
      gameStarted: true,
      mustUseAllDice: true,
      isRolling: false,
      diceRolled: true,
      ...overrides,
    };
  }

  it('allows bearing off with exact die', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[1] = { player: BLACK, count: 1 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [1], remainingDice: [1] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === 1 && m.to === BEARING_OFF_POSITION)).toBe(true);
  });

  it('allows bearing off with higher die if no higher points occupied', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[1] = { player: BLACK, count: 1 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [3], remainingDice: [3] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === 1 && m.to === BEARING_OFF_POSITION)).toBe(true);
  });

  it('disallows bearing off with higher die if higher points occupied', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[1] = { player: BLACK, count: 1 };
    board[3] = { player: BLACK, count: 1 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [3], remainingDice: [3] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === 1 && m.to === BEARING_OFF_POSITION)).toBe(false);
  });

  it('requires bar re-entry before other moves', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[6] = { player: BLACK, count: 1 };
    const bar: BarState = { [BLACK]: 1, [WHITE]: 0 };
    const state = makeGameState({ board, bar, currentPlayer: BLACK, dice: [6], remainingDice: [6] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.every(m => m.from === BAR_POSITION)).toBe(true);
  });

  it('handles doubles as four moves', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[8] = { player: BLACK, count: 1 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [2,2,2,2], remainingDice: [2,2,2,2] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.die === 2)).toBe(true);
  });

  it('blocks moves to points with 2+ opponent pieces', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[8] = { player: BLACK, count: 1 };
    board[6] = { player: WHITE, count: 2 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [2], remainingDice: [2] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.to === 6)).toBe(false);
  });

  it('allows White to bear off with exact die', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[24] = { player: WHITE, count: 1 };
    const state = makeGameState({ board, currentPlayer: WHITE, dice: [1], remainingDice: [1] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === 24 && m.to === BEARING_OFF_POSITION)).toBe(true);
  });

  it('allows White to bear off with higher die if no higher points occupied', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[24] = { player: WHITE, count: 1 };
    const state = makeGameState({ board, currentPlayer: WHITE, dice: [3], remainingDice: [3] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === 24 && m.to === BEARING_OFF_POSITION)).toBe(true);
  });

  it('disallows White bearing off with higher die if higher points occupied', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[24] = { player: WHITE, count: 1 };
    board[22] = { player: WHITE, count: 1 };
    const state = makeGameState({ board, currentPlayer: WHITE, dice: [3], remainingDice: [3] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === 24 && m.to === BEARING_OFF_POSITION)).toBe(false);
  });

  it('blocks bar re-entry if all entry points are blocked', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    // Block all entry points for Black (19-24) with 2 White pieces each
    for (let i = 19; i <= 24; i++) {
      board[i] = { player: WHITE, count: 2 };
    }
    const bar: BarState = { [BLACK]: 1, [WHITE]: 0 };
    const state = makeGameState({ board, bar, currentPlayer: BLACK, dice: [1,2], remainingDice: [1,2] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.length).toBe(0);
  });

  it('hitting sends opponent checker to bar', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[8] = { player: BLACK, count: 1 };
    board[6] = { player: WHITE, count: 1 };
    const bar: BarState = { [BLACK]: 0, [WHITE]: 0 };
    const state = makeGameState({ board, bar, currentPlayer: BLACK, dice: [2], remainingDice: [2] });
    const move = { from: 8, to: 6, die: 2 };
    const { newBoard, newBar } = BackgammonRules.applyMove(board, bar, { [BLACK]: 0, [WHITE]: 0 }, BLACK, move);
    expect(newBoard[6] && newBoard[6].player).toBe(BLACK);
    expect(newBoard[6] && newBoard[6].count).toBe(1);
    expect(newBar[WHITE]).toBe(1);
  });

  it('no moves available ends turn', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[8] = { player: BLACK, count: 1 };
    board[6] = { player: WHITE, count: 2 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [2], remainingDice: [2] });
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.length).toBe(0);
  });

  it('uses all four moves with doubles, including bearing off', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[2] = { player: BLACK, count: 4 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [2,2,2,2], remainingDice: [2,2,2,2] });
    const moves = BackgammonRules.getAvailableMoves(state);
    // Should allow four moves from 2 to bearing off
    expect(moves.filter(m => m.from === 2 && m.to === BEARING_OFF_POSITION).length).toBeGreaterThan(0);
  });

  it('mixed moves: bar, board, bear off in one turn', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[2] = { player: BLACK, count: 1 };
    const bar: BarState = { [BLACK]: 1, [WHITE]: 0 };
    const state = makeGameState({ board, bar, currentPlayer: BLACK, dice: [2,1], remainingDice: [2,1] });
    // First move: bar to 24 (using 1), then 2 to 1 (using 1), then 1 to bear off (using 1)
    // This is a simplified test to check that all move types are possible in a turn
    const moves = BackgammonRules.getAvailableMoves(state);
    expect(moves.some(m => m.from === BAR_POSITION)).toBe(true);
  });

  it('gammon and backgammon scoring', () => {
    const borneOff: BorneOffState = { [BLACK]: 15, [WHITE]: 0 };
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    // White has all pieces in Black's home board (simulate backgammon)
    for (let i = 1; i <= 6; i++) {
      board[i] = { player: WHITE, count: 2 };
    }
    expect(BackgammonRules.isGammon(borneOff, WHITE)).toBe(true);
    expect(BackgammonRules.isMulligan(board, WHITE)).toBe(true);
  });

  it('illegal moves are not allowed', () => {
    const board: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    board[8] = { player: BLACK, count: 1 };
    board[6] = { player: WHITE, count: 2 };
    const state = makeGameState({ board, currentPlayer: BLACK, dice: [2], remainingDice: [2] });
    const moves = BackgammonRules.getAvailableMoves(state);
    // Should not allow move from 8 to 6
    expect(moves.some(m => m.from === 8 && m.to === 6)).toBe(false);
    // Should not allow bearing off if not all in home board
    board[7] = { player: BLACK, count: 1 };
    const state2 = makeGameState({ board, currentPlayer: BLACK, dice: [1], remainingDice: [1] });
    const moves2 = BackgammonRules.getAvailableMoves(state2);
    expect(moves2.some(m => m.to === BEARING_OFF_POSITION)).toBe(false);
  });
}); 