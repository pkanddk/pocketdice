"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ScoreTable } from './ScoreTable'
import { Input } from "@/components/ui/input"
import confetti from 'canvas-confetti';

const hideSpinnerClass = "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface ScoreCardLogicProps {
  players: string[]
  isJerryGame: boolean
  isMernGame: boolean
  scores: Array<Array<{ value: number | null; locked: boolean }>>
  setScores: React.Dispatch<React.SetStateAction<Array<Array<{ value: number | null; locked: boolean }>>>>
}

const upperCategories = [
  { name: 'ONES', value: 1 },
  { name: 'TWOS', value: 2 },
  { name: 'THREES', value: 3 },
  { name: 'FOURS', value: 4 },
  { name: 'FIVES', value: 5 },
  { name: 'SIXES', value: 6 }
]

const getLowerCategories = (isJerryGame: boolean, isMernGame: boolean) => [
  'Three of a Kind',
  'Four of a Kind',
  isJerryGame || isMernGame ? 'Boat' : 'Full House',
  isJerryGame || isMernGame ? 'Smalls' : 'Small Straight',
  isJerryGame || isMernGame ? 'Biggie' : 'Large Straight',
  'Yahtzee',
  'Chance'
]

const BONUS_THRESHOLD = 63
const BONUS_AMOUNT = 35

export const ScoreCardLogic: React.FC<ScoreCardLogicProps> = ({ players, isJerryGame, isMernGame, scores, setScores }) => {
  const lowerCategories = useMemo(() => getLowerCategories(isJerryGame, isMernGame), [isJerryGame, isMernGame])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [showRules, setShowRules] = useState(false)
  const [finalTally, setFinalTally] = useState(false)
  const [showFinalTally, setShowFinalTally] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedScore, setSelectedScore] = useState<{ playerIndex: number; categoryIndex: number; currentValue: number | null } | null>(null)
  const router = useRouter()
  const [scrollPosition, setScrollPosition] = useState(0);
  const [newValue, setNewValue] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ playerIndex: number; categoryIndex: number } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const calculateUpperTotal = useCallback((playerIndex: number) => {
    return upperCategories.reduce((sum, _, index) => sum + (scores[playerIndex]?.[index]?.value || 0), 0)
  }, [scores])

  const calculateBonus = useCallback((upperTotal: number) => {
    return upperTotal >= BONUS_THRESHOLD ? BONUS_AMOUNT : 0
  }, [])

  const calculateLowerTotal = useCallback((playerIndex: number) => {
    return lowerCategories.reduce((sum, _, index) => sum + (scores[playerIndex]?.[upperCategories.length + index]?.value || 0), 0)
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

  const handleScoreChange = useCallback((playerIndex: number, categoryIndex: number, value: string) => {
    // Only allow numeric input (including empty string for backspace)
    if (!/^\d*$/.test(value)) {
      return;
    }

    const currentValue = scores[playerIndex][categoryIndex].value;
    
    if (currentValue !== null) {
      // If there's already a value, show the confirmation modal
      setSelectedScore({ playerIndex, categoryIndex, currentValue });
      setShowConfirmModal(true);
      setScrollPosition(window.pageYOffset);
      setNewValue(value);
    } else {
      // If there's no value yet, update the score directly
      const numValue = value === '' ? null : parseInt(value, 10);
      if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
        setScores(prevScores => {
          const newScores = [...prevScores];
          if (newScores[playerIndex]) {
            newScores[playerIndex] = [...newScores[playerIndex]];
            newScores[playerIndex][categoryIndex] = { value: numValue, locked: true };
          } else {
            console.error(`Error: scores for playerIndex ${playerIndex} not initialized.`);
          }
          return newScores;
        });
        // Advance player only after successfully setting a score in an empty cell
        setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length);
      }
    }
  }, [scores, setScores, setSelectedScore, setShowConfirmModal, setScrollPosition, setNewValue, players.length]);

  const handleConfirmChange = useCallback((confirmedValue: string) => {
    if (selectedScore) {
      const { playerIndex, categoryIndex } = selectedScore;
      const numValue = confirmedValue === '' ? null : parseInt(confirmedValue, 10);
      if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
        setScores(prevScores => {
          const newScores = [...prevScores];
          newScores[playerIndex] = [...newScores[playerIndex]];
          newScores[playerIndex][categoryIndex] = { value: numValue, locked: true };
          return newScores;
        });
      }
    }
    setShowConfirmModal(false);
    setSelectedScore(null);
    setNewValue('');
    setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length);
    // Restore scroll position after a short delay
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  }, [selectedScore, setScores, players.length, scrollPosition]);

  const handleFinalTally = useCallback(() => {
    setFinalTally(true)
    setShowFinalTally(true)
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    // You might want to add logic here to save the game results
  }, [])

  const resetGame = useCallback(() => {
    setScores(Array(players.length).fill(null).map(() => Array(upperCategories.length + lowerCategories.length).fill({ value: null, locked: false })))
    setFinalTally(false)
    setShowFinalTally(false)
    setCurrentPlayer(0)
  }, [players.length, upperCategories.length, lowerCategories.length, setScores])

  const isGameComplete = useCallback(() => {
    return scores.every(playerScores => playerScores.every(score => score.locked))
  }, [scores])

  useEffect(() => {
    if (showConfirmModal) {
      setScrollPosition(window.pageYOffset);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosition);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      setNewValue('');
    }
  }, [showConfirmModal, scrollPosition]);

  const startEditing = (playerIndex: number, categoryIndex: number, value: string) => {
    setEditingCell({ playerIndex, categoryIndex });
    setEditingValue(value);
  };

  const commitEditing = useCallback(() => {
    if (editingCell) {
      const { playerIndex, categoryIndex } = editingCell;
      handleScoreChange(playerIndex, categoryIndex, editingValue);
      setEditingCell(null);
      setEditingValue('');
    }
  }, [editingCell, editingValue, handleScoreChange]);

  return (
    <div className={`container mx-auto px-2 sm:px-4 py-2 sm:py-4 min-h-screen ${
      isJerryGame ? 'bg-gray-900 text-white' :
      isMernGame ? 'bg-white text-pink-900' :
      'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className={`${
        isJerryGame ? 'bg-gray-800' :
        isMernGame ? 'bg-white' :
        'bg-white'
      } shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border ${
        isJerryGame ? 'border-gray-700' :
        isMernGame ? 'border-pink-300' :
        'border-gray-100'
      } mt-2`}>
        <ScoreTable 
          players={players}
          currentPlayer={currentPlayer}
          scores={scores}
          playerTotals={playerTotals}
          isJerryGame={isJerryGame}
          isMernGame={isMernGame}
          showRules={showRules}
          setShowRules={setShowRules}
          handleScoreChange={handleScoreChange}
          handleFinalTally={handleFinalTally}
          isGameComplete={isGameComplete}
          finalTally={finalTally}
          editingCell={editingCell}
          editingValue={editingValue}
          startEditing={startEditing}
          setEditingValue={setEditingValue}
          commitEditing={commitEditing}
        />
      </div>
      <div className="mt-8 text-center space-y-3 sm:space-y-0 sm:space-x-4 mb-0">
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
          Reset Game
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
          Exit to Main Screen
        </Button>
      </div>
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
                {players[playerTotals.reduce((maxIndex, current, index, array) =>
                  current.grandTotal > array[maxIndex].grandTotal ? index : maxIndex, 0
                )]} wins with {Math.max(...playerTotals.map(p => p.grandTotal))} points!
              </p>
            </div>
            <div className="space-y-2 mb-6">
              {players.map((player, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded ${
                    playerTotals[index].grandTotal === Math.max(...playerTotals.map(p => p.grandTotal))
                      ? isJerryGame
                        ? 'bg-blue-900/50'
                        : 'bg-blue-100'
                      : ''
                  }`}
                >
                  <span className="text-lg">
                    {playerTotals[index].grandTotal === Math.max(...playerTotals.map(p => p.grandTotal)) && '🏆 '}
                    {player}
                  </span>
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
      {showConfirmModal && selectedScore && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-red-600 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
            >
              <h2 className="text-2xl font-bold mb-4 text-white">Confirm Change</h2>
              <p className="text-white mb-4">Are you sure you want to change this score?</p>
              <p className="text-white mb-4">Current value: {selectedScore.currentValue}</p>
              <div className="flex flex-col space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={newValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setNewValue(value);
                    }
                  }}
                  className={`w-full text-center text-lg ${hideSpinnerClass} bg-white text-red-600 border-white focus:border-white focus:ring-white rounded-md`}
                />
                <div className="flex justify-between space-x-4">
                  <Button
                    onClick={() => handleConfirmChange(selectedScore.currentValue?.toString() ?? '')}
                    className="flex-1 bg-white text-red-600 hover:bg-red-100 rounded-md"
                  >
                    Keep Current
                  </Button>
                  <Button
                    onClick={() => handleConfirmChange(newValue)}
                    className="flex-1 bg-white text-red-600 hover:bg-red-100 rounded-md"
                  >
                    OK
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

