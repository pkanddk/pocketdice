import { useState, useCallback } from 'react';

export const useAnimation = (duration: number = 500) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  }, [duration]);

  return { isAnimating, startAnimation };
};

