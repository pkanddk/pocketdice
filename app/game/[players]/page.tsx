"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { JerryLogo } from '@/components/JerryLogo'
import { MernLogo } from '@/components/MernLogo'
import { GameLogic } from '@/components/GameLogic'
import { Button } from '@/components/ui/button'

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter()
  const [isJerryGame, setIsJerryGame] = useState(false)
  const [isMernGame, setIsMernGame] = useState(false)

  const playerNames = useMemo(() => {
    const namesParam = searchParams.get('names')
    return namesParam ? JSON.parse(decodeURIComponent(namesParam)) : []
  }, [searchParams])

  const [scores, setScores] = useState<Array<Array<{ value: number | null; locked: boolean }>>>(() => 
    Array(playerNames.length).fill(null).map(() => 
      Array(13).fill(null).map(() => ({ value: null, locked: false }))
    )
  )

  const checkForSpecialGames = useCallback((names: string[]) => {
    const jerryActivated = names.some(name => name.toLowerCase().replace(/\s+/g, '') === "jerrymccall")
    const mernActivated = names.some(name => name.toLowerCase().replace(/\s+/g, '') === "mernmccall")
    
    if (jerryActivated && mernActivated) {
      const jerryIndex = names.findIndex(name => name.toLowerCase().replace(/\s+/g, '') === "jerrymccall")
      const mernIndex = names.findIndex(name => name.toLowerCase().replace(/\s+/g, '') === "mernmccall")
      setIsJerryGame(jerryIndex < mernIndex)
      setIsMernGame(jerryIndex >= mernIndex)
    } else {
      setIsJerryGame(jerryActivated)
      setIsMernGame(mernActivated)
    }
  }, [])

  useEffect(() => {
    if (playerNames.length > 0) {
      checkForSpecialGames(playerNames)
    }
  }, [playerNames, checkForSpecialGames])

  const getDisplayNames = useMemo(() => {
    return playerNames.map(name => {
      const lowerName = name.toLowerCase().replace(/\s+/g, '')
      if (lowerName === "jerrymccall") return "Jerry"
      if (lowerName === "mernmccall") return "Mern"
      return name
    })
  }, [playerNames])

  const resetGame = useCallback(() => {
    setScores(Array(playerNames.length).fill(null).map(() => 
      Array(13).fill(null).map(() => ({ value: null, locked: false }))
    ))
  }, [playerNames.length]);

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
        Reset Game
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
        Exit to Main Screen
      </Button>
    </div>
  )

  if (playerNames.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className={`container mx-auto px-4 py-4 min-h-screen flex flex-col ${
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
          {playerNames.length} Player{playerNames.length > 1 ? 's' : ''} | Round {Math.floor(scores.flat().filter(score => score.locked).length / playerNames.length) + 1}
        </p>
      </div>
      <GameLogic 
        players={getDisplayNames} 
        isJerryGame={isJerryGame} 
        isMernGame={isMernGame}
        scores={scores}
        setScores={setScores}
        onResetGame={resetGame}
        renderNewGameButtons={renderNewGameButtons}
      />
      <footer className="mt-auto pt-8 text-center text-sm text-gray-500">
        <p>Pocket Score © {new Date().getFullYear()} | a pk and dk app</p>
      </footer>
    </div>
  )
}

