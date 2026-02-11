import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

type TagSelectorProps = {
  tags?: string[];
  onChange: (tags: string[]) => void;
  className?: string;
  suggestions?: string[]; // Common tags to suggest
};

const defaultSuggestions = ['frontend', 'backend', 'bug', 'feature', 'design', 'urgent', 'research'];

// Get consistent color for each tag
const getTagColor = (tag: string): string => {
  const colors = [
    { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
    { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
    { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
    { bg: 'bg-lime-500/20', border: 'border-lime-500/50', text: 'text-lime-400' },
    { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
    { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-400' },
    { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
    { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
    { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400' },
    { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-400' },
    { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
    { bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50', text: 'text-fuchsia-400' },
    { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
  ];

  const hash = tag.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const TagSelector: React.FC<TagSelectorProps> = ({
  tags = [],
  onChange,
  className = '',
  suggestions = defaultSuggestions,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(newTag.toLowerCase())
  );

  const handleAdd = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setNewTag('');
    setIsAdding(false);
    setShowSuggestions(false);
  };

  const handleRemove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleAdd(filteredSuggestions[0]);
      } else {
        handleAdd(newTag);
      }
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTag('');
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Display tags */}
      <AnimatePresence>
        {tags.map((tag) => {
          const colors = getTagColor(tag);
          return (
            <motion.div
              key={tag}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors.bg} ${colors.border} ${colors.text}`}
            >
              <Icon name="tag" className="w-3 h-3" />
              <span>{tag}</span>
              <motion.button
                onClick={() => handleRemove(tag)}
                className="opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded-full p-0.5 transition"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon name="close" className="w-2.5 h-2.5" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add tag button/input */}
      {isAdding ? (
        <div className="relative">
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={newTag}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                setTimeout(() => {
                  setIsAdding(false);
                  setShowSuggestions(false);
                  setNewTag('');
                }, 200);
              }}
              placeholder="Enter tag..."
              autoFocus
              className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple-500 w-24"
            />
          </motion.div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-10 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
              >
                {filteredSuggestions.slice(0, 5).map((suggestion) => {
                  const colors = getTagColor(suggestion);
                  return (
                    <motion.button
                      key={suggestion}
                      onClick={() => handleAdd(suggestion)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs transition hover:bg-slate-700 ${colors.text}`}
                      whileHover={{ x: 2 }}
                    >
                      <Icon name="tag" className="w-3 h-3" />
                      <span>{suggestion}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition text-xs"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Add tag"
        >
          <Icon name="tag" className="w-3 h-3" />
          <span>Add tag</span>
        </motion.button>
      )}
    </div>
  );
};

export default TagSelector;
