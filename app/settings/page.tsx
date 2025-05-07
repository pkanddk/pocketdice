"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [soundEffects, setSoundEffects] = useState(true)

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked)
    // Here you would implement the actual dark mode logic
  }

  const handleSoundEffectsToggle = (checked: boolean) => {
    setSoundEffects(checked)
    // Here you would implement the actual sound effects logic
  }

  const handleResetScores = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('yahtzeeHistory')
      alert('All game history has been reset.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-md mx-auto">
        <Link href="/" className="inline-flex items-center text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-lg">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-effects" className="text-lg">Sound Effects</Label>
            <Switch
              id="sound-effects"
              checked={soundEffects}
              onCheckedChange={handleSoundEffectsToggle}
            />
          </div>
          <div>
            <Button 
              onClick={handleResetScores}
              variant="destructive"
              className="w-full"
            >
              Reset All Scores
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

