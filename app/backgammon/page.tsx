"use client"

import React, { useState, useEffect, Suspense } from "react"
import BackgammonGame from "@/components/backgammon/BackgammonGame"

export default function BackgammonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0">
      <Suspense fallback={<div>Loading game...</div>}>
        <BackgammonGame playerNames={[]}/>
      </Suspense>
    </main>
  )
} 