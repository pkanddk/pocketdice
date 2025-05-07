"use client";

import React from 'react';

// The content from docs/farkle-rules.md
// For simplicity in this step, rules are hardcoded. 
// In a real app, you might fetch this from the .md file or use a markdown parser.
const farkleRulesText = `
# F#*KLE Rules

F#*KLE (also known as "F#*kel" or "Hot Dice") is a fun dice game that requires both luck and strategy. 

## Equipment
- Six standard dice
- 1 or more players

## Objective
Reach 10,000 points to initiate the final round, then finish with the highest score to win the game!

## Basic Play
1.  On your turn, roll all six dice.
2.  After each roll, you must set aside at least one scoring die.
3.  You may choose to roll again with remaining dice, or bank your points.
4.  If you can't set aside any scoring dice after a roll, you "F#*KLE" and lose all points accumulated during that turn.

## Scoring
-   **Single 1:** 100 points
-   **Single 5:** 50 points
-   **Three of a kind:** Value of die × 100 (except three 1's = 1,000 points)
    -   Three 1's = 1,000 points
    -   Three 2's = 200 points
    -   Three 3's = 300 points
    -   Three 4's = 400 points
    -   Three 5's = 500 points
    -   Three 6's = 600 points
-   **Four of a kind:** 1,000 points
-   **Five of a kind:** 2,000 points
-   **Six of a kind:** 3,000 points
-   **Straight (1-2-3-4-5-6):** 1,500 points
-   **Three pairs:** 1,500 points (e.g., 2-2, 4-4, 5-5)
-   **Two triplets:** 2,500 points (e.g., 2-2-2, 4-4-4)

## Important Rules
-   You must set aside at least one scoring die after each roll.
-   You can only score dice on the roll where they appear (no combining across rolls).
-   If all six dice score in a single roll, you can roll all six again and continue your turn, adding to your current turn's score.
-   **Getting on the Board:** Minimum score (500 points) in a single turn. Once a player is on the board, they can bank any score.
-   **Ending the Game:** The game ends when a player reaches or exceeds 10,000 points. After a player reaches this target and banks their points, all other players get one final turn to try to beat that high score. The player with the highest score after these final turns wins.

## Example Turn
1.  You roll six dice and get: **1, 3, 3, 4, 5, 6**
2.  You set aside the **1** (100 points) and **5** (50 points). Current turn score: 150 points.
3.  You roll the remaining four dice and get: **1, 3, 3, 4**
4.  You set aside the **1** (100 more points). Current turn score: 250 points.
5.  You roll the remaining three dice and get: **2, 2, 2**
6.  You set aside the three **2's** (200 points). Current turn score: 450 points.
7.  You decide to bank your 450 points rather than risk rolling the remaining zero dice (or rolling all six again if "hot dice" rules apply to only three dice being scored, which varies by house rule - typically hot dice applies if all six dice are scored).

## Strategy Tips
-   Early in the game, take more risks to establish a lead or get on the board.
-   Later in the game, be more conservative when you have a good score to protect, especially if you are in the lead.
-   If another player is close to winning, you may need to take bigger risks to catch up.
`;

// Helper function to parse **bold** text and apply consistent styling
const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="font-semibold text-purple-600">{children}</span>;
};

const ParseLine: React.FC<{ line: string }> = ({ line }) => {
  // Regex to find **bolded** parts or normal text
  const parts = line.split(/(\*\*.*?\*\*)/g).filter(part => part); 

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Highlight key={index}>{part.slice(2, -2)}</Highlight>;
        }
        // Handle specific keywords for extra emphasis
        if (part.toLowerCase().includes('farkle')) {
            return part.split(/(farkle)/gi).map((subPart, subIndex) => 
                subPart.toLowerCase() === 'farkle' ? 
                <span key={`${index}-${subIndex}`} className="font-bold text-red-500 uppercase tracking-wide">F#*KLE</span> : 
                subPart
            );
        }
        return part;
      })}
    </>
  );
};

export const FarkleRulesDisplay: React.FC = () => {
  const allLines = farkleRulesText.trim().split('\n');
  const renderedElements: JSX.Element[] = [];

  allLines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('# ')) { // Main Title
      renderedElements.push(
        <h1 key={`h1-${index}`} className="text-3xl sm:text-4xl font-bold text-center text-purple-700 my-6 pb-3 border-b-2 border-purple-200">
          🎲 <ParseLine line={trimmedLine.substring(2)} /> 🎲
        </h1>
      );
    } else if (trimmedLine.startsWith('## ')) { // Section Title
      let emoji = '📄';
      const titleText = trimmedLine.substring(3);
      if (titleText.toLowerCase().includes('equipment')) emoji = '⚙️';
      if (titleText.toLowerCase().includes('objective')) emoji = '🎯';
      if (titleText.toLowerCase().includes('basic play')) emoji = '▶️';
      if (titleText.toLowerCase().includes('scoring')) emoji = '💯';
      if (titleText.toLowerCase().includes('important rules')) emoji = '📌';
      if (titleText.toLowerCase().includes('example turn')) emoji = '💡';
      if (titleText.toLowerCase().includes('strategy tips')) emoji = '🧠';
      renderedElements.push(
        <h2 key={`h2-${index}`} className="text-xl sm:text-2xl font-semibold text-purple-600 mt-8 mb-4 pt-2 border-t border-purple-100">
          {emoji} <ParseLine line={titleText} />
        </h2>
      );
    } else if (trimmedLine.startsWith('- ')) { // Unordered List Item
      renderedElements.push(
        <div key={`ul-item-${index}`} className="flex items-start space-x-3 ml-2 my-2 py-1 px-2 rounded-md bg-purple-50 border border-purple-200 shadow-sm">
          <span className="flex-shrink-0 mt-1.5 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-pink-300"></span>
          <p className="text-gray-700 flex-1"><ParseLine line={trimmedLine.substring(2)} /></p>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmedLine)) { // Ordered List Item
      const itemNumber = trimmedLine.split('.')[0];
      const itemText = trimmedLine.substring(trimmedLine.indexOf(' ') + 1);
      renderedElements.push(
        <div key={`ol-item-${index}`} className="flex items-start space-x-3 ml-2 my-2 py-1 px-2 rounded-md bg-teal-50 border border-teal-200 shadow-sm">
          <span className="flex-shrink-0 w-6 h-6 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-teal-300">{itemNumber}</span>
          <p className="text-gray-700 flex-1"><ParseLine line={itemText} /></p>
        </div>
      );
    } else if (trimmedLine === '') { // Blank line
      // Optionally add a visual break for significant spacing in markdown, or just let CSS margins handle it
      // renderedElements.push(<div key={`br-${index}`} className="h-2"></div>); 
    } else { // Paragraph
      renderedElements.push(
        <p key={`p-${index}`} className="my-3 text-gray-800 leading-relaxed">
          <ParseLine line={trimmedLine} />
        </p>
      );
    }
  });

  return (
    <div className="p-4 sm:p-6 bg-white font-sans text-sm sm:text-base">
      {renderedElements}
    </div>
  );
}; 