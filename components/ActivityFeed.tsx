import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from '../types';
import Icon from './Icon';

type ActivityFeedProps = {
  activities: Activity[];
  className?: string;
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, className = '' }) => {
  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const getActivityIcon = (type: Activity['type']): { name: any; color: string } => {
    switch (type) {
      case 'card_created':
        return { name: 'plus', color: 'text-green-400' };
      case 'card_moved':
        return { name: 'arrow-up', color: 'text-blue-400' };
      case 'card_updated':
        return { name: 'pencil', color: 'text-purple-400' };
      case 'comment_added':
        return { name: 'chat', color: 'text-cyan-400' };
      case 'assignee_added':
      case 'assignee_removed':
        return { name: 'users', color: 'text-amber-400' };
      case 'due_date_set':
      case 'due_date_changed':
        return { name: 'calendar', color: 'text-pink-400' };
      case 'priority_changed':
        return { name: 'flag', color: 'text-red-400' };
      case 'tag_added':
      case 'tag_removed':
        return { name: 'tag', color: 'text-indigo-400' };
      default:
        return { name: 'pencil', color: 'text-slate-400' };
    }
  };

  const getActivityText = (activity: Activity): string => {
    const user = activity.user || 'Someone';
    switch (activity.type) {
      case 'card_created':
        return `${user} created this card`;
      case 'card_moved':
        return `${user} moved this card`;
      case 'card_updated':
        return `${user} updated this card`;
      case 'comment_added':
        return `${user} added a comment`;
      case 'assignee_added':
        return `${user} assigned ${activity.metadata?.assignee || 'someone'}`;
      case 'assignee_removed':
        return `${user} removed ${activity.metadata?.assignee || 'someone'}`;
      case 'due_date_set':
        return `${user} set due date`;
      case 'due_date_changed':
        return `${user} changed due date`;
      case 'priority_changed':
        return `${user} changed priority to ${activity.metadata?.priority || 'unknown'}`;
      case 'tag_added':
        return `${user} added tag "${activity.metadata?.tag || 'unknown'}"`;
      case 'tag_removed':
        return `${user} removed tag "${activity.metadata?.tag || 'unknown'}"`;
      default:
        return `${user} made a change`;
    }
  };

  if (activities.length === 0) {
    return (
      <div className={`text-center py-6 text-slate-500 text-sm ${className}`}>
        No activity yet
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {activities.map((activity, index) => {
        const iconInfo = getActivityIcon(activity.type);
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition"
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center ${iconInfo.color}`}>
              <Icon name={iconInfo.name} className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">{getActivityText(activity)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatTimestamp(activity.createdAt)}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
