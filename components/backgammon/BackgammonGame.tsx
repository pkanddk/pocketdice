"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Dice } from "./dice"
import { GamePiece } from "./game-piece"
import { GameControls } from "./game-controls"
import { Trophy, Settings, RotateCcw, LogOut } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { SettingsDialog } from "./settings-dialog"
import { Bar } from "./bar"
import { Button } from "@/components/ui/button"
import { getThemeStyle } from "@/utils/theme-styles"
import { BoardPoint } from './board-point'
import { BackgammonRules } from './game-logic'
import { Player, BoardState, BarState, GameState, Move, DiceRoll, BorneOffState } from './types'

// Import the cultural backgrounds
import { culturalBackgrounds } from "@/utils/cultural-backgrounds"

// Add at the top after imports
const DEBUG = true;

const debugLog = (message: string, data: any) => {
  if (DEBUG) {
    console.log(`[Backgammon Debug] ${message}:`, data);
  }
};

// Updated BackgammonGame.tsx with simplified bearing off logic

import { 
  BLACK, WHITE, BEARING_OFF_POSITION, BAR_POSITION, 
  HOME_BOARDS, MOVEMENT_PATHS, BOARD_LAYOUT 
} from './constants';

// Create a new component for bearing off zones
function BearOffZone({ 
  player, 
  isTopHalf, 
  canBearOff, 
  theme, 
  onBearOff 
}: { 
  player: Player; 
  isTopHalf: boolean; 
  canBearOff: boolean; 
  theme: string;
  onBearOff: (fromIndex: number) => void;
}) {
  const themeStyle = getThemeStyle(theme);

  const handleDragOver = (e: React.DragEvent) => {
    if (!canBearOff) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canBearOff) return;
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    console.log('Bearing off piece from index', fromIndex);
    onBearOff(fromIndex);
  };

  return (
    <div 
      className={`absolute w-16 rounded-lg transition-all duration-300 ${canBearOff ? 'opacity-100' : 'opacity-40'}`}
      style={{
        right: '1rem',
        [isTopHalf ? 'top' : 'bottom']: '1rem',
        height: '120px',
        background: player === 1 ? themeStyle.player1Color + '33' : themeStyle.player2Color + '33',
        border: `2px dashed ${canBearOff ? (player === 1 ? themeStyle.player1Color : themeStyle.player2Color) : 'transparent'}`,
        boxShadow: canBearOff ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-white text-xs font-bold mb-1">
          {player === 1 ? 'P1' : 'P2'} Off
        </div>
        <div className="text-white text-lg font-bold">
          {player === 1 ? '↘' : '↗'}
        </div>
        <div className="mt-2 text-white text-xs">
          {canBearOff ? 'Ready' : 'Locked'}
        </div>
      </div>
    </div>
  );
}

export default function BackgammonGame({ playerNames = [] }: { playerNames?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Debug playerNames received from parent
  console.log("====== BACKGAMMON GAME COMPONENT ======");
  console.log("🔍 RECEIVED PLAYER NAMES:", playerNames);
  console.log("🔍 Names type:", typeof playerNames);
  console.log("🔍 Is Array:", Array.isArray(playerNames));
  console.log("🔍 Array length:", playerNames ? playerNames.length : 'undefined/null');
  
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    board: Array(25).fill(null).map(() => ({ player: 0, count: 0 })),
    bar: { [BLACK]: 0, [WHITE]: 0 },
    borneOff: { [BLACK]: 0, [WHITE]: 0 },
    currentPlayer: BLACK,
    dice: [],
    remainingDice: [],
    gameStarted: false,
    mustUseAllDice: true,
    isRolling: false,
    diceRolled: false
  });

  // Ref to track the previous player to prevent immediate switch-back
  const prevPlayerRef = useRef<Player | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [scores, setScores] = useState<{ 1: number; 2: number }>({ 1: 0, 2: 0 });
  const [theme, setTheme] = useState("classic");
  const themeStyle = getThemeStyle(theme);
  const [gameNumber, setGameNumber] = useState(1);
  const [seriesWinner, setSeriesWinner] = useState<Player | null>(null);

  // Force render state to handle updates
  const [forceRender, setForceRender] = useState(0);

  // Force board reset when game starts
  useEffect(() => {
    if (gameState.gameStarted) {
      debugLog("Game started - Resetting state", null);
      
      // Create a properly initialized board
      const newBoard = BackgammonRules.getInitialBoard();
      
      // Log the board state for debugging
      console.log("Initial board state:", JSON.stringify(newBoard.map((p, i) => 
        i > 0 && i <= 24 ? { pos: i, player: p?.player, count: p?.count } : null).filter(Boolean)));
      
      // Verify each position has properly been set
      const blackPositions = [6, 8, 13, 24];
      const whitePositions = [1, 12, 17, 19];
      
      let isValid = true;
      
      blackPositions.forEach(pos => {
        if (!newBoard[pos] || newBoard[pos].player !== BLACK || newBoard[pos].count === 0) {
          console.error(`Black position ${pos} not properly initialized:`, newBoard[pos]);
          isValid = false;
        } else {
          console.log(`✓ Verified Black position ${pos}: count=${newBoard[pos].count}`);
        }
      });
      
      whitePositions.forEach(pos => {
        if (!newBoard[pos] || newBoard[pos].player !== WHITE || newBoard[pos].count === 0) {
          console.error(`White position ${pos} not properly initialized:`, newBoard[pos]);
          isValid = false;
        } else {
          console.log(`✓ Verified White position ${pos}: count=${newBoard[pos].count}`);
        }
      });
      
      if (!isValid) {
        console.error("Board initialization failed - attempting manual initialization");
        
        // If there was a problem, manually set the positions
        const manualBoard: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
        
        // Set up Black pieces (Player 1)
        manualBoard[24] = { player: BLACK, count: 2 };  // 2 pucks at position 24
        manualBoard[13] = { player: BLACK, count: 5 };  // 5 pucks at position 13
        manualBoard[8] = { player: BLACK, count: 3 };   // 3 pucks at position 8
        manualBoard[6] = { player: BLACK, count: 5 };   // 5 pucks at position 6
        
        // Set up White pieces (Player 2)
        manualBoard[1] = { player: WHITE, count: 2 };   // 2 pucks at position 1
        manualBoard[12] = { player: WHITE, count: 5 };  // 5 pucks at position 12
        manualBoard[17] = { player: WHITE, count: 3 };  // 3 pucks at position 17
        manualBoard[19] = { player: WHITE, count: 5 };  // 5 pucks at position 19
        
        console.log("Manually initialized board:", manualBoard);
        
        setGameState(state => ({
          ...state,
          board: manualBoard,
          bar: BackgammonRules.getInitialBarState(),
          borneOff: BackgammonRules.getInitialBorneOffState(),
          currentPlayer: 1,
          dice: [],
          remainingDice: [],
          mustUseAllDice: true,
          isRolling: false
        }));
      } else {
        // Normal initialization
        setGameState(state => ({
          ...state,
          board: newBoard,
          bar: BackgammonRules.getInitialBarState(),
          borneOff: BackgammonRules.getInitialBorneOffState(),
          currentPlayer: 1,
          dice: [],
          remainingDice: [],
          mustUseAllDice: true,
          isRolling: false
        }));
      }
      
      prevPlayerRef.current = null; // Reset previous player on game start/reset
      
      // Force a redraw of the board
      setTimeout(() => {
        console.log("Forcing redraw after game initialization");
        setGameState(state => ({ ...state }));
      }, 100);
    }
  }, [gameState.gameStarted]);

  // Reset game function
  const handleReset = useCallback(() => {
    debugLog("Resetting game", null);
    setGameState({
      board: BackgammonRules.getInitialBoard(),
      bar: BackgammonRules.getInitialBarState(),
      borneOff: BackgammonRules.getInitialBorneOffState(),
      currentPlayer: 1,
      dice: [],
      remainingDice: [],
      gameStarted: false,
      mustUseAllDice: true,
      isRolling: false,
      diceRolled: false
    });
    setGameNumber(1);
    setScores({ 1: 0, 2: 0 });
    setSeriesWinner(null);
    prevPlayerRef.current = null; // Reset previous player
  }, []);

  // Exit game function
  const handleExit = () => {
    router.push('/');
  };

  // Debug function to set up testing bearing off
  const setupForBearingOff = () => {
    if (!DEBUG) return;
    
    // Create a new board with 1-based positions (25 elements, 0 is unused/bar)
    const newBoard: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    
    // Set up Black pieces (Player 1) in home board (1-6)
    newBoard[1] = { player: BLACK, count: 5 };  // Position 1: needs die 1 to bear off
    newBoard[2] = { player: BLACK, count: 3 };  // Position 2: needs die 2 to bear off
    newBoard[3] = { player: BLACK, count: 3 };  // Position 3: needs die 3 to bear off
    newBoard[4] = { player: BLACK, count: 2 };  // Position 4: needs die 4 to bear off
    newBoard[5] = { player: BLACK, count: 1 };  // Position 5: needs die 5 to bear off
    newBoard[6] = { player: BLACK, count: 1 };  // Position 6: needs die 6 to bear off
    
    // Set up White pieces (Player 2) in home board (19-24)
    newBoard[19] = { player: WHITE, count: 5 };  // Position 19: needs die 6 to bear off
    newBoard[20] = { player: WHITE, count: 3 };  // Position 20: needs die 5 to bear off
    newBoard[21] = { player: WHITE, count: 3 };  // Position 21: needs die 4 to bear off
    newBoard[22] = { player: WHITE, count: 2 };  // Position 22: needs die 3 to bear off
    newBoard[23] = { player: WHITE, count: 1 };  // Position 23: needs die 2 to bear off
    newBoard[24] = { player: WHITE, count: 1 };  // Position 24: needs die 1 to bear off
    
    // Update game state
    setGameState(state => ({
      ...state,
      board: newBoard,
      bar: { [BLACK]: 0, [WHITE]: 0 },
      borneOff: { [BLACK]: 0, [WHITE]: 0 },
      gameStarted: true,
      currentPlayer: WHITE, // Start with White for testing
      dice: [1, 5], // Set default dice values
      remainingDice: [1, 5]
    }));
    
    console.log("Board set up for testing bearing off with 1-based positions");
    console.log("- Black (Player 1) pieces are at positions 1-6");
    console.log("- White (Player 2) pieces are at positions 19-24");
    console.log("- Current player: White (Player 2)");
    console.log("- Dice: [1, 5]");
  };

  // Debug function to set up testing BLACK bearing off
  const setupBlackBearingOffTest = () => {
    if (!DEBUG) return;
    
    const newBoard: BoardState = Array(25).fill(null).map(() => ({ player: 0, count: 0 }));
    
    // Set up Black pieces (Player 1) in home board (1-6)
    newBoard[1] = { player: BLACK, count: 5 };  
    newBoard[2] = { player: BLACK, count: 3 };  
    newBoard[3] = { player: BLACK, count: 3 };  
    newBoard[4] = { player: BLACK, count: 2 };  
    newBoard[5] = { player: BLACK, count: 1 };  
    newBoard[6] = { player: BLACK, count: 1 };  
    
    // Put White pieces somewhere out of the way (e.g., point 24)
    newBoard[24] = { player: WHITE, count: 15 }; 

    const testDice: DiceRoll = [1, 4]; // Example dice for Black test
    
    // Update game state
    setGameState(state => ({
      ...state,
      board: newBoard,
      bar: { [BLACK]: 0, [WHITE]: 0 },
      borneOff: { [BLACK]: 0, [WHITE]: 0 },
      gameStarted: true,
      currentPlayer: BLACK, // Start with Black for testing
      dice: [...testDice], 
      remainingDice: [...testDice]
    }));
    
    console.log("Board set up for testing BLACK bearing off");
    console.log("- Black (Player 1) pieces are at positions 1-6");
    console.log("- Current player: Black (Player 1)");
    console.log(`- Dice: [${testDice.join(', ')}]`);
  };

  const rollDice = useCallback(() => {
    if (gameState.remainingDice.length > 0 || !gameState.gameStarted || gameState.isRolling) return;

    debugLog("Rolling dice for player", gameState.currentPlayer);
    setGameState(state => ({ ...state, isRolling: true }));

    setTimeout(() => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const newDice = die1 === die2 ? [die1, die1, die1, die1] : [die1, die2];
      
      debugLog("Rolled dice", { 
        dice: newDice, 
        player: gameState.currentPlayer,
        isDoubles: die1 === die2
      });

      setGameState(state => ({
        ...state,
        dice: [...newDice],
        remainingDice: [...newDice],
        isRolling: false,
        mustUseAllDice: true
      }));
    }, 1000);
  }, [gameState.gameStarted, gameState.isRolling, gameState.currentPlayer, gameState.remainingDice.length]);

  const switchPlayer = useCallback(() => {
    const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    console.log(`[Debug switchPlayer] Called. Switching from ${gameState.currentPlayer} to ${nextPlayer}`);
    debugLog("Switching to player", nextPlayer);

    setGameState(state => ({
      ...state,
      currentPlayer: nextPlayer,
      dice: [],
      remainingDice: [],
      mustUseAllDice: true,
      isRolling: false
    }));
  }, [gameState.currentPlayer]);

  /**
   * Handles a piece move attempt
   */
  const handlePieceMove = (fromIndex: number, toIndex: number) => {
    console.log(`Attempting to move piece from ${fromIndex} to ${toIndex}`);
    
    // Get the actual dice values in use
    const activeDice = gameState.remainingDice?.length ? gameState.remainingDice : gameState.dice;
    
    if (activeDice.length === 0) {
      console.log('No dice available for the move');
      return;
    }
    
    console.log('Active dice:', activeDice);
    
    // Calculate the move distance based on player's movement direction
    let moveDistance = 0;
    
    if (fromIndex === BAR_POSITION) {
      // Special case for bar
      if (gameState.currentPlayer === BLACK) {
        moveDistance = 25 - toIndex;
      } else {
        moveDistance = toIndex;
      }
    } else if (toIndex === BEARING_OFF_POSITION) {
      // Special case for bearing off
      if (gameState.currentPlayer === BLACK) {
        const fromPosition = MOVEMENT_PATHS[BLACK].indexOf(fromIndex);
        if (fromPosition !== -1) {
          moveDistance = MOVEMENT_PATHS[BLACK].length - fromPosition;
        }
      } else {
        const fromPosition = MOVEMENT_PATHS[WHITE].indexOf(fromIndex);
        if (fromPosition !== -1) {
          moveDistance = MOVEMENT_PATHS[WHITE].length - fromPosition;
        }
      }
    } else {
      // Regular move - calculate distance based on player's direction
      if (gameState.currentPlayer === BLACK) {
        const fromPosition = MOVEMENT_PATHS[BLACK].indexOf(fromIndex);
        const toPosition = MOVEMENT_PATHS[BLACK].indexOf(toIndex);
        
        if (fromPosition !== -1 && toPosition !== -1) {
          moveDistance = toPosition - fromPosition;
          console.log(`BLACK move: from=${fromIndex}(idx:${fromPosition}) to=${toIndex}(idx:${toPosition}), distance=${moveDistance}`);
        }
      } else {
        const fromPosition = MOVEMENT_PATHS[WHITE].indexOf(fromIndex);
        const toPosition = MOVEMENT_PATHS[WHITE].indexOf(toIndex);
        
        if (fromPosition !== -1 && toPosition !== -1) {
          moveDistance = toPosition - fromPosition;
          console.log(`WHITE move: from=${fromIndex}(idx:${fromPosition}) to=${toIndex}(idx:${toPosition}), distance=${moveDistance}`);
        }
      }
    }
    
    console.log(`Move distance: ${moveDistance}`);
    
    // Get available moves for validation
    const availableMoves = BackgammonRules.getAvailableMoves(gameState);
    console.log('Available moves:', availableMoves);
    
    // Find a matching move from the available moves
    const matchingMove = availableMoves.find(move => 
      move.from === fromIndex && move.to === toIndex
    );
    
    if (!matchingMove) {
      console.log('Invalid move - not in available moves list');
      console.log('Attempted move:', {from: fromIndex, to: toIndex, distance: moveDistance});
      console.log('Available moves:', availableMoves.map(m => `${m.from}→${m.to} (die ${m.die}${m.usesBothDice ? ', combined' : ''})`));
      return;
    }
    
    console.log('Matched move:', matchingMove);
    
    // Create a new game state with this move applied
    const newGameState = { ...gameState };
    const newBoard = [...newGameState.board];
    newGameState.board = newBoard;
    
    // Apply the move
    const moveResult = BackgammonRules.applyMove(
      newGameState.board,
      newGameState.bar,
      newGameState.borneOff,
      newGameState.currentPlayer,
      matchingMove
    );
    
    // Update state with move results
    newGameState.board = [...moveResult.newBoard];
    newGameState.bar = { ...moveResult.newBar };
    newGameState.borneOff = { ...moveResult.newBorneOff };
    
    // Check if this was a combined move that uses both dice
    if (matchingMove.usesBothDice) {
      console.log('This is a combined move using both dice - ending turn');
      // End turn immediately for combined moves
      newGameState.currentPlayer = newGameState.currentPlayer === BLACK ? WHITE : BLACK;
      newGameState.dice = [];
      newGameState.remainingDice = [];
      newGameState.diceRolled = false;
    } else {
      // Regular move - remove only the used die
      const usedDie = matchingMove.die;
      const remainingDice = activeDice.filter((d, index) => {
        // Keep dice that are not the used die, but only remove one instance
        if (d === usedDie) {
          // Create a new array with this die removed
          const result = index === activeDice.findIndex(dice => dice === usedDie);
          return !result;
        }
        return true;
      });
      
      // Update the game state with the remaining dice
      newGameState.remainingDice = remainingDice;
      
      // Check if all dice have been used
      if (remainingDice.length === 0) {
        // End turn automatically if no dice left
        newGameState.currentPlayer = newGameState.currentPlayer === BLACK ? WHITE : BLACK;
        newGameState.dice = [];
        newGameState.remainingDice = [];
        newGameState.diceRolled = false;
      } else {
        // Check if there are any valid moves left with the remaining dice
        // Clone the board for the calculation to use the updated board state
        const updatedGameState = {
          ...newGameState,
          dice: remainingDice,
          remainingDice: remainingDice,
          diceRolled: newGameState.diceRolled,
          board: [...newGameState.board] // Ensure we're using the updated board
        };
        
        console.log("Checking for remaining moves with dice:", remainingDice);
        console.log("Using updated board state:", updatedGameState.board);
        
        // Get available moves for the updated board state
        const remainingMoves = BackgammonRules.getAvailableMoves(updatedGameState);
        
        console.log("Remaining available moves:", remainingMoves.length);
        if (remainingMoves.length > 0) {
          console.log("Available moves:", remainingMoves.map(m => 
            `${m.from}→${m.to} (die ${m.die}${m.usesBothDice ? ', combined' : ''})`));
        }
        
        if (remainingMoves.length === 0) {
          console.log('No valid moves remaining with dice', remainingDice);
          // End turn automatically if no valid moves
          newGameState.currentPlayer = newGameState.currentPlayer === BLACK ? WHITE : BLACK;
          newGameState.dice = [];
          newGameState.remainingDice = [];
          newGameState.diceRolled = false;
        }
      }
    }
    
    // Update the game state
    setGameState(newGameState);
    
    // Simple force render without the recursive retry mechanism that could cause loops
    setForceRender(prev => prev + 1);
    
    // If moving from bar, add a one-time delayed update to ensure rendering
    if (fromIndex === BAR_POSITION) {
      setTimeout(() => {
        console.log('Delayed update after bar move to ensure rendering');
        setForceRender(prev => prev + 1);
      }, 100);
    }
  };

  // Check for series winner
  useEffect(() => {
    if (scores[1] >= 3 || scores[2] >= 3) {
      const winner = scores[1] >= 3 ? 1 : 2;
      setSeriesWinner(winner);
      alert(`Player ${winner} wins the series!`);
    }
  }, [scores]);

  // Check for win condition
  useEffect(() => {
    if (!gameState.gameStarted) return;

    const checkWin = (player: Player) => {
      // Player has won if all pieces are borne off
      if (gameState.borneOff[player] === BackgammonRules.PIECES_PER_PLAYER) {
        debugLog("Player won", player);
        
        // Determine opponent
        const opponent = player === 1 ? 2 : 1;
        
        // Check if Mulligan rules apply (opponent hasn't moved all pieces to home board)
        const opponentAllHome = BackgammonRules.allPiecesInHomeBoard(gameState.board, opponent);
        
        // Score calculation
        const pointsEarned = !opponentAllHome ? 3 : 1;
        
        debugLog("Win details", { 
          player, 
          opponent, 
          opponentAllHome, 
          pointsEarned
        });
        
        const newScores = { ...scores };
        newScores[player] += pointsEarned;
        setScores(newScores);
        
        setGameState(state => ({ ...state, gameStarted: false }));
        
        // Show end game notification
        let message = `Player ${player} wins${pointsEarned === 3 ? ' a Backgammon' : ' a Gammon'}!`;
        if (seriesWinner === 1) {
          message += ` Player 1 wins the series ${newScores[1]}-${newScores[2]}!`;
        } else if (seriesWinner === 2) {
          message += ` Player 2 wins the series ${newScores[2]}-${newScores[1]}!`;
        }
        
        alert(message);
        
        // Start new game
        setGameNumber(prev => prev + 1);
      }
    };

    checkWin(1);
    checkWin(2);
  }, [gameState.board, gameState.bar, gameState.borneOff, gameState.gameStarted]);

  // EFFECT: Check ONLY for the "stuck" condition (has dice but no moves)
  useEffect(() => {
    const currentPlayer = gameState.currentPlayer;
    console.log(`[Debug useEffect RUN] Curr: ${currentPlayer}, Dice: [${gameState.remainingDice.join(',')}]`);

    // Don't run checks if game not started or dice are rolling OR if dice are empty
    if (!gameState.gameStarted || gameState.isRolling || gameState.remainingDice.length === 0) {
      return;
    }

    // Player HAS dice, check if they are stuck
    const availableMoves = BackgammonRules.getAvailableMoves({
        ...gameState,
        dice: gameState.remainingDice
    });
    console.log(`[Debug] Found ${availableMoves.length} available moves for Player ${currentPlayer} with dice [${gameState.remainingDice.join(", ")}]`);

    if (availableMoves.length === 0) {
        console.log(`[Debug useEffect] Turn should end for Player ${currentPlayer} (No available moves). Switching player.`);
        const timer = setTimeout(() => { switchPlayer(); }, 200);
        return () => clearTimeout(timer);
    }

  // Dependencies: Only need to run when things potentially affecting moves change WHILE dice exist.
  }, [gameState.remainingDice, gameState.currentPlayer, gameState.board, gameState.bar, gameState.gameStarted, gameState.isRolling, switchPlayer]);

  // Add the function to handle bearing off directly
  const handleBearOff = useCallback((fromIndex: number) => {
    if (!gameState.gameStarted || gameState.remainingDice.length === 0) return; // Check remainingDice

    // Validate using getAvailableMoves with remaining dice
    const possibleMoves = BackgammonRules.getAvailableMoves({
      ...gameState, 
      dice: gameState.remainingDice 
    });
    
    // Check if any of the possible moves is a bear-off from the clicked index
    const bearOffMove = possibleMoves.find((move: Move) => move.from === fromIndex && move.to === BEARING_OFF_POSITION);

    if (bearOffMove) {
      console.log(`Handling direct bear off for piece ${fromIndex} using die ${bearOffMove.die}`);
      // Pass the specific move (including the die) to handlePieceMove 
      // handlePieceMove will find this exact move again for validation
      handlePieceMove(fromIndex, BEARING_OFF_POSITION);
    } else {
      console.log(`Cannot bear off directly from ${fromIndex} with remaining dice [${gameState.remainingDice.join(", ")}]`);
    }
  // Update dependencies: gameState provides all needed sub-properties
  }, [gameState, handlePieceMove]);

  // Render points for a quadrant - using 1-based indexing
  const renderPoints = (quadrant: keyof typeof BOARD_LAYOUT) => {
    const indices = BOARD_LAYOUT[quadrant];
    const isTopHalf = quadrant.startsWith('TOP_');

    return indices.map((position, i) => {
      // Make sure we have a valid point state
      let point = gameState.board[position];
      if (!point) {
        console.error(`Point ${position} is undefined or null - creating empty point`);
        point = { player: 0, count: 0 };
      }
      
      // Debug log the point state
      if (point.count > 0) {
        console.log(`Rendering point ${position} with ${point.count} pieces for player ${point.player}`);
      }

      const isEvenPoint = i % 2 === 0;

      // Check if the current player can bear off (pass parameters)
      const playerCanBearOff = BackgammonRules.canBearOff(
        gameState.board,
        gameState.bar,
        gameState.currentPlayer
      );

      // Check if this point is in player's home board
      const isInHomeBoard = BackgammonRules.isInHomeBoard(position, gameState.currentPlayer);

      // Is this point occupied by current player?
      const isPlayerPoint = point.player === gameState.currentPlayer && point.count > 0;

      // Get the set of moves REQUIRED this turn based on remaining dice
      const requiredMovesForTurn = BackgammonRules.determineRequiredMoves({
          ...gameState,
          dice: gameState.remainingDice
      });

      // Can this point be used for bearing off? Check required moves list.
      const canBearOffFromPoint = playerCanBearOff && 
        isPlayerPoint && 
        isInHomeBoard && 
        requiredMovesForTurn.some((move: Move) => move.from === position && move.to === BEARING_OFF_POSITION);
        
      // Is this point playable for ANY required move this turn?
      const isPlayable = gameState.gameStarted &&
        gameState.remainingDice.length > 0 && 
        isPlayerPoint &&
        (gameState.bar[gameState.currentPlayer] === 0) && 
        requiredMovesForTurn.some((move: Move) => move.from === position); 

      // Add log
      console.log(`[Debug renderPoints] Point ${position}: isPlayable=${isPlayable}, canBearOff=${canBearOffFromPoint}, player=${point.player}, count=${point.count}, RequiredMoves=`, requiredMovesForTurn.length); 
      
      // Add a unique key to force re-render when the point changes
      // Include forceRender to ensure consistent updates
      const pointKey = `point-${position}-${point.player}-${point.count}-${isPlayable}-${forceRender}`;
      
      return (
        <BoardPoint
          key={pointKey}
          index={position}
          player={point.player}
          count={point.count}
          isTopHalf={isTopHalf}
          isEvenPoint={isEvenPoint}
          theme={theme}
          currentPlayer={gameState.currentPlayer}
          isPlayable={isPlayable}
          onMove={handlePieceMove}
          canBearOff={canBearOffFromPoint}
        />
      );
    });
  };

  // Check if there are valid moves for the current player
  const hasValidMoves = (state: typeof gameState) => {
    const { board, bar, currentPlayer, dice, borneOff } = state;
    const remainingDice = state.remainingDice?.length ? state.remainingDice : dice;
    
    // First try using the updated approach to get available moves
    const availableMoves = BackgammonRules.getAvailableMoves({
      board,
      bar,
      currentPlayer,
      dice,
      borneOff: state.borneOff,
      gameStarted: state.gameStarted,
      mustUseAllDice: state.mustUseAllDice,
      isRolling: state.isRolling,
      remainingDice: remainingDice || dice,
      diceRolled: state.diceRolled
    });
    
    return availableMoves.length > 0;
  };
  
  // End the current player's turn and switch to the next player
  const endTurn = (state: typeof gameState) => {
    const nextPlayer = state.currentPlayer === 1 ? 2 : 1;
    
    setGameState({
      ...state,
      currentPlayer: nextPlayer,
      dice: [],
      isRolling: false,
    });
  };
  
  // Handle game end when a player has borne off all their pieces
  const handleGameEnd = (winner: 1 | 2) => {
    const loser = winner === 1 ? 2 : 1;
    
    // Check for special scoring conditions
    const isGammon = BackgammonRules.isGammon(gameState.borneOff, loser);
    const isMulligan = BackgammonRules.isMulligan(gameState.board, loser);
    
    // Calculate points
    let points = 1; // Base points
    if (isGammon) points = 2; // Gammon (2x)
    if (isMulligan) points = 3; // Backgammon (3x)
    
    // Update scores (using component state 'scores', not gameState.scores)
    const newScores = { ...scores }; // Use the 'scores' state variable
    newScores[winner] += points;
    setScores(newScores); // Update the scores state
    
    // Check if the series is over
    const seriesWinner = newScores[1] >= 5 ? 1 : newScores[2] >= 5 ? 2 : 0;
    
    setGameState(state => ({
      ...state,
      gameOver: true,
      winner,
      seriesWinner,
    }));
    
    // Show end game notification
    let message = `Player ${winner} wins${isGammon ? ' a Gammon' : isMulligan ? ' a Backgammon' : ''}!`;
    if (seriesWinner === 1) {
      message += ` Player 1 wins the series ${newScores[1]}-${newScores[2]}!`;
    } else if (seriesWinner === 2) {
      message += ` Player 2 wins the series ${newScores[2]}-${newScores[1]}!`;
    }
    
    /* Commenting out undefined notification call
    setNotification({
      message,
      type: 'success',
      duration: 5000,
    });
    */
  };

  // Add a more aggressive useEffect at the top of the component
  useEffect(() => {
    // More aggressive approach to force layouts to show properly
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Find and fix ALL possible containers
    const allContainers = document.querySelectorAll('div, main, section, article, #__next, [id*="root"], [class*="layout"], [class*="container"]');
    allContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        // Set everything to visible overflow
        container.style.overflow = 'visible';
        
        // Get computed style to check if this container might be a culprit
        const style = window.getComputedStyle(container);
        if (style.height !== 'auto' && style.maxHeight !== 'none' && style.overflow === 'hidden') {
          // This is likely a problem container - force it to show content
          container.style.height = 'auto';
          container.style.maxHeight = 'none';
          container.style.minHeight = container === document.body ? '100vh' : 'auto';
        }
      }
    });

    // Fix the game container directly
    const gameContainer = document.getElementById('backgammon-game-container');
    if (gameContainer) {
      gameContainer.style.minHeight = '100vh';
      gameContainer.style.height = 'auto';
      gameContainer.style.position = 'relative';
      gameContainer.style.zIndex = '1';
    }

    return () => {
      // Cleanup
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('height'); 
      document.body.style.removeProperty('minHeight');
      document.documentElement.style.removeProperty('height');
      document.documentElement.style.removeProperty('overflow');
    };
  }, []);

  const checkEndOfTurn = useCallback(() => {
    // Check if player's turn is over (no more dice or no valid moves)
    if (gameState.dice.length === 0) {
      // No more dice, end turn
      switchPlayer();
      return;
    }
    
    // Check if there are valid moves
    const availableMoves = BackgammonRules.getAvailableMoves({
      board: gameState.board,
      bar: gameState.bar,
      currentPlayer: gameState.currentPlayer,
      dice: gameState.dice,
      borneOff: gameState.borneOff,
      gameStarted: gameState.gameStarted,
      mustUseAllDice: gameState.mustUseAllDice,
      isRolling: gameState.isRolling,
      remainingDice: gameState.remainingDice,
      diceRolled: gameState.diceRolled
    });
    
    if (availableMoves.length === 0) {
      // No valid moves, end turn
      console.log('No valid moves available. Ending turn.');
      switchPlayer();
    }
  }, [gameState, switchPlayer]);

  // Check for valid moves after player changes or dice are rolled
  useEffect(() => {
    if (!gameState.gameStarted || gameState.dice.length === 0 || gameState.isRolling) return;
    
    console.log(`[Debug useEffect RUN] Curr: ${gameState.currentPlayer}, Dice: ${gameState.dice}`);
    
    // Check if there are valid moves
    const availableMoves = BackgammonRules.getAvailableMoves({
      board: gameState.board,
      bar: gameState.bar,
      currentPlayer: gameState.currentPlayer,
      dice: gameState.dice,
      borneOff: gameState.borneOff,
      gameStarted: gameState.gameStarted,
      mustUseAllDice: gameState.mustUseAllDice,
      isRolling: gameState.isRolling,
      remainingDice: gameState.remainingDice,
      diceRolled: gameState.diceRolled
    });
    
    if (availableMoves.length === 0) {
      // No valid moves, end turn
      console.log(`[Debug] No valid moves for Player ${gameState.currentPlayer}. Auto-ending turn.`);
      setTimeout(() => {
        switchPlayer();
      }, 1000);
    } else {
      console.log(`[Debug] Found ${availableMoves.length} available moves for Player ${gameState.currentPlayer} with dice ${gameState.dice}`);
    }
  }, [gameState.currentPlayer, gameState.dice, forceRender, switchPlayer]);

  return (
    <div 
      id="backgammon-game-container" 
      className="bg-gray-900 w-full"
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        maxHeight: '100vh', // Enforce maximum height
        overflow: 'hidden' // Prevent scrolling within the game container
      }}
    >
      {/* Header - Fixed height */}
      <div className="bg-gray-800 p-3 shadow-md flex-shrink-0">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-white font-bold">
              Score: {scores[1]} - {scores[2]} (Game {gameNumber} of 5)
            </span>
          </div>

          <div className="flex items-center">
            <PlayerIndicator player={gameState.currentPlayer} theme={theme} playerNames={playerNames} />
          </div>

          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="text-white">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-white">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExit} className="text-white">
              <LogOut className="h-4 w-4 mr-1" /> Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Game board - Take available space but not more than needed */}
      <div className="flex-grow flex-shrink-1 overflow-auto p-3 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* Board with responsive aspect ratio */}
          <div className="relative w-full" style={{ paddingBottom: "50%" }}>
            <div 
              className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg border-4 shadow-lg"
              style={{ borderColor: themeStyle.borderColor }}
            >
              <div className="h-full flex">
                {/* Left half */}
                <div className="flex-1 flex flex-col">
                  {/* Top quadrants */}
                  <div className="flex-1 flex">
                    <div className="flex-1 flex">
                      {renderPoints('TOP_LEFT')}
                    </div>
                    <div className="w-10 relative border-l border-r border-gray-700">
                      <Bar
                        player={2}
                        count={gameState.bar[2]}
                        onMove={handlePieceMove}
                        currentPlayer={gameState.currentPlayer}
                        isTopHalf={true}
                        theme={theme}
                        isPlayable={
                          gameState.gameStarted &&
                          gameState.dice.length > 0 &&
                          gameState.currentPlayer === 2 &&
                          gameState.bar[2] > 0
                        }
                      />
                    </div>
                    <div className="flex-1 flex">
                      {renderPoints('TOP_RIGHT')}
                    </div>
                  </div>

                  {/* Bottom quadrants */}
                  <div className="flex-1 flex">
                    <div className="flex-1 flex">
                      {renderPoints('BOTTOM_LEFT')}
                    </div>
                    <div className="w-10 relative border-l border-r border-gray-700">
                      <Bar
                        player={1}
                        count={gameState.bar[1]}
                        onMove={handlePieceMove}
                        currentPlayer={gameState.currentPlayer}
                        isTopHalf={false}
                        theme={theme}
                        isPlayable={
                          gameState.gameStarted &&
                          gameState.dice.length > 0 &&
                          gameState.currentPlayer === 1 &&
                          gameState.bar[1] > 0
                        }
                      />
                    </div>
                    <div className="flex-1 flex">
                      {renderPoints('BOTTOM_RIGHT')}
                    </div>
                  </div>
                </div>

                {/* Dice area */}
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center items-center pointer-events-none z-30">
                  {gameState.gameStarted && gameState.dice.length > 0 && (
                    <div className={`p-2 ${themeStyle.diceBackground} backdrop-blur-sm rounded-lg border border-white/10 shadow-md`}>
                      <Dice values={gameState.dice} rolling={gameState.isRolling} />
                    </div>
                  )}
                </div>

                {/* Bearing off indicators */}
                <div className="absolute top-2 right-2 p-2 bg-black/30 rounded text-white text-xs">
                  P1: {gameState.borneOff[1]}/15
                </div>
                <div className="absolute bottom-2 right-2 p-2 bg-black/30 rounded text-white text-xs">
                  P2: {gameState.borneOff[2]}/15
                </div>
              </div>
            </div>
          </div>

          {/* Bearing Off Zone */}
          <div className="mt-3 h-10 flex w-full rounded-lg overflow-hidden border-2 border-gray-700">
            {/* Player 1 Bearing Off Zone */}
            <div 
              className={`flex-1 flex items-center justify-start px-2 space-x-1 overflow-x-auto
                ${BackgammonRules.canBearOff(gameState.board, gameState.bar, 1) && gameState.currentPlayer === 1 ? 
                  'bg-blue-500/20 ring-1 ring-blue-500' : 
                  'bg-gradient-to-r from-opacity-20 to-opacity-40'}
              `}
              style={{ 
                background: `linear-gradient(to right, ${themeStyle.player1Color}22, ${themeStyle.player1Color}44)`,
                borderRight: '1px solid rgba(255,255,255,0.1)'
              }}
              onDragOver={(e) => {
                if (BackgammonRules.canBearOff(gameState.board, gameState.bar, 1) && gameState.currentPlayer === 1) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(e) => {
                if (BackgammonRules.canBearOff(gameState.board, gameState.bar, 1) && gameState.currentPlayer === 1) {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  handlePieceMove(fromIndex, BEARING_OFF_POSITION);
                }
              }}
            >
              <div className="flex-shrink-0 text-white text-xs font-bold mr-2">P1:</div>
              {Array.from({ length: gameState.borneOff[1] }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ 
                    background: themeStyle.player1Color,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                />
              ))}
            </div>
            
            {/* Player 2 Bearing Off Zone */}
            <div 
              className={`flex-1 flex items-center justify-start px-2 space-x-1 overflow-x-auto
                ${BackgammonRules.canBearOff(gameState.board, gameState.bar, 2) && gameState.currentPlayer === 2 ? 
                  'bg-blue-500/20 ring-1 ring-blue-500' : 
                  'bg-gradient-to-r from-opacity-20 to-opacity-40'}
              `}
              style={{ 
                background: `linear-gradient(to right, ${themeStyle.player2Color}22, ${themeStyle.player2Color}44)`,
                borderLeft: '1px solid rgba(255,255,255,0.1)'
              }}
              onDragOver={(e) => {
                if (BackgammonRules.canBearOff(gameState.board, gameState.bar, 2) && gameState.currentPlayer === 2) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(e) => {
                if (BackgammonRules.canBearOff(gameState.board, gameState.bar, 2) && gameState.currentPlayer === 2) {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  handlePieceMove(fromIndex, BEARING_OFF_POSITION);
                }
              }}
            >
              <div className="flex-shrink-0 text-white text-xs font-bold mr-2">P2:</div>
              {Array.from({ length: gameState.borneOff[2] }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ 
                    background: themeStyle.player2Color,
                    border: '1px solid rgba(0,0,0,0.2)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS - Bottom with fixed height */}
      <div className="bg-gray-800 border-t-4 border-blue-500 shadow-xl flex-shrink-0 p-4">
        <div className="max-w-4xl mx-auto flex justify-center items-center">
          {!gameState.gameStarted && (
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 text-xl font-bold"
              onClick={() => {
                if (seriesWinner) {
                  alert(`The series is already over! Player ${seriesWinner} won.`);
                  return;
                }
                debugLog("Starting new game", null);
                setGameState(state => ({ ...state, gameStarted: true }));
              }}
            >
              START GAME
            </Button>
          )}
          
          {gameState.gameStarted && (
            <>
              {gameState.dice.length === 0 && !gameState.isRolling && (
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 text-xl font-bold"
                  onClick={rollDice}
                  disabled={gameState.isRolling}
                >
                  ROLL DICE
                </Button>
              )}
              
              {gameState.dice.length > 0 && (
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 text-xl font-bold"
                  onClick={switchPlayer}
                >
                  END TURN
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} theme={theme} onThemeChange={setTheme} />
    </div>
  );
}

function PlayerIndicator({ player, theme, playerNames }: { player: Player; theme: string; playerNames?: string[] }) {
  // player prop is the gameState.currentPlayer
  
  const player1Name = playerNames && playerNames.length > 0 ? playerNames[0] : "Player 1";
  const player2Name = playerNames && playerNames.length > 1 ? playerNames[1] : "Player 2";
  
  // Player 1 is always black, Player 2 is always white (for border/dot)
  const p1BorderColorClass = 'border-black';
  const p1DotColorClass = 'bg-black';
  const p2BorderColorClass = 'border-white';
  const p2DotColorClass = 'bg-white';

  console.log("🎮 PLAYER NAMES:", player1Name, player2Name);
  console.log(`🎲 Active Player: ${player}`);

  return (
    <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 shadow-md" style={{minWidth: "180px"}}>
      {/* Player 1 Section */}
      <div className="flex items-center gap-2">
        <div 
          className={`w-6 h-6 rounded-md flex items-center justify-center bg-transparent border-2 ${p1BorderColorClass} transition-all duration-200 ${player === 1 ? "scale-110 ring-2 ring-offset-1 ring-blue-500" : "opacity-60"}`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${p1DotColorClass}`}></div>
        </div>
        <div className="text-base font-bold text-white">{player1Name}</div>
      </div>
      
      <div className="text-sm font-bold text-white/70 mx-2">VS</div>
      
      {/* Player 2 Section */}
      <div className="flex items-center gap-2">
        <div className="text-base font-bold text-white">{player2Name}</div>
        <div 
          className={`w-6 h-6 rounded-md flex items-center justify-center bg-transparent border-2 ${p2BorderColorClass} transition-all duration-200 ${player === 2 ? "scale-110 ring-2 ring-offset-1 ring-blue-500" : "opacity-60"}`}
        >
           <div className={`h-1.5 w-1.5 rounded-full ${p2DotColorClass}`}></div> 
        </div>
      </div>
    </div>
  );
}

