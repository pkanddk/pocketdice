import React from 'react'
import { motion } from 'framer-motion'
import { DiceIcon } from './DiceIcon'

interface DiceProps {
  value: number
  isHeld: boolean
  isRolling: boolean
  onClick: () => void
  isJerryGame: boolean
  isMernGame: boolean
}

export const Dice: React.FC<DiceProps> = ({ value, isHeld, isRolling, onClick, isJerryGame, isMernGame }) => {
  const getDiceColor = (isHeld: boolean) => {
    if (isHeld) {
      return isJerryGame ? 'text-red-400' : isMernGame ? 'text-red-500' : 'text-red-600'
    }
    return isJerryGame ? 'text-blue-400' : isMernGame ? 'text-pink-600' : 'text-blue-600'
  }

  return (
    <motion.div
      animate={isRolling && !isHeld ? { rotate: 360 } : { rotate: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className={`cursor-pointer p-0.5 rounded-lg touch-manipulation ${
        isHeld ? 'bg-opacity-20 bg-gray-400' : 'hover:bg-opacity-10 hover:bg-gray-400'
      } transition-colors duration-200 flex items-center justify-center`}
      role="button"
      aria-pressed={isHeld}
      aria-label={`Dice with value ${value}${isHeld ? ', held' : ''}`}
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <DiceIcon 
        number={value as 1 | 2 | 3 | 4 | 5 | 6} 
        className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 ${getDiceColor(isHeld)}`}
      />
    </motion.div>
  )
}

