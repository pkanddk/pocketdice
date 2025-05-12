import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { GameRules } from './GameRules'
import { UpperSection } from './UpperSection'
import { LowerSection } from './LowerSection'

interface ScoreTableProps {
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
  showRules: boolean
  setShowRules: (show: boolean) => void
  handleScoreChange: (playerIndex: number, categoryIndex: number, value: string) => void
  handleFinalTally: () => void
  isGameComplete: () => boolean
  finalTally: boolean
}

export const ScoreTable: React.FC<ScoreTableProps> = ({
  players,
  currentPlayer,
  scores,
  playerTotals,
  isJerryGame,
  isMernGame,
  showRules,
  setShowRules,
  handleScoreChange,
  handleFinalTally,
  isGameComplete,
  finalTally
}) => {
  return (
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
            {players.map((player, index) => (
              <th key={index} className={`p-2 sm:p-4 text-center font-mono text-lg min-w-[80px] sm:min-w-[120px] ${
                index === currentPlayer 
                  ? 'bg-red-600 text-white'
                  : isJerryGame
                    ? 'bg-blue-800 text-white'
                    : isMernGame
                      ? 'bg-pink-600 text-white'
                      : 'bg-blue-600 text-white'
              }`}>
                {player}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono relative">
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
          <UpperSection
            players={players}
            currentPlayer={currentPlayer}
            scores={scores}
            playerTotals={playerTotals}
            isJerryGame={isJerryGame}
            isMernGame={isMernGame}
            handleScoreChange={handleScoreChange}
            finalTally={finalTally}
          />
          <LowerSection
            players={players}
            currentPlayer={currentPlayer}
            scores={scores}
            playerTotals={playerTotals}
            isJerryGame={isJerryGame}
            isMernGame={isMernGame}
            handleScoreChange={handleScoreChange}
            finalTally={finalTally}
          />
          <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-pink-50' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
            <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Final Tally</td>
            <td colSpan={players.length} className="p-2 sm:p-4 text-center">
              <Button
                onClick={handleFinalTally}
                disabled={!isGameComplete() || finalTally}
                className={`w-48 ${
                  isJerryGame ? 'bg-blue-400 hover:bg-blue-500' :
                  isMernGame ? 'bg-blue-400 hover:bg-blue-500' :
                  'bg-blue-400 hover:bg-blue-500'
                } text-white font-bold py-2 px-6 rounded-full transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg`}
              >
                Final Tally
              </Button>
            </td>
          </tr>
          <tr className={`${isJerryGame ? 'bg-gray-700' : isMernGame ? 'bg-pink-50' : 'bg-gray-100'} border-b ${isJerryGame ? 'border-gray-600' : isMernGame ? 'border-pink-200' : 'border-gray-200'}`}>
            <td className={`p-2 sm:p-4 font-semibold sticky left-0 ${isJerryGame ? 'bg-gray-700 text-white' : isMernGame ? 'bg-pink-50 text-gray-800' : 'bg-gray-100 text-gray-700'} text-lg`}>Grand Total</td>
            {players.map((_, playerIndex) => (
              <td key={playerIndex} className={`p-2 sm:p-4 text-center font-bold text-lg ${playerIndex === currentPlayer ? 'bg-red-50' : ''}`}>
                {finalTally ? playerTotals[playerIndex]?.grandTotal ?? '?' : '?'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

