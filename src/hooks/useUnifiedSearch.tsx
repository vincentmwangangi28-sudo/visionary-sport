import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SearchItemType } from '@/services/unifiedSearch';

interface UnifiedSearchContextType {
  isOpen: boolean;
  openSearch: (initialQuery?: string, initialCategory?: 'all' | SearchItemType) => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  query: string;
  setQuery: (q: string) => void;
  activeCategory: 'all' | SearchItemType;
  setActiveCategory: (cat: 'all' | SearchItemType) => void;
}

const UnifiedSearchContext = createContext<UnifiedSearchContextType | undefined>(undefined);

export const UnifiedSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | SearchItemType>('all');

  const openSearch = useCallback((initialQuery = '', initialCategory: 'all' | SearchItemType = 'all') => {
    if (initialQuery) setQuery(initialQuery);
    if (initialCategory) setActiveCategory(initialCategory);
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Global keyboard shortcuts: Cmd+K / Ctrl+K and /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // '/' trigger when not in an interactive input
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement;
        const isEditable = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' || 
          target.isContentEditable;
        
        if (!isEditable) {
          e.preventDefault();
          setIsOpen(true);
        }
      }

      // Esc trigger to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <UnifiedSearchContext.Provider
      value={{
        isOpen,
        openSearch,
        closeSearch,
        toggleSearch,
        query,
        setQuery,
        activeCategory,
        setActiveCategory,
      }}
    >
      {children}
    </UnifiedSearchContext.Provider>
  );
};

export const useUnifiedSearch = (): UnifiedSearchContextType => {
  const context = useContext(UnifiedSearchContext);
  if (!context) {
    throw new Error('useUnifiedSearch must be used within a UnifiedSearchProvider');
  }
  return context;
};
