import React from 'react'
import Image from 'next/image'

export function MernLogo() {
  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center overflow-hidden">
        <div className="w-[240px] h-[240px] relative">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MernsGame-DFJnuDuk0dMvOMpOxBqUOrB7JkDIWw.png"
            alt="Mern&apos;s Game"
            width={240}
            height={240}
            objectFit="cover"
            objectPosition="-2px center"
            className="rounded-sm"
          />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-pink-700 tracking-tight">Mern&apos;s Game</h1>
      <p className="text-xl text-pink-600 mt-2">Dice rolling with a Mern twist!</p>
      <p className="text-xl text-pink-700 mt-2">Game On!</p>
    </div>
  )
}

