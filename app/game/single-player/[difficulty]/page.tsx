"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { JerryLogo } from '@/components/JerryLogo'
import { MernLogo } from '@/components/MernLogo'
import { GameLogic } from '@/components/GameLogic'
import { Button } from '@/components/ui/button'

export default function SinglePlayerGamePage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('Player 1')
  const [isJerryGame, setIsJerryGame] = useState(false)
  const [isMernGame, setIsMernGame] = useState(false)
  const [scores, setScores] = useState<Array<Array<{ value: number | null; locked: boolean }>>>([])
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    if (playerName) {
      setIsJerryGame(playerName.toLowerCase().replace(/\s+/g, '') === "jerrymccall")
      setIsMernGame(playerName.toLowerCase().replace(/\s+/g, '') === "mernmccall")
    }
    setScores([
      Array(13).fill(null).map(() => ({ value: null, locked: false })),
      Array(13).fill(null).map(() => ({ value: null, locked: false }))
    ])
  }, [playerName])

  const resetGame = useCallback(() => {
    setScores([
      Array(13).fill(null).map(() => ({ value: null, locked: false })),
      Array(13).fill(null).map(() => ({ value: null, locked: false }))
    ]);
    setGameKey(prevKey => prevKey + 1);
  }, []);

  const renderNewGameButtons = () => (
    <div className="mt-6 sm:mt-10 text-center space-y-4 sm:space-y-0 sm:space-x-4">
      <Button
        onClick={resetGame}
        className={`w-full sm:w-auto ${
          isJerryGame
            ? 'bg-green-600 hover:bg-green-700'
            : isMernGame
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-green-600 hover:bg-green-700'
        } text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full transition duration-300 shadow-md hover:shadow-lg text-lg`}
      >
        New Game
      </Button>
      <Button
        onClick={() => router.push('/')}
        className={`w-full sm:w-auto ${
          isJerryGame
            ? 'bg-red-600 hover:bg-red-700'
            : isMernGame
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-red-600 hover:bg-red-700'
        } text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full transition duration-300 shadow-md hover:shadow-lg text-lg`}
      >
        Back to Home
      </Button>
    </div>
  )

  return (
    <div className={`container mx-auto px-4 py-4 min-h-screen ${
      isJerryGame ? 'bg-[#0C1222] text-white' : 
      isMernGame ? 'bg-white text-pink-900' : 
      'bg-gradient-to-b from-gray-50 to-white text-gray-900'
    }`}>
      <div className="mb-2">
        {isJerryGame ? (
          <div className="text-white">
            <JerryLogo />
          </div>
        ) : isMernGame ? (
          <div className="text-pink-700">
            <MernLogo />
          </div>
        ) : (
          <Logo />
        )}
        <p className="text-center mt-1 text-lg">
          Single Player vs Computer
        </p>
      </div>
      {scores.length > 0 && (
        <GameLogic 
          key={gameKey}
          players={[playerName, 'Computer']} 
          isJerryGame={isJerryGame} 
          isMernGame={isMernGame}
          scores={scores}
          setScores={setScores}
          isSinglePlayer={true}
          onResetGame={resetGame}
          renderNewGameButtons={renderNewGameButtons}
        />
      )}
    </div>
  )
}

