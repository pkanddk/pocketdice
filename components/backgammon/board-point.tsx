import React, { useState, useEffect, useCallback } from 'react';
import { GamePiece } from '../backgammon/game-piece';
import { getThemeStyle } from '@/utils/theme-styles';
import { motion } from 'framer-motion';

interface BoardPointProps {
  index: number;
  player: number;
  count: number;
  isTopHalf: boolean;
  isEvenPoint: boolean;
  theme: string;
  currentPlayer: number;
  isPlayable: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  canBearOff?: boolean;
  isRecentBarMove?: boolean;
  onPointClick?: (index: number) => void;
  isSelected?: boolean;
  showIllegalHighlight?: boolean;
  illegalHighlightKey?: number | null;
}

export function BoardPoint({
  index,
  player,
  count,
  isTopHalf,
  isEvenPoint,
  theme,
  currentPlayer,
  isPlayable,
  onMove,
  canBearOff = false,
  isRecentBarMove = false,
  onPointClick,
  isSelected = false,
  showIllegalHighlight = false,
  illegalHighlightKey = null,
}: BoardPointProps) {

  // Add log here to see props on render
  console.log(`BoardPoint ${index} RENDER: player=${player}, count=${count}, isSelected=${isSelected}, showIllegalHighlight=${showIllegalHighlight}`);

  const themeStyle = getThemeStyle(theme);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFeedbackActive, setShowFeedbackActive] = useState(false);
  
  useEffect(() => {
    if (showIllegalHighlight && illegalHighlightKey) {
      setShowFeedbackActive(true);
      const timer = setTimeout(() => {
        setShowFeedbackActive(false);
      }, 700); // Duration of the feedback
      return () => clearTimeout(timer);
    }
  }, [showIllegalHighlight, illegalHighlightKey]); // Depend on the key to re-trigger
  
  // Always re-render when count or player changes
  useEffect(() => {
    if (count > 0) {
      console.log(`Point ${index} has ${count} pieces for player ${player}`);
    }
  }, [index, count, player]);
  
  // Simplified function to check if the point can accept a piece
  const canAcceptPiece = useCallback(() => {
    // If no player pieces here, or only 1 of opponent, or same player
    return !player || count <= 1 || player === currentPlayer;
  }, [count, player, currentPlayer]);
  
  // Handle drag events for the point
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (canAcceptPiece()) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  }, [canAcceptPiece]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!canAcceptPiece()) return;
    
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    console.log(`Dropping from ${fromIndex} to ${index}`);
    
    onMove(fromIndex, index);
  }, [canAcceptPiece, index, onMove]);
  
  // Point styles based on state
  const pointStyle = {
    backgroundColor: isEvenPoint ? themeStyle.lightPointColor : themeStyle.darkPointColor,
  };
  
  // Modified handleClick to use onPointClick if available
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPointClick) {
      onPointClick(index);
    } else {
      // Fallback to original direct bear-off logic if onPointClick is not provided
      // (though it should always be provided with the new changes)
      if (canBearOff && isPlayable && player === currentPlayer) {
        console.log(`Bearing off from point ${index} via fallback click`);
        onMove(index, 24); // BEARING_OFF_POSITION
      }
    }
  }, [canBearOff, isPlayable, player, currentPlayer, index, onMove, onPointClick]);
  
  // Calculate the number of pieces to display and how they should stack
  const maxVisiblePieces = 5;
  
  // Calculate stack margin based on available height
  const stackMargin = "-12px"; // Default small stack for mobile
  
  // Ensure count is actually available and valid
  const pieceCount = typeof count === 'number' && !isNaN(count) ? count : 0;
  
  // Add visual highlighting for pieces recently moved from the bar
  const pointHighlightClass = isRecentBarMove 
    ? 'ring-2 ring-yellow-300 shadow-lg animate-pulse'
    : '';
  
  // Add visual highlighting for selected points
  const selectionHighlightClass = isSelected 
    ? 'ring-2 ring-blue-400 shadow-lg' // Lighter blue, thinner ring, softer shadow
    : '';
  
  return (
    <div
      className={`relative flex-1 h-full transition-all duration-200
        ${isEvenPoint ? 'bg-black/15' : 'bg-black/5'}
        ${isDragOver ? 'bg-blue-400/30 ring-2 ring-blue-400' : ''}
        ${canBearOff && !isSelected ? 'ring-1 ring-yellow-500' : ''}
        ${pointHighlightClass}
        ${selectionHighlightClass}`}
      style={{
        backgroundColor: isSelected ? "rgba(96, 165, 250, 0.25)" : // Lighter, more transparent blue (blue-400 @ 0.25 opacity)
                        isDragOver ? "rgba(59, 130, 246, 0.3)" : 
                        canBearOff ? "rgba(234, 179, 8, 0.2)" : 
                        "transparent",
        // boxShadow: isDragOver ? 'inset 0 0 8px rgba(59, 130, 246, 0.4)' : 'none', // Removed isSelected boxShadow for now
        transition: "all 0.2s", 
        zIndex: isDragOver || isSelected ? 20 : 1, 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      data-point-index={index}
      data-player={player}
      data-count={pieceCount}
    >
      {/* Illegal Move Feedback Animation */}
      {showFeedbackActive && (
        <motion.div
          key={illegalHighlightKey}
          className="absolute inset-0 w-full h-full z-30"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{
            opacity: [0.7, 0],
            scale: [1.05, 1],
            x: [0, -3, 3, -3, 3, 0],
          }}
          transition={{
            duration: 0.7,
            times: [0, 0.8, 1],
            x: { duration: 0.4, ease: "easeInOut"}
          }}
          style={{
            backgroundColor: "rgba(255, 0, 0, 0.4)",
            clipPath: isTopHalf
              ? "polygon(0% 0%, 100% 0%, 50% 100%)"
              : "polygon(50% 0%, 0% 100%, 100% 100%)",
          }}
        />
      )}

      {/* Triangle */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          clipPath: isTopHalf
            ? "polygon(0% 0%, 100% 0%, 50% 100%)"
            : "polygon(50% 0%, 0% 100%, 100% 100%)",
          ...pointStyle,
          zIndex: 0,
        }}
      />

      {/* Point number label */}
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 text-[10px] font-bold ${isTopHalf ? 'bottom-0' : 'top-0'} z-10 bg-black/50 text-white px-1 rounded-sm`}
      >
        {index}
      </div>

      {/* Pieces container - responsively sized */}
      {pieceCount > 0 && (
        <div
          className={`absolute inset-0 flex flex-col items-center ${
            isTopHalf ? "justify-start" : "justify-end pb-1"
          } pointer-events-none z-20`}
        >
          {Array.from({ length: Math.min(pieceCount, maxVisiblePieces) }).map((_, i) => (
            <div 
              key={i} 
              className="pointer-events-auto relative"
              style={{
                marginTop: i > 0 ? stackMargin : "0",
                // Make pieces smaller if there are many
                transform: pieceCount > 3 ? "scale(0.9)" : "none",
                zIndex: 20 + (maxVisiblePieces - i), // Stack properly with higher pieces on top
              }}
            >
              <GamePiece
                player={player}
                index={index}
                isCurrentPlayer={player === currentPlayer}
                canMove={isPlayable && (i === (isTopHalf ? 0 : Math.min(pieceCount, maxVisiblePieces) - 1))}
                onMove={onMove}
                theme={theme}
                dice={[]}
                canBearOff={canBearOff && i === (isTopHalf ? 0 : Math.min(pieceCount, maxVisiblePieces) - 1)}
              />
            </div>
          ))}
          
          {/* Count indicator for stacks with > 5 pieces */}
          {pieceCount > maxVisiblePieces && (
            <div className="text-white font-bold bg-black/70 rounded-full w-5 h-5 flex items-center justify-center text-xs pointer-events-auto">
              {pieceCount}
            </div>
          )}
        </div>
      )}

      {/* Visual indicator for draggable targets */}
      {canAcceptPiece() && !player && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity duration-200">
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-white"></div>
        </div>
      )}
    </div>
  );
} 