'use client';

import { useState } from 'react';
import { Dice5 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

interface GameModeSelectorProps {
  onSelectGameMode: (mode: string) => void;
}

export function GameModeSelector({ onSelectGameMode }: GameModeSelectorProps) {
  const [open, setOpen] = useState(false);

  // Function to handle game selection
  const handleGameSelect = (gameMode: string) => {
    setOpen(false);
    onSelectGameMode(gameMode);
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Dice5 className="h-5 w-5 text-blue-500" />
      </div>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between pl-10 h-auto py-3 text-lg rounded-full border-blue-200 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-500 focus:ring-blue-500"
          >
            Select Game Mode
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-[calc(100%-1rem)] mx-2 rounded-2xl border-blue-100 shadow-lg overflow-hidden"
          align="center"
          sideOffset={8}
        >
          {/* Yahtzee Games */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="py-4 px-5 hover:bg-blue-50 focus:bg-blue-50">
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-blue-700 text-lg">Yahtzee</span>
                <span className="text-sm text-gray-500">Classic dice game</span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent 
              className="rounded-2xl border-blue-100 shadow-lg overflow-hidden min-w-[280px]"
              sideOffset={12}
            >
              <DropdownMenuItem 
                onClick={() => handleGameSelect('single')}
                className="py-4 px-5 hover:bg-blue-50 focus:bg-blue-50"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-blue-700 text-lg">Dice Against the Machine</span>
                  <span className="text-sm text-gray-500">You vs. the CPU</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-50" />
              <DropdownMenuItem 
                onClick={() => handleGameSelect('score-card')}
                className="py-4 px-5 hover:bg-blue-50 focus:bg-blue-50"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-blue-700 text-lg">Old School</span>
                  <span className="text-sm text-gray-500">A score card for people with dice!</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-50" />
              <DropdownMenuItem 
                onClick={() => handleGameSelect('duel')}
                className="py-4 px-5 hover:bg-blue-50 focus:bg-blue-50"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-blue-700 text-lg">Digital Dice</span>
                  <span className="text-sm text-gray-500">Full game, dice included.</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator className="bg-blue-100" />
          
          {/* Backgammon */}
          <DropdownMenuItem 
            onClick={() => handleGameSelect('backgammon')}
            className="py-4 px-5 hover:bg-blue-50 focus:bg-blue-50"
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold text-blue-700 text-lg">Backgammon</span>
              <span className="text-sm text-gray-500">Classic board game</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 