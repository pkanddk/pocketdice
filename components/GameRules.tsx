import React from 'react';

interface GameRulesProps {
  isJerryGame: boolean
  isMernGame: boolean
}

export function GameRules({ isJerryGame, isMernGame }: GameRulesProps) {
  return (
    <div className={`shadow-lg rounded-2xl p-6 sm:p-8 ${
      isJerryGame ? 'bg-gray-800 text-white' : 
      isMernGame ? 'bg-pink-100 text-pink-900' : 
      'bg-white text-gray-700'
    }`}>
      <h2 className={`text-xl font-bold mb-6 ${
        isJerryGame ? 'text-blue-400' : 
        isMernGame ? 'text-pink-600' : 
        'text-blue-600'
      }`}>
        {isJerryGame ? "Jerry's Game Rules" : isMernGame ? "Mern's Game Rules" : "Pocket Score Rules"}
      </h2>
      <ul className="space-y-4">
        <li className="flex items-start">
          <span className="rule-emoji">🎲</span>
          <span className="text-base">The game consists of <span className="font-bold text-blue-500">13 rounds</span>.</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">🎲</span>
          <span className="text-base">In each round, you roll five dice up to <span className="font-bold text-green-600">three times</span>.</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">👐</span>
          <span className="text-base">After each roll, you can <span className="font-bold text-yellow-600">keep</span> any number of dice and reroll the rest.</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">📝</span>
          <span className="text-base">After your third roll (or earlier if you choose), you must <span className="font-bold text-pink-600">score</span> in one of the 13 categories.</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">🚫</span>
          <span className="text-base">Each category can only be <span className="font-bold text-red-500">scored once</span> per game.</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">🔢</span>
          <span className="text-base">The upper section categories (<span className="font-bold text-blue-500">Ones</span> through <span className="font-bold text-blue-500">Sixes</span>) score the sum of the dice showing that number.</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">💰</span>
          <span className="text-base">If you score <span className="font-bold text-green-600">63 or more</span> points in the upper section, you get a <span className="font-bold text-green-600">bonus of 35 points</span>!</span>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">📋</span>
          <span className="text-base font-semibold">Lower Section Categories:</span>
        </li>
        <li className="ml-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 p-3 shadow-sm">
            <ul className="space-y-2">
              <li className="flex items-center"><span className="subrule-dot" /> <span className="text-base">Three of a Kind: <span className="font-bold text-blue-500">Sum of all dice</span></span></li>
              <li className="flex items-center"><span className="subrule-dot" /> <span className="text-base">Four of a Kind: <span className="font-bold text-blue-500">Sum of all dice</span></span></li>
              <li className="flex items-center"><span className="subrule-dot" /> <span className="text-base">{isJerryGame || isMernGame ? "Boat" : "Full House"}: <span className="font-bold text-purple-600">25 points</span></span></li>
              <li className="flex items-center"><span className="subrule-dot" /> <span className="text-base">{isJerryGame || isMernGame ? "Smalls" : "Small Straight"}: <span className="font-bold text-pink-600">30 points</span></span></li>
              <li className="flex items-center"><span className="subrule-dot" /> <span className="text-base">{isJerryGame || isMernGame ? "Biggie" : "Large Straight"}: <span className="font-bold text-pink-600">40 points</span></span></li>
              <li className="flex items-center"><span className="subrule-dot" /> <span className="text-base">Chance: <span className="font-bold text-blue-500">Sum of all dice</span></span></li>
            </ul>
          </div>
        </li>
        <li>
          <div className="my-4 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 p-4 shadow-md flex items-center gap-4">
            <span className="text-3xl animate-bounce">🎉</span>
            <span className="text-base"><span className="font-extrabold text-yellow-600">Yahtzee Bonus!</span> If you roll more than one Yahtzee in a game and have already scored <span className="font-bold text-yellow-700">50</span> in the Yahtzee category, you earn a <span className="font-bold text-yellow-700">100 point bonus</span> for each additional Yahtzee.</span>
          </div>
        </li>
        <li>
          <div className="my-2 rounded-2xl bg-gradient-to-r from-pink-100 via-pink-50 to-white p-4 shadow flex items-center gap-4">
            <span className="text-2xl">🃏</span>
            <span className="text-base"><span className="font-extrabold text-pink-600">Joker Rule:</span> If the Yahtzee category is filled (with 0 or 50) and the corresponding upper section is filled, you <span className="font-bold text-pink-600">must</span> use the Yahtzee as a joker to fill a lower section category, scoring that category as normal.</span>
          </div>
        </li>
        <li className="flex items-start">
          <span className="rule-emoji">🏆</span>
          <span className="text-base">The player with the <span className="font-bold text-green-600">highest total score</span> at the end of the game wins!</span>
        </li>
      </ul>
      <style jsx>{`
        .rule-emoji {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          font-size: 1.5rem;
          border-radius: 9999px;
          margin-right: 0.75rem;
          flex-shrink: 0;
          background: linear-gradient(135deg, #f0f4ff 60%, #e0e7ff 100%);
        }
        .subrule-dot {
          display: inline-block;
          width: 0.75rem;
          height: 0.75rem;
          background: linear-gradient(135deg, #60a5fa 60%, #a5b4fc 100%);
          border-radius: 9999px;
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  )
}

