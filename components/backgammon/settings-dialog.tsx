"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Sparkles, Music, VolumeX } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

// Import the cultural backgrounds
import { culturalBackgrounds } from "@/utils/cultural-backgrounds"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: string
  onThemeChange: (theme: string) => void
}

export function SettingsDialog({ open, onOpenChange, theme, onThemeChange }: SettingsDialogProps) {
  const [soundOn, setSoundOn] = useState(true)

  const toggleSound = () => {
    setSoundOn(!soundOn)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
            Board Styles
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Choose from traditional styles from around the world
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div>
            <Label className="text-base text-white mb-3 block">Game Theme</Label>
            <RadioGroup value={theme} onValueChange={onThemeChange} className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <RadioGroupItem value="classic" id="classic" className="sr-only" />
                <Label
                  htmlFor="classic"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "classic" ? "border-amber-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#8B4513] to-[#A0522D] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.classic}</div>
                    <div className="w-4 h-8 bg-[#F5F5DC]/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#8B4513]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">Classic</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="turkey" id="turkey" className="sr-only" />
                <Label
                  htmlFor="turkey"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "turkey" ? "border-red-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#E30A17] to-[#C70A17] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.turkey}</div>
                    <div className="w-4 h-8 bg-white/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#E30A17]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">Turkey</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="egypt" id="egypt" className="sr-only" />
                <Label
                  htmlFor="egypt"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "egypt" ? "border-yellow-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#C09E6B] to-[#E5BA73] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.egypt}</div>
                    <div className="w-4 h-8 bg-[#000000]/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#E5BA73]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">Egypt</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="greece" id="greece" className="sr-only" />
                <Label
                  htmlFor="greece"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "greece" ? "border-blue-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0D5EAF] to-[#0D5EAF] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.greece}</div>
                    <div className="w-4 h-8 bg-white/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#0D5EAF]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">Greece</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="france" id="france" className="sr-only" />
                <Label
                  htmlFor="france"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "france" ? "border-blue-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#002395] to-[#002395] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.france}</div>
                    <div className="w-4 h-8 bg-white/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#ED2939]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">France</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="uk" id="uk" className="sr-only" />
                <Label
                  htmlFor="uk"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "uk" ? "border-red-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#00247D] to-[#CF142B] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.uk}</div>
                    <div className="w-4 h-8 bg-white/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#CF142B]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">UK</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="russia" id="russia" className="sr-only" />
                <Label
                  htmlFor="russia"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "russia" ? "border-blue-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FFFFFF] via-[#0039A6] to-[#D52B1E] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.russia}</div>
                    <div className="w-4 h-8 bg-[#FFFFFF]/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#D52B1E]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">Russia</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="usa" id="usa" className="sr-only" />
                <Label
                  htmlFor="usa"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer hover:bg-white/5 ${theme === "usa" ? "border-blue-500 bg-white/10" : "border-white/10"}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#3C3B6E] to-[#B22234] mb-2 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 opacity-30">{culturalBackgrounds.usa}</div>
                    <div className="w-4 h-8 bg-white/70 mr-1 z-10"></div>
                    <div className="w-4 h-8 bg-[#B22234]/70 z-10"></div>
                  </div>
                  <span className="text-sm font-medium">USA</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-base text-white">Sound Effects</Label>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSound}
                className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {soundOn ? <Music className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <motion.div className="mt-2 flex justify-center" whileHover={{ scale: 1.05 }}>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border border-violet-400/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Apply Settings
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 