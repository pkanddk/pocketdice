'use client';

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  
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
                  <DropdownMenuItem onClick={() => router.push("/dice-against-machine")}>
                    Dice Against the Machine
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/old-school")}>
                    Old School
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/digital-dice")}>
                    Digital Dice
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              {/* Backgammon Option */}
              <DropdownMenuItem onClick={() => router.push("/backgammon")}>
                Backgammon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
} 