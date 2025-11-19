import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

type AssigneeSelectorProps = {
  assignees?: string[];
  onChange: (assignees: string[]) => void;
  className?: string;
};

// Generate a consistent color for each user based on their name
const getUserColor = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({ assignees = [], onChange, className = '' }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');

  const handleAdd = () => {
    const trimmed = newAssignee.trim();
    if (trimmed && !assignees.includes(trimmed)) {
      onChange([...assignees, trimmed]);
    }
    setNewAssignee('');
    setIsAdding(false);
  };

  const handleRemove = (assignee: string) => {
    onChange(assignees.filter((a) => a !== assignee));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewAssignee('');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Display assignees */}
      <div className="flex -space-x-2">
        <AnimatePresence>
          {assignees.map((assignee) => (
            <motion.div
              key={assignee}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="group relative"
            >
              <div
                className={`w-8 h-8 rounded-full ${getUserColor(assignee)} flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-900 cursor-pointer hover:z-10 transition`}
                title={assignee}
              >
                {getInitials(assignee)}
              </div>
              {/* Remove button on hover */}
              <motion.button
                onClick={() => handleRemove(assignee)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-20"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon name="close" className="w-2.5 h-2.5 text-white" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add assignee button/input */}
      {isAdding ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          className="flex items-center gap-1"
        >
          <input
            type="text"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAdd}
            placeholder="Enter name..."
            autoFocus
            className="px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple-500 w-32"
          />
        </motion.div>
      ) : (
        <motion.button
          onClick={() => setIsAdding(true)}
          className="w-8 h-8 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:border-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Add assignee"
        >
          <Icon name="plus" className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};

export default AssigneeSelector;
