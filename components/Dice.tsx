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
  sizeVariant?: 'default' | 'farkle'
}

export const Dice: React.FC<DiceProps> = ({ value, isHeld, isRolling, onClick, isJerryGame, isMernGame, sizeVariant = 'default' }) => {
  const getDiceColor = (isHeldParam: boolean) => {
    if (isHeldParam) {
      return isJerryGame ? 'text-red-400' : isMernGame ? 'text-red-500' : 'text-red-600'
    }
    return isJerryGame ? 'text-blue-400' : isMernGame ? 'text-pink-600' : 'text-blue-600'
  }

  let diceIconSizeClasses = '';
  if (sizeVariant === 'farkle') {
    diceIconSizeClasses = 'w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16';
  } else {
    diceIconSizeClasses = 'w-16 h-16 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24';
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
        className={`${diceIconSizeClasses} ${getDiceColor(isHeld)}`}
      />
    </motion.div>
  )
}

