"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { JerryLogo } from '@/components/JerryLogo'
import { MernLogo } from '@/components/MernLogo'
import { GameLogic } from '@/components/GameLogic'

function SinglePlayerGamePage() {
const searchParams = useSearchParams()
const [gameState, setGameState] = useState({
 playerName: '',
 isJerryGame: false,
 isMernGame: false,
})

const [scores, setScores] = useState<Array<Array<{ value: number | null; locked: boolean }>>>(() => 
 Array(2).fill(null).map(() => 
   Array(13).fill(null).map(() => ({ value: null, locked: false }))
 )
);

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

const { playerName, isJerryGame, isMernGame } = gameState

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
     players={[playerName, 'Computer']} 
     isJerryGame={isJerryGame} 
     isMernGame={isMernGame}
     scores={scores}
     setScores={(newScores) => setScores(newScores)}
     isSinglePlayer={true}
   />
   <footer className="mt-auto pt-8 text-center text-sm text-gray-500">
     <p>Pocket Score © {new Date().getFullYear()} | a pk and dk app</p>
   </footer>
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

