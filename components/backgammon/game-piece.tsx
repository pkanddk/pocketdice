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
  dice = []
}: GamePieceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const themeStyle = getThemeStyle(theme);
  
  // Is this piece movable?
  const isMovable = (canMove || canBearOff) && isCurrentPlayer;
  
  // Handle click to bear off
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canBearOff && isCurrentPlayer) {
      console.log(`Clicking to bear off piece at ${index}`);
      onMove(index, BEARING_OFF_POSITION); // Use the constant for bearing off
    }
  };

  // Improved drag start handler with better data transfer
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isMovable) {
      e.preventDefault();
      return;
    }
    
    console.log("Starting drag:", { index, player, canBearOff });
    
    // Set data for transfer
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a ghost drag image - makes dragging more visible
    const dragImage = document.createElement('div');
    dragImage.style.width = '30px';
    dragImage.style.height = '30px';
    dragImage.style.borderRadius = '50%';
    dragImage.style.backgroundColor = player === 1 ? '#f8f8f0' : '#2d2d2d';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    
    // Set custom drag image and position
    e.dataTransfer.setDragImage(dragImage, 15, 15);
    
    // Clean up the temporary element after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
    
    setIsDragging(true);
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
        zIndex: isDragging ? 50 : isMovable ? 30 : 20,
        touchAction: 'none', // Helps with touch devices
        willChange: 'transform', // Performance optimization
        transform: 'translate3d(0,0,0)', // Force GPU acceleration
        display: 'block', // Always display
        overflow: 'visible', // Show everything
        opacity: 1, // Ensure visibility
      }}
      onClick={handleClick}
      data-player={player}
      data-index={index}
      data-movable={isMovable}
    >
      {/* Draggable container wrapper */}
      <div
        draggable={isMovable}
        onDragStart={handleDragStart}
        onDragEnd={() => setIsDragging(false)}
        className={`${pieceSize} touch-manipulation select-none overflow-visible`}
        style={{ 
          cursor: isMovable ? 'grab' : 'default',
          touchAction: 'none', // Helps with touch devices
          pointerEvents: 'auto', // Ensure clicks work
          visibility: 'visible', // Always visible
        }}
      >
        {/* Main piece container */}
        <motion.div
          className={`${pieceSize} rounded-full flex items-center justify-center overflow-visible
            ${isMovable ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400' : 'cursor-default'}
            ${canBearOff ? 'ring-2 ring-yellow-400' : ''}
            ${canMove && !canBearOff ? 'ring-1 ring-blue-400' : ''}
          `}
          style={{
            backgroundColor: playerColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            visibility: 'visible', // Always visible
            position: 'relative', // Establish stacking context
          }}
          whileHover={isMovable ? { scale: 1.08 } : {}}
          animate={canBearOff ? {
            y: [0, -3, 0],
            transition: { repeat: Infinity, duration: 1.5 }
          } : {}}
        >
          {/* Inner circle for design */}
          <div 
            className={`${innerSize} rounded-full`} 
            style={{ 
              border: `2px solid ${player === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
              background: playerColor,
              visibility: 'visible', // Always visible
            }} 
          />
          
          {/* Bearing off indicator - simplified for mobile */}
          {canBearOff && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse z-50">
              ↗
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 