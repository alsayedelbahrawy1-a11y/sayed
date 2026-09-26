import { Card, Deck, ReviewLog, AppSettings, Rating } from '../types';

const DB_NAME = 'StudyCardsDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  soundEnabled: true,
  ttsEnabled: false,
  hapticsEnabled: true,
  showTimer: true,
};

const DEFAULT_DECK: Deck = {
  id: 'default',
  name: 'General',
  description: 'Default collection for flashcards',
  createdAt: Date.now(),
};

const INITIAL_SAMPLE_CARDS: Card[] = [
  {
    id: 'jlngn3',
    deckId: 'default',
    front: 'What is the primary excitatory neurotransmitter in the central nervous system?',
    back: 'Glutamate\n\nActs on AMPA, NMDA, and kainate ionotropic receptors, as well as metabotropic GPCRs (mGluRs).',
    type: 'basic',
    tags: ['Neuro', 'Biochem'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    due: Date.now() - 3600000,
    interval: 1,
    easeFactor: 2.5,
    reps: 1,
    lapses: 0,
    state: 'review',
  },
  {
    id: 'qc6rx4',
    deckId: 'default',
    front: 'The largest artery in the human body is the {{c1::aorta::main artery}}, which originates directly from the {{c2::left ventricle::heart chamber}}.',
    back: 'The aorta distributes oxygenated blood to all parts of the systemic circulation via the systemic circuit.',
    type: 'cloze',
    tags: ['Anatomy', 'Cardio'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    due: Date.now() - 1800000,
    interval: 1,
    easeFactor: 2.5,
    reps: 1,
    lapses: 0,
    state: 'review',
  },
  {
    id: '9p23sm',
    deckId: 'default',
    front: 'Bicuspid Aortic Valve',
    back: 'Most common congenital heart defect (~1-2% population). Increases risk of aortic stenosis, regurgitation, and ascending aortic aneurysm/dissection.',
    type: 'reverse',
    tags: ['Cardiology', 'Pathology'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    due: Date.now() - 600000,
    interval: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    state: 'new',
  },
  {
    id: 'med004',
    deckId: 'default',
    front: `A 58-year-old male presents with crushing retrosternal chest pain.

ECG reveals:
| Leads | Findings |
|---|---|
| II, III, aVF | ST Elevation > 2mm |
| I, aVL | Reciprocal ST Depression |

What is the anatomical diagnosis and culprit vessel?`,
    back: `**Inferior Wall STEMI**

Culprit vessel:
* **Right Coronary Artery (RCA)** in ~85-90% of cases (right-dominant)
* **Left Circumflex Artery (LCx)** in remaining 10-15% (left-dominant)`,
    type: 'basic',
    tags: ['Emergency', 'ECG', 'Cardiology'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    due: Date.now(),
    interval: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    state: 'new',
  },
];

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cards store
      if (!db.objectStoreNames.contains('cards')) {
        const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardStore.createIndex('deckId', 'deckId', { unique: false });
        cardStore.createIndex('due', 'due', { unique: false });
        cardStore.createIndex('state', 'state', { unique: false });
        cardStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Decks store
      if (!db.objectStoreNames.contains('decks')) {
        const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
        deckStore.createIndex('name', 'name', { unique: false });
      }

      // Reviews store
      if (!db.objectStoreNames.contains('reviews')) {
        const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
        reviewStore.createIndex('cardId', 'cardId', { unique: false });
        reviewStore.createIndex('reviewTime', 'reviewTime', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = async (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;

      // Seed initial data if empty
      await seedInitialData(dbInstance);

      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function seedInitialData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(['decks', 'cards'], 'readwrite');
    const deckStore = tx.objectStore('decks');
    const cardStore = tx.objectStore('cards');

    const countReq = deckStore.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        deckStore.put(DEFAULT_DECK);
        for (const card of INITIAL_SAMPLE_CARDS) {
          cardStore.put(card);
        }
      }
      resolve();
    };
    countReq.onerror = () => resolve();
  });
}

// CARDS API
export async function getCards(deckId?: string): Promise<Card[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly');
    const store = tx.objectStore('cards');
    let request: IDBRequest<Card[]>;

    if (deckId && deckId !== 'all') {
      const index = store.index('deckId');
      request = index.getAll(deckId);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getCard(id: string): Promise<Card | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly');
    const store = tx.objectStore('cards');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCard(card: Card): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    const request = store.put({ ...card, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveCards(cards: Card[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');

    for (const card of cards) {
      store.put({ ...card, updatedAt: Date.now() });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCard(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCards(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');

    for (const id of ids) {
      store.delete(id);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// DECKS API
export async function getDecks(): Promise<Deck[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('decks', 'readonly');
    const store = tx.objectStore('decks');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDeck(deck: Deck): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('decks', 'readwrite');
    const store = tx.objectStore('decks');
    const request = store.put(deck);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDeck(id: string): Promise<void> {
  if (id === 'default') return; // Cannot delete default deck
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['decks', 'cards'], 'readwrite');
    const deckStore = tx.objectStore('decks');
    const cardStore = tx.objectStore('cards');

    deckStore.delete(id);

    // Reassign cards from deleted deck to default
    const index = cardStore.index('deckId');
    const req = index.getAll(id);
    req.onsuccess = () => {
      const cards = req.result || [];
      for (const card of cards) {
        card.deckId = 'default';
        cardStore.put(card);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// REVIEWS & SM-2 LOGIC
export async function addReviewLog(log: ReviewLog): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reviews', 'readwrite');
    const store = tx.objectStore('reviews');
    const request = store.put(log);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getReviewLogs(sinceMs: number = 0): Promise<ReviewLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reviews', 'readonly');
    const store = tx.objectStore('reviews');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      if (sinceMs > 0) {
        resolve(all.filter((l) => l.reviewTime >= sinceMs));
      } else {
        resolve(all);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteReviewLog(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reviews', 'readwrite');
    const store = tx.objectStore('reviews');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Calculates next SM-2 parameters for a given rating
 */
export function calculateSM2(
  card: Card,
  rating: Rating
): {
  newInterval: number;
  newEase: number;
  newDue: number;
  newState: Card['state'];
  reps: number;
  lapses: number;
} {
  let interval = card.interval;
  let ease = card.easeFactor || 2.5;
  let reps = card.reps || 0;
  let lapses = card.lapses || 0;
  let state = card.state;
  const now = Date.now();

  switch (rating) {
    case 1: // Again
      lapses += 1;
      reps = 0;
      interval = 0;
      // Due in 10 minutes
      const againDue = now + 10 * 60 * 1000;
      ease = Math.max(1.3, ease - 0.2);
      state = 'learning';
      return {
        newInterval: 0,
        newEase: Number(ease.toFixed(2)),
        newDue: againDue,
        newState: state,
        reps,
        lapses,
      };

    case 2: // Hard
      interval = card.interval <= 0 ? 1 : Math.max(1, Math.round(card.interval * 1.2));
      ease = Math.max(1.3, ease - 0.15);
      reps += 1;
      state = 'review';
      break;

    case 3: // Good
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 6;
      } else {
        interval = Math.max(1, Math.round(card.interval * ease));
      }
      reps += 1;
      state = 'review';
      break;

    case 4: // Easy
      if (reps === 0) {
        interval = 4;
      } else {
        interval = Math.max(1, Math.round(card.interval * ease * 1.3));
      }
      ease = Number((ease + 0.15).toFixed(2));
      reps += 1;
      state = 'review';
      break;
  }

  const newDue = now + interval * 24 * 60 * 60 * 1000;
  return {
    newInterval: interval,
    newEase: Number(ease.toFixed(2)),
    newDue,
    newState: state,
    reps,
    lapses,
  };
}

/**
 * Predicts interval labels for UI buttons
 */
export function getIntervalLabels(card: Card): Record<Rating, string> {
  const ratings: Rating[] = [1, 2, 3, 4];
  const labels: Record<Rating, string> = {
    1: '< 10m',
    2: '1d',
    3: '1d',
    4: '4d',
  };

  for (const r of ratings) {
    if (r === 1) {
      labels[1] = '< 10m';
      continue;
    }
    const { newInterval } = calculateSM2(card, r);
    if (newInterval < 1) {
      labels[r] = '< 1d';
    } else if (newInterval === 1) {
      labels[r] = '1d';
    } else if (newInterval < 30) {
      labels[r] = `${newInterval}d`;
    } else if (newInterval < 365) {
      labels[r] = `${Math.round(newInterval / 30)}mo`;
    } else {
      labels[r] = `${(newInterval / 365).toFixed(1)}y`;
    }
  }

  return labels;
}

// SETTINGS API
export async function getSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get('app_settings');

    request.onsuccess = () => {
      if (request.result && request.result.value) {
        resolve({ ...DEFAULT_SETTINGS, ...request.result.value });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    request.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const request = store.put({ key: 'app_settings', value: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// BACKUP & RESTORE
export async function exportFullBackup(): Promise<{
  version: number;
  exportedAt: string;
  cards: Card[];
  decks: Deck[];
  reviews: ReviewLog[];
  settings: AppSettings;
}> {
  const [cards, decks, reviews, settings] = await Promise.all([
    getCards('all'),
    getDecks(),
    getReviewLogs(),
    getSettings(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
    decks,
    reviews,
    settings,
  };
}

export async function restoreFullBackup(backupData: any): Promise<void> {
  if (!backupData || !Array.isArray(backupData.cards)) {
    throw new Error('Invalid backup file format: missing cards array.');
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['cards', 'decks', 'reviews', 'settings'], 'readwrite');

    const cardStore = tx.objectStore('cards');
    const deckStore = tx.objectStore('decks');
    const reviewStore = tx.objectStore('reviews');
    const settingsStore = tx.objectStore('settings');

    // Clear existing
    cardStore.clear();
    deckStore.clear();
    reviewStore.clear();

    // Populate decks
    const decks = Array.isArray(backupData.decks) && backupData.decks.length > 0 ? backupData.decks : [DEFAULT_DECK];
    for (const d of decks) {
      deckStore.put(d);
    }

    // Populate cards
    for (const c of backupData.cards) {
      cardStore.put(c);
    }

    // Populate reviews
    if (Array.isArray(backupData.reviews)) {
      for (const r of backupData.reviews) {
        reviewStore.put(r);
      }
    }

    // Populate settings
    if (backupData.settings) {
      settingsStore.put({ key: 'app_settings', value: backupData.settings });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetDatabase(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['cards', 'decks', 'reviews'], 'readwrite');
    tx.objectStore('cards').clear();
    tx.objectStore('decks').clear();
    tx.objectStore('reviews').clear();

    const deckStore = tx.objectStore('decks');
    const cardStore = tx.objectStore('cards');

    deckStore.put(DEFAULT_DECK);
    for (const card of INITIAL_SAMPLE_CARDS) {
      cardStore.put(card);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
