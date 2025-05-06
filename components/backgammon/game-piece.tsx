"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getThemeStyle } from '@/utils/theme-styles';
import { BEARING_OFF_POSITION } from './constants'; // Import the constant

export interface GamePieceProps {
  player: number;
  index: number;
  isCurrentPlayer: boolean;
  canMove: boolean;
  canBearOff?: boolean;
  stacked?: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  theme?: string;
  dice?: number[];
  onPiecePointerDown?: (event: React.PointerEvent<HTMLDivElement>, fromIndex: number, player: number) => void;
}

export function GamePiece({
  player,
  index,
  isCurrentPlayer,
  canMove,
  canBearOff = false,
  stacked = false,
  onMove,
  theme = 'classic',
  dice = [],
  onPiecePointerDown
}: GamePieceProps) {
  const themeStyle = getThemeStyle(theme);
  
  // Is this piece movable?
  const isMovable = (canMove || canBearOff) && isCurrentPlayer;
  
  // Handle click for tap-to-select/move or bearing off (now handled by BoardPoint/Game)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Still important
    // Direct bear off via click is now handled by BoardPoint's logic or Game logic
    // if (canBearOff && isCurrentPlayer) { ... }
    // Tap-to-select is handled by BoardPoint click
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isMovable && onPiecePointerDown) {
        onPiecePointerDown(event, index, player);
    } 
    // Removed else if for now, as the main purpose is drag initiation
  };

  // Fallback colors in case theme styles are missing
  const playerColor = player === 1 
    ? themeStyle.player1Color || "#f8f8f0" 
    : themeStyle.player2Color || "#2d2d2d";

  // Log piece creation for debugging
  useEffect(() => {
    console.log(`Creating game piece: player=${player}, index=${index}, canMove=${canMove}`);
    
    // Force render after a small delay to ensure visibility
    const timer = setTimeout(() => {
      const pieceElements = document.querySelectorAll(`[data-player="${player}"][data-index="${index}"]`);
      console.log(`Found ${pieceElements.length} DOM elements for piece at position ${index} for player ${player}`);
      
      // Check if element is visible in DOM
      if (pieceElements.length > 0) {
        // Use type assertion to ensure pieceElements[0] is an Element
        const element = pieceElements[0] as Element;
        const rect = element.getBoundingClientRect();
        console.log(`Piece at ${index} position: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
        
        // If piece has zero dimensions, try to force a repaint
        if (rect.width === 0 || rect.height === 0) {
          console.log(`Piece at ${index} has zero dimensions, forcing repaint`);
          // Use type assertion to ensure it's an HTMLElement before modifying style
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
            void element.offsetHeight; // Force reflow
            element.style.display = 'block';
          }
        }
      }
    }, 100);
    
    // Return cleanup function to track when pieces are destroyed
    return () => {
      console.log(`Destroying game piece: player=${player}, index=${index}`);
      clearTimeout(timer);
    };
  }, [player, index, canMove]);

  // Make pieces very compact but still visible
  const pieceSize = "w-9 h-9 min-w-[2.25rem] min-h-[2.25rem]"; // Was w-8 h-8 (32px), now 36px
  const innerSize = "w-7 h-7 min-w-[1.75rem] min-h-[1.75rem]"; // Was w-6 h-6 (24px), now 28px
  
  return (
    <div 
      className="relative touch-manipulation"
      style={{ 
        zIndex: isMovable ? 30 : 20, // Keep basic stacking for movable pieces
        touchAction: 'none',
        willChange: 'transform',
        transform: 'translate3d(0,0,0)',
        display: 'block',
        overflow: 'visible',
        opacity: 1, // Could potentially set opacity to 0.5 if piece is being dragged (handled by parent now)
      }}
      data-player={player}
      data-index={index}
      data-movable={isMovable}
      onPointerDown={handlePointerDown}
    >
      <motion.div
        className={`${pieceSize} touch-manipulation select-none overflow-visible rounded-full flex items-center justify-center 
          ${isMovable ? 'cursor-grab hover:ring-2 hover:ring-blue-400' : 'cursor-default'}
          ${canBearOff ? 'ring-2 ring-yellow-400' : ''}
          ${canMove && !canBearOff ? 'ring-1 ring-blue-400' : ''}
        `}
        style={{ 
          touchAction: 'none', 
          pointerEvents: 'auto',
          visibility: 'visible', 
          backgroundColor: playerColor,
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          position: 'relative', 
        }}
        whileHover={isMovable ? { scale: 1.08 } : {}}
        animate={canBearOff ? {
          y: [0, -3, 0],
          transition: { repeat: Infinity, duration: 1.5 }
        } : {}}
      >
        <div 
          className={`${innerSize} rounded-full pointer-events-none`}
          style={{ 
            border: `2px solid ${player === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
            background: playerColor,
            visibility: 'visible',
          }} 
        />
        
        {canBearOff && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse z-50 pointer-events-none">
            ↗
          </div>
        )}
      </motion.div>
    </div>
  );
} 