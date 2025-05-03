import type React from "react"

export const culturalBackgrounds: Record<string, React.ReactNode> = {
  // USA illustration (Large, spread out stars pattern with additional stars on the right)
  usa: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    >
      <g>
        {[...Array(22)].map((_, i) => {
          let x, y
          if (i < 20) {
            x = (i % 5) * 200 + Math.random() * 100
            y = Math.floor(i / 5) * 100 + Math.random() * 50
          } else {
            // Position the last two stars on the right side
            x = 700 + Math.random() * 50
            y = (i - 20) * 200 + Math.random() * 100
          }
          const scale = Math.random() * 0.5 + 1 // Larger scale
          return (
            <g key={i} transform={`translate(${x}, ${y}) scale(${scale})`}>
              <path
                d="M0,-20 L5.9,-6.2 19.1,-6.2 7.6,2.4 11.8,16.2 0,7.6 -11.8,16.2 -7.6,2.4 -19.1,-6.2 -5.9,-6.2 Z"
                fill="#FFFFFF"
              />
              <circle cx="0" cy="0" r="3" fill="#FFFFFF" /> {/* Eye in the middle */}
            </g>
          )
        })}
      </g>
    </svg>
  ),

  // Turkish illustration (Hagia Sophia silhouette)
  turkey: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    >
      <g fill="#FFFFFF">
        {/* Hagia Sophia */}
        <path d="M300,300 L500,300 L500,200 Q400,100 300,200 Z" />
        <path d="M250,300 L550,300 L525,250 L275,250 Z" />
        <rect x="250" y="300" width="300" height="50" />
        {/* Minarets */}
        <rect x="200" y="150" width="20" height="200" />
        <path d="M200,150 L220,150 L210,100 Z" />
        <rect x="580" y="150" width="20" height="200" />
        <path d="M580,150 L600,150 L590,100 Z" />
      </g>
    </svg>
  ),

  // Egyptian illustration (Pyramids and Sphinx silhouette)
  egypt: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    >
      <g fill="#FFFFFF">
        {/* Pyramids */}
        <path d="M200,300 L400,100 L600,300 Z" />
        <path d="M100,300 L250,150 L400,300 Z" />
        {/* Sphinx */}
        <path d="M50,300 C100,250 150,250 200,300 L200,350 L50,350 Z" />
      </g>
    </svg>
  ),

  // Greek illustration (empty SVG - no background rectangle)
  greece: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    ></svg>
  ),

  // French illustration (empty SVG - no background rectangle)
  france: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    ></svg>
  ),

  // UK illustration (empty SVG - no background rectangle)
  uk: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    ></svg>
  ),

  // Russian illustration (empty SVG - no background rectangle)
  russia: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    ></svg>
  ),

  // Classic theme (empty SVG - no background rectangle)
  classic: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      aria-hidden="true"
    ></svg>
  ),
} 