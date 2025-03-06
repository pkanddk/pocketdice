import React from 'react'
import { Dice3 } from 'lucide-react'

export function Logo() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 tracking-tight flex items-center justify-center">
        Pocket Sc
        <span className="relative px-1">
          <Dice3 className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 text-blue-600" />
          <span className="invisible">o</span>
        </span>
        re
      </h1>
      <p className="text-xl text-gray-600 mt-2">Game On!</p>
    </div>
  )
}

