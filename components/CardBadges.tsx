import React from 'react';
import { Card } from '../types';
import Icon from './Icon';

type CardBadgesProps = {
  card: Card;
  compact?: boolean;
  className?: string;
};

const CardBadges: React.FC<CardBadgesProps> = ({ card, compact = false, className = '' }) => {
  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    try {
      const date = new Date(dueDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffTime = dueDay.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-400 bg-red-500/20 border-red-500/50', isOverdue: true };
      } else if (diffDays === 0) {
        return { text: 'Due today', color: 'text-amber-400 bg-amber-500/20 border-amber-500/50', isToday: true };
      } else if (diffDays <= 3) {
        return { text: `${diffDays}d`, color: 'text-amber-400 bg-amber-500/20 border-amber-500/50', isSoon: true };
      } else {
        return { text: `${diffDays}d`, color: 'text-slate-400 bg-slate-500/20 border-slate-500/50', isNormal: true };
      }
    } catch {
      return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
      case 'medium':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'low':
        return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'alert';
      case 'high':
        return 'arrow-up';
      case 'medium':
        return 'equals';
      case 'low':
        return 'minus';
      default:
        return 'flag';
    }
  };

  const dueDateStatus = getDueDateStatus(card.dueDate);
  const priorityColor = getPriorityColor(card.priority);
  const hasMetadata = dueDateStatus || card.priority || (card.assignedTo && card.assignedTo.length > 0) || (card.tags && card.tags.length > 0);

  if (!hasMetadata) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* Priority Badge */}
      {card.priority && priorityColor && (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${priorityColor}`}>
          <Icon name={getPriorityIcon(card.priority) as any} className="w-3 h-3" />
          {!compact && <span className="font-medium capitalize">{card.priority}</span>}
        </span>
      )}

      {/* Due Date Badge */}
      {dueDateStatus && (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${dueDateStatus.color}`}>
          <Icon name="calendar" className="w-3 h-3" />
          <span className="font-medium">{dueDateStatus.text}</span>
        </span>
      )}

      {/* Assignees Count */}
      {card.assignedTo && card.assignedTo.length > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs text-slate-400 bg-slate-500/20 border-slate-500/50">
          <Icon name="users" className="w-3 h-3" />
          {!compact && <span className="font-medium">{card.assignedTo.length}</span>}
        </span>
      )}

      {/* Tags (show first tag only in compact mode) */}
      {card.tags && card.tags.length > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs text-purple-400 bg-purple-500/20 border-purple-500/50">
          <Icon name="tag" className="w-3 h-3" />
          {!compact && (
            <span className="font-medium">
              {card.tags[0]}
              {card.tags.length > 1 && ` +${card.tags.length - 1}`}
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default CardBadges;
