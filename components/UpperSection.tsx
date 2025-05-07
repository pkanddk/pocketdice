import React from 'react'
import { Input } from '@/components/ui/input'
import { DiceIcon } from './DiceIcon'

interface UpperSectionProps {
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

const upperCategories = [
  { name: 'ONES', value: 1 },
  { name: 'TWOS', value: 2 },
  { name: 'THREES', value: 3 },
  { name: 'FOURS', value: 4 },
  { name: 'FIVES', value: 5 },
  { name: 'SIXES', value: 6 }
]

// const BONUS_THRESHOLD = 63; // Unused const
// const BONUS_AMOUNT = 35; // Unused const

export const UpperSection: React.FC<UpperSectionProps> = ({
  players,
  currentPlayer,
  scores,
  playerTotals,
  isJerryGame,
  isMernGame,
  handleScoreChange,
  finalTally
}) => {
  return (
    <>
      {upperCategories.map((category, categoryIndex) => (
        <tr key={categoryIndex} className={`border-b ${
          isJerryGame ? 'border-gray-700' : 
          isMernGame ? 'border-pink-100' : 
          'border-gray-200'
        } transition-colors duration-150`}>
          <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 flex items-center justify-between ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-white text-gray-800' : 'bg-white text-gray-700'}`}>
            <span>{category.name}</span>
            <DiceIcon number={category.value as 1 | 2 | 3 | 4 | 5 | 6} className={`ml-2 ${isJerryGame ? 'text-blue-400' : isMernGame ? 'text-pink-600' : 'text-blue-600'} w-6 h-6`} />
          </td>
          {players.map((_, playerIndex) => (
            <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? 'bg-red-50' : ''}`}>
              <Input
                type="number"
                min="0"
                value={scores?.[playerIndex]?.[categoryIndex]?.value ?? ''}
                onChange={(e) => handleScoreChange(playerIndex, categoryIndex, e.target.value)}
                onClick={() => {
                  const currentVal = scores?.[playerIndex]?.[categoryIndex]?.value;
                  if (currentVal !== null && currentVal !== undefined) {
                    handleScoreChange(playerIndex, categoryIndex, currentVal.toString())
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
        <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Upper Section Total</td>
        {players.map((_, playerIndex) => (
          <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? 'bg-red-50' : ''}`}>
            {playerTotals?.[playerIndex]?.upperTotal ?? 0}
          </td>
        ))}
      </tr>
      <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-pink-50' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
        <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Bonus (63+ = 35)</td>
        {players.map((_, playerIndex) => {
          const bonus = playerTotals?.[playerIndex]?.bonus;
          const pointsToBonus = playerTotals?.[playerIndex]?.pointsToBonus;
          const pointsOverBonus = playerTotals?.[playerIndex]?.pointsOverBonus;
          return (
            <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? 'bg-red-50' : ''} ${isJerryGame ? 'text-white' : ''}`}>
              <span className="font-bold text-lg">{bonus ?? 0}</span>
              {(bonus ?? 0) === 0 ? (
                <span className={`text-${isJerryGame ? 'gray-300' : isMernGame ? 'pink-700' : 'red-500'} ml-1 sm:ml-2 text-base block sm:inline`}>
                  ({pointsToBonus ?? 0} to go)
                </span>
              ) : (
                <span className={`text-${isJerryGame ? 'gray-300' : isMernGame ? 'pink-600' : 'green-500'} ml-1 sm:ml-2 text-base block sm:inline`}>
                  (+{pointsOverBonus ?? 0})
                </span>
              )}
            </td>
          );
        })}
      </tr>
      <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-pink-50' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
        <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Upper Section Total (with bonus)</td>
        {players.map((_, playerIndex) => (
          <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? 'bg-red-50' : ''}`}>
            {playerTotals?.[playerIndex]?.upperTotalWithBonus ?? 0}
          </td>
        ))}
      </tr>
    </>
  )
}

