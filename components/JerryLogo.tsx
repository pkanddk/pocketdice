import React from 'react'
import Image from 'next/image'

export function JerryLogo() {
  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JerrysGame-oO4bKtUi4VFqWzVXwfgpfzzMSsz4AX.png"
          alt="Jerry's Game"
          width={240}
          height={240}
          className="bg-white rounded-sm"
        />
      </div>
      <h1 className="text-4xl font-bold text-white tracking-tight">Jerry&apos;s Game</h1>
      <p className="text-xl text-blue-300 mt-2">Roll the dice, Jerry style!</p>
      <p className="text-xl text-white mt-2">Game On!</p>
    </div>
  )
}

