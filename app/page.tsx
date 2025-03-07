"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dice3, Users } from 'lucide-react'
import { Card, CardContent } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { GameModeSelector } from '@/components/GameModeSelector'

export default function HomePage() {
  const router = useRouter()
  const [gameMode, setGameMode] = useState<string>('single') 
  const [playerCount, setPlayerCount] = useState<number>(2)
  const [playerNames, setPlayerNames] = useState<string[]>(['']) 

  useEffect(() => {
    if (gameMode === 'single') {
      setPlayerNames([''])
    } else if (gameMode === 'score-card' || gameMode === 'duel') {
      setPlayerNames(Array(playerCount).fill(''))
    }
  }, [gameMode, playerCount])

  const handleStartGame = useCallback(() => {
    if (gameMode === 'single' && playerNames[0].trim() === '') {
      return;
    }
    if ((gameMode === 'score-card' || gameMode === 'duel') && playerNames.slice(0, playerCount).some(name => name.trim() === '')) {
      return;
    }

    if (gameMode === 'single' && playerNames[0].trim() !== '') {
      router.push(`/game/single-player?name=${encodeURIComponent(playerNames[0])}`);
    } else if ((gameMode === 'score-card' || gameMode === 'duel') && playerNames.every(name => name.trim() !== '')) {
      const route = gameMode === 'score-card' ? '/score-card' : `/game/${playerCount}`;
      router.push(`${route}?names=${encodeURIComponent(JSON.stringify(playerNames.slice(0, playerCount)))}`);
    }
  }, [gameMode, playerCount, playerNames, router]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleStartGame();
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [handleStartGame]);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...playerNames]
    newNames[index] = value
    setPlayerNames(newNames)
  }

  const handleSelectGameMode = (mode: string) => {
    setGameMode(mode);
  };

  return (
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
            <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">
              Select game mode
            </h2>
            
            <GameModeSelector onSelectGameMode={handleSelectGameMode} />

            {(gameMode === 'score-card' || gameMode === 'duel') && (
              <div className="relative mt-4">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <Select 
                  onValueChange={(value) => setPlayerCount(parseInt(value))} 
                  defaultValue="2"
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

            <AnimatePresence>
              {(gameMode === 'single' ? [0] : gameMode === 'score-card' || gameMode === 'duel' ? Array.from({ length: playerCount }, (_, i) => i) : []).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <Input
                    placeholder={`Player ${index + 1}`}
                    value={playerNames[index] || ''}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="h-12 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500 mb-2"
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <Button 
              onClick={handleStartGame}
              className="w-full h-12 text-lg rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-300"
            >
              Start Game
            </Button>
          </CardContent>
        </Card>

        <motion.div 
          className="mt-8 text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-blue-600 text-lg font-medium">
            Choose your game mode and click Start Game to begin!
          </p>
          
          <div className="w-8 h-8 mx-auto border-2 border-blue-500 rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          </div>
        </motion.div>
      </motion.div>

      <footer className="mt-auto pt-8 text-center text-sm text-gray-500">
        <p>Pocket Score © {new Date().getFullYear()} | a pk and dk app</p>
      </footer>
    </div>
  )
}

