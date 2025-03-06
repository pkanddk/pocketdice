"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface GameData {
  date: string
  players: string[]
  scores: number[]
}

export default function HistoryPage() {
  const [gameHistory, setGameHistory] = useState<GameData[]>([])

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('yahtzeeHistory') || '[]')
    setGameHistory(history)
  }, [])

  return (
    <div className="container mx-auto px-4 py-12 bg-gradient-to-b from-gray-50 to-white min-h-screen flex flex-col">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Game History</h1>
        <p className="text-xl text-gray-600 mt-2">Pocket Score</p>
      </div>
      {gameHistory.length === 0 ? (
        <p className="text-center">No games played yet.</p>
      ) : (
        <div className="space-y-6 flex-grow">
          {gameHistory.map((game, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold mb-2">
                Game {gameHistory.length - index} - {new Date(game.date).toLocaleDateString()}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {game.players.map((player, playerIndex) => (
                  <div key={playerIndex} className="flex justify-between">
                    <span>{player}:</span>
                    <span className="font-bold">{game.scores[playerIndex]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-10 text-center">
        <Link href="/">
          <Button className="rounded-full px-8 py-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-300">Back to Home</Button>
        </Link>
      </div>
      <footer className="mt-auto pt-8 text-center text-sm text-gray-500">
        <p>Pocket Score © {new Date().getFullYear()} | a pk and dk app</p>
      </footer>
    </div>
  )
}

