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
import { useRouter } from "next/navigation";
import MainNav from "./MainNav";

export function GameNavbar() {
  const router = useRouter();
  
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <MainNav />
        
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
                    Player vs A.I.
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/old-school")}>
                    Score Card
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/digital-dice")}>
                    Player vs Player
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