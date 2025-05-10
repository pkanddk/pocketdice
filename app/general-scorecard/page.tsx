"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { GeneralScoreCard } from '@/components/general/GeneralScoreCard';

function GeneralScoreCardPageContent() {
  const searchParams = useSearchParams();
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [displayTurn, setDisplayTurn] = useState<number>(1);

  useEffect(() => {
    const namesParam = searchParams.get('names');
    if (namesParam) {
      try {
        const parsedNames = JSON.parse(decodeURIComponent(namesParam));
        if (Array.isArray(parsedNames) && parsedNames.length >= 2 && parsedNames.every(name => typeof name === 'string')) {
          setPlayerNames(parsedNames);
          setGameStarted(true);
        } else {
          console.error("Invalid player names format in URL");
          setPlayerNames([]); 
          setGameStarted(false);
        }
      } catch (error) {
        console.error("Error parsing player names from URL:", error);
        setPlayerNames([]); 
        setGameStarted(false);
      }
    } else {
      console.error("Missing player names in URL");
      setPlayerNames([]);
      setGameStarted(false);
    }
  }, [searchParams]);

  const handleTurnChange = useCallback((turn: number) => {
    setDisplayTurn(turn);
  }, [setDisplayTurn]);

  if (!gameStarted) {
    return <div className="text-center py-10">Loading Player Data or Invalid/Missing Names...</div>;
  }

  const pageClasses = "container mx-auto px-4 py-4 min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white text-gray-900";

  return (
    <div className={pageClasses}>
      <div className="mb-2 text-center">
        <div className="inline-block">
            <Logo />
        </div>
        <p className="text-center mt-1 text-lg text-gray-700">
          General Score Card | Turn {displayTurn}
        </p>
      </div>
      <GeneralScoreCard players={playerNames} onTurnChange={handleTurnChange} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading General Score Card...</div>}>
      <GeneralScoreCardPageContent />
    </Suspense>
  );
} 