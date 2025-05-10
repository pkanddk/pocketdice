"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DiceIcon } from './DiceIcon'
import { GameRules } from './GameRules'
import { Logo } from './Logo'
import { JerryLogo } from './JerryLogo'
import { MernLogo } from './MernLogo'
import { DiceRoller } from './DiceRoller'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { UniversalFooter } from "@/components/common/UniversalFooter";

interface ScoreSheetProps {
  players: string[]
  onEndGame: (scores: number[]) => void
  isJerryGame: boolean
  isMernGame: boolean
}

const upperCategories = [
  { name: 'ONES', value: 1 },
  { name: 'TWOS', value: 2 },
  { name: 'THREES', value: 3 },
  { name: 'FOURS', value: 4 },
  { name: 'FIVES', value: 5 },
  { name: 'SIXES', value: 6 }
]

const getLowerCategories = (isJerryGame: boolean) => [
  'Three of a Kind',
  'Four of a Kind',
  isJerryGame ? 'Boat' : 'Full House',
  isJerryGame ? 'Smalls' : 'Small Straight',
  isJerryGame ? 'Biggie' : 'Large Straight',
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

const BONUS_THRESHOLD = 63
const BONUS_AMOUNT = 35

export default function ScoreSheet({ players, onEndGame, isJerryGame, isMernGame }: ScoreSheetProps) {
  const lowerCategories = getLowerCategories(isJerryGame)
  const [scores, setScores] = useState<number[][]>(
    Array(players.length).fill(null).map(() => Array(upperCategories.length + lowerCategories.length).fill(null))
  )
  const [finalTally, setFinalTally] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showFinalTally, setShowFinalTally] = useState(false)
  const router = useRouter()

  const calculateUpperTotal = (playerIndex: number) => {
    return upperCategories.reduce((sum, _, index) => sum + (scores[playerIndex][index] || 0), 0)
  }

  const calculateBonus = (upperTotal: number) => {
    return upperTotal >= BONUS_THRESHOLD ? BONUS_AMOUNT : 0
  }

  const calculateLowerTotal = (playerIndex: number) => {
    return lowerCategories.reduce((sum, _, index) => sum + (scores[playerIndex][upperCategories.length + index] || 0), 0)
  }

  const playerTotals = useMemo(() => {
    return players.map((_, playerIndex) => {
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
    })
  }, [scores, players])

  const handleScoreChange = (playerIndex: number, categoryIndex: number, value: string) => {
    if (/^\d*$/.test(value)) {
      const newScores = [...scores];
      newScores[playerIndex][categoryIndex] = value === '' ? null : parseInt(value);
      setScores(newScores);
    }
  };

  const isGameComplete = () => {
    return scores.every(playerScores => playerScores.every(score => score !== null))
  }

  const handleFinalTally = () => {
    setFinalTally(true)
    setShowFinalTally(true)
    onEndGame(playerTotals.map(p => p.grandTotal))
  }

  const resetGame = () => {
    setScores(Array(players.length).fill(null).map(() => Array(upperCategories.length + lowerCategories.length).fill(null)))
    setFinalTally(false)
    setShowFinalTally(false)
  }

  const winnerIndex = playerTotals.reduce((maxIndex, current, index, array) => 
    current.grandTotal > (array[maxIndex]?.grandTotal ?? -Infinity) ? index : maxIndex, 0)

  return (
    <div className={`container mx-auto px-2 sm:px-4 py-6 sm:py-12 min-h-screen ${
      isJerryGame ? 'bg-gray-900 text-white' : 
      isMernGame ? 'bg-white text-pink-900' : 
      'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className="mb-6">
        {isJerryGame ? (
          <div className="text-blue-300">
            <JerryLogo />
          </div>
        ) : isMernGame ? (
          <div className="text-pink-500">
            <MernLogo />
          </div>
        ) : (
          <Logo />
        )}
      </div>
      <div className="mb-6">
        <DiceRoller isJerryGame={isJerryGame} isMernGame={isMernGame} />
      </div>
      <div>
        {showRules && (
          <div>
            <GameRules isJerryGame={isJerryGame} isMernGame={isMernGame} />
          </div>
        )}
      </div>
      <div className={`${
        isJerryGame ? 'bg-gray-800' : 
        isMernGame ? 'bg-white' : 
        'bg-white'
      } shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border ${
        isJerryGame ? 'border-gray-700' : 
        isMernGame ? 'border-pink-300' : 
        'border-gray-100'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={`${isJerryGame ? 'bg-blue-800' : isMernGame ? 'bg-pink-600' : 'bg-blue-600'} text-white`}>
                <th className={`p-2 sm:p-4 text-left sticky left-0 z-10 min-w-[120px] sm:min-w-[200px] ${isJerryGame ? 'bg-blue-800' : isMernGame ? 'bg-pink-600' : 'bg-blue-600'}`}>
                  <Button
                    onClick={() => setShowRules(!showRules)}
                    variant="ghost"
                    className="text-white hover:text-blue-200 font-semibold py-1 px-2 rounded-full transition duration-300 flex items-center space-x-2 text-lg"
                  >
                    {showRules ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Hide Rules</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Game Rules</span>
                      </>
                    )}
                  </Button>
                </th>
                {players.map((player, index) => (
                  <th key={index} className={`p-2 sm:p-4 text-center font-mono text-lg min-w-[80px] sm:min-w-[120px]`}>
                    {player}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {upperCategories.map((category, categoryIndex) => (
                <tr key={categoryIndex} className={`border-b ${isJerryGame ? 'border-gray-700 hover:bg-gray-700' : isMernGame ? 'border-pink-200 hover:bg-pink-50' : 'border-gray-200 hover:bg-gray-50'} transition-colors duration-150`}>
                  <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 flex items-center justify-between ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-pink-200 text-pink-900' : 'bg-white text-gray-700'}`}>
                    <span>{category.name}</span>
                    <DiceIcon number={category.value} className={`ml-2 ${isJerryGame ? 'text-blue-400' : isMernGame ? 'text-pink-600' : 'text-blue-600'} w-6 h-6`} />
                  </td>
                  {players.map((_, playerIndex) => (
                    <td key={playerIndex} className="p-2 sm:p-4 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        value={scores[playerIndex][categoryIndex] ?? ''}
                        onChange={(e) => handleScoreChange(playerIndex, categoryIndex, e.target.value)}
                        className={`w-16 sm:w-24 text-center text-lg ${
                          isJerryGame 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500' 
                            : isMernGame
                            ? 'bg-white border-pink-300 text-pink-900 focus:border-pink-500 focus:ring-pink-500'
                            : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } rounded-md`}
                        disabled={finalTally}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-white' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-white text-pink-900' : 'bg-gray-100 text-gray-700'} text-lg`}>Upper Section Total</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg`}>
                    {playerTotals[playerIndex].upperTotal}
                  </td>
                ))}
              </tr>
              <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-white' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-white text-pink-900' : 'bg-gray-100 text-gray-700'} text-lg`}>Bonus (63+ = 35)</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center ${isJerryGame ? 'text-white' : ''}`}>
                    <span className="font-bold text-lg">{playerTotals[playerIndex].bonus}</span>
                    {playerTotals[playerIndex].bonus === 0 ? (
                      <span className={`text-${isJerryGame ? 'gray-300' : isMernGame ? 'pink-700' : 'red-500'} ml-1 sm:ml-2 text-base block sm:inline`}>
                        ({playerTotals[playerIndex].pointsToBonus} to go)
                      </span>
                    ) : (
                      <span className={`text-${isJerryGame ? 'gray-300' : isMernGame ? 'pink-600' : 'green-500'} ml-1 sm:ml-2 text-base block sm:inline`}>
                        (+{playerTotals[playerIndex].pointsOverBonus})
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-white' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-white text-pink-900' : 'bg-gray-100 text-gray-700'} text-lg`}>Upper Section Total (with bonus)</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg`}>
                    {playerTotals[playerIndex].upperTotalWithBonus}
                  </td>
                ))}
              </tr>
              {lowerCategories.map((category, categoryIndex) => (
                <tr key={categoryIndex} className={`border-b ${isJerryGame ? 'border-gray-700 hover:bg-gray-700' : isMernGame ? 'border-pink-200 hover:bg-pink-100' : 'border-gray-200 hover:bg-gray-50'} transition-colors duration-150`}>
                  <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-pink-200 text-pink-900' : 'bg-white text-gray-700'}`}>
                    {category}
                    {lowerCategoryScores[category] && (
                      <span className={`ml-2 text-base ${isJerryGame ? 'text-gray-300' : isMernGame ? 'text-pink-700' : 'text-gray-400'}`}>
                        ({lowerCategoryScores[category]} points)
                      </span>
                    )}
                  </td>
                  {players.map((_, playerIndex) => (
                    <td key={playerIndex} className="p-2 sm:p-4 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        value={scores[playerIndex][upperCategories.length + categoryIndex] ?? ''}
                        onChange={(e) => handleScoreChange(playerIndex, upperCategories.length + categoryIndex, e.target.value)}
                        className={`w-16 sm:w-24 text-center text-lg ${
                          isJerryGame 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500' 
                            : isMernGame
                            ? 'bg-white border-pink-300 text-pink-900 focus:border-pink-500 focus:ring-pink-500'
                            : 'bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } rounded-md`}
                        disabled={finalTally}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-white' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-white text-pink-900' : 'bg-gray-100 text-gray-700'} text-lg`}>Lower Section Total</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg`}>
                    {playerTotals[playerIndex].lowerTotal}
                  </td>
                ))}
              </tr>
              <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-white' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
                <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-white text-pink-900' : 'bg-gray-100 text-gray-700'} text-lg`}>Grand Total</td>
                {players.map((_, playerIndex) => (
                  <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg`}>
                    {finalTally ? playerTotals[playerIndex].grandTotal : '?'}
                  </td>
                ))}
              </tr>
              <tr>
                <td colSpan={players.length + 1} className={`p-2 sm:p-4 text-center sticky left-0 ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-white' : 'bg-white'}`}>
                  <Button
                    onClick={handleFinalTally}
                    disabled={!isGameComplete() || finalTally}
                    className={`w-full ${isJerryGame ? 'bg-blue-800 hover:bg-blue-900' : isMernGame ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg`}
                  >
                    Final Tally
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {!finalTally ? (
        <div className="mt-6 sm:mt-10 text-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            onClick={resetGame}
            className={`w-full sm:w-auto ${
              isJerryGame 
                ? 'bg-green-700 hover:bg-green-800' 
                : isMernGame
                ? 'bg-pink-500 hover:bg-pink-600'
                : 'bg-green-600 hover:bg-green-700'
            } text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full transition duration-300 shadow-md hover:shadow-lg text-lg`}
          >
            Reset Game
          </Button>
          <Button
            onClick={() => router.push('/')}
            className={`w-full sm:w-auto ${
              isJerryGame 
                ? 'bg-red-700 hover:bg-red-800' 
                : isMernGame
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-red-600 hover:bg-red-700'
            } text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full transition duration-300 shadow-md hover:shadow-lg text-lg`}
          >
            Exit to Main Screen
          </Button>
        </div>
      ) : null}
      <UniversalFooter />
      {showFinalTally && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50`}>
          <div className={`relative p-6 rounded-2xl shadow-xl max-w-xl w-full mx-4 ${
            isJerryGame ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h2 className="text-xl font-bold mb-4 text-center">Game Over!</h2>
            <div className={`flex items-center justify-center gap-2 mb-6 ${
              isJerryGame ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <p className="text-lg font-semibold">
                {players[winnerIndex]} wins with {playerTotals[winnerIndex].grandTotal} points!
              </p>
            </div>
            <div className="space-y-2 mb-6">
              {players.map((player, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded ${
                    index === winnerIndex 
                      ? isJerryGame 
                        ? 'bg-blue-900/50' 
                        : 'bg-blue-100'
                      : ''
                  }`}
                >
                  <span className="text-lg">{player}</span>
                  <span className="font-mono font-bold text-lg">{playerTotals[index].grandTotal}</span>
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
          </div>
        </div>
      )}
    </div>
  )
}

