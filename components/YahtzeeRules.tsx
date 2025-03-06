export function GameRules() {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 mb-8 text-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-blue-600">Pocket Score Rules</h2>
      <ul className="space-y-4">
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">1</span>
          <span>The game consists of 13 rounds.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">2</span>
          <span>In each round, you roll five dice up to three times.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">3</span>
          <span>After each roll, you can choose to keep any number of dice and reroll the rest.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">4</span>
          <span>After your third roll (or earlier if you choose), you must score in one of the 13 categories.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">5</span>
          <span>Each category can only be scored once per game.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">6</span>
          <span>The upper section categories (Ones through Sixes) score the sum of the dice showing that number.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">7</span>
          <span>If you score 63 or more points in the upper section, you get a bonus of 35 points.</span>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">8</span>
          <span>Lower section categories have specific requirements:</span>
          <ul className="ml-9 mt-2 space-y-2">
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Three of a Kind: At least three dice showing the same number. Score is the sum of all dice.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Four of a Kind: At least four dice showing the same number. Score is the sum of all dice.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Full House: Three of one number and two of another. Scores 25 points.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Small Straight: Four sequential dice (e.g., 1-2-3-4, 2-3-4-5, or 3-4-5-6). Scores 30 points.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Large Straight: Five sequential dice (1-2-3-4-5 or 2-3-4-5-6). Scores 40 points.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Yahtzee: All five dice showing the same number. Scores 50 points.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2 mt-1.5"></span>
              <span>Chance: Can be used for any roll. Score is the sum of all dice.</span>
            </li>
          </ul>
        </li>
        <li className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold mr-3 flex-shrink-0 text-sm">9</span>
          <span>The player with the highest total score at the end of the game wins.</span>
        </li>
      </ul>
    </div>
  )
}

