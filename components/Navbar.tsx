'use client';

import { Button } from "./ui/button";
import Link from "next/link";
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

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Pocket Score
          </Link>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Games</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Yahtzee Games Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Yahtzee</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link href="/dice-against-machine">Player vs A.I.</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/old-school">Score Card</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/digital-dice">Player vs Player</Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              {/* Backgammon Option */}
              <DropdownMenuItem asChild>
                <Link href="/backgammon">Backgammon</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
} 