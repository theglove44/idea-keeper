export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color?: string; // For avatar background
}

export interface Card {
  id: string;
  text: string;
  createdAt: string; // ISO string
  commentsCount?: number;
  // Due Dates & Time Tracking
  dueDate?: string; // ISO string
  estimatedHours?: number;
  actualHours?: number;
  priority?: PriorityLevel;
  // Collaboration
  assignedTo?: string[]; // User IDs or names (for now, before auth)
  createdBy?: string; // User ID or name
  // Labels & Tags
  tags?: string[];
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export interface Idea {
  id: string;
  title: string;
  summary: string;
  columns: Column[];
  createdAt: string; // ISO string
}

export interface CardComment {
  id: string;
  cardId: string;
  body: string;
  author?: string | null;
  createdAt: string; // ISO string
  mentions?: string[]; // @mentioned users
}

export type ActivityType =
  | 'card_created'
  | 'card_moved'
  | 'card_updated'
  | 'comment_added'
  | 'assignee_added'
  | 'assignee_removed'
  | 'due_date_set'
  | 'due_date_changed'
  | 'priority_changed'
  | 'tag_added'
  | 'tag_removed';

export interface Activity {
  id: string;
  cardId: string;
  ideaId: string;
  type: ActivityType;
  user?: string; // User name or ID
  metadata?: Record<string, any>; // Extra data (old/new values, etc.)
  createdAt: string; // ISO string
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MIReportPayload {
  ideaId: string;
  ideaTitle: string;
  columnId: string;
  columnTitle: string;
  cardId: string;
  cardText: string;
  summary: string;
  details: string;
  severity?: SeverityLevel;
}

export interface MIReportResult {
  id: string;
  filePath: string;
}

export interface UpgradeChecklistItem {
  label: string;
  completed: boolean;
}

export interface UpgradeReportPayload {
  ideaId: string;
  ideaTitle: string;
  columnId: string;
  columnTitle: string;
  cardId: string;
  cardText: string;
  description: string;
  plan: string;
  estimate: string;
  checklist: string[];
}

export interface UpgradeReportResult {
  id: string;
  filePath: string;
}
