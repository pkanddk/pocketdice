import React from 'react'
import { Input } from '@/components/ui/input'

interface LowerSectionProps {
  players: string[]
  currentPlayer: number
  scores: Array<Array<{ value: number | null; locked: boolean }>>
  playerTotals: Array<{
    upperTotal: number
    bonus: number
    upperTotalWithBonus: number
    lowerTotal: number
    grandTotal: number
    pointsToBonus: number
    pointsOverBonus: number
  }>
  isJerryGame: boolean
  isMernGame: boolean
  handleScoreChange: (playerIndex: number, categoryIndex: number, value: string) => void
  finalTally: boolean
}

const getLowerCategories = (isJerryGame: boolean, isMernGame: boolean) => [
  'Three of a Kind',
  'Four of a Kind',
  isJerryGame || isMernGame ? 'Boat' : 'Full House',
  isJerryGame || isMernGame ? 'Smalls' : 'Small Straight',
  isJerryGame || isMernGame ? 'Biggie' : 'Large Straight',
  'Yahtzee',
  'Chance'
]

const lowerCategoryScores: { [key: string]: number } = {
  'Full House': 25,
  'Boat': 25,
  'Small Straight': 30,
  'Smalls': 30,
  'Large Straight': 40,
  'Biggie': 40,
  'Yahtzee': 50
}

export const LowerSection: React.FC<LowerSectionProps> = ({
  players,
  currentPlayer,
  scores,
  playerTotals,
  isJerryGame,
  isMernGame,
  handleScoreChange,
  finalTally
}) => {
  const lowerCategories = React.useMemo(() => getLowerCategories(isJerryGame, isMernGame), [isJerryGame, isMernGame])

  return (
    <>
      {lowerCategories.map((category, categoryIndex) => (
        <tr key={categoryIndex} className={`border-b ${
          isJerryGame ? 'border-gray-700' : 
          isMernGame ? 'border-pink-100' : 
          'border-gray-200'
        } transition-colors duration-150`}>
          <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 z-30 ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-white text-gray-800' : 'bg-white text-gray-700'}`}>
            {category}
            {lowerCategoryScores.hasOwnProperty(category) && lowerCategoryScores[category] && (
              <span className={`ml-2 text-base ${isJerryGame ? 'text-gray-300' : isMernGame ? 'text-pink-700' : 'text-gray-400'}`}>
                ({lowerCategoryScores[category]} points)
              </span>
            )}
          </td>
          {players.map((_, playerIndex) => (
            <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? 'bg-red-50' : ''}`}>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                value={scores?.[playerIndex]?.[6 + categoryIndex]?.value ?? ''}
                onChange={(e) => handleScoreChange(playerIndex, 6 + categoryIndex, e.target.value)}
                onClick={() => {
                  const scoreValue = scores?.[playerIndex]?.[6 + categoryIndex]?.value;
                  if (scoreValue !== null && scoreValue !== undefined) {
                    handleScoreChange(playerIndex, 6 + categoryIndex, scoreValue.toString())
                  }
                }}
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
      <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-pink-50' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
        <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Lower Section Total</td>
        {players.map((_, playerIndex) => (
          <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? 'bg-red-50' : ''}`}>
            {playerTotals?.[playerIndex]?.lowerTotal ?? 0}
          </td>
        ))}
      </tr>
    </>
  )
}

