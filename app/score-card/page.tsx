"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { JerryLogo } from '@/components/JerryLogo'
import { MernLogo } from '@/components/MernLogo'
import { ScoreCardLogic } from '@/components/ScoreCardLogic'
import { UniversalFooter } from '@/components/common/UniversalFooter'

function ScoreCardPage() {
const searchParams = useSearchParams()
const [gameStarted, setGameStarted] = useState(false)
const [isJerryGame, setIsJerryGame] = useState(false)
const [isMernGame, setIsMernGame] = useState(false)
const [scores, setScores] = useState<Array<Array<{ value: number | null; locked: boolean }>>>([])

const playerNames = useState(() => {
 const namesParam = searchParams.get('names')
 return namesParam ? JSON.parse(decodeURIComponent(namesParam)) : []
})[0]

useEffect(() => {
 if (playerNames.length > 0 && !gameStarted) {
   setGameStarted(true)
   setScores(Array(playerNames.length).fill(null).map(() => 
     Array(13).fill(null).map(() => ({ value: null, locked: false }))
   ))
   checkForSpecialGames(playerNames)
 }
}, [playerNames, gameStarted])

const checkForSpecialGames = (names: string[]) => {
 const jerryActivated = names.some(name => name.toLowerCase().replace(/\s+/g, '') === "jerrymccall")
 const mernActivated = names.some(name => name.toLowerCase().replace(/\s+/g, '') === "mernmccall")
 
 if (jerryActivated && mernActivated) {
   const jerryIndex = names.findIndex(name => name.toLowerCase().replace(/\s+/g, '') === "jerrymccall")
   const mernIndex = names.findIndex(name => name.toLowerCase().replace(/\s+/g, '') === "mernmccall")
   setIsJerryGame(jerryIndex < mernIndex)
   setIsMernGame(jerryIndex >= mernIndex)
 } else {
   setIsJerryGame(jerryActivated)
   setIsMernGame(mernActivated)
 }
}

const getDisplayNames = playerNames.map((name: string) => {
 const lowerName = name.toLowerCase().replace(/\s+/g, '')
 if (lowerName === "jerrymccall") return "Jerry"
 if (lowerName === "mernmccall") return "Mern"
 return name
})

if (!gameStarted) {
 return <div>Loading...</div>
}

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
     <p className="text-center mt-1 text-lg">
       Score Card | {playerNames.length} Player{playerNames.length > 1 ? 's' : ''}
     </p>
   </div>
   <ScoreCardLogic 
     players={getDisplayNames} 
     isJerryGame={isJerryGame} 
     isMernGame={isMernGame}
     scores={scores}
     setScores={setScores}
   />
   <UniversalFooter />
 </div>
)
}

export default function Page() {
return (
 <Suspense fallback={<div>Loading...</div>}>
   <ScoreCardPage />
 </Suspense>
);
}

