import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'

interface DiceIconProps {
  number: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

export function DiceIcon({ number, className = "" }: DiceIconProps) {
  const DiceComponent = {
    1: Dice1,
    2: Dice2,
    3: Dice3,
    4: Dice4,
    5: Dice5,
    6: Dice6
  }[number]

  return <DiceComponent className={`w-6 h-6 ${className}`} />
}

