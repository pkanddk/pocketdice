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
  'yahtzee-pvp': "Yahtzee - Player vs Player",
  'farkle-pvp': "Farkle - Player vs Player",
  'farkle-scorecard': "Farkle - Score Card",
  'farkle-pvc': "Farkle - Player vs Computer",
  [BACKGAMMON_MODE_KEY]: "Backgammon",
};

// Dynamically add display names for Farkle PvP with player counts
for (let i = 2; i <= 8; i++) {
  GAME_MODE_DISPLAY_NAMES[`farkle-pvp-${i}`] = `Farkle - ${i} Players`;
}

// Dynamically add display names for Yahtzee PvP with player counts
for (let i = 2; i <= 8; i++) {
  GAME_MODE_DISPLAY_NAMES[`yahtzee-pvp-${i}`] = `Yahtzee - ${i} Players`;
}

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
    let currentSelectedPlayerCount = playerCount; 

    if (gameMode.startsWith('farkle-pvp-')) {
      // This logic might be redundant if handleSelectGameMode correctly sets gameMode to base and playerCount
    } else if (gameMode.startsWith('yahtzee-pvp-')) {
      // This logic might be redundant if handleSelectGameMode correctly sets gameMode to base and playerCount
    }

    if (gameMode !== BACKGAMMON_MODE_KEY) {
      if (gameMode === 'single' || gameMode === 'farkle-pvc') { 
        requiredLength = 1;
      } else if (gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'farkle-pvp' || gameMode === 'farkle-scorecard' || gameMode === 'yahtzee-pvp') {
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
  if (gameMode === 'single' || gameMode === 'farkle-pvc') { 
    numInputsToShow = 1;
  } else if (gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'farkle-pvp' || gameMode === 'farkle-scorecard' || gameMode === 'yahtzee-pvp') {
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

    // For farkle-pvp or farkle-pvc, numInputsToShow is derived from playerCount or 1 respectively
    const namesForRoute = playerNames.slice(0, numInputsToShow);

    if (gameMode === 'single') {
      router.push(`/game/single-player?name=${encodeURIComponent(namesForRoute[0] || '')}`);
    } else if (gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'yahtzee-pvp') {
      const route = gameMode === 'score-card' ? '/score-card' : `/game/${playerCount}`;
      router.push(`${route}?names=${encodeURIComponent(JSON.stringify(namesForRoute))}`);
    } else if (gameMode === 'farkle-scorecard') {
      const route = '/farkle-scorecard';
      const queryString = encodeURIComponent(JSON.stringify(namesForRoute));
      router.push(`${route}?names=${queryString}`);
    } else if (gameMode === 'farkle-pvp') { // Handles all X-player Farkle games
      const route = '/farkle-pvp';
      // playerNames has been adjusted by useEffect based on playerCount, which was set by handleSelectGameMode
      const pvpNamesToPass = playerNames.slice(0, playerCount); 
      const queryString = encodeURIComponent(JSON.stringify(pvpNamesToPass));
      router.push(`${route}?players=${queryString}`);
    } else if (gameMode === 'farkle-pvc') { // New route for Farkle Player vs Computer
      const route = '/farkle-pvc';
      // playerNames should have 1 element for PVC. Get the first name, default if empty.
      const humanPlayerName = playerNames[0] || "Player 1"; 
      router.push(`${route}?playerName=${encodeURIComponent(humanPlayerName)}&gameMode=farkle-pvc`);
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
    let baseMode = modeKey;
    let countFromMode = 0;

    if (modeKey.startsWith('farkle-pvp-')) {
      const parts = modeKey.split('-');
      countFromMode = parseInt(parts.pop() || '2', 10);
      baseMode = 'farkle-pvp'; 
      setPlayerCount(countFromMode); 
    } else if (modeKey.startsWith('yahtzee-pvp-')) {
      const parts = modeKey.split('-');
      countFromMode = parseInt(parts.pop() || '2', 10);
      baseMode = 'yahtzee-pvp';
      setPlayerCount(countFromMode);
    } else if (modeKey === 'farkle-pvc') {
      setPlayerCount(1); 
    } else if (modeKey === 'single') {
      setPlayerCount(1);
    } else if (modeKey !== 'score-card' && modeKey !== 'duel' && !modeKey.startsWith('farkle-') && !modeKey.startsWith('yahtzee-')) {
        // This condition might need refinement to ensure it doesn't incorrectly reset playerCount for Yahtzee/Farkle scorecards
        // if (modeKey === 'single') { // This inner check is now handled above
        // }
    }

    setGameMode(baseMode); 
    setSelectedGameModeName(GAME_MODE_DISPLAY_NAMES[modeKey] || GAME_MODE_DISPLAY_NAMES[baseMode] || "");

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

              {(gameMode === 'score-card' || gameMode === 'duel' || gameMode === 'farkle-pvp' || gameMode === 'farkle-scorecard' || gameMode === 'yahtzee-pvp') && (
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

