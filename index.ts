export type CardType = 'basic' | 'cloze' | 'reverse';

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  type: CardType;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  due: number; // timestamp in ms
  interval: number; // in days (0 = immediate/today)
  easeFactor: number; // default 2.5
  reps: number;
  lapses: number;
  state: CardState;
  suspended?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: Rating;
  reviewTime: number; // timestamp ms
  lastInterval: number;
  newInterval: number;
  lastEase: number;
  newEase: number;
  timeTakenMs?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  dailyNewLimit: number;
  dailyReviewLimit: number;
  soundEnabled: boolean;
  ttsEnabled: boolean;
  ttsVoice?: string;
  hapticsEnabled: boolean;
  showTimer: boolean;
}

export interface ParsedCard {
  id?: string;
  type: CardType;
  front: string;
  back: string;
  tags: string[];
  rawText?: string;
  lineNumber?: number;
  warnings?: string[];
}

export interface ParseResult {
  cards: ParsedCard[];
  errors: string[];
  warnings: string[];
}

export interface StudyStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueTodayCount: number;
  totalReviews: number;
  retentionRate: number; // percentage (ratings >= 2 / total reviews)
  forecast: { [dateStr: string]: number };
  recentLogs: ReviewLog[];
}
