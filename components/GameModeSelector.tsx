'use client';

import React from 'react';
import { useState } from 'react';
import { Dice5, ChevronDown, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameModeSelectorProps {
  onSelectGameMode: (mode: string) => void;
  currentSelectionName: string;
}

export function GameModeSelector({ onSelectGameMode, currentSelectionName }: GameModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [yahtzeeOpen, setYahtzeeOpen] = useState(false);
  const [yahtzeeFullGameOpen, setYahtzeeFullGameOpen] = useState(false);
  const [yahtzeeScoreCardOpen, setYahtzeeScoreCardOpen] = useState(false);
  const [farkleOpen, setFarkleOpen] = useState(false);
  const [farkleFullGameOpen, setFarkleFullGameOpen] = useState(false);
  const [farkleScoreCardOpen, setFarkleScoreCardOpen] = useState(false);
  const [backgammonOpen, setBackgammonOpen] = useState(false);
  const [generalScoreCardOpen, setGeneralScoreCardOpen] = useState(false);

  // Function to handle game selection - Simplified
  const handleGameSelect = (gameMode: string) => {
    setOpen(false);
    setYahtzeeOpen(false);
    setYahtzeeFullGameOpen(false);
    setYahtzeeScoreCardOpen(false);
    setFarkleOpen(false);
    setFarkleFullGameOpen(false);
    setFarkleScoreCardOpen(false);
    setBackgammonOpen(false);
    setGeneralScoreCardOpen(false);
    onSelectGameMode(gameMode); // Always pass the full gameMode string
  };

  // Toggle Yahtzee category
  const toggleYahtzee = () => {
    const currentlyYahtzeeOpen = yahtzeeOpen;
    setYahtzeeOpen(!currentlyYahtzeeOpen);
    setYahtzeeFullGameOpen(false);
    setYahtzeeScoreCardOpen(false);
    if (!currentlyYahtzeeOpen) {
      setFarkleOpen(false);
      setFarkleFullGameOpen(false);
      setFarkleScoreCardOpen(false);
      setBackgammonOpen(false);
      setGeneralScoreCardOpen(false);
    }
  };

  // Toggle Yahtzee Full Game submenu
  const toggleYahtzeeFullGame = () => {
    setYahtzeeFullGameOpen(!yahtzeeFullGameOpen);
    setYahtzeeScoreCardOpen(false);
  };

  // NEW: Toggle Yahtzee Score Card submenu
  const toggleYahtzeeScoreCard = () => {
    setYahtzeeScoreCardOpen(!yahtzeeScoreCardOpen);
    setYahtzeeFullGameOpen(false);
  };

  // Toggle Farkle category
  const toggleFarkle = () => {
    const currentlyFarkleOpen = farkleOpen;
    setFarkleOpen(!currentlyFarkleOpen);
    setFarkleFullGameOpen(false);
    setFarkleScoreCardOpen(false);
    if (!currentlyFarkleOpen) {
      setYahtzeeOpen(false);
      setYahtzeeFullGameOpen(false);
      setYahtzeeScoreCardOpen(false);
      setBackgammonOpen(false);
      setGeneralScoreCardOpen(false);
    }
  };

  // Toggle Farkle Full Game submenu
  const toggleFarkleFullGame = () => {
    setFarkleFullGameOpen(!farkleFullGameOpen);
    setFarkleScoreCardOpen(false);
  };

  // NEW: Toggle Farkle Score Card submenu
  const toggleFarkleScoreCard = () => {
    setFarkleScoreCardOpen(!farkleScoreCardOpen);
    setFarkleFullGameOpen(false);
  };
  
  // Toggle Backgammon category
  const toggleBackgammon = () => {
    const currentlyBackgammonOpen = backgammonOpen;
    setBackgammonOpen(!currentlyBackgammonOpen);
    if (!currentlyBackgammonOpen) {
        setYahtzeeOpen(false);
        setFarkleOpen(false);
        setGeneralScoreCardOpen(false);
    }
  };

  // Toggle General Score Card category - NEW
  const toggleGeneralScoreCard = () => {
    const currentlyGeneralOpen = generalScoreCardOpen;
    setGeneralScoreCardOpen(!currentlyGeneralOpen);
    if (!currentlyGeneralOpen) {
      setYahtzeeOpen(false);
      setFarkleOpen(false);
      setBackgammonOpen(false);
      setYahtzeeFullGameOpen(false); // Ensure other sub-submenus are closed
      setFarkleFullGameOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Dice5 className="h-5 w-5 text-blue-500" />
      </div>
      
      {/* Main Button */}
      <Button 
        variant="outline" 
        className="w-full justify-between pl-10 h-12 text-lg rounded-2xl border-blue-100 bg-white/80 backdrop-blur-sm hover:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100/50 transition-all duration-200 shadow-sm"
        onClick={() => setOpen(!open)}
      >
        {currentSelectionName || "Select Game Mode"}
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Button>
      
      {/* Main Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-blue-50 bg-white/95 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-200">
          {/* Yahtzee Category */}
          <div className="w-full">
            <button 
              className="w-full py-4 px-5 hover:bg-blue-50/50 focus:bg-blue-50/50 flex justify-between items-center transition-colors duration-150"
              onClick={toggleYahtzee}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">The Yacht Game</span>
                <span className="text-sm text-gray-500 mt-0.5">Invented by a couple who played it on their yacht.</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-400 transition-transform duration-200 ${yahtzeeOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Yahtzee Submenu (Vertical) */}
            {yahtzeeOpen && (
              <div className="bg-blue-50/30 border-t border-blue-100/50">
                {/* Yahtzee Full Game - Toggles Submenu */}
                <button
                  className="w-full py-3.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left flex justify-between items-center transition-colors duration-150"
                  onClick={toggleYahtzeeFullGame}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-base">Full Game</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-blue-400 transition-transform duration-200 ${yahtzeeFullGameOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Yahtzee Full Game Submenu (Vertical) */}
                {yahtzeeFullGameOpen && (
                  <div className="bg-blue-50/20 border-t border-blue-100/30 pl-4">
                    <button
                      className="w-full py-2.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left text-center transition-colors duration-150"
                      onClick={() => handleGameSelect('single')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-blue-700 text-sm">Player vs. Computer</span>
                      </div>
                    </button>
                    <div className="border-t border-blue-100/30"></div>
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <React.Fragment key={`yahtzee-pvp-${num}`}>
                        <button
                          className="w-full py-2.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left text-center transition-colors duration-150"
                          onClick={() => handleGameSelect(`yahtzee-pvp-${num}`)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-blue-700 text-sm">{num} Players</span>
                          </div>
                        </button>
                        {num < 8 && <div className="border-t border-blue-100/30"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <div className="border-t border-blue-100/30"></div>

                {/* Yahtzee Score Card - Toggles Submenu */}
                <button
                  className="w-full py-3.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left flex justify-between items-center transition-colors duration-150"
                  onClick={toggleYahtzeeScoreCard}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-base">Score Card</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-blue-400 transition-transform duration-200 ${yahtzeeScoreCardOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Yahtzee Score Card Submenu (Player Count Options) */}
                {yahtzeeScoreCardOpen && (
                  <div className="bg-blue-50/20 border-t border-blue-100/30 pl-4">
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <React.Fragment key={`yahtzee-score-card-${num}`}>
                        <button
                          className="w-full py-2.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left text-center transition-colors duration-150"
                          onClick={() => handleGameSelect(`yahtzee-score-card-${num}`)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-blue-700 text-sm">{num} Players</span>
                          </div>
                        </button>
                        {num < 8 && <div className="border-t border-blue-100/30"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="border-t border-blue-100/50"></div>
          
          {/* Farkle Category */}
          <div className="w-full">
            <button
              className="w-full py-4 px-5 hover:bg-blue-50/50 focus:bg-blue-50/50 flex justify-between items-center transition-colors duration-150"
              onClick={toggleFarkle}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">F#*kle</span>
                <span className="text-sm text-gray-500 mt-0.5">The probability of rolling a no scoring combination is 2.31% </span>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-400 transition-transform duration-200 ${farkleOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Farkle Submenu (Vertical) */}
            {farkleOpen && (
              <div className="bg-blue-50/30 border-t border-blue-100/50">
                {/* Farkle Full Game - Toggles Submenu */}
                <button
                  className="w-full py-3.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left flex justify-between items-center transition-colors duration-150"
                  onClick={toggleFarkleFullGame}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-base">Full Game</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-blue-400 transition-transform duration-200 ${farkleFullGameOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Farkle Full Game Submenu (Vertical) */}
                {farkleFullGameOpen && (
                  <div className="bg-blue-50/20 border-t border-blue-100/30 pl-4">
                    <button
                      className="w-full py-2.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left text-center transition-colors duration-150"
                      onClick={() => handleGameSelect('farkle-pvc')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-blue-700 text-sm">Player vs. Computer</span>
                      </div>
                    </button>
                    <div className="border-t border-blue-100/30"></div>
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <React.Fragment key={`farkle-pvp-${num}`}>
                        <button
                          className="w-full py-2.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left text-center transition-colors duration-150"
                          onClick={() => handleGameSelect(`farkle-pvp-${num}`)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-blue-700 text-sm">{num} Players</span>
                          </div>
                        </button>
                        {num < 8 && <div className="border-t border-blue-100/30"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <div className="border-t border-blue-100/30"></div>

                {/* Farkle Score Card - Toggles Submenu */}
                <button
                  className="w-full py-3.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left flex justify-between items-center transition-colors duration-150"
                  onClick={toggleFarkleScoreCard}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-base">Score Card</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-blue-400 transition-transform duration-200 ${farkleScoreCardOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Farkle Score Card Submenu (Player Count Options) */}
                {farkleScoreCardOpen && (
                  <div className="bg-blue-50/20 border-t border-blue-100/30 pl-4">
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <React.Fragment key={`farkle-scorecard-${num}`}>
                        <button
                          className="w-full py-2.5 px-8 hover:bg-blue-100/50 focus:bg-blue-100/50 text-left text-center transition-colors duration-150"
                          onClick={() => handleGameSelect(`farkle-scorecard-${num}`)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-blue-700 text-sm">{num} Players</span>
                          </div>
                        </button>
                        {num < 8 && <div className="border-t border-blue-100/30"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-blue-100"></div>
          
          {/* Backgammon Category - Moved General Score Card After This */}
          <div className="w-full">
            <button 
              className="w-full py-4 px-5 hover:bg-blue-50 focus:bg-blue-50 flex justify-between items-center"
              onClick={toggleBackgammon}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">Backgammon</span>
                <span className="text-sm text-gray-500">Emperor Nero played it for $10,000 per game (in today's currency).</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${backgammonOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Backgammon Submenu */}
            {backgammonOpen && (
              <div className="bg-blue-50/70 border-t border-b border-blue-100">
                <button 
                  className="w-full py-4 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left"
                  onClick={() => handleGameSelect('backgammon-pvp')}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">Player vs Player</span>
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
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* General Score Card Category - MOVED TO BOTTOM */}
          <div className="border-t border-blue-100"></div> {/* Separator */}
          <div className="w-full">
            <button 
              className="w-full py-4 px-5 hover:bg-blue-50 focus:bg-blue-50 flex justify-between items-center"
              onClick={toggleGeneralScoreCard}
            >
              <div className="flex items-center text-left">
                <div className="flex flex-col">
                  <span className="font-semibold text-blue-700 text-lg">General Score Card</span>
                  <span className="text-sm text-gray-500">Use this for any game you play!</span>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform ${generalScoreCardOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* General Score Card Submenu (Player Count) */}
            {generalScoreCardOpen && (
              <div className="bg-blue-50/70 border-t border-b border-blue-200 pl-4">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <React.Fragment key={`general-scorecard-${num}`}>
                    <button
                      className="w-full py-3 px-8 hover:bg-blue-100 focus:bg-blue-100 text-left text-center"
                      onClick={() => handleGameSelect(`general-scorecard-${num}`)}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-blue-700 text-md">{num} Players</span>
                      </div>
                    </button>
                    {num < 10 && <div className="border-t border-blue-200/50"></div>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
} 