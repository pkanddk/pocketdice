"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dice3, Users, Computer } from 'lucide-react'
import { Card, CardContent } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { GameModeSelector } from '@/components/GameModeSelector'
import SaveToHomeScreenModal from '@/components/ui/SaveToHomeScreenModal'

const BACKGAMMON_MODE_KEY = "backgammon";
const OPPONENT_PLAYER = "player";
const OPPONENT_COMPUTER = "computer";

// Update display names for Yahtzee modes
const GAME_MODE_DISPLAY_NAMES: { [key: string]: string } = {
  'single': "Yahtzee - Player vs A.I.",
  'score-card': "Yahtzee - Score Card",
  'duel': "Yahtzee - Player vs Player",
  'farkle-pvp': "Farkle - Player vs Player",
  'farkle-scorecard': "Farkle - Score Card",
  [BACKGAMMON_MODE_KEY]: "Backgammon",
};

// Add a helper function to generate properly encoded Backgammon game links
function getBackgammonLink(names: string[]) {
  const encodedNames = encodeURIComponent(JSON.stringify(names));
  return `/backgammon?names=${encodedNames}`;
}

export default function HomePage() {
  const router = useRouter()
  const [gameMode, setGameMode] = useState<string>('')
  const [playerCount, setPlayerCount] = useState<number>(2)
  const [playerNames, setPlayerNames] = useState<string[]>([''])
  const [backgammonOpponentType, setBackgammonOpponentType] = useState<string>(OPPONENT_PLAYER);
  // Initialize selectedGameModeName to empty string
  const [selectedGameModeName, setSelectedGameModeName] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    let requiredLength = 0;
    if (gameMode !== BACKGAMMON_MODE_KEY) {
      if (gameMode === 'single') {
        requiredLength = 1;
      } else if (gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'farkle-pvp' || gameMode === 'farkle-scorecard') {
        requiredLength = playerCount;
      }
      // Reset opponent type if switching away from Backgammon
      if (backgammonOpponentType !== OPPONENT_PLAYER) {
          setBackgammonOpponentType(OPPONENT_PLAYER);
      }
    } else { // Backgammon selected
      requiredLength = backgammonOpponentType === OPPONENT_COMPUTER ? 1 : 2;
    }

    // Adjust playerNames array
    setPlayerNames((currentNames) => {
        const newNames = Array(requiredLength).fill('');
        for (let i = 0; i < Math.min(requiredLength, currentNames.length); i++) {
            newNames[i] = currentNames[i] || '';
        }
        return newNames;
    });

  }, [gameMode, playerCount, backgammonOpponentType]);

  // Effect to manage Save to Home Screen modal display
  useEffect(() => {
    // Ensure this code only runs on the client-side
    if (typeof window !== 'undefined') {
      // Check if running as a PWA (standalone mode)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowSaveModal(false); // Don't show if already a PWA
        return;
      }

      const lastSeenTimestamp = localStorage.getItem('lastSeenSaveModalTimestamp');
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

      if (!lastSeenTimestamp) {
        setShowSaveModal(true); // First visit
      } else {
        const timeSinceLastSeen = Date.now() - parseInt(lastSeenTimestamp, 10);
        if (timeSinceLastSeen > sevenDaysInMillis) {
          setShowSaveModal(true); // More than 7 days have passed
        }
      }
    }
  }, []);

  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    localStorage.setItem('lastSeenSaveModalTimestamp', Date.now().toString());
  };

  let numInputsToShow = 0;
  if (gameMode === 'single') {
    numInputsToShow = 1;
  } else if (gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'farkle-pvp' || gameMode === 'farkle-scorecard') {
    numInputsToShow = playerCount;
  } else if (gameMode === BACKGAMMON_MODE_KEY) {
    numInputsToShow = backgammonOpponentType === OPPONENT_COMPUTER ? 1 : 2;
  }

  const isStartDisabled = !gameMode ||
                          (numInputsToShow > 0 && playerNames.slice(0, numInputsToShow).some(name => !name || name.trim() === ''));

  const handleStartGame = useCallback(() => {
    if (isStartDisabled) {
      console.error("Attempted to start game while button should be disabled.");
      return; 
    }

    const namesForRoute = playerNames.slice(0, numInputsToShow); // Use numInputsToShow for general case

    if (gameMode === 'single') {
      router.push(`/game/single-player?name=${encodeURIComponent(namesForRoute[0] || '')}`);
    } else if (gameMode === 'score-card' || gameMode === 'duel') {
      const route = gameMode === 'score-card' ? '/score-card' : `/game/${playerCount}`;
      router.push(`${route}?names=${encodeURIComponent(JSON.stringify(namesForRoute))}`);
    } else if (gameMode === 'farkle-scorecard') {
      const route = '/farkle-scorecard';
      const queryString = encodeURIComponent(JSON.stringify(namesForRoute));
      console.log("[Farkle Scorecard Navigation] Mode:", gameMode, "Route:", route, "PlayerCount:", playerCount, "Names being passed:", namesForRoute, "QueryString:", queryString);
      router.push(`${route}?names=${queryString}`);
    } else if (gameMode === 'farkle-pvp') {
      const route = '/farkle-pvp';
      // For farkle-pvp, playerCount is the correct length specifier used in its useEffect
      const pvpNamesToPass = playerNames.slice(0, playerCount); 
      const queryString = encodeURIComponent(JSON.stringify(pvpNamesToPass));
      console.log("[Farkle PvP Navigation] Mode:", gameMode, "Route:", route, "PlayerCount:", playerCount, "Names being passed:", pvpNamesToPass, "QueryString:", queryString);
      router.push(`${route}?players=${queryString}`);
    } else if (gameMode === BACKGAMMON_MODE_KEY) {
      const backgammonLink = getBackgammonLink(namesForRoute);
      router.push(backgammonLink);
    }
  }, [gameMode, playerCount, playerNames, router, backgammonOpponentType, isStartDisabled, numInputsToShow]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isStartDisabled) {
        handleStartGame();
      }
    };
    // Ensure this code only runs on the client-side
    if (typeof document !== 'undefined') {
      document.addEventListener('keypress', handleKeyPress);
      return () => {
        document.removeEventListener('keypress', handleKeyPress);
      };
    }
  }, [handleStartGame, isStartDisabled]);

  const handleNameChange = (index: number, value: string) => {
    setPlayerNames(prevNames => {
        const newNames = [...prevNames];
        if (index < newNames.length) {
            newNames[index] = value;
        }
        return newNames;
    });
  }

  const handleSelectGameMode = useCallback((modeKey: string) => {
    setGameMode(modeKey);
    setSelectedGameModeName(GAME_MODE_DISPLAY_NAMES[modeKey] || "");
    if (modeKey !== BACKGAMMON_MODE_KEY) {
        setBackgammonOpponentType(OPPONENT_PLAYER);
    }
  }, []);

  return (
    <>
      <SaveToHomeScreenModal isOpen={showSaveModal} onClose={handleCloseSaveModal} />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-blue-800 tracking-tight flex items-center justify-center">
            Pocket Sc
            <motion.span 
              className="relative px-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Dice3 className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 w-10 h-10 text-blue-600" />
              <span className="invisible">o</span>
            </motion.span>
            re
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-2xl text-blue-600 mt-2 font-semibold"
          >
            Game On!
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-md mx-auto flex-grow"
        >
          <Card className="bg-white shadow-lg rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <GameModeSelector 
                  onSelectGameMode={handleSelectGameMode} 
                  currentSelectionName={selectedGameModeName}
              />

              {(gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'farkle-pvp' || gameMode === 'farkle-scorecard') && (
                <div className="relative mt-4">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <Select 
                    onValueChange={(value) => setPlayerCount(parseInt(value))} 
                    defaultValue="2"
                    value={playerCount.toString()}
                  >
                    <SelectTrigger className="pl-10 h-auto py-3 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Choose number of players" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          <div className="flex items-center justify-center">
                            <span className="font-semibold">{num} Players</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {gameMode === BACKGAMMON_MODE_KEY && (
                <div className="relative mt-4">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {backgammonOpponentType === OPPONENT_COMPUTER ? <Computer className="h-5 w-5 text-purple-500" /> : <Users className="h-5 w-5 text-green-500"/>}
                  </div>
                  <Select 
                    value={backgammonOpponentType} 
                    onValueChange={setBackgammonOpponentType}
                  >
                     <SelectTrigger className="pl-10 h-auto py-3 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select opponent" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={OPPONENT_COMPUTER}>
                           <div className="flex items-center">
                             <Computer className="mr-2 h-5 w-5" /> 
                             <span className="font-semibold">Play vs Computer</span>
                          </div>
                        </SelectItem>
                         <SelectItem value={OPPONENT_PLAYER}>
                           <div className="flex items-center">
                            <Users className="mr-2 h-5 w-5" /> 
                            <span className="font-semibold">Play vs Player</span>
                          </div>
                        </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <AnimatePresence>
                {Array.from({ length: numInputsToShow }).map((_, index) => (
                  <motion.div
                    key={`${gameMode}-${playerCount}-${backgammonOpponentType}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <Input
                      placeholder={
                        gameMode === BACKGAMMON_MODE_KEY && 
                        backgammonOpponentType === OPPONENT_COMPUTER && 
                        index === 1 
                          ? "Computer" 
                          : `Player ${index + 1}`
                      }
                      value={playerNames[index] || ''}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      disabled={
                        gameMode === BACKGAMMON_MODE_KEY && 
                        backgammonOpponentType === OPPONENT_COMPUTER && 
                        index === 1
                      }
                      className="h-12 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500 mb-2"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button 
                onClick={handleStartGame}
                disabled={isStartDisabled}
                className="w-full mt-4 py-4 text-lg font-semibold rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Start Game
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-8 mb-4"
        >
          <p className="text-blue-700">Choose your game mode and click Start Game to begin!</p>
           {/* Add the die icon below the text */}
          <div className="mt-2 inline-block border-2 border-blue-500 rounded p-1">
              <Dice3 className="h-4 w-4 text-blue-600" />
          </div>
        </motion.div>

      </div>
    </>
  )
}

