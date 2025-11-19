import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriorityLevel } from '../types';
import Icon from './Icon';

type PrioritySelectorProps = {
  priority?: PriorityLevel;
  onChange: (priority: PriorityLevel | undefined) => void;
  className?: string;
};

const priorityOptions: { value: PriorityLevel; label: string; color: string; icon: string }[] = [
  { value: 'low', label: 'Low', color: 'slate', icon: 'minus' },
  { value: 'medium', label: 'Medium', color: 'blue', icon: 'equals' },
  { value: 'high', label: 'High', color: 'amber', icon: 'arrow-up' },
  { value: 'critical', label: 'Critical', color: 'red', icon: 'alert' },
];

const PrioritySelector: React.FC<PrioritySelectorProps> = ({ priority, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentPriority = priorityOptions.find((p) => p.value === priority);

  const handleSelect = (value: PriorityLevel) => {
    onChange(value);
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition ${
          currentPriority
            ? `bg-${currentPriority.color}-500/10 border-${currentPriority.color}-500/50 text-${currentPriority.color}-400`
            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon name={currentPriority?.icon || 'flag'} className="w-4 h-4" />
        <span>{currentPriority?.label || 'Set priority'}</span>
        {currentPriority && (
          <motion.span
            onClick={handleRemove}
            className="ml-1 hover:bg-black/20 rounded-full p-0.5"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="close" className="w-3 h-3" />
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
            >
              {priorityOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition hover:bg-slate-700 ${
                    priority === option.value ? 'bg-slate-700' : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <Icon name={option.icon} className={`w-4 h-4 text-${option.color}-400`} />
                  <span className={`text-${option.color}-400`}>{option.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrioritySelector;
