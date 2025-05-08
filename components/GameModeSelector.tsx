'use client';

import React from 'react';
import { useState } from 'react';
import { Dice5, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameModeSelectorProps {
  onSelectGameMode: (mode: string) => void;
  currentSelectionName: string;
}

export function GameModeSelector({ onSelectGameMode, currentSelectionName }: GameModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [yahtzeeOpen, setYahtzeeOpen] = useState(false);
  const [yahtzeeFullGameOpen, setYahtzeeFullGameOpen] = useState(false);
  const [farkleOpen, setFarkleOpen] = useState(false);
  const [farkleFullGameOpen, setFarkleFullGameOpen] = useState(false);
  const [backgammonOpen, setBackgammonOpen] = useState(false);

  // Function to handle game selection
  const handleGameSelect = (gameMode: string, playerCount?: number) => {
    setOpen(false);
    setYahtzeeOpen(false);
    setYahtzeeFullGameOpen(false);
    setFarkleOpen(false);
    setFarkleFullGameOpen(false);
    setBackgammonOpen(false);
    
    if ((gameMode.startsWith('farkle-pvp') || gameMode.startsWith('yahtzee-pvp')) && playerCount) {
      onSelectGameMode(`${gameMode}-${playerCount}`);
    } else {
      onSelectGameMode(gameMode);
    }
  };

  // Toggle Yahtzee category
  const toggleYahtzee = () => {
    const currentlyYahtzeeOpen = yahtzeeOpen;
    setYahtzeeOpen(!currentlyYahtzeeOpen);
    setYahtzeeFullGameOpen(false);
    if (!currentlyYahtzeeOpen) {
      setFarkleOpen(false);
      setBackgammonOpen(false);
      setFarkleFullGameOpen(false);
    }
  };

  // Toggle Yahtzee Full Game submenu
  const toggleYahtzeeFullGame = () => {
    setYahtzeeFullGameOpen(!yahtzeeFullGameOpen);
  };

  // Toggle Farkle category
  const toggleFarkle = () => {
    const currentlyFarkleOpen = farkleOpen;
    setFarkleOpen(!currentlyFarkleOpen);
    setFarkleFullGameOpen(false);
    if (!currentlyFarkleOpen) {
      setYahtzeeOpen(false);
      setBackgammonOpen(false);
    }
  };

  // Toggle Farkle Full Game submenu
  const toggleFarkleFullGame = () => {
    setFarkleFullGameOpen(!farkleFullGameOpen);
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Dice5 className="h-5 w-5 text-blue-500" />
      </div>
      
      {/* Main Button */}
      <Button 
        variant="outline" 
        className="w-full justify-between pl-10 h-auto py-3 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500"
        onClick={() => setOpen(!open)}
      >
        {currentSelectionName || "Select Game Mode"}
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      
      {/* Main Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-blue-100 bg-white shadow-lg overflow-hidden">
          {/* Yahtzee Category */}
          <div className="w-full">
            <button 
              className="w-full py-4 px-5 hover:bg-blue-50 focus:bg-blue-50 flex justify-between items-center"
              onClick={toggleYahtzee}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">Yahtzee</span>
                <span className="text-sm text-gray-500">Classic dice game</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${yahtzeeOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Yahtzee Submenu (Vertical) */}
            {yahtzeeOpen && (
              <div className="bg-blue-50/70 border-t border-b border-blue-100">
                <button 
                  className="w-full py-4 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left"
                  onClick={() => handleGameSelect('score-card')}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">Score Card</span>
                    <span className="text-sm text-gray-500">Digital score card.</span>
                  </div>
                </button>
                
                <div className="border-t border-blue-100/50"></div>

                {/* Yahtzee Full Game - Toggles Submenu */}
                <button
                  className="w-full py-4 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left flex justify-between items-center"
                  onClick={toggleYahtzeeFullGame}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">Full Game</span>
                    <span className="text-sm text-gray-500">Play against others or AI.</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${yahtzeeFullGameOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Yahtzee Full Game Submenu (Vertical) */}
                {yahtzeeFullGameOpen && (
                  <div className="bg-blue-50/70 border-t border-b border-blue-200 pl-4">
                    <button
                      className="w-full py-3 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left text-center"
                      onClick={() => handleGameSelect('single')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-blue-700 text-md">Player vs. Machine</span>
                      </div>
                    </button>
                    <div className="border-t border-blue-200/50"></div>
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <React.Fragment key={`yahtzee-pvp-${num}`}>
                        <button
                          className="w-full py-3 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left text-center"
                          onClick={() => handleGameSelect('yahtzee-pvp', num)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-blue-700 text-md">{num} Players</span>
                          </div>
                        </button>
                        {num < 8 && <div className="border-t border-blue-200/50"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="border-t border-blue-100"></div>
          
          {/* Farkle Category - NEW */}
          <div className="w-full">
            <button
              className="w-full py-4 px-5 hover:bg-blue-50 focus:bg-blue-50 flex justify-between items-center"
              onClick={toggleFarkle}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">F#*kle</span>
                <span className="text-sm text-gray-500">Roll and risk dice game</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${farkleOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Farkle Submenu (Vertical) */}
            {farkleOpen && (
              <div className="bg-blue-50/70 border-t border-b border-blue-100">
                {/* Farkle Score Card Button - Should be a direct option */}
                <button
                  className="w-full py-4 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left"
                  onClick={() => handleGameSelect('farkle-scorecard')}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">Score Card</span>
                    <span className="text-sm text-gray-500">Digital score card.</span>
                  </div>
                </button>

                <div className="border-t border-blue-100/50"></div>

                {/* Farkle Full Game - Toggles Submenu */}
                <button
                  className="w-full py-4 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left flex justify-between items-center"
                  onClick={toggleFarkleFullGame}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">Full Game</span>
                    <span className="text-sm text-gray-500">Play against others or AI.</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${farkleFullGameOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Farkle Full Game Submenu (Vertical) */}
                {farkleFullGameOpen && (
                  <div className="bg-blue-50/70 border-t border-b border-blue-200 pl-4">
                    <button
                      className="w-full py-3 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left text-center"
                      onClick={() => handleGameSelect('farkle-pvc')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-blue-700 text-md">Player vs. Computer</span>
                      </div>
                    </button>
                    <div className="border-t border-blue-200/50"></div>
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <React.Fragment key={`farkle-pvp-${num}`}>
                        <button
                          className="w-full py-3 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left text-center"
                          onClick={() => handleGameSelect('farkle-pvp', num)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-blue-700 text-md">{num} Players</span>
                          </div>
                        </button>
                        {num < 8 && <div className="border-t border-blue-200/50"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-blue-100"></div>
          
          {/* Backgammon Category */}
          <div className="w-full">
            <button 
              className="w-full py-4 px-5 hover:bg-blue-50 focus:bg-blue-50 flex justify-between items-center"
              onClick={() => {
                const currentlyBackgammonOpen = backgammonOpen;
                setBackgammonOpen(!currentlyBackgammonOpen);
                if (!currentlyBackgammonOpen) {
                  setYahtzeeOpen(false);
                  setFarkleOpen(false);
                }
              }}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">Backgammon</span>
                <span className="text-sm text-gray-500">Classic board game</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${backgammonOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Backgammon Submenu */}
            {backgammonOpen && (
              <div className="bg-blue-50/70 border-t border-b border-blue-100">
                <button 
                  className="w-full py-4 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left"
                  onClick={() => handleGameSelect('backgammon')}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">Player vs Player</span>
                    <span className="text-sm text-gray-500">Full game, board included.</span>
                  </div>
                </button>
                
                <div className="border-t border-blue-100/50"></div>
                
                <button 
                  className="w-full py-4 px-8 bg-gray-50 text-left opacity-75 cursor-not-allowed"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-600 text-lg">Player vs Computer</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <span className="text-sm text-gray-500">Play against AI.</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 