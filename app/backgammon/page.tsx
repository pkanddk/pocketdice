"use client"

import React, { useState, useEffect } from "react"
import BackgammonGame from "@/components/backgammon/BackgammonGame"

export default function BackgammonPage() {
  const [playerNames, setPlayerNames] = useState<string[]>(["Player 1", "Player 2"])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const namesParam = params.get('names')
      
      if (namesParam) {
        try {
          const parsedNames = JSON.parse(namesParam)
          if (Array.isArray(parsedNames) && parsedNames.length > 0) {
            console.log("🎲 Backgammon: Names from URL:", parsedNames)
            setPlayerNames(parsedNames)
          }
        } catch (e) {
          console.error("Error parsing names:", e)
        }
      }
    }
  }, [])
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0">
      <BackgammonGame playerNames={playerNames} />
    </main>
  )
} 