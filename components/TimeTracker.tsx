import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

type TimeTrackerProps = {
  estimatedHours?: number;
  actualHours?: number;
  onEstimateChange: (hours: number | undefined) => void;
  onActualChange: (hours: number | undefined) => void;
  className?: string;
};

const TimeTracker: React.FC<TimeTrackerProps> = ({
  estimatedHours,
  actualHours,
  onEstimateChange,
  onActualChange,
  className = '',
}) => {
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [isEditingActual, setIsEditingActual] = useState(false);
  const [estimateValue, setEstimateValue] = useState(estimatedHours?.toString() || '');
  const [actualValue, setActualValue] = useState(actualHours?.toString() || '');

  const handleEstimateSave = () => {
    const value = parseFloat(estimateValue);
    onEstimateChange(isNaN(value) || value <= 0 ? undefined : value);
    setIsEditingEstimate(false);
  };

  const handleActualSave = () => {
    const value = parseFloat(actualValue);
    onActualChange(isNaN(value) || value <= 0 ? undefined : value);
    setIsEditingActual(false);
  };

  const handleEstimateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEstimateSave();
    } else if (e.key === 'Escape') {
      setEstimateValue(estimatedHours?.toString() || '');
      setIsEditingEstimate(false);
    }
  };

  const handleActualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleActualSave();
    } else if (e.key === 'Escape') {
      setActualValue(actualHours?.toString() || '');
      setIsEditingActual(false);
    }
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours}h`;
  };

  const getProgressColor = () => {
    if (!estimatedHours || !actualHours) return 'text-slate-400';
    const ratio = actualHours / estimatedHours;
    if (ratio > 1.2) return 'text-red-400';
    if (ratio > 0.9) return 'text-amber-400';
    return 'text-green-400';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Estimated Time */}
      <div className="flex items-center gap-2">
        <Icon name="clock" className="w-4 h-4 text-slate-500" />
        {isEditingEstimate ? (
          <input
            type="number"
            value={estimateValue}
            onChange={(e) => setEstimateValue(e.target.value)}
            onKeyDown={handleEstimateKeyDown}
            onBlur={handleEstimateSave}
            placeholder="Est."
            step="0.5"
            min="0"
            autoFocus
            className="w-16 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple-500"
          />
        ) : (
          <motion.button
            onClick={() => {
              setEstimateValue(estimatedHours?.toString() || '');
              setIsEditingEstimate(true);
            }}
            className="px-2 py-1 text-sm bg-slate-800/50 border border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Est: {formatHours(estimatedHours)}
          </motion.button>
        )}
      </div>

      <span className="text-slate-600">/</span>

      {/* Actual Time */}
      <div className="flex items-center gap-2">
        {isEditingActual ? (
          <input
            type="number"
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            onKeyDown={handleActualKeyDown}
            onBlur={handleActualSave}
            placeholder="Actual"
            step="0.5"
            min="0"
            autoFocus
            className="w-16 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple-500"
          />
        ) : (
          <motion.button
            onClick={() => {
              setActualValue(actualHours?.toString() || '');
              setIsEditingActual(true);
            }}
            className={`px-2 py-1 text-sm bg-slate-800/50 border border-slate-700 rounded hover:bg-slate-800 transition ${getProgressColor()}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Actual: {formatHours(actualHours)}
          </motion.button>
        )}
      </div>

      {/* Progress indicator */}
      {estimatedHours && actualHours && (
        <div className="flex items-center gap-1 text-xs">
          <span className={getProgressColor()}>
            {Math.round((actualHours / estimatedHours) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
