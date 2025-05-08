"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { JerryLogo } from '@/components/JerryLogo'
import { MernLogo } from '@/components/MernLogo'
import { GameLogic } from '@/components/GameLogic'
import { UniversalFooter } from '@/components/common/UniversalFooter'

function SinglePlayerGamePage() {
const searchParams = useSearchParams()
const [gameState, setGameState] = useState({
 playerName: '',
 isJerryGame: false,
 isMernGame: false,
})

const [scores, setScores] = useState<Array<Array<{ value: number | null; locked: boolean }>>>([])
const [playerName, setPlayerName] = useState("Player 1")
const [gameStarted, setGameStarted] = useState(false)
const [playerNames, setPlayerNames] = useState<string[]>([])

const name = useMemo(() => searchParams.get('name') || 'Player 1', [searchParams])

useEffect(() => {
 const lowerName = name.toLowerCase().replace(/\s+/g, '')
 setGameState(prevState => ({
   ...prevState,
   playerName: name,
   isJerryGame: lowerName === "jerrymccall",
   isMernGame: lowerName === "mernmccall",
 }))
}, [name])

useEffect(() => {
  const paramPlayerName = searchParams.get('playerName');
  if (paramPlayerName) {
    setPlayerName(decodeURIComponent(paramPlayerName));
  }
  if (!gameStarted && playerName) {
    const initialPlayerNames = [playerName, 'Computer'];
    setPlayerNames(initialPlayerNames);
    setScores(Array(initialPlayerNames.length).fill(null).map(() => 
      Array(13).fill(null).map(() => ({ value: null, locked: false }))
    ));
    setGameStarted(true);
  }
}, [searchParams, gameStarted, playerName]);

const checkForSpecialGames = (currentNames: string[]) => {
  const lowerCaseNames = currentNames.map(cn => cn.toLowerCase().replace(/\s+/g, ''));
  const jerryActivated = lowerCaseNames.includes("jerrymccall");
  const mernActivated = lowerCaseNames.includes("mernmccall");

  let newIsJerryGame = false;
  let newIsMernGame = false;

  if (jerryActivated && mernActivated) {
    const jerryIndex = lowerCaseNames.indexOf("jerrymccall");
    const mernIndex = lowerCaseNames.indexOf("mernmccall");
    newIsJerryGame = jerryIndex < mernIndex;
    newIsMernGame = jerryIndex >= mernIndex;
  } else {
    newIsJerryGame = jerryActivated;
    newIsMernGame = mernActivated;
  }
  if (newIsJerryGame !== gameState.isJerryGame || newIsMernGame !== gameState.isMernGame) {
    setGameState(prev => ({...prev, isJerryGame: newIsJerryGame, isMernGame: newIsMernGame }));
  }
};

const { playerName: gamePlayerName, isJerryGame, isMernGame } = gameState

const handleResetGame = () => {
  const currentPlayersForReset = [gamePlayerName, 'Computer'];
  setScores(Array(currentPlayersForReset.length).fill(null).map(() => 
    Array(13).fill(null).map(() => ({ value: null, locked: false }))
  ));
};

return (
 <div className={`container mx-auto px-4 py-4 min-h-screen flex flex-col ${
   isJerryGame ? 'bg-[#0C1222] text-white' : 
   isMernGame ? 'bg-white text-pink-900' : 
   'bg-gradient-to-b from-gray-50 to-white text-gray-900'
 }`}>
   <div className="mb-2">
     {isJerryGame ? (
       <div className="text-white">
         <JerryLogo />
       </div>
     ) : isMernGame ? (
       <div className="text-pink-700">
         <MernLogo />
       </div>
     ) : (
       <Logo />
     )}
     {/* <p className="text-center mt-1 text-lg">
       Single Player vs Computer
     </p> */}
   </div>
   <GameLogic 
     players={[gamePlayerName, 'Computer']} 
     isJerryGame={isJerryGame} 
     isMernGame={isMernGame}
     scores={scores}
     setScores={(newScores) => setScores(newScores)}
     isSinglePlayer={true}
     onResetGame={handleResetGame}
   />
   <UniversalFooter />
 </div>
)
}

export default function Page() {
return (
 <Suspense fallback={<div>Loading...</div>}>
   <SinglePlayerGamePage />
 </Suspense>
);
}

