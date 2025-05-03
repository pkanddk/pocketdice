"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface DiceProps {
  values: number[]
  rolling: boolean
}

export function Dice({ values, rolling }: DiceProps) {
  const [animatingValues, setAnimatingValues] = useState<number[]>([0, 0])

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setAnimatingValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])
      }, 100)

      return () => clearInterval(interval)
    } else {
      setAnimatingValues(values)
    }
  }, [rolling, values])

  const renderDot = (visible: boolean) =>
    visible ? (
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-[#2a1106]"
        style={{
          boxShadow: "inset 0 0 1px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.5)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
      />
    ) : (
      <div className="w-1.5 h-1.5 rounded-full bg-transparent"></div>
    )

  const renderDice = (value: number, index: number) => {
    return (
      <motion.div
        key={index}
        className="w-10 h-10 rounded-lg shadow-md flex items-center justify-center p-1 mx-1"
        style={{
          background: "linear-gradient(135deg, #FFFFF0 0%, #F5F5DC 50%, #E8E8D0 100%)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3), inset 0 0 2px rgba(0,0,0,0.1), inset 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
        animate={{
          rotateX: rolling ? [0, 360, 720, 1080, 1440, 1800] : 0,
          rotateY: rolling ? [0, 360, 720, 1080, 1440, 1800] : 0,
          rotateZ: rolling ? [0, 360, 720, 1080, 1440, 1800] : 0,
        }}
        transition={{ duration: rolling ? 2 : 0.5, ease: "easeOut" }}
      >
        <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full p-1">
          {/* Dice dots layout */}
          {renderDot([4, 5, 6].includes(value))}
          {renderDot(false)}
          {renderDot([2, 3, 4, 5, 6].includes(value))}
          {renderDot([6].includes(value))}
          {renderDot([1, 3, 5].includes(value))}
          {renderDot([6].includes(value))}
          {renderDot([2, 3, 4, 5, 6].includes(value))}
          {renderDot(false)}
          {renderDot([4, 5, 6].includes(value))}
        </div>

        {/* Highlight effect */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
            opacity: 0.6,
          }}
        />
      </motion.div>
    )
  }

  return (
    <div className="flex">
      {animatingValues.map((value, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          {renderDice(value, index)}
        </motion.div>
      ))}
    </div>
  )
} 