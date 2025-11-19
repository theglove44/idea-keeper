import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Idea, Card } from '../types';
import Icon from './Icon';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: Idea[];
  onSelectCard: (ideaId: string, columnId: string, cardId: string) => void;
  onSelectIdea: (ideaId: string) => void;
}

interface SearchResult {
  type: 'idea' | 'card';
  id: string;
  title: string;
  subtitle?: string;
  ideaId?: string;
  columnId?: string;
  cardId?: string;
  score: number;
}

// Simple fuzzy matching algorithm
function fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
  text = text.toLowerCase();
  query = query.toLowerCase();

  // Exact match gets highest score
  if (text === query) {
    return { matches: true, score: 1000 };
  }

  // Contains match gets high score
  if (text.includes(query)) {
    return { matches: true, score: 500 + (100 / text.length) };
  }

  // Fuzzy match
  let queryIndex = 0;
  let textIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      score += consecutiveMatches * 10;
    } else {
      consecutiveMatches = 0;
    }
    textIndex++;
  }

  const matches = queryIndex === query.length;
  return { matches, score: matches ? score : 0 };
}

export default function SearchModal({
  isOpen,
  onClose,
  ideas,
  onSelectCard,
  onSelectIdea,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search through all ideas and cards
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent ideas when no query
      return ideas.slice(0, 5).map((idea) => ({
        type: 'idea' as const,
        id: idea.id,
        title: idea.title,
        subtitle: idea.summary,
        score: 0,
      }));
    }

    const searchResults: SearchResult[] = [];

    ideas.forEach((idea) => {
      // Search idea title and summary
      const titleMatch = fuzzyMatch(idea.title, query);
      const summaryMatch = fuzzyMatch(idea.summary || '', query);

      if (titleMatch.matches || summaryMatch.matches) {
        searchResults.push({
          type: 'idea',
          id: idea.id,
          title: idea.title,
          subtitle: idea.summary,
          score: Math.max(titleMatch.score, summaryMatch.score) + 100, // Boost ideas
        });
      }

      // Search cards within idea
      idea.columns.forEach((column) => {
        column.cards.forEach((card) => {
          const cardMatch = fuzzyMatch(card.text, query);
          if (cardMatch.matches) {
            searchResults.push({
              type: 'card',
              id: card.id,
              title: card.text,
              subtitle: `${idea.title} • ${column.title}`,
              ideaId: idea.id,
              columnId: column.id,
              cardId: card.id,
              score: cardMatch.score,
            });
          }
        });
      });
    });

    // Sort by score
    return searchResults.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [query, ideas]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedIndex, results]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const selected = resultsRef.current?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'idea') {
      onSelectIdea(result.id);
    } else if (result.type === 'card' && result.ideaId && result.columnId && result.cardId) {
      onSelectCard(result.ideaId, result.columnId, result.cardId);
    }
    onClose();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-brand-purple/30 text-text-primary">{text.slice(index, index + query.length)}</mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-surface-dark border border-border-subtle rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="border-b border-border-subtle p-4">
              <div className="flex items-center gap-3">
                <Icon name="sparkles" className="w-5 h-5 text-brand-purple" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search ideas and cards..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-lg outline-none"
                />
                <kbd className="px-2 py-1 text-xs font-semibold text-text-secondary bg-surface-base border border-border-subtle rounded">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Results */}
            <div
              ref={resultsRef}
              className="max-h-[400px] overflow-y-auto scrollbar-custom"
            >
              {results.length === 0 && query.trim() && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
                    <Icon name="sparkles" className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-text-secondary">No results found for "{query}"</p>
                </div>
              )}

              {results.length === 0 && !query.trim() && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 flex items-center justify-center">
                    <Icon name="sparkles" className="w-8 h-8 text-brand-purple" />
                  </div>
                  <p className="text-text-secondary">Start typing to search...</p>
                  <p className="text-text-muted text-sm mt-2">
                    {ideas.length === 0
                      ? 'No ideas yet'
                      : `Search across ${ideas.length} idea${ideas.length === 1 ? '' : 's'}`}
                  </p>
                </div>
              )}

              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full text-left p-4 border-b border-border-subtle last:border-b-0 transition-colors ${
                    index === selectedIndex
                      ? 'bg-brand-purple/10 border-l-4 border-l-brand-purple'
                      : 'hover:bg-surface-elevated border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        result.type === 'idea'
                          ? 'bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20'
                          : 'bg-surface-elevated'
                      }`}
                    >
                      <Icon
                        name={result.type === 'idea' ? 'sparkles' : 'message'}
                        className={`w-4 h-4 ${
                          result.type === 'idea' ? 'text-brand-purple' : 'text-text-secondary'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-text-primary font-medium truncate">
                        {highlightMatch(result.title, query)}
                      </div>
                      {result.subtitle && (
                        <div className="text-text-secondary text-sm truncate mt-1">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <div className="text-text-muted text-xs flex items-center gap-1">
                        <Icon name="check" className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="border-t border-border-subtle px-4 py-3 bg-surface-elevated flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-base border border-border-subtle rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-surface-base border border-border-subtle rounded">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-base border border-border-subtle rounded">↵</kbd>
                    to select
                  </span>
                </div>
                <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
