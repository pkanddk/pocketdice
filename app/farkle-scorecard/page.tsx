"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo'; // Assuming you have a generic Logo component
import { FarkleScoreCard } from '@/components/farkle/FarkleScoreCard';

function FarkleScoreCardPageContent() {
  const searchParams = useSearchParams();
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [displayTurn, setDisplayTurn] = useState<number>(1);
  // Add any other page-specific state if needed, e.g., themes for Farkle

  useEffect(() => {
    const namesParam = searchParams.get('names');
    if (namesParam) {
      try {
        const parsedNames = JSON.parse(decodeURIComponent(namesParam));
        if (Array.isArray(parsedNames) && parsedNames.every(name => typeof name === 'string')) {
          setPlayerNames(parsedNames);
        } else {
          console.error("Invalid player names format in URL");
          setPlayerNames([]); // Fallback to empty or handle error appropriately
        }
      } catch (error) {
        console.error("Error parsing player names from URL:", error);
        setPlayerNames([]); // Fallback
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (playerNames.length > 0 && !gameStarted) {
      setGameStarted(true);
      // Initialize any other game-specific states based on playerNames if needed
    }
  }, [playerNames, gameStarted]);

  const handleTurnChange = useCallback((turn: number) => {
    setDisplayTurn(turn);
  }, [setDisplayTurn]);

  if (!gameStarted || playerNames.length === 0) {
    // You might want a more sophisticated loading state or error handling
    return <div className="text-center py-10">Loading Players or Player Data Missing...</div>;
  }

  // Determine a theme or background - default for now
  const pageClasses = "container mx-auto px-4 py-4 min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white text-gray-900";

  return (
    <div className={pageClasses}>
      <div className="mb-2 text-center">
        <div className="inline-block">
            <Logo /> { /* Or a specific Farkle Logo if you create one */ }
        </div>
        <p className="text-center mt-1 text-lg">
          F#*KLE Score Card | Turn {displayTurn}
        </p>
      </div>
      <FarkleScoreCard players={playerNames} onTurnChange={handleTurnChange} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading Farkle Score Card...</div>}>
      <FarkleScoreCardPageContent />
    </Suspense>
  );
} 