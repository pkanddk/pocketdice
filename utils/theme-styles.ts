// Theme styles for different countries
export type ThemeStyle = {
  boardBackground: string
  woodGrain: string
  barColor: string
  lightPointColor: string
  darkPointColor: string
  player1Color: string
  player2Color: string
  borderColor: string
  highlightColor: string
  diceBackground: string
}

export const themeStyles: Record<string, ThemeStyle> = {
  classic: {
    boardBackground: "linear-gradient(to right, #8B4513, #A0522D)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#6D4C41] via-[#5D4037] to-[#6D4C41]",
    lightPointColor: "rgba(245, 245, 220, 0.9)",
    darkPointColor: "rgba(139, 69, 19, 0.9)",
    player1Color: "radial-gradient(circle at 40% 40%, #1a1a1a 0%, #222222 40%, #000000 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 100%)",
    borderColor: "#5D4037",
    highlightColor: "rgba(255,255,255,0.1)",
    diceBackground: "bg-black/40",
  },
  turkey: {
    boardBackground: "linear-gradient(to right, #1F2937, #374151)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.8'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#E30A17] via-[#C70A17] to-[#E30A17]",
    lightPointColor: "rgba(255, 255, 255, 0.9)",
    darkPointColor: "rgba(227, 10, 23, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #E30A17 0%, #C70A17 40%, #B00A17 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 100%)",
    borderColor: "#C70A17",
    highlightColor: "rgba(255,255,255,0.15)",
    diceBackground: "bg-red-900/40",
  },
  egypt: {
    boardBackground: "linear-gradient(to right, #C09E6B, #E5BA73)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.7'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#D4AF37] via-[#FFD700] to-[#D4AF37]",
    lightPointColor: "rgba(229, 186, 115, 0.9)",
    darkPointColor: "rgba(0, 0, 0, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #000000 0%, #111111 40%, #222222 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #D4AF37 0%, #FFD700 40%, #D4AF37 100%)",
    borderColor: "#D4AF37",
    highlightColor: "rgba(255,255,255,0.2)",
    diceBackground: "bg-yellow-900/40",
  },
  greece: {
    boardBackground: "linear-gradient(to right, #0D5EAF, #1A73E8)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#0D5EAF] via-[#0A4C8C] to-[#0D5EAF]",
    lightPointColor: "rgba(255, 255, 255, 0.9)",
    darkPointColor: "rgba(13, 94, 175, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #0D5EAF 0%, #0A4C8C 40%, #083A6F 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 100%)",
    borderColor: "#0A4C8C",
    highlightColor: "rgba(255,255,255,0.15)",
    diceBackground: "bg-blue-900/40",
  },
  france: {
    boardBackground: "linear-gradient(to right, #002395, #002395)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#FFFFFF] via-[#F5F5F5] to-[#FFFFFF]",
    lightPointColor: "rgba(255, 255, 255, 0.9)",
    darkPointColor: "rgba(237, 41, 57, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #ED2939 0%, #D42939 40%, #B52939 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #002395 0%, #001F7D 40%, #001A66 100%)",
    borderColor: "#002395",
    highlightColor: "rgba(255,255,255,0.15)",
    diceBackground: "bg-blue-900/40",
  },
  uk: {
    boardBackground: "linear-gradient(to right, #00247D, #00247D)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#CF142B] via-[#BF142B] to-[#CF142B]",
    lightPointColor: "rgba(255, 255, 255, 0.9)",
    darkPointColor: "rgba(207, 20, 43, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #CF142B 0%, #BF142B 40%, #AF142B 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 100%)",
    borderColor: "#00247D",
    highlightColor: "rgba(255,255,255,0.15)",
    diceBackground: "bg-blue-900/40",
  },
  russia: {
    boardBackground: "linear-gradient(to right, #0039A6, #0039A6)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#FFFFFF] via-[#F5F5F5] to-[#FFFFFF]",
    lightPointColor: "rgba(255, 255, 255, 0.9)",
    darkPointColor: "rgba(213, 43, 30, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #D52B1E 0%, #C52B1E 40%, #B52B1E 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 100%)",
    borderColor: "#0039A6",
    highlightColor: "rgba(255,255,255,0.15)",
    diceBackground: "bg-blue-900/40",
  },
  usa: {
    boardBackground: "linear-gradient(to right, #3C3B6E, #3C3B6E)",
    woodGrain:
      "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E\")",
    barColor: "bg-gradient-to-b from-[#FFFFFF] via-[#F5F5F5] to-[#FFFFFF]",
    lightPointColor: "rgba(255, 255, 255, 0.9)",
    darkPointColor: "rgba(178, 34, 52, 0.8)",
    player1Color: "radial-gradient(circle at 40% 40%, #B22234 0%, #A22234 40%, #922234 100%)",
    player2Color: "radial-gradient(circle at 40% 40%, #FFFFFF 0%, #F5F5F5 40%, #E8E8E8 100%)",
    borderColor: "#3C3B6E",
    highlightColor: "rgba(255,255,255,0.15)",
    diceBackground: "bg-blue-900/40",
  },
}

export const getThemeStyle = (theme: string): ThemeStyle => {
  const style = themeStyles[theme];
  return style ? style : themeStyles.classic;
} 