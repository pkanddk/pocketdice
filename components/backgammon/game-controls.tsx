"use client"

import { Button } from "@/components/ui/button"
import { Dices, Zap } from "lucide-react"
import { motion } from "framer-motion"

interface GameControlsProps {
  onRollDice: () => void
  onEndTurn: () => void
  diceRolled: boolean
  onStartGame: () => void
  gameStarted: boolean
}

export function GameControls({ onRollDice, onEndTurn, diceRolled, onStartGame, gameStarted }: GameControlsProps) {
  return (
    <motion.div
      className="flex justify-between items-center gap-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {!gameStarted && (
        <Button
          onClick={onStartGame}
          className="rounded-xl px-6 py-6 text-white border bg-green-600 hover:bg-green-700 flex-1"
        >
          Start Game
        </Button>
      )}
      {gameStarted && (
        <>
          <Button
            onClick={onRollDice}
            disabled={diceRolled}
            className="rounded-xl px-6 py-6 text-white border bg-blue-600 hover:bg-blue-700 flex-1"
          >
            <motion.div
              animate={{
                rotate: diceRolled ? 0 : [0, -10, 10, -10, 10, 0],
              }}
              transition={{
                repeat: diceRolled ? 0 : Number.POSITIVE_INFINITY,
                repeatDelay: 3,
                duration: 0.5,
              }}
            >
              <Dices className="mr-2 h-5 w-5" />
            </motion.div>
            Roll Dice
          </Button>

          <Button
            onClick={onEndTurn}
            variant="outline"
            className="rounded-xl px-6 py-6 border bg-gray-600 hover:bg-gray-700 text-white flex-1"
          >
            <Zap className="mr-2 h-5 w-5" />
            End Turn
          </Button>
        </>
      )}
    </motion.div>
  )
} 