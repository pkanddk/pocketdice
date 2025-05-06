import React, { useState, useEffect, useCallback } from 'react';
import { GamePiece } from '../backgammon/game-piece';
import { getThemeStyle } from '@/utils/theme-styles';

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
}: BoardPointProps) {
  const themeStyle = getThemeStyle(theme);
  const [isDragOver, setIsDragOver] = useState(false);
  
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
  
  // Handle click for bearing off
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation();
    
    if (canBearOff && isPlayable && player === currentPlayer) {
      console.log(`Bearing off from point ${index}`);
      onMove(index, 24); // Special index 24 represents bearing off
    }
  }, [canBearOff, isPlayable, player, currentPlayer, index, onMove]);
  
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
  
  return (
    <div
      className={`relative flex-1 h-full transition-all duration-200
        ${isEvenPoint ? 'bg-black/15' : 'bg-black/5'}
        ${isDragOver ? 'bg-blue-400/30 ring-2 ring-blue-400' : ''}
        ${canBearOff ? 'ring-1 ring-yellow-500' : ''}
        ${pointHighlightClass}`}
      style={{
        backgroundColor: isDragOver ? "rgba(59, 130, 246, 0.3)" : 
                        canBearOff ? "rgba(234, 179, 8, 0.2)" : 
                        "transparent",
        transition: "all 0.2s",
        zIndex: isDragOver ? 20 : 1, // Increase z-index when dragging over
        userSelect: 'none', // Prevent text selection
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
            isTopHalf ? "justify-start pt-1" : "justify-end pb-1"
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