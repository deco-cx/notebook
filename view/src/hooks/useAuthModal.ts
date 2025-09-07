import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState('');
  const { isLoggedIn } = useAuth();

  const requireAuth = useCallback((featureName: string): boolean => {
    if (!isLoggedIn) {
      setFeature(featureName);
      setIsOpen(true);
      return false;
    }
    return true;
  }, [isLoggedIn]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setFeature('');
  }, []);

  return {
    isOpen,
    feature,
    requireAuth,
    closeModal
  };
}
