import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ScoreCategoryProps {
  categoryName: string
  categoryIndex: number
  players: string[]
  currentPlayer: number
  scores: Array<Array<{ value: number | null; locked: boolean }>>
  possibleScores: (number | null)[]
  rollCount: number
  selectScore: (categoryIndex: number) => void
  isJerryGame: boolean
  isMernGame: boolean
  finalTally: boolean
}

export const ScoreCategory: React.FC<ScoreCategoryProps> = ({
  categoryName,
  categoryIndex,
  players,
  currentPlayer,
  scores,
  possibleScores,
  rollCount,
  selectScore,
  isJerryGame,
  isMernGame,
  finalTally
}) => {
  return (
    <tr className={`border-b ${
      isJerryGame ? 'border-gray-700' : 
      isMernGame ? 'border-pink-100' : 
      'border-gray-200'
    } transition-colors duration-150`}>
      <td className={`p-2 sm:p-4 text-lg font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-800 text-white' : isMernGame ? 'bg-white text-gray-800' : 'bg-white text-gray-700'}`}>
        {categoryName}
      </td>
      {players.map((_, playerIndex) => (
        <td key={playerIndex} className={`p-2 sm:p-4 text-center ${playerIndex === currentPlayer ? isJerryGame ? 'bg-gray-700' : 'bg-red-50' : ''}`}>
          <div className="w-16 sm:w-24 mx-auto">
            {playerIndex === currentPlayer && rollCount > 0 && possibleScores[categoryIndex] !== null && !scores[playerIndex][categoryIndex].locked ? (
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
                value={scores[playerIndex][categoryIndex].value ?? ''}
                readOnly
                className={`w-full text-center text-lg ${
                  scores[playerIndex][categoryIndex] !== null
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
  )
}

