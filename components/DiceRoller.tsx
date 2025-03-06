import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DiceIcon } from './DiceIcon'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { MobileDiceRoller } from './MobileDiceRoller'
import { Dice } from './Dice'

interface DiceRollerProps {
  isJerryGame: boolean
  isMernGame: boolean
  onRoll: (diceValues: number[]) => void
  onHold: (index: number) => void
  disabled: boolean
  rollCount: number
  diceValues: number[]
  heldDice: boolean[]
  scoreSelected: boolean
}

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ 
  isJerryGame, 
  isMernGame, 
  onRoll, 
  onHold,
  disabled, 
  rollCount, 
  diceValues, 
  heldDice,
  scoreSelected
}) => {
  const [isRolling, setIsRolling] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const rollDice = useCallback(() => {
    if (rollCount < 3 && !disabled && !scoreSelected) {
      setIsRolling(true);
      const newDiceValues = diceValues.map((value, index) => 
        heldDice[index] ? value : getRandomInt(1, 6)
      );
      setTimeout(() => {
        setIsRolling(false);
        onRoll(newDiceValues);
      }, 500);
    }
  }, [rollCount, heldDice, disabled, scoreSelected, onRoll, diceValues]);

  const toggleHold = (index: number) => {
    if (!isRolling && rollCount > 0 && rollCount <= 3 && !disabled && !scoreSelected) {
      onHold(index);
    }
  };

  const getButtonColor = () => {
    if (isJerryGame) return 'bg-blue-800'
    if (isMernGame) return 'bg-pink-600'
    return 'bg-blue-600'
  }

  if (isMobile) {
    return (
      <MobileDiceRoller
        isJerryGame={isJerryGame}
        isMernGame={isMernGame}
        onRoll={onRoll}
        onHold={onHold}
        disabled={disabled}
        rollCount={rollCount}
        diceValues={diceValues}
        heldDice={heldDice}
        scoreSelected={scoreSelected}
      />
    )
  }

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 text-left font-semibold text-lg flex justify-between items-center ${getButtonColor()} text-white hover:bg-opacity-80 transition-colors duration-300`}
        aria-expanded={isExpanded}
        aria-controls="dice-roller-content"
      >
        Dice Roller
        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="dice-roller-content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-4">
              <div className="grid grid-cols-5 gap-1 py-1 max-w-3xl mx-auto">
                {diceValues.map((value, index) => (
                  <Dice
                    key={index}
                    value={value}
                    isHeld={heldDice[index]}
                    isRolling={isRolling}
                    onClick={() => toggleHold(index)}
                    isJerryGame={isJerryGame}
                    isMernGame={isMernGame}
                  />
                ))}
              </div>
              <div className="mt-4 space-y-4">
                <p className="text-sm sm:text-base text-center">
                  Click on the dice you would like to keep.
                </p>
                <Button 
                  onClick={rollDice} 
                  className={`w-full py-4 sm:py-5 text-lg font-semibold transition-colors duration-300 ${getButtonColor()} text-white rounded-lg`}
                  disabled={isRolling || rollCount >= 3 || disabled || scoreSelected}
                >
                  {isRolling ? 'Rolling...' : 
                   disabled || scoreSelected ? 'Select a score' : 
                   rollCount >= 3 ? 'Select a score' : 
                   `Roll Dice (${rollCount + 1}/3)`}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

