# Comprehensive Backgammon Rules Reference

## Board Structure
- 24 points numbered 1-24
- Points 1-6: Black's home board
- Points 19-24: White's home board 
- The Bar: Central area for hit pieces (represented by position 0 in the game)
- Bearing Off area: Off-board location for removed pieces (represented by position 25 in the game)

## Players and Movement
- **Player 1 (Black)**: Moves counter-clockwise from higher to lower point numbers
  - Movement path: 24-23-22-21-20-19-18-17-16-15-14-13-12-11-10-9-8-7-6-5-4-3-2-1
- **Player 2 (White)**: Moves clockwise from lower to higher point numbers
  - Movement path: 0→1→2→3→4→5→6→7→8→9→10→11→12-13-14-15-16-17-18-19-20-21-22-23-24
- Distance moved must exactly match a die value
- Players can move different pieces or the same piece multiple times

## Starting Positions
- **Black (Player 1)**: 
  - 2 pucks at position 24
  - 5 pucks at position 13
  - 3 pucks at position 8
  - 5 pucks at position 6
- **White (Player 2)**:
  - 2 pucks at position 1
  - 5 pucks at position 12
  - 3 pucks at position 17
  - 5 pucks at position 19

## Game Flow
- Players roll two dice to determine moves
- Each die value represents a separate move
- Players have three options for using their dice:
  1. **Moving one piece with both dice values**: Players can combine both dice values to move a single piece once by the total value (if both intermediate and final positions are valid)
  2. **Moving two different pieces with different dice values**: Players can move one piece with the first die value and a different piece with the second die value
  3. **Using the second die on the same piece after moving it with the first die**: Players can move the same piece twice in succession, first by the value of one die and then by the value of the second die
- When a player rolls (for example) a 5 and a 3:
  - They can move one piece 8 spaces (combining the 5 and 3)
  - They can move one piece 5 spaces and another piece 3 spaces
  - They can move the same piece twice: first 5 spaces, then 3 spaces (or vice versa)
  - Each move must be legal on its own
- Players must use both dice values if possible
- After all moves, turn passes to opponent
- If doubles are rolled (e.g., 4-4), the player gets to move four times using that value

## Hitting Opponent Pieces
- A player can land on a point with a single opponent piece ("blot")
- The opponent piece is hit and placed on the bar
- Players cannot land on points with 2+ opponent pieces

## Bar Re-entry
- When a player has pieces on the bar, they must re-enter those pieces first
- Black enters at points 19-24 (using dice values 6-1 respectively)
  - 6=19, 5=20, 4=21, 3=22, 2=23, 1=24
- White enters at points 1-6 (using dice values 1-6 respectively)
  - 1=1, 2=2, 3=3, 4=4, 5=5, 6=6
- Players cannot make other moves until all their pieces are off the bar
- If re-entry points are blocked by opponent having double pieces, the player loses their turn

## Bearing Off Rules
1. **Requirements for Bearing Off**:
   - All of a player's pieces must be in their home board
     - White's home board: Points 19, 20, 21, 22, 23, 24
     - Black's home board: Points 6, 5, 4, 3, 2, 1
   - No pieces on the bar

2. **Bearing Off Process**:
   - Players remove pieces from their home board using exact dice values:
     - Black (positions 1-6): Position number = die needed
       - Position 1 needs die 1
       - Position 2 needs die 2, etc.
     - White (positions 19-24): 
       - Position 19 needs die 6
       - Position 20 needs die 5
       - Position 21 needs die 4
       - Position 22 needs die 3
       - Position 23 needs die 2
       - Position 24 needs die 1
   - Doubles are treated as in normal gameplay (four moves using that value)
   - Special handling for unoccupied positions:
     - If a player rolls a value higher than any occupied point, they can bear off the highest occupied point
     - If a player rolls a value with no matching occupied point but there are higher occupied points, the player must move a piece before bearing off

## Scoring
- Scoring works in chunks
- The player that first bears off all their pieces wins the game and earns one point
- To win the match, a player must win the majority of 5 games
- If a player bears off all their pieces and the opponent has not yet reached their home board, it's a Mulligan worth three points (3 game wins) 