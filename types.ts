export interface Card {
  id: string;
  text: string;
  createdAt: string; // ISO string
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
