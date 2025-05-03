"use client"

import React, { Suspense } from "react"
import { useSearchParams } from 'next/navigation'
import BackgammonGame from "@/components/backgammon/BackgammonGame"

function BackgammonGameLoader() {
  const searchParams = useSearchParams();
  let playerNames: string[] = [];

  const namesParam = searchParams.get('names');
  if (namesParam) {
    try {
      const decodedNames = decodeURIComponent(namesParam);
      const parsedNames = JSON.parse(decodedNames);
      if (Array.isArray(parsedNames) && parsedNames.every(name => typeof name === 'string')) {
        playerNames = parsedNames;
        console.log("Parsed player names from URL:", playerNames);
      } else {
         console.error("Invalid 'names' parameter format:", parsedNames);
      }
    } catch (error) {
      console.error("Failed to parse 'names' parameter:", error);
    }
  } else {
     console.log("No 'names' parameter found in URL.");
  }

  return <BackgammonGame playerNames={playerNames} />;
}

export default function BackgammonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0 bg-gray-900">
      <Suspense fallback={<div className="text-white text-xl p-10">Loading game...</div>}>
        <BackgammonGameLoader />
      </Suspense>
    </main>
  )
} 