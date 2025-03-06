import { useState, useCallback } from 'react';

interface ErrorState {
  hasError: boolean;
  message: string;
}

const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '' });

  const handleError = useCallback((message: string) => {
    setError({ hasError: true, message });
  }, []);

  const clearError = useCallback(() => {
    setError({ hasError: false, message: '' });
  }, []);

  return { error, handleError, clearError };
};

export default useErrorHandler;

