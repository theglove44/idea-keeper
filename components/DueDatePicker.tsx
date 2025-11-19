import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

type DueDatePickerProps = {
  dueDate?: string; // ISO string
  onChange: (date: string | undefined) => void;
  className?: string;
};

const DueDatePicker: React.FC<DueDatePickerProps> = ({ dueDate, onChange, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);

  const formatDueDate = (iso?: string) => {
    if (!iso) return null;
    try {
      const date = new Date(iso);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffTime = dueDay.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { text: `Overdue by ${Math.abs(diffDays)} day(s)`, isOverdue: true };
      } else if (diffDays === 0) {
        return { text: 'Due today', isToday: true };
      } else if (diffDays === 1) {
        return { text: 'Due tomorrow', isSoon: true };
      } else if (diffDays <= 7) {
        return { text: `Due in ${diffDays} days`, isSoon: true };
      } else {
        return { text: date.toLocaleDateString(), isNormal: true };
      }
    } catch {
      return null;
    }
  };

  const dueDateInfo = formatDueDate(dueDate);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Convert to ISO string
      const date = new Date(value);
      onChange(date.toISOString());
    } else {
      onChange(undefined);
    }
    setIsEditing(false);
  };

  const handleRemove = () => {
    onChange(undefined);
    setIsEditing(false);
  };

  const getInputValue = () => {
    if (!dueDate) return '';
    try {
      const date = new Date(dueDate);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          type="date"
          value={getInputValue()}
          onChange={handleDateChange}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple-500"
        />
        {dueDate && (
          <motion.button
            onClick={handleRemove}
            className="p-1 rounded text-red-400 hover:bg-red-500/10 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="close" className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    );
  }

  if (!dueDate) {
    return (
      <motion.button
        onClick={() => setIsEditing(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition text-sm ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon name="calendar" className="w-4 h-4" />
        <span>Add due date</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={() => setIsEditing(true)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition ${className} ${
        dueDateInfo?.isOverdue
          ? 'bg-red-500/10 border-red-500/50 text-red-400'
          : dueDateInfo?.isToday
            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
            : dueDateInfo?.isSoon
              ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
              : 'bg-slate-800/50 border-slate-700 text-slate-300'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon name="calendar" className="w-4 h-4" />
      <span>{dueDateInfo?.text || 'Due date'}</span>
    </motion.button>
  );
};

export default DueDatePicker;
