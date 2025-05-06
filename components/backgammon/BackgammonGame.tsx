"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Dice } from "./dice"
import { GamePiece } from "./game-piece"
import { GameControls } from "./game-controls"
import { Trophy, Settings, RotateCcw, LogOut, Maximize, Minimize, Smartphone, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { SettingsDialog } from "./settings-dialog"
import { Bar } from "./bar"
import { Button } from "@/components/ui/button"
import { getThemeStyle } from "@/utils/theme-styles"
import { BoardPoint } from './board-point'
import { BackgammonRules } from './game-logic'
import { Player, BoardState, BarState, GameState, Move, DiceRoll, BorneOffState, PointState } from './types'

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

// Helper hook for detecting mobile and orientation
function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Basic mobile detection (consider a library for more robust detection)
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobileCheck);

      // Check orientation
      const portraitQuery = window.matchMedia("(orientation: portrait)");
      setIsPortrait(portraitQuery.matches);

      // Listener for orientation changes
      const handleOrientationChange = (e: MediaQueryListEvent) => {
        setIsPortrait(e.matches);
      };
      portraitQuery.addEventListener("change", handleOrientationChange);

      return () => {
        portraitQuery.removeEventListener("change", handleOrientationChange);
      };
    };

    // Run check after mount (window/navigator are available)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      checkDevice();
    }
  }, []);

  return { isMobile, isPortrait };
}

interface GhostPieceState {
  player: Player | 0; // 0 for no player, or Player type
  x: number;
  y: number;
  visible: boolean;
  fromIndex: number | null; // Original index of the piece being dragged
  currentOverIndex: number | null; // Index of the point the ghost is currently over
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
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [forceRender, setForceRender] = useState(0);

  // New state for "no moves available" feedback
  const [showNoMovesFeedback, setShowNoMovesFeedback] = useState(false);
  const noMovesTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref to manage the feedback timer

  // New state for mobile suggestions and fullscreen
  const { isMobile, isPortrait } = useDeviceDetection();
  const [showGameplayHint, setShowGameplayHint] = useState(false); // Renamed from showRotateSuggestion
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ghostPiece, setGhostPiece] = useState<GhostPieceState>({ 
    player: 0, x: 0, y: 0, visible: false, fromIndex: null, currentOverIndex: null 
  });
  const gameBoardRef = useRef<HTMLDivElement>(null); // Ref for the main board area to get offsets
  const [hasMounted, setHasMounted] = useState(false);
  const [illegalMoveFeedback, setIllegalMoveFeedback] = useState<{ index: number | null, timestamp: number | null }>({ index: null, timestamp: null });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Force render state to handle updates
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
        diceRolled: true,
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
      isRolling: false,
      diceRolled: false
    }));
    // Clear selection and feedback state explicitly on switch
    setSelectedPointIndex(null);
    setShowNoMovesFeedback(false);
    if (noMovesTimerRef.current) {
      clearTimeout(noMovesTimerRef.current);
      noMovesTimerRef.current = null;
    }
  }, [gameState.currentPlayer]);

  /**
   * Handles a piece move attempt
   */
  const handlePieceMove = useCallback((fromIndex: number, toIndex: number) => {
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
      // Trigger feedback for illegal move attempt on a board point
      if (toIndex >= 1 && toIndex <= 24) { // Ensure toIndex is a valid board point
        setIllegalMoveFeedback({ index: toIndex, timestamp: Date.now() });
      }
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
      // Regular move - remove only the used die or dice
      const tempRemainingDice = [...activeDice]; // Create a mutable copy

      if (matchingMove.isChainedDouble && typeof matchingMove.diceUsed === 'number' && matchingMove.diceUsed > 0) {
        // This is a compound move using multiple identical dice (e.g., from doubles)
        const numDiceActuallyUsed = matchingMove.diceUsed;
        const singleDieValueInChain = matchingMove.die; // In this context, .die is the value of one segment
        
        console.log(`Chained double move: using ${numDiceActuallyUsed} dice of value ${singleDieValueInChain}`);
        
        for (let i = 0; i < numDiceActuallyUsed; i++) {
            const dieIndex = tempRemainingDice.findIndex(d => d === singleDieValueInChain);
            if (dieIndex > -1) {
                tempRemainingDice.splice(dieIndex, 1);
            } else {
                // This is a critical issue if it occurs, means gameState is inconsistent with the proposed move.
                console.warn(`CRITICAL: Could not find die ${singleDieValueInChain} to remove for chained double (iteration ${i+1}/${numDiceActuallyUsed}).`);
                console.warn(`RemainingDice before this attempt: ${activeDice.join(',')}. Current tempRemainingDice: ${tempRemainingDice.join(',')}. Move:`, matchingMove);
                // Potentially halt further processing or throw an error, as state is desynced.
                break; 
            }
        }
      } else { 
        // Standard single die move.
        // For a single die move, matchingMove.die is the value of the die.
        // matchingMove.diceUsed should be 1 (or undefined, handled by game-logic).
        const usedDie = matchingMove.die;
        console.log('Single die move: using die', usedDie);
        const dieIndexToRemove = tempRemainingDice.findIndex(d => d === usedDie);
        if (dieIndexToRemove > -1) {
            tempRemainingDice.splice(dieIndexToRemove, 1);
        } else {
            // This can happen if a move was deemed valid but the die isn't in remainingDice.
            // e.g. if remainingDice was [5,5] and a move for a 5 was made, but then another move for a 5 was attempted
            // before availableMoves was re-calculated with only one 5.
            console.warn(`Could not find single die ${usedDie} to remove from remainingDice. ActiveDice: ${activeDice.join(',')}. Current tempRemainingDice: ${tempRemainingDice.join(',')}. MatchingMove:`, matchingMove);
        }
      }
      
      // Update the game state with the remaining dice
      newGameState.remainingDice = tempRemainingDice;
      
      // Check if all dice have been used
      if (newGameState.remainingDice.length === 0) {
        // End turn automatically if no dice left
        newGameState.currentPlayer = newGameState.currentPlayer === BLACK ? WHITE : BLACK;
        newGameState.dice = [];
        // newGameState.remainingDice is already empty
        newGameState.diceRolled = false;
      } else {
        // Check if there are any valid moves left with the remaining dice
        const updatedGameStateForCheck = {
          ...newGameState,
          // dice: newGameState.remainingDice, // Important: getAvailableMoves uses gameState.dice if remainingDice is empty
          // remainingDice: newGameState.remainingDice, // already set
          // diceRolled: newGameState.diceRolled, // already set
          // board: [...newGameState.board] // Ensure we're using the updated board -- already using newGameState.board which is a new array
        };
        
        console.log("Checking for remaining moves with dice:", newGameState.remainingDice);
        // console.log("Using updated board state for check:", updatedGameStateForCheck.board);
        
        const remainingMoves = BackgammonRules.getAvailableMoves(updatedGameStateForCheck);
        
        console.log("Remaining available moves after current move:", remainingMoves.length);
        if (remainingMoves.length > 0) {
          console.log("Available moves:", remainingMoves.map(m => 
            `${m.from}→${m.to} (die ${m.die}${m.usesBothDice ? ', combined' : ''})`));
        }
        
        if (remainingMoves.length === 0) {
          console.log('No valid moves remaining with dice', newGameState.remainingDice);
          newGameState.currentPlayer = newGameState.currentPlayer === BLACK ? WHITE : BLACK;
          newGameState.dice = [];
          newGameState.remainingDice = [];
          newGameState.diceRolled = false;
        }
      }
    }
    
    setGameState(newGameState);
    setIllegalMoveFeedback({ index: null, timestamp: null }); // Clear feedback on successful or processed move
    setSelectedPointIndex(null); // Clear selection after any move attempt

    // Log state right after setting it
    console.log("State set after move attempt:", JSON.stringify(newGameState));
    if (toIndex !== BEARING_OFF_POSITION && toIndex !== BAR_POSITION) {
       console.log(`Target point ${toIndex} state AFTER setGameState:`, JSON.stringify(newGameState.board[toIndex]));
    }

    setForceRender(prev => prev + 1);
    if (fromIndex === BAR_POSITION) {
      setTimeout(() => {
        console.log('Delayed update after bar move to ensure rendering');
        setForceRender(prev => prev + 1);
      }, 100);
    }
  }, [gameState, setSelectedPointIndex /* add other dependencies if needed */]);

  // New click handler for points
  const handlePointClick = useCallback((clickedIndex: number) => {
    debugLog("Point clicked", { clickedIndex, currentSelected: selectedPointIndex, currentPlayer: gameState.currentPlayer });

    const pointData = clickedIndex !== BAR_POSITION ? gameState.board[clickedIndex] : null;
    const isCurrentPlayerBarNonEmpty = gameState.bar[gameState.currentPlayer] > 0;

    if (isCurrentPlayerBarNonEmpty) {
      // Player HAS pieces on the bar.
      if (clickedIndex === BAR_POSITION) {
        // User clicked the BAR itself.
        if (selectedPointIndex === BAR_POSITION) { // Clicking bar when bar is already selected
          setSelectedPointIndex(null); // Deselect bar
          debugLog("Deselected BAR by clicking it again", { player: gameState.currentPlayer });
        } else {
          setSelectedPointIndex(BAR_POSITION); // Select bar
          debugLog("Selected BAR by clicking it", { player: gameState.currentPlayer });
        }
        return; // Handled bar click, exit
      } else {
        // User clicked a BOARD POINT (clickedIndex is 1-24).
        // Since they have pieces on the bar, this click is an ATTEMPT to move FROM BAR to clickedIndex.
        // No need to check selectedPointIndex here, the 'from' is implicitly BAR_POSITION.
        debugLog("Attempting move FROM BAR to board point", { from: BAR_POSITION, to: clickedIndex });
        handlePieceMove(BAR_POSITION, clickedIndex); 
        // setSelectedPointIndex(null); // handlePieceMove will clear selection if successful / or on turn end.
        return; // Move attempted, exit
      }
    }

    // Player does NOT have pieces on the bar (isCurrentPlayerBarNonEmpty is false).
    // Proceed with normal point selection/move logic:
    if (selectedPointIndex === null) {
      // No point is currently selected, try to select this one as 'from'
      if (pointData && pointData.player === gameState.currentPlayer && pointData.count > 0) {
        setSelectedPointIndex(clickedIndex);
        debugLog("Selected point as 'from'", { clickedIndex });
      } else {
        debugLog("Clicked invalid starting point or empty point", { clickedIndex, pointData });
      }
    } else {
      // A point is already selected ('from' point could be a board point)
      // (BAR_POSITION as selectedPointIndex is handled above if isCurrentPlayerBarNonEmpty)
      if (selectedPointIndex === clickedIndex) {
        setSelectedPointIndex(null); // De-select if clicking the same point
        debugLog("De-selected point by clicking it again", { clickedIndex });
      } else {
        // Attempt to move from selectedPointIndex to clickedIndex (which is a board point here)
        debugLog("Attempting move via click from selected to new point", { from: selectedPointIndex, to: clickedIndex });
        handlePieceMove(selectedPointIndex, clickedIndex); 
        // setSelectedPointIndex(null); // handlePieceMove will clear selection
      }
    }
  }, [selectedPointIndex, gameState, handlePieceMove, setSelectedPointIndex, debugLog]);

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

  // useEffect to reset selection and clear "no moves" feedback
  useEffect(() => {
    debugLog("Player/Dice changed, deselecting point & clearing feedback", { currentPlayer: gameState.currentPlayer, remainingDice: gameState.remainingDice });
    setSelectedPointIndex(null);
    setShowNoMovesFeedback(false); // Clear feedback on player/dice change
    if (noMovesTimerRef.current) {
      clearTimeout(noMovesTimerRef.current);
      noMovesTimerRef.current = null;
    }
  }, [gameState.currentPlayer, gameState.remainingDice]);

  // EFFECT: Check for "stuck" condition (has dice but no moves) & trigger feedback/switch
  useEffect(() => {
    const currentPlayer = gameState.currentPlayer;
    // console.log(`[Debug useEffect RUN - Stuck Check] Curr: ${currentPlayer}, Rolled: ${gameState.diceRolled}, Dice: [${gameState.remainingDice.join(',')}]`);

    // Only run if the game is started, dice ARE rolled for the turn, and not currently rolling/switching
    if (!gameState.gameStarted || !gameState.diceRolled || gameState.isRolling || gameState.remainingDice.length === 0) {
       // Ensure feedback is off if conditions aren't met
       if (showNoMovesFeedback) setShowNoMovesFeedback(false);
       if (noMovesTimerRef.current) {
           clearTimeout(noMovesTimerRef.current);
           noMovesTimerRef.current = null;
       }
      return;
    }

    // Player HAS dice, check if they are stuck
    const availableMoves = BackgammonRules.getAvailableMoves({
        ...gameState,
        dice: gameState.remainingDice // Check based on remaining dice
    });
    // console.log(`[Debug Stuck Check] Found ${availableMoves.length} available moves for Player ${currentPlayer} with dice [${gameState.remainingDice.join(", ")}]`);

    if (availableMoves.length === 0) {
        // Only start the feedback/switch process if it's not already running
        if (!noMovesTimerRef.current && !showNoMovesFeedback) {
            console.log(`[Debug Stuck Check] No available moves for Player ${currentPlayer}. Starting feedback & switch timer.`);
            setShowNoMovesFeedback(true); // Show feedback immediately

            // Set a timer to switch player after feedback duration
            noMovesTimerRef.current = setTimeout(() => {
                console.log(`[Debug Stuck Check] Timer finished. Switching player ${currentPlayer}.`);
                switchPlayer();
                // No need to setShowNoMovesFeedback(false) here, switchPlayer's useEffect handles it
                noMovesTimerRef.current = null; // Clear the ref after timer executes
            }, 1500); // Show feedback for 1.5 seconds before switching
        }
    } else {
        // Moves ARE available, ensure feedback is off and timer is cleared
        if (showNoMovesFeedback) setShowNoMovesFeedback(false);
        if (noMovesTimerRef.current) {
            console.log(`[Debug Stuck Check] Moves available. Clearing switch timer for player ${currentPlayer}.`);
            clearTimeout(noMovesTimerRef.current);
            noMovesTimerRef.current = null;
        }
    }

    // Cleanup function to clear timer if dependencies change before timeout
    return () => {
        if (noMovesTimerRef.current) {
            // console.log(`[Debug Stuck Check] Cleanup: Clearing timer for player ${currentPlayer}.`);
            clearTimeout(noMovesTimerRef.current);
            noMovesTimerRef.current = null;
        }
    };

  // Dependencies: Run when remaining dice change, player changes, board changes (affecting moves),
  // bar changes, or game start/rolling status changes. Ensure diceRolled is included.
  }, [gameState.remainingDice, gameState.currentPlayer, gameState.board, gameState.bar, gameState.gameStarted, gameState.isRolling, gameState.diceRolled, switchPlayer, showNoMovesFeedback]);

  // Effect to show gameplay hint once per session
  useEffect(() => {
    if (hasMounted) {
      const dismissed = sessionStorage.getItem('gameplayHintDismissed');
      if (dismissed !== 'true') {
        setShowGameplayHint(true);
      }
    }
  }, [hasMounted]);

  // Add the function to handle bearing off directly
  const handleBearOff = useCallback((fromIndex: number) => {
    // ... (ensure this uses selectedPointIndex if that's the new flow, or works with direct bear off clicks)
    // For now, assume it's a direct click on a bear-off enabled piece/zone
    if (selectedPointIndex === null && fromIndex !== BAR_POSITION) {
        // If nothing is selected, and we are clicking a point that can bear off directly
        const canBearOffDirectly = BackgammonRules.getAvailableMoves({ ...gameState, dice: gameState.remainingDice })
                                      .find(m => m.from === fromIndex && m.to === BEARING_OFF_POSITION);
        if (canBearOffDirectly) {
            debugLog("Direct bearing off via click from point", { fromIndex });
            handlePieceMove(fromIndex, BEARING_OFF_POSITION);
            return;
        }
    }
    // If a point is selected, and the click implies bearing off from that selected point
    if (selectedPointIndex === fromIndex && fromIndex !== BAR_POSITION) { // fromIndex here is the target for bear off
        debugLog("Attempting to bear off from selected point", { from: selectedPointIndex });
        handlePieceMove(selectedPointIndex, BEARING_OFF_POSITION);
        // setSelectedPointIndex(null); // handlePieceMove will clear
    } else if (selectedPointIndex !== null && fromIndex === BEARING_OFF_POSITION) { // Clicking bear-off zone when something is selected
        debugLog("Attempting to bear off from selected point TO bear-off zone", { from: selectedPointIndex });
        handlePieceMove(selectedPointIndex, BEARING_OFF_POSITION);
    }
     else {
      // Original logic from prompt - might still be relevant for direct drag/drop to bear-off zone
      if (!gameState.gameStarted || gameState.remainingDice.length === 0) return;
      const possibleMoves = BackgammonRules.getAvailableMoves({ ...gameState, dice: gameState.remainingDice });
      const bearOffMove = possibleMoves.find((move: Move) => move.from === fromIndex && move.to === BEARING_OFF_POSITION);
      if (bearOffMove) {
        handlePieceMove(fromIndex, BEARING_OFF_POSITION);
      } else {
        console.log(`Cannot bear off directly from ${fromIndex} with remaining dice [${gameState.remainingDice.join(", ")}]`);
      }
    }
  }, [gameState, handlePieceMove, selectedPointIndex, debugLog]);

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
          onPointClick={handlePointClick}
          canBearOff={canBearOffFromPoint}
          isSelected={selectedPointIndex === position}
          showIllegalHighlight={illegalMoveFeedback?.index === position}
          illegalHighlightKey={illegalMoveFeedback?.index === position ? illegalMoveFeedback.timestamp : null}
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

   // Effect to listen for fullscreen changes (e.g., user pressing Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check document directly as state might not update immediately
       setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Add vendor prefixes for broader compatibility
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Fullscreen toggle function
  const toggleFullScreen = () => {
    const elem = document.documentElement; // Target the whole page

    if (!document.fullscreenElement) {
      // Attempt standard first
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.error(`FS Error: ${err.message}`));
      } else if ((elem as any).webkitRequestFullscreen) { /* Safari */
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) { /* Firefox */
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) { /* IE/Edge */
        (elem as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(`Exit FS Error: ${err.message}`));
      } else if ((document as any).webkitExitFullscreen) { /* Safari */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) { /* IE/Edge */
        (document as any).msExitFullscreen();
      }
    }
     // State update relies on the event listener now
  };

  // Custom drag and drop handlers
  const handlePiecePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, fromIndex: number, piecePlayer: Player) => {
    // Ensure it's the current player's piece and there are dice rolled, etc.
    // This check should be similar to what determines if a piece is `isMovable` in GamePiece
    const point = fromIndex === BAR_POSITION ? null : gameState.board[fromIndex];
    const isBarPiece = fromIndex === BAR_POSITION && gameState.bar[piecePlayer] > 0;
    const isBoardPiece = point && point.player === piecePlayer && point.count > 0;
    const isTurn = gameState.currentPlayer === piecePlayer && gameState.diceRolled && gameState.remainingDice.length > 0;

    if (isTurn && (isBarPiece || isBoardPiece)) {
      event.preventDefault(); // Prevent default actions like text selection or native drag
      event.currentTarget.setPointerCapture(event.pointerId); // Capture pointer events to this element

      setGhostPiece({
        player: piecePlayer,
        x: event.clientX,
        y: event.clientY,
        visible: true,
        fromIndex: fromIndex,
        currentOverIndex: null,
      });

      // Add global listeners
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp); // Also handle cancel
      debugLog("Pointer Down & Custom Drag Start", { fromIndex, player: piecePlayer, clientX: event.clientX, clientY: event.clientY });
    }
  }, [gameState]); // Add other dependencies as needed

  const handleGlobalPointerMove = useCallback((event: PointerEvent) => {
    if (ghostPiece.visible) {
      event.preventDefault();
      setGhostPiece(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
      }));

      // Basic drop target detection (can be improved)
      let targetElement = document.elementFromPoint(event.clientX, event.clientY);
      let newOverIndex: number | null = null;
      while(targetElement) {
        if (targetElement.getAttribute('data-point-index')) {
          newOverIndex = parseInt(targetElement.getAttribute('data-point-index')!, 10);
          break;
        } else if (targetElement.getAttribute('data-bear-off-zone-player') === String(ghostPiece.player)) {
          newOverIndex = BEARING_OFF_POSITION; // Special index for bearing off
          break;
        }
        targetElement = targetElement.parentElement;
      }
      if (newOverIndex !== ghostPiece.currentOverIndex) {
        setGhostPiece(prev => ({ ...prev, currentOverIndex: newOverIndex }));
        // debugLog("Ghost over target", { newOverIndex });
      }
    }
  }, [ghostPiece.visible, ghostPiece.player, ghostPiece.currentOverIndex]);

  const handleGlobalPointerUp = useCallback((event: PointerEvent) => {
    if (ghostPiece.visible) {
      event.preventDefault();
      // event.currentTarget.releasePointerCapture(event.pointerId); // Release pointer capture from the original element
      // Note: Releasing capture might need to be done on the element that captured it initially
      // This will be handled by the browser automatically when the pointerup event fires on window if element is removed/hidden.

      debugLog("Pointer Up & Custom Drag End", { from: ghostPiece.fromIndex, to: ghostPiece.currentOverIndex, player: ghostPiece.player });
      if (ghostPiece.fromIndex !== null && ghostPiece.currentOverIndex !== null && ghostPiece.fromIndex !== ghostPiece.currentOverIndex) {
        handlePieceMove(ghostPiece.fromIndex, ghostPiece.currentOverIndex);
      }
      
      setGhostPiece({ player: 0, x: 0, y: 0, visible: false, fromIndex: null, currentOverIndex: null });
      setSelectedPointIndex(null); // Clear any tap-selection

      // Remove global listeners
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    }
  }, [ghostPiece, handlePieceMove]); // Add dependencies

  const handleRequestLandscape = async () => {
    debugLog("Attempting to switch to landscape.", null);
    const elem = document.documentElement;

    try {
      if (!document.fullscreenElement) {
        debugLog("Requesting fullscreen for orientation lock.", null);
        await elem.requestFullscreen();
        await new Promise(resolve => setTimeout(resolve, 100)); 
      }

      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        // Revert to using 'as any' and remove @ts-expect-error
        await (screen.orientation as any).lock('landscape-primary');
        debugLog("Screen orientation lock requested for landscape-primary.", null);
      } else {
        debugLog("Screen orientation lock API not supported or lock is not a function.", null);
        alert("For the best experience please rotate your device"); // Updated alert message
      }
    } catch (err) {
      debugLog("Error requesting fullscreen or locking orientation:", err);
      alert("For the best experience please rotate your device"); // Updated alert message
    }
  };

  return (
    <div
      id="backgammon-game-container"
      className="bg-gray-900 w-full"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        userSelect: 'none', // Prevent text selection on the whole game area
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        msUserSelect: 'none' // IE/Edge
      }}
    >
      {/* Header - Add responsive classes */}
      <div className="bg-gray-800 p-2 sm:p-3 landscape:p-1 shadow-md flex-shrink-0"> {/* Reduced padding on smallest screens */}
        <div className="flex flex-wrap justify-between items-center gap-2 landscape:gap-1">
          {/* Score - Allow shrinking */}
          <div className="flex items-center flex-shrink min-w-0">
            <Trophy className="h-5 w-5 text-yellow-400 mr-1 sm:mr-2" />
            <span className="text-white font-bold text-sm sm:text-base truncate"> {/* Smaller text on mobile */}
              Score: {scores[BLACK]} - {scores[WHITE]} (G{gameNumber}) {/* Shorter text */}
            </span>
          </div>

          {/* Player Indicator - Center on small screens when wrapping */}
          <div className="flex items-center flex-grow justify-center sm:flex-grow-0 sm:flex-shrink-1 order-first sm:order-none w-full sm:w-auto">
            <PlayerIndicator player={gameState.currentPlayer} theme={theme} playerNames={playerNames} />
          </div>

          {/* Buttons - Allow shrinking/wrapping */}
          <div className="flex flex-wrap gap-1 justify-end flex-shrink">
             {/* Add Fullscreen button */}
             {hasMounted && (document.documentElement.requestFullscreen || (document.documentElement as any).webkitRequestFullscreen || (document.documentElement as any).mozRequestFullScreen || (document.documentElement as any).msRequestFullscreen) && (
                <Button variant="ghost" size="sm" onClick={toggleFullScreen} className="text-white p-1 sm:p-2">
                  {isFullscreen ? <Minimize className="h-4 w-4 sm:mr-1" /> : <Maximize className="h-4 w-4 sm:mr-1" />}
                  <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </Button>
             )}
            {/* Mobile Only: Rotate to Landscape Button */} 
            {hasMounted && isMobile && typeof screen !== 'undefined' && screen.orientation && (
                <Button variant="ghost" size="sm" onClick={handleRequestLandscape} className="text-white p-1 sm:p-2" title="Rotate to Landscape">
                    <Smartphone className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Landscape</span>
                </Button>
            )}
            {/* Settings Button */}
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="text-white p-1 sm:p-2">
              <Settings className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Settings</span> {/* Hide text on small screens */}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-white p-1 sm:p-2">
              <RotateCcw className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExit} className="text-white p-1 sm:p-2">
              <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Rotate Suggestion Banner - now Gameplay Hint Banner */}
      {hasMounted && showGameplayHint && ( // Use new state showGameplayHint
        <div className="bg-yellow-500 text-black p-2 text-center text-sm flex justify-center items-center gap-2 relative z-50"> {/* Ensure banner is on top */}
          {/* Smartphone icon removed as the message is now a gameplay hint */}
          <span>Hint: Tap a piece, then tap its destination to move!</span>
          <button
            onClick={() => {
                setShowGameplayHint(false); // Use new setter
                sessionStorage.setItem('gameplayHintDismissed', 'true'); // Save dismissal to session storage
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-black/10 rounded-full"
            aria-label="Dismiss rotation suggestion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Conditional Rendering: START GAME Button or GAME BOARD */}
      {!gameState.gameStarted ? (
        // Show Start Game Button Centered
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 text-2xl font-bold shadow-lg animate-pulse" // Changed to blue
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
          {/* Optional: Add instructions or welcome message here */}
           <p className="text-gray-400 mt-4 text-center">Let the games begin!</p> {/* Changed text */}
        </div>
      ) : (
        // Show Game Board Area
        <div className="flex-grow flex-shrink-1 overflow-hidden p-1 sm:p-3 landscape:p-0 flex flex-col items-center justify-center">
          {/* Added landscape:py-1 to reduce vertical padding in landscape if needed */}
          {/* The direct child of this flex container will be constrained by its parent's height (due to overflow-hidden and flex properties) */}
          <div className="w-full max-w-4xl h-full flex flex-col justify-center"> {/* Allow this to take available height and center its content if smaller */}
            {/* Board with responsive aspect ratio */}
            {/* Applying max-height directly to the aspect ratio box's PARENT might be better */}
            {/* Let's ensure this aspect ratio div itself doesn't grow too tall in landscape. */}
            <div 
              className="relative w-full landscape:max-h-[calc(100%-1.75rem)]" // Adjusted max-height: 1.5rem for h-6 + 0.25rem for mt-1
              style={{ paddingBottom: "var(--board-aspect-ratio, 75%)" }} // Default to 75% (portrait-ish)
            >
              {/* Custom property for aspect ratio allows easier JS/CSS adjustment if needed */}
              <style>{`
                @media (min-width: 640px) {
                  :root {
                    --board-aspect-ratio: 50%; /* Desktop/larger tablets */
                  }
                }
                @media (orientation: landscape) and (max-height: 600px) { /* Small height landscape */
                   /* For very short landscape screens, we might want an even wider aspect, or let max-h handle it */
                  :root {
                    /* --board-aspect-ratio: 40%; /* or adjust max-height more dynamically */
                  }
                  /* Ensure the board itself doesn't exceed the viewport height minus other elements */
                  /* This is tricky with padding-bottom for aspect ratio. */
                  /* The landscape:max-h on the parent div is the primary constraint. */
                }
                @media (orientation: landscape) and (max-width: 767px) { /* Targeting mobile landscape */
                  :root {
                    --board-aspect-ratio: 65%; /* Make board shorter (wider aspect ratio) */
                  }
                }
              `}</style>
              <div
                className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg border-2 sm:border-4 shadow-lg"
                style={{
                  borderColor: themeStyle.borderColor,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
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
                          player={WHITE}
                          count={gameState.bar[WHITE]}
                          currentPlayer={gameState.currentPlayer}
                          isTopHalf={true}
                          theme={theme}
                          isPlayable={
                            gameState.gameStarted &&
                            gameState.diceRolled &&
                            gameState.currentPlayer === WHITE &&
                            gameState.bar[WHITE] > 0 &&
                            BackgammonRules.getAvailableMoves({
                                ...gameState,
                                dice: gameState.remainingDice,
                            }).some(m => m.from === BAR_POSITION)
                          }
                          onBarClick={() => handlePointClick(BAR_POSITION)}
                          isSelected={selectedPointIndex === BAR_POSITION && gameState.currentPlayer === WHITE}
                          selectedPointIndex={selectedPointIndex}
                          setSelectedPointIndex={setSelectedPointIndex}
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
                          player={BLACK}
                          count={gameState.bar[BLACK]}
                          currentPlayer={gameState.currentPlayer}
                          isTopHalf={false}
                          theme={theme}
                          isPlayable={
                            gameState.gameStarted &&
                            gameState.diceRolled &&
                            gameState.currentPlayer === BLACK &&
                            gameState.bar[BLACK] > 0 &&
                            BackgammonRules.getAvailableMoves({
                                ...gameState,
                                dice: gameState.remainingDice,
                            }).some(m => m.from === BAR_POSITION)
                          }
                          onBarClick={() => handlePointClick(BAR_POSITION)}
                          isSelected={selectedPointIndex === BAR_POSITION && gameState.currentPlayer === BLACK}
                          selectedPointIndex={selectedPointIndex}
                          setSelectedPointIndex={setSelectedPointIndex}
                        />
                      </div>
                      <div className="flex-1 flex">
                        {renderPoints('BOTTOM_RIGHT')}
                      </div>
                    </div>
                  </div>

                  {/* Dice area - Adjust size/position slightly? */}
                  <div
                    className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center items-center z-30 scale-90 sm:scale-100" // Slightly smaller on mobile
                    onClick={() => {
                      // Only allow roll if game started, it's current player's turn,
                      // they are not rolling, and dice haven't been rolled for this turn yet.
                      if (gameState.gameStarted && !gameState.isRolling && gameState.dice.length === 0 && !gameState.diceRolled) {
                        rollDice();
                      }
                    }}
                    style={{ cursor: (gameState.gameStarted && !gameState.isRolling && gameState.dice.length === 0 && !gameState.diceRolled) ? 'pointer' : 'default' }}
                  >
                    {/* Conditionally render dice OR a prompt to roll */}
                    {/* Prompt to roll */}
                    {gameState.gameStarted && !gameState.isRolling && gameState.dice.length === 0 && !gameState.diceRolled && (
                       <div className="p-2 bg-blue-600/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-md text-white text-center font-bold animate-pulse">
                         Tap to Roll
                       </div>
                    )}
                    {/* Show Dice (if rolled or currently rolling) */}
                    {gameState.gameStarted && (gameState.dice.length > 0 || gameState.isRolling) && (
                      <div className={`relative p-2 ${themeStyle.diceBackground} backdrop-blur-sm rounded-lg border border-white/10 shadow-md`}>
                        <Dice values={gameState.dice} rolling={gameState.isRolling} />
                        {/* "No Moves" Feedback Indicator */}
                        {showNoMovesFeedback && (
                            <motion.div
                                key="no-moves-feedback"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-red-600 text-white text-xs rounded shadow-lg whitespace-nowrap"
                            >
                                No moves available
                            </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bearing off indicators - Smaller text */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 sm:p-2 bg-black/30 rounded text-white text-[10px] sm:text-xs">
                    P1: {gameState.borneOff[BLACK]}/15
                  </div>
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-1 sm:p-2 bg-black/30 rounded text-white text-[10px] sm:text-xs">
                    P2: {gameState.borneOff[WHITE]}/15
                  </div>
                </div>
              </div>
            </div>

            {/* Bearing Off Zone - ensure it fits */}
            <div className="mt-2 sm:mt-3 landscape:mt-1 h-8 sm:h-10 landscape:h-6 flex w-full rounded-lg overflow-hidden border border-gray-700 sm:border-2 flex-shrink-0">
               {/* Player 1 Bearing Off Zone */}
               <div 
                 className={`flex-1 flex items-center justify-start px-1 sm:px-2 space-x-1 overflow-x-auto ${BackgammonRules.canBearOff(gameState.board, gameState.bar, BLACK) && gameState.currentPlayer === BLACK ? 'bg-blue-500/20 ring-1 ring-blue-500' : 'bg-gradient-to-r from-opacity-20 to-opacity-40'}`}
                 style={{
                   background: `linear-gradient(to right, ${themeStyle.player1Color}22, ${themeStyle.player1Color}44)`,
                   borderRight: '1px solid rgba(255,255,255,0.1)'
                 }}
                 data-bear-off-zone-player={String(BLACK)}
                 onDragOver={(e) => {
                   // Keep existing HTML5 drag over logic for compatibility if needed, 
                   // but custom DND won't use it directly
                   if (BackgammonRules.canBearOff(gameState.board, gameState.bar, BLACK) && gameState.currentPlayer === BLACK) {
                     e.preventDefault();
                     e.dataTransfer.dropEffect = 'move';
                   }
                 }}
                 onDrop={(e) => {
                   // Keep existing HTML5 drop logic for compatibility if needed
                   if (BackgammonRules.canBearOff(gameState.board, gameState.bar, BLACK) && gameState.currentPlayer === BLACK) {
                     e.preventDefault();
                     // This logic might need adjustment based on how custom DND vs HTML5 DND interact
                     // For now, retain the logic that checks selectedPointIndex first
                     if (selectedPointIndex !== null && selectedPointIndex !== BAR_POSITION) {
                       debugLog("Bearing off from selected point via drop on zone", { from: selectedPointIndex });
                       handlePieceMove(selectedPointIndex, BEARING_OFF_POSITION);
                     } else {
                       const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                       if (!isNaN(fromIndex)) { // Check if parsing was successful
                         debugLog("Bearing off via direct HTML5 drag-drop to zone", { from: fromIndex });
                         const availableMoves = BackgammonRules.getAvailableMoves({...gameState, dice: gameState.remainingDice});
                         const isValidBearOffDrop = availableMoves.some(move => move.from === fromIndex && move.to === BEARING_OFF_POSITION);
                         if (isValidBearOffDrop) {
                             handlePieceMove(fromIndex, BEARING_OFF_POSITION);
                         } else {
                             console.log(`Invalid HTML5 drop bear off from ${fromIndex}`);
                         }
                       } else {
                           console.error("Failed to parse fromIndex from dataTransfer");
                       }
                     }
                   }
                 }}
               >
                 <div className="flex-shrink-0 text-white text-[10px] sm:text-xs font-bold mr-1 sm:mr-2">P1:</div>
                 {Array.from({ length: gameState.borneOff[BLACK] }).map((_, i) => (
                   <div
                     key={`p1-borne-${i}`}
                     className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" // Smaller pieces
                     style={{
                        background: themeStyle.player1Color,
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                   />
                 ))}
               </div>
               {/* Player 2 Bearing Off Zone */}
                <div
                 className={`flex-1 flex items-center justify-start px-1 sm:px-2 space-x-1 overflow-x-auto ${BackgammonRules.canBearOff(gameState.board, gameState.bar, WHITE) && gameState.currentPlayer === WHITE ? 'bg-blue-500/20 ring-1 ring-blue-500' : 'bg-gradient-to-r from-opacity-20 to-opacity-40'}`}
                 style={{
                   background: `linear-gradient(to right, ${themeStyle.player2Color}22, ${themeStyle.player2Color}44)`,
                   borderLeft: '1px solid rgba(255,255,255,0.1)'
                 }}
                 data-bear-off-zone-player={String(WHITE)}
                 onDragOver={(e) => {
                   if (BackgammonRules.canBearOff(gameState.board, gameState.bar, WHITE) && gameState.currentPlayer === WHITE) {
                     e.preventDefault();
                     e.dataTransfer.dropEffect = 'move';
                   }
                 }}
                 onDrop={(e) => {
                   if (BackgammonRules.canBearOff(gameState.board, gameState.bar, WHITE) && gameState.currentPlayer === WHITE) {
                     e.preventDefault();
                     if (selectedPointIndex !== null && selectedPointIndex !== BAR_POSITION) {
                       debugLog("Bearing off from selected point via drop on zone", { from: selectedPointIndex });
                       handlePieceMove(selectedPointIndex, BEARING_OFF_POSITION);
                     } else {
                       const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        if (!isNaN(fromIndex)) { // Check if parsing was successful
                           debugLog("Bearing off via direct HTML5 drag-drop to zone", { from: fromIndex });
                           const availableMoves = BackgammonRules.getAvailableMoves({...gameState, dice: gameState.remainingDice});
                           const isValidBearOffDrop = availableMoves.some(move => move.from === fromIndex && move.to === BEARING_OFF_POSITION);
                           if (isValidBearOffDrop) {
                               handlePieceMove(fromIndex, BEARING_OFF_POSITION);
                           } else {
                               console.log(`Invalid HTML5 drop bear off from ${fromIndex}`);
                           }
                       } else {
                            console.error("Failed to parse fromIndex from dataTransfer");
                       }
                     }
                   }
                 }}
               >
                 <div className="flex-shrink-0 text-white text-[10px] sm:text-xs font-bold mr-1 sm:mr-2">P2:</div>
                 {Array.from({ length: gameState.borneOff[WHITE] }).map((_, i) => (
                    <div
                     key={`p2-borne-${i}`}
                     className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" // Smaller pieces
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
      )}

      {/* Ghost Piece for Custom Drag and Drop */}
      {ghostPiece.visible && ghostPiece.player !== 0 && (
        <div 
          className="fixed pointer-events-none z-[100]" // High z-index, ignore pointer events itself
          style={{
            left: ghostPiece.x - 18, // Center the ghost piece (half of 36px)
            top: ghostPiece.y - 18,   // Center the ghost piece
          }}
        >
          <GamePiece 
            player={ghostPiece.player}
            index={-1} // Special index for ghost, not a real point
            isCurrentPlayer={true} // Visually treat as current player's piece
            canMove={true} // Visually treat as movable
            theme={theme} 
            onMove={() => {}} // Ghost doesn't trigger moves itself
          />
        </div>
      )}

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} theme={theme} onThemeChange={setTheme} />
    </div>
  );
}

function PlayerIndicator({ player, theme, playerNames }: { player: Player; theme: string; playerNames?: string[] }) {
  const player1Name = playerNames && playerNames.length > 0 ? playerNames[0] : "Player 1";
  const player2Name = playerNames && playerNames.length > 1 ? playerNames[1] : "Player 2";

  const p1BorderColorClass = 'border-black';
  const p1DotColorClass = 'bg-black';
  const p2BorderColorClass = 'border-white';
  const p2DotColorClass = 'bg-white';

  console.log("🎮 PLAYER NAMES:", player1Name, player2Name);
  console.log(`🎲 Active Player: ${player}`);

  return (
    // Reduced padding/gap on small screens
    <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-white/20 shadow-md w-full max-w-xs sm:max-w-sm mx-auto">
      {/* Player 1 Section */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-hidden"> {/* Allow text truncate */}
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center bg-transparent border-2 ${p1BorderColorClass} transition-all duration-200 flex-shrink-0 ${player === BLACK ? "scale-110 ring-2 ring-offset-1 ring-blue-500" : "opacity-60"}`} // Use constant
        >
          <div className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${p1DotColorClass}`}></div>
        </div>
        {/* Smaller text on mobile */}
        <div className="text-sm sm:text-base font-bold text-white truncate">{player1Name}</div>
      </div>

      {/* Smaller VS text */}
      <div className="text-xs sm:text-sm font-bold text-white/70 mx-1 sm:mx-2">VS</div>

      {/* Player 2 Section */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-hidden"> {/* Allow text truncate */}
         {/* Smaller text on mobile */}
        <div className="text-sm sm:text-base font-bold text-white truncate">{player2Name}</div>
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center bg-transparent border-2 ${p2BorderColorClass} transition-all duration-200 flex-shrink-0 ${player === WHITE ? "scale-110 ring-2 ring-offset-1 ring-blue-500" : "opacity-60"}`} // Use constant
        >
           <div className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${p2DotColorClass}`}></div>
        </div>
      </div>
    </div>
  );
}

