export interface Card {
  id: string;
  text: string;
  createdAt: string; // ISO string
  commentsCount?: number;
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
