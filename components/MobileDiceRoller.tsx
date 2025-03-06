import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { X } from 'lucide-react'

interface MobileDiceRollerProps {
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

const getDotPosition = (value: number, index: number): { top: string, left: string } => {
  const positions = {
    1: [{ top: '50%', left: '50%' }],
    2: [{ top: '30%', left: '70%' }, { top: '70%', left: '30%' }],
    3: [{ top: '30%', left: '70%' }, { top: '50%', left: '50%' }, { top: '70%', left: '30%' }],
    4: [{ top: '30%', left: '30%' }, { top: '30%', left: '70%' }, { top: '70%', left: '30%' }, { top: '70%', left: '70%' }],
    5: [{ top: '30%', left: '30%' }, { top: '30%', left: '70%' }, { top: '50%', left: '50%' }, { top: '70%', left: '30%' }, { top: '70%', left: '70%' }],
    6: [{ top: '30%', left: '30%' }, { top: '30%', left: '70%' }, { top: '50%', left: '30%' }, { top: '50%', left: '70%' }, { top: '70%', left: '30%' }, { top: '70%', left: '70%' }],
  };
  return positions[value as keyof typeof positions][index];
};

export const MobileDiceRoller: React.FC<MobileDiceRollerProps> = ({ 
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
  const [isOpen, setIsOpen] = useState(false)
  const [allDiceHeld, setAllDiceHeld] = useState(false);

  useEffect(() => {
    if (scoreSelected) {
      setAllDiceHeld(false);
      setIsOpen(false);
    }
  }, [scoreSelected]);

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
      const newHeldDice = [...heldDice];
      newHeldDice[index] = !newHeldDice[index];
      onHold(index);
      setAllDiceHeld(newHeldDice.every(held => held));
    }
  };

  const getButtonColor = () => {
    if (isJerryGame) return 'bg-blue-600 hover:bg-blue-700'
    if (isMernGame) return 'bg-pink-500 hover:bg-pink-600'
    return 'bg-blue-500 hover:bg-blue-600'
  }

  const getDiceColor = (isHeld: boolean) => {
    return isHeld ? 'bg-blue-600' : 'bg-blue-400';
  }

  const handleTakeScore = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className={`w-full py-4 text-lg font-semibold transition-colors duration-300 ${getButtonColor()} text-white rounded-lg`}
        disabled={disabled || scoreSelected}
      >
        {rollCount === 0 ? 'Roll Dice' : 'Mobile Dice Roller'}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-transparent border-none shadow-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`relative p-6 rounded-2xl ${
                  isJerryGame ? 'bg-gray-800' : 
                  isMernGame ? 'bg-pink-100' : 
                  'bg-white'
                }`}
                style={{
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <DialogHeader className="mb-4 relative">
                  <DialogTitle className={`text-2xl font-bold ${
                    isJerryGame ? 'text-blue-400' : 
                    isMernGame ? 'text-pink-600' : 
                    'text-gray-800'
                  }`}>
                    Mobile Dice Roller
                  </DialogTitle>
                  <DialogDescription className={`${
                    isJerryGame ? 'text-gray-400' : 
                    isMernGame ? 'text-pink-700' : 
                    'text-gray-600'
                  }`}>
                    Tap on the dice you want to hold, then roll again.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 py-4">
                  {diceValues.map((value, index) => (
                    <motion.div
                      key={index}
                      animate={isRolling && !heldDice[index] ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 0.5 }}
                      onClick={() => toggleHold(index)}
                      className={`cursor-pointer p-2 rounded-lg ${
                        heldDice[index] ? 'ring-2 ring-yellow-400' : ''
                      } transition-all duration-200 flex items-center justify-center`}
                    >
                      <motion.div 
                        className={`w-20 h-20 ${
                          heldDice[index] 
                            ? isJerryGame 
                              ? 'bg-blue-600' 
                              : isMernGame 
                                ? 'bg-pink-600' 
                                : 'bg-blue-600'
                            : isJerryGame 
                              ? 'bg-blue-500' 
                              : isMernGame 
                                ? 'bg-pink-500' 
                                : 'bg-blue-500'
                        } rounded-xl shadow-lg flex items-center justify-center relative`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(value)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2.5 h-2.5 rounded-full bg-white absolute transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                ...getDotPosition(value, i)
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={rollDice} 
                    className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${getButtonColor()} text-white rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1`}
                    disabled={isRolling || rollCount >= 3 || disabled || scoreSelected}
                  >
                    {isRolling ? 'Rolling...' : 
                     disabled || scoreSelected ? 'Select a score' : 
                     rollCount >= 3 ? 'Select a score' : 
                     `Roll Dice (${rollCount + 1}/3)`}
                  </Button>
                  <Button 
                    onClick={handleTakeScore} 
                    className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                      rollCount === 3 ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1`}
                    disabled={rollCount === 0 || scoreSelected}
                  >
                    Take Your Score
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}

