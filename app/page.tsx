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
  'yahtzee-pvp': "Yahtzee - Player vs Player",
  'farkle-pvp': "Farkle - Player vs Player",
  'farkle-pvc': "Farkle - Player vs Computer",
  'backgammon-pvp': "Backgammon - Player vs Player",
  'backgammon-pvc': "Backgammon - Player vs Computer",
  'general-scorecard': "General Score Card",
};

// Dynamically add display names for Farkle PvP with player counts
for (let i = 2; i <= 8; i++) {
  GAME_MODE_DISPLAY_NAMES[`farkle-pvp-${i}`] = `Farkle - ${i} Players`;
}

// Dynamically add display names for Yahtzee PvP with player counts
for (let i = 2; i <= 8; i++) {
  GAME_MODE_DISPLAY_NAMES[`yahtzee-pvp-${i}`] = `Yahtzee - ${i} Players`;
}

// Dynamically add display names for General Score Card with player counts
for (let i = 2; i <= 10; i++) {
  GAME_MODE_DISPLAY_NAMES[`general-scorecard-${i}`] = `General Score Card - ${i} Players`;
}

// NEW: Dynamically add display names for Yahtzee Score Card with player counts
for (let i = 2; i <= 8; i++) {
  GAME_MODE_DISPLAY_NAMES[`yahtzee-score-card-${i}`] = `Yahtzee - Score Card - ${i} Players`;
}

// NEW: Dynamically add display names for Farkle Score Card with player counts
for (let i = 2; i <= 8; i++) {
  GAME_MODE_DISPLAY_NAMES[`farkle-scorecard-${i}`] = `Farkle - Score Card - ${i} Players`;
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
  const [selectedGameModeName, setSelectedGameModeName] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    let requiredLength = 0;
    
    if (gameMode === 'single' || gameMode === 'farkle-pvc') { 
      requiredLength = 1;
    } else if (gameMode === 'backgammon-pvp') {
      requiredLength = 2;
    } else if (gameMode === 'backgammon-pvc') {
      requiredLength = 1;
    } else if (gameMode === 'score-card' || 
               gameMode === 'farkle-pvp' || 
               gameMode === 'farkle-scorecard' || 
               gameMode === 'yahtzee-pvp' || 
               gameMode === 'general-scorecard') {
      requiredLength = playerCount;
    }

    // Reset opponent type if switching away from Backgammon modes that use it
    if (gameMode !== 'backgammon-pvp' && gameMode !== 'backgammon-pvc' && backgammonOpponentType !== OPPONENT_PLAYER) {
        // This condition might need review based on how/if backgammonOpponentType is used elsewhere
        // For now, if not a backgammon mode that implies opponent type, reset to player.
        // setBackgammonOpponentType(OPPONENT_PLAYER); // Potentially not needed if only set by specific modes
    }

    setPlayerNames((currentNames) => {
        const newNames = Array(requiredLength).fill('');
        for (let i = 0; i < Math.min(requiredLength, currentNames.length); i++) {
            newNames[i] = currentNames[i] || '';
        }
        // Remove the loop that sets default names like "Player 1"
        // The placeholder attribute on the Input component will handle this.
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
  } else if (gameMode === 'backgammon-pvp') {
    numInputsToShow = 2;
  } else if (gameMode === 'backgammon-pvc') {
    numInputsToShow = 1;
  } else if (gameMode === 'score-card' || 
             gameMode === 'farkle-pvp' || 
             gameMode === 'farkle-scorecard' || 
             gameMode === 'yahtzee-pvp' || 
             gameMode === 'general-scorecard') {
    numInputsToShow = playerCount;
  }

  const isStartDisabled = !gameMode ||
                          (numInputsToShow > 0 && playerNames.slice(0, numInputsToShow).some(name => !name || name.trim() === ''));

  const handleStartGame = useCallback(() => {
    if (isStartDisabled) {
      console.error("Attempted to start game while button should be disabled.");
      return; 
    }

    const namesForRoute = playerNames.slice(0, numInputsToShow);

    if (gameMode === 'single') {
      router.push(`/game/single-player?name=${encodeURIComponent(namesForRoute[0] || '')}`);
    } else if (gameMode === 'score-card' || gameMode === 'yahtzee-pvp') {
      // Yahtzee score card or PvP
      const route = gameMode === 'score-card' ? '/score-card' : `/game/${playerCount}`;
      router.push(`${route}?names=${encodeURIComponent(JSON.stringify(namesForRoute))}`);
    } else if (gameMode === 'farkle-scorecard') {
      // Farkle score card
      const route = '/farkle-scorecard';
      const queryString = encodeURIComponent(JSON.stringify(namesForRoute));
      router.push(`${route}?names=${queryString}`);
    } else if (gameMode === 'farkle-pvp') {
      // Farkle PvP
      const route = '/farkle-pvp';
      const pvpNamesToPass = playerNames.slice(0, playerCount);
      const queryString = encodeURIComponent(JSON.stringify(pvpNamesToPass));
      router.push(`${route}?players=${queryString}`);
    } else if (gameMode === 'farkle-pvc') {
      // Farkle PvC
      const route = '/farkle-pvc';
      const humanPlayerName = playerNames[0] || "Player 1"; 
      router.push(`${route}?playerName=${encodeURIComponent(humanPlayerName)}&gameMode=farkle-pvc`);
    } else if (gameMode === 'backgammon-pvp' || gameMode === 'backgammon-pvc') {
      // Assumes getBackgammonLink correctly uses namesForRoute (1 for PvC, 2 for PvP)
      // and the /backgammon page infers mode from number of names.
      const backgammonLink = getBackgammonLink(namesForRoute);
      router.push(backgammonLink);
    } else if (gameMode === 'general-scorecard') {
      const route = '/general-scorecard';
      const queryString = encodeURIComponent(JSON.stringify(namesForRoute));
      router.push(`${route}?names=${queryString}`);
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
    let countFromMode = 2; // Default player count if not specified

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
    } else if (modeKey.startsWith('general-scorecard-')) {
      const parts = modeKey.split('-');
      countFromMode = parseInt(parts.pop() || '2', 10);
      baseMode = 'general-scorecard';
      setPlayerCount(countFromMode);
    } else if (modeKey.startsWith('yahtzee-score-card-')) {
      const parts = modeKey.split('-');
      countFromMode = parseInt(parts.pop() || '2', 10);
      baseMode = 'score-card';
      setPlayerCount(countFromMode);
    } else if (modeKey.startsWith('farkle-scorecard-')) {
      const parts = modeKey.split('-');
      countFromMode = parseInt(parts.pop() || '2', 10);
      baseMode = 'farkle-scorecard';
      setPlayerCount(countFromMode);
    } else if (modeKey === 'farkle-pvc') {
      setPlayerCount(1); 
      baseMode = modeKey;
    } else if (modeKey === 'single') {
      setPlayerCount(1);
      baseMode = modeKey;
    } else if (modeKey === 'backgammon-pvp') {
      baseMode = 'backgammon-pvp';
      setPlayerCount(2);
      setBackgammonOpponentType(OPPONENT_PLAYER);
    } else if (modeKey === 'backgammon-pvc') {
      baseMode = 'backgammon-pvc';
      setPlayerCount(1);
      setBackgammonOpponentType(OPPONENT_COMPUTER);
    } else {
      // Handles modes like BACKGAMMON_MODE_KEY or any mode not matching above
      baseMode = modeKey;
      // For modes not explicitly setting playerCount (like Backgammon), set a default or let specific logic handle it.
      // Most player-count sensitive modes are now handled by suffixes.
      // If it's not a known suffixed type, and not single player, default to 2.
      if (baseMode !== 'single' && baseMode !== 'farkle-pvc' && baseMode !== 'backgammon-pvp' && baseMode !== 'backgammon-pvc') {
        // This case should ideally not be hit for modes that *should* have player counts
        // as they should be selected with suffixes.
        // If an old key like 'score-card' (without suffix) was somehow passed, this might apply.
        setPlayerCount(2); 
      }
    }
    
    setGameMode(baseMode); 
    setSelectedGameModeName(GAME_MODE_DISPLAY_NAMES[modeKey] || GAME_MODE_DISPLAY_NAMES[baseMode] || "");

    // Explicitly manage backgammonOpponentType based on the selected mode
    if (modeKey === 'backgammon-pvp') {
      setBackgammonOpponentType(OPPONENT_PLAYER);
    } else if (modeKey === 'backgammon-pvc') {
      setBackgammonOpponentType(OPPONENT_COMPUTER);
    } else if (baseMode !== 'backgammon-pvp' && baseMode !== 'backgammon-pvc') {
      // If not a specific backgammon mode, reset or ensure opponent type is non-computer if that state is reused.
      // For now, let's assume if it's not backgammon-pvc, it's not vs computer for backgammon context.
      // If other modes might set OPPONENT_COMPUTER, this might need adjustment.
      // setBackgammonOpponentType(OPPONENT_PLAYER); // Consider if this reset is broadly needed.
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
                        gameMode === 'backgammon-pvc' &&
                        index === 1 
                          ? "Computer" 
                          : `Player ${index + 1}`
                      }
                      value={playerNames[index] || ''}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      disabled={
                        gameMode === 'backgammon-pvc' &&
                        index === 1
                      }
                      className="w-full h-12 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500 mb-2"
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

