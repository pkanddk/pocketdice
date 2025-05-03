"use client"

import { User, Crown, Circle } from "lucide-react"
import { motion } from "framer-motion"

interface PlayerInfoProps {
  currentPlayer: number
  player1Color: string
  player2Color: string
  playerNames?: string[]
}

export function PlayerInfo({ currentPlayer, player1Color, player2Color, playerNames = [] }: PlayerInfoProps) {
  const player1Name = playerNames[0] || "Player 1"
  const player2Name = playerNames[1] || "Player 2"
  
  return (
    <motion.div
      className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-lg"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${player1Color} ${currentPlayer === 1 ? "scale-110" : "opacity-80"}`}
          animate={{
            scale: currentPlayer === 1 ? [1.05, 1.1, 1.05] : 1,
          }}
          transition={{
            scale: { repeat: currentPlayer === 1 ? Number.POSITIVE_INFINITY : 0, duration: 2 },
          }}
        >
          {currentPlayer === 1 && (
            <Circle className="h-2 w-2 fill-white text-white" />
          )}
        </motion.div>
        <div className="text-base font-bold text-white">{player1Name}</div>
      </div>

      <div className="text-base font-bold text-white/70 mx-2">VS</div>

      <div className="flex items-center gap-2">
        <div className="text-base font-bold text-white">{player2Name}</div>
        <motion.div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${player2Color} ${currentPlayer === 2 ? "scale-110" : "opacity-80"}`}
          animate={{
            scale: currentPlayer === 2 ? [1.05, 1.1, 1.05] : 1,
          }}
          transition={{
            scale: { repeat: currentPlayer === 2 ? Number.POSITIVE_INFINITY : 0, duration: 2 },
          }}
        >
          {currentPlayer === 2 && (
            <Circle className="h-2 w-2 fill-white text-white" />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
} 