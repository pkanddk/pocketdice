import React, { useState } from 'react';
import { GamePiece } from './game-piece';
import { BAR_POSITION } from './constants'; // Import BAR_POSITION constant

interface BarProps {
  player: number;
  count: number;
  isTopHalf: boolean;
  theme: string;
  currentPlayer: number;
  isPlayable: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export const Bar: React.FC<BarProps> = ({
  player,
  count,
  isTopHalf,
  theme,
  currentPlayer,
  isPlayable,
  onMove,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Calculate piece offset and container height
  const pieceOffset = 16; // Offset between pieces
  const containerHeight = Math.min(count, 5) * pieceOffset + 32; // Base height plus offset for each piece

  // Define custom CSS for the pulse animation
  const pulseStyle = `
    @keyframes pulse-bg {
      0% { background-color: rgba(29, 78, 216, 0.2); }
      50% { background-color: rgba(59, 130, 246, 0.3); }
      100% { background-color: rgba(29, 78, 216, 0.2); }
    }
    .pulse-bg {
      animation: pulse-bg 2s infinite;
    }
  `;

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPlayable) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!isPlayable) return;
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    console.log('Dropping piece from index', fromIndex, 'to bar');
    
    onMove(fromIndex, BAR_POSITION);
  };

  // Debug bar state
  console.log("Bar state:", {
    player,
    count,
    isTopHalf,
    currentPlayer,
    isPlayable
  });

  const containerStyles = {
    position: 'absolute' as const,
    top: isTopHalf ? '0' : 'auto',
    bottom: !isTopHalf ? '0' : 'auto',
    left: '0',
    right: '0',
    height: `${containerHeight}px`,
    display: 'flex',
    flexDirection: (isTopHalf ? 'column' : 'column-reverse') as 'column' | 'column-reverse',
    alignItems: 'center',
    padding: '4px',
  };

  // Only render if there are pieces in the bar
  if (count <= 0) {
    return <div className="h-full relative bg-black/10" />;
  }

  // Helper function to determine if this bar has currentPlayer pieces 
  // that need to be moved
  const isActivePlayerBar = player === currentPlayer && count > 0;

  return (
    <>
      <style>{pulseStyle}</style>
      <div 
        className={`h-full relative transition-all duration-200 
          ${isActivePlayerBar && isPlayable ? 'bg-blue-700/20 pulse-bg border-2 border-blue-500' : 'bg-black/10'}
          ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-500/30' : ''}
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isActivePlayerBar && isPlayable && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-xs text-white font-bold bg-black/60 px-2 py-1 rounded-full whitespace-nowrap animate-pulse">
              Must move
            </div>
          </div>
        )}
        <div style={containerStyles}>
          {/* Render exactly count number of pieces */}
          {Array.from({ length: Math.min(count, 5) }, (_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '32px',
                height: '32px',
                [isTopHalf ? 'top' : 'bottom']: `${i * pieceOffset}px`,
                zIndex: isTopHalf ? 5 - i : i + 1,
              }}
            >
              <GamePiece
                player={player}
                index={BAR_POSITION} // Use BAR_POSITION constant for pieces on the bar
                isCurrentPlayer={player === currentPlayer}
                canMove={isPlayable && (i === (isTopHalf ? 0 : Math.min(count, 5) - 1))}
                onMove={onMove}
                theme={theme}
              />
            </div>
          ))}

          {/* Only show count indicator if more than 5 pieces */}
          {count > 5 && (
            <div 
              className="absolute bg-black/70 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                [isTopHalf ? 'top' : 'bottom']: `${containerHeight + 8}px`,
                zIndex: 10,
              }}
            >
              {count}
            </div>
          )}
        </div>
      </div>
    </>
  );
}; 