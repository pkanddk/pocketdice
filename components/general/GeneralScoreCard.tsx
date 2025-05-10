"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GeneralScoreTable } from './GeneralScoreTable';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { UniversalFooter } from '@/components/common/UniversalFooter';

const INITIAL_TURNS_TO_SHOW = 10;

interface PlayerState {
  scores: Array<number | null>;
  total: number;
}

interface GeneralScoreCardProps {
  players: string[];
  onTurnChange?: (turn: number) => void;
}

const initializePlayerState = (): PlayerState => ({
  scores: Array(INITIAL_TURNS_TO_SHOW).fill(null),
  total: 0,
});

export const GeneralScoreCard: React.FC<GeneralScoreCardProps> = ({ players, onTurnChange }) => {
  const router = useRouter();

  const [playerStates, setPlayerStates] = useState<PlayerState[]>(players.map(() => initializePlayerState()));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentTurnInput, setCurrentTurnInput] = useState('');
  const [currentGlobalTurn, setCurrentGlobalTurn] = useState(1);
  const [displayedTurnCount, setDisplayedTurnCount] = useState(INITIAL_TURNS_TO_SHOW);
  
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [highestScorer, setHighestScorer] = useState<string | null>(null);

  const [lastSubmittedPlayerIndex, setLastSubmittedPlayerIndex] = useState<number | null>(null);

  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);
  const [selectedCellToEdit, setSelectedCellToEdit] = useState<{ playerIndex: number; turnIndex: number; currentValue: number | null } | null>(null);
  const [editModalValue, setEditModalValue] = useState<string>('');

  useEffect(() => {
    if (players.length > 0) {
      setPlayerStates(players.map(() => initializePlayerState()));
      setCurrentPlayerIndex(0);
      setCurrentGlobalTurn(1);
      if (onTurnChange) onTurnChange(1);
      setGameOver(false);
      setShowSummaryModal(false);
      setHighestScorer(null);
      if (players[0]) {
        setGameMessage(`${players[0]}\'s turn.`);
      }
      setLastSubmittedPlayerIndex(null);
      setDisplayedTurnCount(INITIAL_TURNS_TO_SHOW);
    }
  }, [players, onTurnChange]);

  useEffect(() => {
    if (!gameOver && currentGlobalTurn >= displayedTurnCount - 2) {
      setDisplayedTurnCount(prev => prev + 5);
    }
    if (onTurnChange) {
      onTurnChange(currentGlobalTurn);
    }
  }, [currentGlobalTurn, displayedTurnCount, gameOver, onTurnChange]);

  const handleSubmitTurnScore = useCallback(() => {
    if (gameOver) { 
      setGameMessage("Scorecard ended. Reset to start a new one.");
      return;
    }
    if (!players[currentPlayerIndex]) return;

    const score = parseInt(currentTurnInput, 10);
    const currentPlayerName = players[currentPlayerIndex]!;

    if (isNaN(score)) {
      setGameMessage("Please enter a valid number for the score.");
      setTimeout(() => setGameMessage(null), 3000);
      return;
    }

    setPlayerStates(prevStates => {
      const newStates = prevStates.map(ps => ({ ...ps, scores: [...ps.scores] }));
      const playerState = newStates[currentPlayerIndex];
      if (!playerState) return prevStates;

      while (playerState.scores.length < currentGlobalTurn) {
        playerState.scores.push(null);
      }
      
      playerState.total += score;
      playerState.scores[currentGlobalTurn - 1] = score;
      
      newStates[currentPlayerIndex] = playerState;
      setGameMessage(`${currentPlayerName} scored ${score}.`);
      return newStates;
    });
    setCurrentTurnInput('');
    setLastSubmittedPlayerIndex(currentPlayerIndex); 

  }, [currentPlayerIndex, players, currentTurnInput, gameOver, currentGlobalTurn]);

  useEffect(() => {
    const isPlayerInputting = currentTurnInput.trim() !== '';
    if (isPlayerInputting || players.length === 0 || gameOver) {
      return;
    }

    if (lastSubmittedPlayerIndex !== null && lastSubmittedPlayerIndex === currentPlayerIndex) {
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextPlayerIndex);
      const nextPlayerName = players[nextPlayerIndex]!;
      setGameMessage(`It\'s ${nextPlayerName}\'s turn.`);

      if (nextPlayerIndex === 0) {
          setCurrentGlobalTurn(prev => prev + 1);
      }
      setLastSubmittedPlayerIndex(null);
    } else if (lastSubmittedPlayerIndex === null && !gameMessage && players[0]) {
        setGameMessage(`${players[0]}\'s turn.`);
    }
    
  }, [playerStates, currentGlobalTurn, currentPlayerIndex, players, gameMessage, currentTurnInput, gameOver, lastSubmittedPlayerIndex]);

  const handleInputChange = (value: string) => {
    if (gameOver) return;
    if (/^-?\d*$/.test(value) || value === '-' || value === '') {
      setCurrentTurnInput(value);
      if(gameMessage && !gameMessage.includes("scored")) setGameMessage(null);
    }
  };
  
  const handleResetGame = useCallback(() => {
    setPlayerStates(players.map(() => initializePlayerState()));
    setCurrentPlayerIndex(0);
    setCurrentGlobalTurn(1);
    if (onTurnChange) onTurnChange(1);
    setCurrentTurnInput('');
    setGameMessage(players[0] ? `${players[0]}\'s turn.` : null);
    setGameOver(false);
    setShowSummaryModal(false);
    setHighestScorer(null);
    setLastSubmittedPlayerIndex(null);
    setDisplayedTurnCount(INITIAL_TURNS_TO_SHOW);
  }, [players, onTurnChange]);

  const handleEndGameAndShowSummary = () => {
    setGameOver(true);
    let maxScore = -Infinity;
    let currentHighestScorer = null;
    playerStates.forEach((ps, index) => {
      if (ps.total > maxScore) {
        maxScore = ps.total;
        currentHighestScorer = players[index];
      }
    });
    setHighestScorer(currentHighestScorer);
    setShowSummaryModal(true);
    setGameMessage(currentHighestScorer ? `${currentHighestScorer} has the highest score: ${maxScore}!` : "Game ended. No scores recorded.");
  };

  const handleEditBankedScoreTrigger = (playerIndex: number, turnIndex: number) => {
    const playerState = playerStates[playerIndex];
    if (playerState && turnIndex < playerState.scores.length) {
      const valueFromScores = playerState.scores[turnIndex];
      const currentValueForEdit: number | null = valueFromScores === undefined ? null : valueFromScores;
      
      setSelectedCellToEdit({ playerIndex, turnIndex, currentValue: currentValueForEdit }); 
      setEditModalValue(currentValueForEdit !== null ? currentValueForEdit.toString() : '');
      setShowConfirmEditModal(true);
    }
  };

  const handleConfirmScoreChange = () => {
    if (!selectedCellToEdit || !players[selectedCellToEdit.playerIndex]) return;

    const { playerIndex, turnIndex } = selectedCellToEdit;
    const newScoreInputStr = editModalValue;
    const newScore = parseInt(newScoreInputStr, 10);
    const playerName = players[selectedCellToEdit.playerIndex]!;

    if (isNaN(newScore) && newScoreInputStr.trim() !== '') {
      setGameMessage(`Invalid score '${newScoreInputStr}'. Please enter a number or leave blank to clear.`);
      return;
    }
    const actualNewScore = newScoreInputStr.trim() === '' ? null : newScore;

    setPlayerStates(prevStates => {
      const newStates = prevStates.map((ps, idx) => 
        idx === playerIndex ? { ...ps, scores: [...ps.scores], total: ps.total } : ps
      );
      const playerState = newStates[playerIndex];
      if (!playerState) return prevStates;

      const oldTurnScore = playerState.scores[turnIndex] ?? 0;
      playerState.scores[turnIndex] = actualNewScore;
      playerState.total = playerState.total - oldTurnScore + (actualNewScore ?? 0);
      
      setGameMessage(`${playerName} updated score for turn ${turnIndex + 1} to ${actualNewScore === null ? 'N/A' : actualNewScore}.`);
      newStates[playerIndex] = playerState;
      return newStates;
    });

    setShowConfirmEditModal(false);
    setSelectedCellToEdit(null);
    setEditModalValue('');
  };

  const handleCancelScoreEdit = () => {
    setShowConfirmEditModal(false);
    setSelectedCellToEdit(null);
    setEditModalValue('');
    setGameMessage("Score change cancelled.");
  };

  if (!players || players.length === 0) {
    return <div className="text-center py-10">Loading General Score Card or No Players...</div>;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 min-h-screen flex flex-col">
      <div>
        <GeneralScoreTable
          players={players}
          turnScores={playerStates.map(ps => ps.scores)}
          playerTotals={playerStates.map(ps => ps.total)}
          currentPlayerIndex={currentPlayerIndex}
          actualCurrentTurnIndex={currentGlobalTurn - 1}
          displayedTurnCount={displayedTurnCount}
          currentTurnInput={currentTurnInput}
          gameOver={gameOver}
          gameMessage={gameMessage}
          onInputChange={handleInputChange}
          onBankScore={handleSubmitTurnScore}
          onEditBankedScore={handleEditBankedScoreTrigger}
          showConfirmModal={showConfirmEditModal}
          onConfirmScoreChange={handleConfirmScoreChange}
          onCancelScoreEdit={handleCancelScoreEdit}
          editModalValue={editModalValue}
          onEditModalValueChange={setEditModalValue}
          selectedCellToEdit={selectedCellToEdit}
          showFinalTallyModal={showSummaryModal}
          winningPlayerName={highestScorer}
          onCloseFinalTallyModal={() => setShowSummaryModal(false)}
        />
      </div>
      <div className="container mx-auto w-full mt-8 mb-4 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-2 sm:px-4">
        <Button 
          onClick={handleResetGame}
          className="w-full sm:flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out text-lg">
          Reset Scores
        </Button>
        <Button 
          onClick={handleEndGameAndShowSummary} 
          disabled={gameOver}
          className={`w-full sm:flex-1 px-6 py-3 font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out text-lg ${
            gameOver ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
          }`}>
          End & Show Summary
        </Button>
        <Button 
          onClick={() => router.push('/')}
          className="w-full sm:flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out text-lg">
          Exit to Main Screen
        </Button>
      </div>
      <div className="mt-8">
        <UniversalFooter />
      </div>
    </div>
  );
}; 