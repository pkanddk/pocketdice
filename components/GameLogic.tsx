import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { DiceRoller } from './DiceRoller'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DiceIcon } from './DiceIcon'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ComputerPlayerAI } from './ComputerPlayerAI'
import { motion, AnimatePresence } from 'framer-motion'
import { GameRules } from './GameRules'
import confetti from 'canvas-confetti'

export type DiceValues = number[];

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}

interface GameLogicProps {
  players: string[]
  isJerryGame: boolean
  isMernGame: boolean
  scores: Array<Array<{ value: number | null; locked: boolean }>>
  setScores: React.Dispatch<React.SetStateAction<Array<Array<{ value: number | null; locked: boolean }>>>>
  isSinglePlayer?: boolean
  onResetGame: () => void;
}

const upperCategories = [
  { name: 'ONES', value: 1 },
  { name: 'TWOS', value: 2 },
  { name: 'THREES', value: 3 },
  { name: 'FOURS', value: 4 },
  { name: 'FIVES', value: 5 },
  { name: 'SIXES', value: 6 }
] as const;

const getLowerCategories = (isJerryGame: boolean, isMernGame: boolean) => [
  'Three of a Kind',
  'Four of a Kind',
  isJerryGame || isMernGame ? 'Boat' : 'Full House',
  isJerryGame || isMernGame ? 'Smalls' : 'Small Straight',
  isJerryGame || isMernGame ? 'Biggie' : 'Large Straight',
  'Yahtzee',
  'Chance'
]

const lowerCategoryScores = {
  'Full House': 25,
  'Boat': 25,
  'Small Straight': 30,
  'Smalls': 30,
  'Large Straight': 40,
  'Biggie': 40,
  'Yahtzee': 50
}

// Define a type for the keys that HAVE fixed scores
type LowerCategoryWithFixedScore = keyof typeof lowerCategoryScores;

// Helper function for type guarding
function isFixedLowerCategory(category: string): category is LowerCategoryWithFixedScore {
    return category in lowerCategoryScores;
}

const BONUS_THRESHOLD = 63
const BONUS_AMOUNT = 35


export const GameLogic: React.FC<GameLogicProps> = ({ players, isJerryGame, isMernGame, scores, setScores, isSinglePlayer = false, onResetGame }) => {
  const lowerCategories = useMemo(() => getLowerCategories(isJerryGame, isMernGame), [isJerryGame, isMernGame])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [rollCount, setRollCount] = useState(0)
  const [diceValues, setDiceValues] = useState([1, 1, 1, 1, 1])
  const [heldDice, setHeldDice] = useState<boolean[]>([false, false, false, false, false])
  const [possibleScores, setPossibleScores] = useState<(number | null)[]>([])
  const [showRules, setShowRules] = useState(false)
  const [finalTally, setFinalTally] = useState(false)
  const [showFinalTally, setShowFinalTally] = useState(false)
  const router = useRouter()
  const [isComputerTurn, setIsComputerTurn] = useState(false)
  const [computerAI] = useState(() => new ComputerPlayerAI())
  const [scoreSelected, setScoreSelected] = useState(false)

  const getDisplayNames = useMemo(() => {
    return players.map(name => {
      const lowerName = name.toLowerCase().replace(/\s+/g, '')
      if (lowerName === "jerrymccall") return "Jerry"
      if (lowerName === "mernmccall") return "Mern"
      return name
    })
  }, [players])

  const calculatePossibleScores = useCallback((dice: number[]): (number | null)[] => {
    if (!dice || dice.length === 0) {
      return Array(upperCategories.length + lowerCategories.length).fill(null);
    }

    const newPossibleScores = Array(upperCategories.length + lowerCategories.length).fill(null)

    // Calculate upper section scores
    upperCategories.forEach((category, index) => {
      newPossibleScores[index] = dice.filter(v => v === category.value).reduce((sum, v) => sum + v, 0)
    })

    // Calculate lower section scores
    const counts = dice.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const diceSum = dice.reduce((sum, v) => sum + v, 0)

    newPossibleScores[6] = Object.values(counts).some(count => count >= 3) ? diceSum : 0 // Three of a Kind
    newPossibleScores[7] = Object.values(counts).some(count => count >= 4) ? diceSum : 0 // Four of a Kind
    newPossibleScores[8] = Object.values(counts).includes(3) && Object.values(counts).includes(2) ? 25 : 0 // Full House / Boat

    // Small Straight / Smalls
    const uniqueSorted = Array.from(new Set(dice)).sort((a, b) => a - b);
    newPossibleScores[9] = uniqueSorted.some((_, i) =>
      i <= uniqueSorted.length - 4 &&
      uniqueSorted.slice(i, i + 4).every((n, j) => {
        const prevValue = uniqueSorted[i + j - 1];
        return j === 0 || (prevValue !== undefined && n === prevValue + 1);
      })
    ) ? 30 : 0

    // Large Straight / Biggie
    newPossibleScores[10] = (
      uniqueSorted.length === 5 &&
      uniqueSorted[0] !== undefined &&
      uniqueSorted[4] !== undefined &&
      uniqueSorted[4] - uniqueSorted[0] === 4
    ) ? 40 : 0;

    newPossibleScores[11] = Object.values(counts).some(count => count === 5) ? 50 : 0 // Yahtzee
    newPossibleScores[12] = diceSum // Chance

    return newPossibleScores
  }, [lowerCategories.length])

  const handleRoll = useCallback((newDiceValues: number[]) => {
    setDiceValues(newDiceValues)
    setRollCount(prevCount => prevCount + 1)
    setPossibleScores(calculatePossibleScores(newDiceValues))
  }, [calculatePossibleScores])

  const handleHold = useCallback((index: number) => {
    setHeldDice(prev => {
      const newHeldDice = [...prev]
      newHeldDice[index] = !newHeldDice[index]
      return newHeldDice
    })
  }, [])

  const nextTurn = useCallback(() => {
    setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length)
    setRollCount(0)
    setDiceValues([1, 1, 1, 1, 1])
    setHeldDice([false, false, false, false, false])
    setPossibleScores([])
    setScoreSelected(false)
  }, [players.length])

  const selectScore = useCallback((categoryIndex: number) => {
    const currentPlayerScores = scores[currentPlayer];
    const scoreToTake = (categoryIndex >= 0 && categoryIndex < possibleScores.length) ? possibleScores[categoryIndex] : undefined;

    if (
      rollCount > 0 &&
      scoreToTake !== null && scoreToTake !== undefined &&
      currentPlayerScores && 
      categoryIndex >= 0 && categoryIndex < currentPlayerScores.length && 
      currentPlayerScores[categoryIndex] && 
      !currentPlayerScores[categoryIndex].locked
    ) {
      setScores(prevScores => {
        const newScores = [...prevScores];
        const targetPlayerScores = newScores[currentPlayer];
        if (targetPlayerScores && categoryIndex >= 0 && categoryIndex < targetPlayerScores.length) {
          const updatedPlayerScores = [...targetPlayerScores];
          updatedPlayerScores[categoryIndex] = { value: scoreToTake as number, locked: true }; 
          newScores[currentPlayer] = updatedPlayerScores;
        }
        return newScores;
      });
      setScoreSelected(true);
      setRollCount(0);
      setDiceValues([1, 1, 1, 1, 1]);
      setHeldDice([false, false, false, false, false]);
      setPossibleScores([])
      nextTurn()
    }
  }, [rollCount, possibleScores, scores, currentPlayer, setScores, nextTurn])

  const calculateUpperTotal = useCallback((playerIndex: number) => {
    const playerScores = scores[playerIndex];
    if (!playerScores) return 0; // Guard against undefined player scores array
    return upperCategories.reduce((sum, _, index) => {
      const scoreEntry = playerScores[index];
      return sum + (scoreEntry?.value || 0); // Use optional chaining for scoreEntry
    }, 0);
  }, [scores])

  const calculateBonus = useCallback((upperTotal: number) => {
    return upperTotal >= BONUS_THRESHOLD ? BONUS_AMOUNT : 0
  }, [])

  const calculateLowerTotal = useCallback((playerIndex: number) => {
    const playerScores = scores[playerIndex];
    if (!playerScores) return 0; // Guard against undefined player scores array
    return lowerCategories.reduce((sum, _, index) => {
      const scoreEntry = playerScores[upperCategories.length + index];
      return sum + (scoreEntry?.value || 0); // Use optional chaining for scoreEntry
    }, 0);
  }, [scores, lowerCategories])

  const playerTotals = useMemo(() => players.map((_, playerIndex) => {
    const upperTotal = calculateUpperTotal(playerIndex)
    const bonus = calculateBonus(upperTotal)
    const lowerTotal = calculateLowerTotal(playerIndex)
    return {
      upperTotal,
      bonus,
      upperTotalWithBonus: upperTotal + bonus,
      lowerTotal,
      grandTotal: upperTotal + bonus + lowerTotal,
      pointsToBonus: Math.max(0, BONUS_THRESHOLD - upperTotal),
      pointsOverBonus: Math.max(0, upperTotal - BONUS_THRESHOLD)
    }
  }), [players, calculateUpperTotal, calculateBonus, calculateLowerTotal])

  const handleFinalTally = useCallback(() => {
    setFinalTally(true)
    setShowFinalTally(true)
    triggerConfetti()
  }, [])

  const resetGame = useCallback(() => {
    setScores(Array(players.length).fill(null).map(() => 
      Array(upperCategories.length + lowerCategories.length).fill({ value: null, locked: false })
    ));
    setCurrentPlayer(0);
    setRollCount(0);
    setDiceValues([1, 1, 1, 1, 1]);
    setHeldDice([false, false, false, false, false]);
    setPossibleScores([]);
    setScoreSelected(false);
    setFinalTally(false);
    setShowFinalTally(false);
    if (typeof onResetGame === 'function') {
      onResetGame();
    }
  }, [players.length, lowerCategories.length, setScores, onResetGame]);

  const isGameComplete = useCallback(() => {
    return Array.isArray(scores) && scores.length > 0 && scores.every(playerScores =>
      Array.isArray(playerScores) && playerScores.every(score => score && score.locked)
    )
  }, [scores])

  const handleComputerTurn = useCallback(() => {
    if (!computerAI) return

    setIsComputerTurn(true)
    let remainingRolls = 3
    let currentDiceValues = [...diceValues]
    let keptDice = [...heldDice]

    const rollDice = () => {
      if (remainingRolls > 0) {
        currentDiceValues = currentDiceValues.map((value, index) =>
          keptDice[index] ? value : Math.floor(Math.random() * 6) + 1
        )
        setDiceValues(currentDiceValues)
        setRollCount(3 - remainingRolls + 1)
        remainingRolls--

        if (remainingRolls > 0) {
          keptDice = computerAI.decideDiceToKeep(currentDiceValues)
          setHeldDice(keptDice)
          setTimeout(rollDice, 1000)
        } else {
          endTurn()
        }
      } else {
        endTurn()
      }
    }

    const endTurn = () => {
      const possibleScores = calculatePossibleScores(currentDiceValues)
      const currentPlayerScores = scores[currentPlayer]

      if (!currentPlayerScores) {
        console.error(`Computer turn error: No scores array found for player index ${currentPlayer}`)
        setIsComputerTurn(false)
        return
      }

      const availableCategories = currentPlayerScores.map((score, index) =>
        score.locked ? null : index
      ).filter((index): index is number => index !== null)

      const categoryNames: string[] = [
        ...upperCategories.map(cat => cat.name),
        ...lowerCategories
      ]

      const availableCategoryNames = availableCategories
        .map(index => categoryNames[index])
        .filter((name): name is string => name !== undefined)

      const selectedCategory = computerAI.decideCategory(
        availableCategoryNames,
        availableCategories.map(index => possibleScores[index] || 0)
      )
      const selectedCategoryIndex = categoryNames.indexOf(selectedCategory)

      if (selectedCategoryIndex < 0) {
        console.error(`Computer turn error: Category '${selectedCategory}' not found in categoryNames.`)
        setIsComputerTurn(false)
        return
      }

      setScores(prevScores => {
        const newScores = [...prevScores]
        const targetPlayerScores = newScores[currentPlayer]

        if (!targetPlayerScores) {
          console.error(`Computer turn error: targetPlayerScores is undefined for player index ${currentPlayer} inside setScores.`)
          return prevScores
        }

        const updatedPlayerScores = [...targetPlayerScores]
        
        updatedPlayerScores[selectedCategoryIndex] = {
          value: possibleScores[selectedCategoryIndex] ?? 0,
          locked: true
        }
        newScores[currentPlayer] = updatedPlayerScores
        return newScores
      })

      setIsComputerTurn(false)
      nextTurn()
    }

    rollDice()
  }, [computerAI, currentPlayer, diceValues, heldDice, calculatePossibleScores, nextTurn, scores, setScores, lowerCategories])

  useEffect(() => {
    if (isSinglePlayer && currentPlayer === 1 && !isComputerTurn) {
      handleComputerTurn()
    }
  }, [isSinglePlayer, currentPlayer, isComputerTurn, handleComputerTurn])

  useEffect(() => {
    if (scoreSelected) {
      setScoreSelected(false)
    }
  }, [currentPlayer, scoreSelected])

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
        New Game (Same Players)
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
        Reset Game (New Players)
      </Button>
    </div>
  )

  if (!Array.isArray(scores)) {
    console.error('Scores is not an array:', scores)
    return null
  }

  return (
    <div className={`container mx-auto px-2 sm:px-4 py-2 sm:py-4 min-h-screen relative z-0 ${
      isJerryGame ? 'bg-gray-900 text-white' :
        isMernGame ? 'bg-white text-pink-900' :
          'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      {isSinglePlayer && (
        <p className="text-center mb-6 text-lg">
          Single Player vs Computer | Round {Math.floor(scores.reduce((total, playerScores) => total + (Array.isArray(playerScores) ? playerScores.filter(score => score && score.locked).length : 0), 0) / 2) + 1}
        </p>
      )}
      <div className={`${
        isJerryGame ? 'bg-gray-800' :
          isMernGame ? 'bg-white' :
            'bg-white'
      } shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border ${
        isJerryGame ? 'border-gray-700' :
          isMernGame ? 'border-pink-300' :
            'border-gray-100'
      } mb-4 mt-0`}>
        <DiceRoller
          isJerryGame={isJerryGame}
          isMernGame={isMernGame}
          onRoll={handleRoll}
          onHold={handleHold}
          disabled={rollCount >= 3 || scoreSelected}
          rollCount={rollCount}
          diceValues={diceValues}
          heldDice={heldDice}
          scoreSelected={scoreSelected}
        />
      </div>
      <div className={`${
        isJerryGame ? 'bg-gray-800' :
          isMernGame ? 'bg-white' :
            'bg-white'
      } shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border ${
        isJerryGame ? 'border-gray-700' :
          isMernGame ? 'border-pink-300' :
            'border-gray-100'
      } mt-2`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="relative z-10">
              <tr className={`${isJerryGame ? 'bg-blue-800' : isMernGame ? 'bg-pink-600' : 'bg-blue-600'} ${isMernGame ? 'text-pink-900' : 'text-white'}`}>
                <th className={`p-2 sm:p-4 text-left sticky left-0 z-10 min-w-[120px] sm:min-w-[200px] ${isJerryGame ? 'bg-blue-800' : isMernGame ? 'bg-pink-600' : 'bg-blue-600'}`}>
                  <Button
                    onClick={() => setShowRules(!showRules)}
                    variant="ghost"
                    className={`w-full p-4 text-left font-semibold text-lg flex justify-between items-center text-white hover:bg-red-600 hover:text-white transition-colors duration-300 ${showRules ? 'bg-red-600' : ''}`}
                  >
                    Game Rules
                    {showRules ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </Button>
                </th>
                {getDisplayNames.map((player, index) => (
                  <th key={index} className={`p-2 sm:p-4 text-center font-mono text-lg min-w-[80px] sm:min-w-[120px] ${
                    index === currentPlayer
                      ? isJerryGame
                        ? 'bg-gray-700 text-white'
                        : 'bg-red-600 text-white'
                      : isMernGame
                        ? 'bg-pink-600 text-white'
                        : isJerryGame
                          ? 'bg-gray-700 text-white'
                          : 'bg-blue-600 text-white'
                  }`}>
                    {player}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono relative z-0">
              <AnimatePresence>
                {showRules && (
                  <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-20"
                  >
                    <td colSpan={players.length + 1} className="p-0">
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden rounded-lg shadow-md bg-white"
                      >
                        <div className="p-4">
                          <GameRules isJerryGame={isJerryGame} isMernGame={isMernGame} />
                        </div>
                      </motion.div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
              {upperCategories.map((category, categoryIndex) => (
                <tr key={categoryIndex} className={`border-b ${
                  isJerryGame ? 'border-gray-700' :
                    isMernGame ? 'border-pink-100' :
                      'border-gray-200'
                } transition-colors duration-150`}>
                  <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 flex items-center justify-between ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-white text-gray-800' : 'bg-white text-gray-700'}`}>
                    <span>{category.name}</span>
                    <DiceIcon number={category.value} className={`ml-2 ${isJerryGame ? 'text-blue-400' : isMernGame ? 'text-pink-600' : 'text-blue-600'} w-6 h-6`} />
                  </td>
                  {players.map((_, playerIndex) => (
                    <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
                      <div className="w-16 sm:w-24 mx-auto">
                        {playerIndex === currentPlayer && rollCount > 0 && possibleScores[categoryIndex] !== null && !scores[playerIndex]?.[categoryIndex]?.locked ? (
                          <Button
                            onClick={() => selectScore(categoryIndex)}
                            className={`w-full py-2 text-lg font-semibold ${
                              isJerryGame
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : isMernGame
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {possibleScores[categoryIndex]}
                          </Button>
                        ) : (
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={scores[playerIndex]?.[categoryIndex]?.value ?? ''}
                            readOnly
                            className={`w-full text-center text-lg ${
                              scores[playerIndex]?.[categoryIndex] !== null
                                ? isJerryGame
                                  ? 'bg-blue-900 border-blue-700 text-white'
                                  : isMernGame
                                    ? 'bg-white border-pink-200 text-gray-800'
                                    : 'bg-blue-100 border-blue-300 text-blue-900'
                                : isJerryGame
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : isMernGame
                                    ? 'bg-white border-pink-200 text-gray-800'
                                    : 'bg-gray-50 border-gray-300'
                            } rounded-md`}
                          />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={`${
                isJerryGame ? 'bg-gray-700' :
                  isMernGame ? 'bg-pink-50' :
                    'bg-gray-100'
              } border-b ${
                isJerryGame ? 'border-gray-600' :
                  isMernGame ? 'border-pink-200' :
                    'border-gray-200'
              }`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Upper Section Total</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
                    {playerTotals?.[playerIndex]?.upperTotal}
                  </td>
                ))}
              </tr>
              <tr className={`${
                isJerryGame ? 'bg-gray-700' :
                  isMernGame ? 'bg-pink-50' :
                    'bg-gray-100'
              } border-b ${
                isJerryGame ? 'border-gray-600' :
                  isMernGame ? 'border-pink-200' :
                    'border-gray-200'
              }`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Bonus (63+ = 35)</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''} ${isJerryGame ? 'text-white' : ''}`}>
                    <span className="font-bold text-lg">{playerTotals?.[playerIndex]?.bonus}</span>
                    {playerTotals?.[playerIndex]?.bonus === 0 ? (
                      <span className={`text-${isJerryGame ? 'gray-300' : isMernGame ? 'pink-700' : 'red-500'} ml-1 sm:ml-2 text-base block sm:inline`}>
                        ({playerTotals?.[playerIndex]?.pointsToBonus} to go)
                      </span>
                    ) : (
                      <span className={`text-${isJerryGame ? 'gray-300' : isMernGame ? 'pink-600' : 'green-500'} ml-1 sm:ml-2 text-base block sm:inline`}>
                        (+{playerTotals?.[playerIndex]?.pointsOverBonus})
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className={`${
                isJerryGame ? 'bg-gray-700' :
                  isMernGame ? 'bg-pink-50' :
                    'bg-gray-100'
              } border-b ${
                isJerryGame ? 'border-gray-600' :
                  isMernGame ? 'border-pink-200' :
                    'border-gray-200'
              }`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Upper Section Total (with bonus)</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
                    {playerTotals?.[playerIndex]?.upperTotalWithBonus}
                  </td>
                ))}
              </tr>
              {lowerCategories.map((category, categoryIndex) => (
                <tr key={categoryIndex} className={`border-b ${
                  isJerryGame ? 'border-gray-700' :
                    isMernGame ? 'border-pink-100' :
                      'border-gray-200'
                } transition-colors duration-150`}>
                  <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-white text-gray-800' : 'bg-white text-gray-700'}`}>
                    {category}
                    {isFixedLowerCategory(category) && lowerCategoryScores[category] && (
                      <span className={`ml-2 text-base ${isJerryGame ? 'text-gray-300' : isMernGame ? 'text-pink-700' : 'text-gray-400'}`}>
                        ({lowerCategoryScores[category]} points)
                      </span>
                    )}
                  </td>
                  {players.map((_, playerIndex) => (
                    <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
                      <div className="w-16 sm:w-24 mx-auto">
                        {playerIndex === currentPlayer && rollCount > 0 && possibleScores[upperCategories.length + categoryIndex] !== null && !scores[playerIndex][upperCategories.length + categoryIndex].locked ? (
                          <Button
                            onClick={() => selectScore(upperCategories.length + categoryIndex)}
                            className={`w-full py-2 text-lg font-semibold ${
                              isJerryGame
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : isMernGame
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {possibleScores[upperCategories.length + categoryIndex]}
                          </Button>
                        ) : (
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={scores?.[playerIndex]?.[upperCategories.length + categoryIndex]?.value ?? ''}
                            readOnly
                            className={`w-full text-center text-lg ${
                              (scores?.[playerIndex]?.[upperCategories.length + categoryIndex]?.value !== null && 
                               scores?.[playerIndex]?.[upperCategories.length + categoryIndex]?.value !== undefined)
                                ? isJerryGame ? 'bg-blue-900 border-blue-700 text-white' : isMernGame ? 'bg-white border-pink-200 text-gray-800' : 'bg-blue-100 border-blue-300 text-blue-900'
                                : isJerryGame ? 'bg-gray-700 border-gray-600 text-white' : isMernGame ? 'bg-white border-pink-200 text-gray-800' : 'bg-gray-50 border-gray-300'
                            } rounded-md`}
                          />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={`${
                isJerryGame ? 'bg-gray-700' :
                  isMernGame ? 'bg-pink-50' :
                    'bg-gray-100'
              } border-b ${
                isJerryGame ? 'border-gray-600' :
                  isMernGame ? 'border-pink-200' :
                    'border-gray-200'
              }`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Lower Section Total</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
                    {playerTotals?.[playerIndex]?.lowerTotal}
                  </td>
                ))}
              </tr>
              <tr className={`${
                isJerryGame ? 'bg-gray-700' :
                  isMernGame ? 'bg-pink-50' :
                    'bg-gray-100'
              } border-b ${
                isJerryGame ? 'border-gray-600' :
                  isMernGame ? 'border-pink-200' :
                    'border-gray-200'
              }`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Final Tally</td>
                <td colSpan={players.length} className="p-2 sm:p-4 text-center">
                  <Button
                    onClick={handleFinalTally}
                    disabled={!isGameComplete() || finalTally}
                    className={`w-full sm:w-auto ${
                      isJerryGame ? 'bg-blue-800 hover:bg-blue-900' :
                        isMernGame ? 'bg-blue-600 hover:bg-blue-700' :
                          'bg-blue-600 hover:bg-blue-700'
                    } text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg`}
                  >
                    Final Tally
                  </Button>
                </td>
              </tr>
              <tr className={`${
                isJerryGame ? 'bg-gray-700' :
                  isMernGame ? 'bg-pink-50' :
                    'bg-gray-100'
              } border-b ${
                isJerryGame ? 'border-gray-600' :
                  isMernGame ? 'border-pink-200' :
                    'border-gray-200'
              }`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Grand Total</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
                    {finalTally ? playerTotals?.[playerIndex]?.grandTotal : '?'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {renderNewGameButtons()}
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-300">
          <p className={`text-center ${isJerryGame ? 'text-gray-400' : isMernGame ? 'text-pink-600' : 'text-gray-500'} text-base`}>
            Pocket Score © {new Date().getFullYear()} | a pk and dk app
          </p>
        </div>
      </div>
      {showFinalTally && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onAnimationComplete={() => triggerConfetti()}
            className={`relative p-6 rounded-2xl shadow-xl max-w-xl w-full mx-4 ${
              isJerryGame ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h2 className="text-xl font-bold mb-4 text-center">Game Over!</h2>
            <div className={`flex items-center justify-center gap-2 mb-6 ${
              isJerryGame ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <p className="text-lg font-semibold">
                {getDisplayNames[playerTotals?.reduce((maxIndex, current, index, array) =>
                  current.grandTotal > (array?.[maxIndex]?.grandTotal ?? -Infinity) ? index : maxIndex
                , 0) ?? 0]} wins with {Math.max(...playerTotals?.map(p => p.grandTotal) ?? [0])} points!
              </p>
            </div>
            <div className="space-y-2 mb-6">
              {getDisplayNames.map((player, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded ${
                    (playerTotals?.[index]?.grandTotal ?? -1) === Math.max(...playerTotals?.map(p => p.grandTotal) ?? [0])
                      ? isJerryGame ? 'bg-blue-900/50' : 'bg-blue-100'
                      : ''
                  }`}
                >
                  <span className="text-lg">
                    {(playerTotals?.[index]?.grandTotal ?? -1) === Math.max(...playerTotals?.map(p => p.grandTotal) ?? [0]) && '🏆 '}
                    {player}
                  </span>
                  <span className="font-mono font-bold text-lg">{playerTotals?.[index]?.grandTotal}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowFinalTally(false)}
              className={`w-full ${
                isJerryGame
                  ? 'bg-blue-700 hover:bg-blue-800'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-full text-lg`}
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}
      {isComputerTurn && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className={`bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4 ${
                isJerryGame ? 'bg-blue-900 text-white' :
                  isMernGame ? 'bg-pink-100 text-pink-900' :
                    'bg-white text-gray-900'
              }`}
            >
              <h2 className="text-2xl font-bold mb-4 text-center">Computer&apos;s Turn</h2>
              <div className="flex justify-center items-center space-x-4">
                {[1, 2, 3].map((die) => (
                  <motion.div
                    key={die}
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                    className={`w-12 h-12 ${
                      isJerryGame ? 'text-blue-400' :
                        isMernGame ? 'text-pink-400' :
                          'text-blue-600'
                    }`}
                  >
                    <DiceIcon number={die as 1 | 2 | 3} />
                  </motion.div>
                ))}
              </div>
              <p className="mt-4 text-center text-lg">Calculating best move...</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

