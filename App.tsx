import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Deck, ReviewLog, AppSettings, Rating } from './types';
import {
  openDB,
  getCards,
  saveCard,
  saveCards,
  deleteCard,
  deleteCards,
  getDecks,
  saveDeck,
  deleteDeck,
  getReviewLogs,
  addReviewLog,
  deleteReviewLog,
  getSettings,
  saveSettings,
  resetDatabase,
  DEFAULT_SETTINGS,
} from './db/indexedDB';
import { exportCardsToText } from './parser/cardParser';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { DeckCardItem } from './components/DeckCardItem';
import { CardBrowserView } from './components/CardBrowserView';
import { ReviewModal } from './components/ReviewModal';
import { AddCardsModal } from './components/AddCardsModal';
import { EditCardModal } from './components/EditCardModal';
import { InspectModal } from './components/InspectModal';
import { DeckDetailModal } from './components/DeckDetailModal';
import { TagManagerModal } from './components/TagManagerModal';
import { StatisticsModal } from './components/StatisticsModal';
import { SettingsModal } from './components/SettingsModal';
import { FormatGuideModal } from './components/FormatGuideModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  Play,
  Flame,
  PlusCircle,
  FolderPlus,
  Clock,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Database,
  Layers,
  BarChart3,
} from 'lucide-react';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Active Main View
  const [activeView, setActiveView] = useState<'dashboard' | 'browser'>('dashboard');

  // Search & Filter in Toolbar
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('all');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Card[]>([]);
  const [isCramMode, setIsCramMode] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [inspectingCard, setInspectingCard] = useState<Card | null>(null);
  const [deckDetail, setDeckDetail] = useState<Deck | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // Undo stack during review
  const [undoStack, setUndoStack] = useState<{ previousCard: Card; log: ReviewLog }[]>([]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme application
  const applyTheme = useCallback((theme: AppSettings['theme']) => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Initial Data Load
  const refreshAllData = useCallback(async () => {
    try {
      await openDB();
      const [allCards, allDecks, allLogs, savedSettings] = await Promise.all([
        getCards('all'),
        getDecks(),
        getReviewLogs(),
        getSettings(),
      ]);

      setCards(allCards);
      setDecks(allDecks);
      setReviewLogs(allLogs);
      setSettings(savedSettings);
      applyTheme(savedSettings.theme);
    } catch (e: any) {
      console.error('Failed to load local DB data:', e);
      showToast(`Database error: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [applyTheme, showToast]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Listen to system color scheme changes if system theme selected
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [settings.theme, applyTheme]);

  const toggleTheme = async () => {
    const nextTheme: AppSettings['theme'] = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    applyTheme(nextTheme);
    await saveSettings(updated);
    showToast(`Switched to ${nextTheme} theme`, 'info');
  };

  // Due cards calculation
  const now = Date.now();
  const dueCards = useMemo(() => {
    return cards.filter((c) => !c.suspended && c.due <= now);
  }, [cards, now]);

  // Start study / review session
  const handleStartReview = (deckId?: string, cram: boolean = false) => {
    let targetPool = cards.filter((c) => !c.suspended);
    if (deckId && deckId !== 'all') {
      targetPool = targetPool.filter((c) => c.deckId === deckId);
    }

    if (!cram) {
      // Regular SM-2 Review: only due cards
      targetPool = targetPool.filter((c) => c.due <= now);
    }

    if (targetPool.length === 0) {
      showToast(cram ? 'No cards available to practice in this deck.' : 'No cards due right now! Great job!', 'info');
      return;
    }

    // Shuffle queue slightly for variety
    const shuffled = [...targetPool].sort(() => Math.random() - 0.5);
    setReviewQueue(shuffled);
    setIsCramMode(cram);
    setUndoStack([]);
    setIsReviewModalOpen(true);
  };

  // Card Record Review in Study Session
  const handleRecordReview = async (updatedCard: Card, rating: Rating, log: ReviewLog) => {
    const existing = cards.find((c) => c.id === updatedCard.id);
    if (existing) {
      setUndoStack((prev) => [...prev, { previousCard: existing, log }]);
    }

    await saveCard(updatedCard);
    await addReviewLog(log);

    // Update local React state
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    setReviewLogs((prev) => [...prev, log]);
  };

  // Undo last card review
  const handleUndoLastReview = async () => {
    if (undoStack.length === 0) return;
    const lastItem = undoStack[undoStack.length - 1];
    const { previousCard, log } = lastItem;

    await saveCard(previousCard);
    await deleteReviewLog(log.id);

    setCards((prev) => prev.map((c) => (c.id === previousCard.id ? previousCard : c)));
    setReviewLogs((prev) => prev.filter((l) => l.id !== log.id));
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    showToast('Review rating undone!', 'info');
  };

  // Card CRUD Handlers
  const handleAddCards = async (newCards: Card[]) => {
    await saveCards(newCards);
    await refreshAllData();
  };

  const handleUpdateCard = async (updated: Card) => {
    await saveCard(updated);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCard = async (id: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      showToast('Card deleted.', 'info');
    }
  };

  const handleToggleSuspend = async (card: Card) => {
    const updated: Card = { ...card, suspended: !card.suspended };
    await saveCard(updated);
    setCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
    showToast(updated.suspended ? 'Card suspended.' : 'Card unsuspended.', 'info');
  };

  // Bulk Operations
  const handleBulkDelete = async (ids: string[]) => {
    await deleteCards(ids);
    setCards((prev) => prev.filter((c) => !ids.includes(c.id)));
    showToast(`Deleted ${ids.length} cards.`, 'info');
  };

  const handleBulkSuspend = async (ids: string[], suspend: boolean) => {
    const updatedCards = cards
      .filter((c) => ids.includes(c.id))
      .map((c) => ({ ...c, suspended: suspend }));
    await saveCards(updatedCards);
    setCards((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, suspended: suspend } : c))
    );
    showToast(`${suspend ? 'Suspended' : 'Unsuspended'} ${ids.length} cards.`, 'info');
  };

  const handleBulkReset = async (ids: string[]) => {
    const updatedCards = cards
      .filter((c) => ids.includes(c.id))
      .map((c) => ({
        ...c,
        interval: 0,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        state: 'new' as const,
        due: Date.now(),
      }));
    await saveCards(updatedCards);
    await refreshAllData();
    showToast(`Reset learning progress for ${ids.length} cards.`, 'success');
  };

  const handleBulkAddTag = async (ids: string[], newTag: string) => {
    const clean = newTag.replace(/^#/, '').trim();
    const updatedCards = cards
      .filter((c) => ids.includes(c.id))
      .map((c) => ({
        ...c,
        tags: Array.from(new Set([...(c.tags || []), clean])),
      }));
    await saveCards(updatedCards);
    await refreshAllData();
    showToast(`Added #${clean} to ${ids.length} cards.`, 'success');
  };

  const handleBulkMoveDeck = async (ids: string[], destDeckId: string) => {
    const updatedCards = cards
      .filter((c) => ids.includes(c.id))
      .map((c) => ({ ...c, deckId: destDeckId }));
    await saveCards(updatedCards);
    await refreshAllData();
    showToast(`Moved ${ids.length} cards to destination deck.`, 'success');
  };

  // Tag Operations
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    const updatedCards = cards.map((c) => {
      if (c.tags?.includes(oldTag)) {
        const nextTags = c.tags.map((t) => (t === oldTag ? newTag : t));
        return { ...c, tags: Array.from(new Set(nextTags)) };
      }
      return c;
    });
    await saveCards(updatedCards);
    await refreshAllData();
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    const updatedCards = cards.map((c) => {
      if (c.tags?.includes(tagToDelete)) {
        return { ...c, tags: c.tags.filter((t) => t !== tagToDelete) };
      }
      return c;
    });
    await saveCards(updatedCards);
    await refreshAllData();
  };

  // Deck Operations
  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    const newDeck: Deck = {
      id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newDeckName.trim(),
      description: newDeckDesc.trim(),
      createdAt: Date.now(),
    };
    await saveDeck(newDeck);
    setDecks((prev) => [...prev, newDeck]);
    setNewDeckName('');
    setNewDeckDesc('');
    setShowCreateDeckModal(false);
    showToast(`Deck "${newDeck.name}" created!`, 'success');
  };

  const handleSaveDeck = async (updated: Deck) => {
    await saveDeck(updated);
    setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDeck = async (id: string) => {
    await deleteDeck(id);
    await refreshAllData();
    showToast('Deck deleted (cards moved to General).', 'info');
  };

  // Export canonical text
  const handleExportAll = () => {
    let target = cards;
    if (selectedDeckId !== 'all') {
      target = target.filter((c) => c.deckId === selectedDeckId);
    }
    if (target.length === 0) {
      showToast('No cards to export.', 'info');
      return;
    }
    const text = exportCardsToText(target);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studycards-export-${target.length}-cards.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${target.length} cards in canonical format!`, 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
            S
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading StudyCards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main App Navigation Header */}
      <Header
        dueCount={dueCards.length}
        totalCards={cards.length}
        activeView={activeView}
        onNavigateView={setActiveView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onStartReview={() => handleStartReview('all', false)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFormatGuide={() => setIsFormatGuideOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenTagManager={() => setIsTagManagerOpen(true)}
        settings={settings}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toolbar */}
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDeckId={selectedDeckId}
          onSelectDeck={setSelectedDeckId}
          decks={decks}
          onCreateDeck={() => setShowCreateDeckModal(true)}
          onOpenImport={() => setIsAddModalOpen(true)}
          onExportCards={handleExportAll}
          onOpenQuickAdd={() => setIsAddModalOpen(true)}
          selectedTag={selectedTag}
          onClearTagFilter={() => setSelectedTag(undefined)}
        />

        {/* Dashboard View or Card Browser View */}
        {activeView === 'dashboard' ? (
          <div className="space-y-6">
            {/* Quick Hero Banner with Study Action */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SM-2 Spaced Repetition Engine</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {dueCards.length > 0
                      ? `You have ${dueCards.length} cards due for review.`
                      : 'All caught up on reviews for today!'}
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-100 opacity-90">
                    {dueCards.length > 0
                      ? 'Reviewing cards right when they are due solidifies long-term memory retention.'
                      : 'You can practice any deck in Cram mode, create new cards, or import custom text notes.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {dueCards.length > 0 ? (
                    <button
                      onClick={() => handleStartReview('all', false)}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-sm shadow-lg transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Due Review ({dueCards.length})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartReview('all', true)}
                      disabled={cards.length === 0}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Practice / Cram Mode</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsFormatGuideOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur font-semibold text-xs border border-white/20 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Format Guide & AI</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Decks Grid Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Study Decks ({decks.length})
                  </h2>
                </div>

                <button
                  onClick={() => setShowCreateDeckModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>New Deck</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => (
                  <DeckCardItem
                    key={deck.id}
                    deck={deck}
                    cards={cards}
                    onStudyDeck={(deckId) => handleStartReview(deckId, false)}
                    onCramDeck={(deckId) => handleStartReview(deckId, true)}
                    onEditDeck={(deck) => setDeckDetail(deck)}
                    onDeleteDeck={handleDeleteDeck}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Card Browser View */
          <CardBrowserView
            cards={cards}
            decks={decks}
            onEditCard={(c) => setEditingCard(c)}
            onInspectCard={(c) => setInspectingCard(c)}
            onToggleSuspend={handleToggleSuspend}
            onDeleteCard={handleDeleteCard}
            onBulkDelete={handleBulkDelete}
            onBulkSuspend={handleBulkSuspend}
            onBulkReset={handleBulkReset}
            onBulkAddTag={handleBulkAddTag}
            onBulkMoveDeck={handleBulkMoveDeck}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Review Modal (Study Session) */}
      {isReviewModalOpen && (
        <ReviewModal
          cardsToReview={reviewQueue}
          allDecks={decks}
          settings={settings}
          isCramMode={isCramMode}
          onFinishSession={() => {
            setIsReviewModalOpen(false);
            refreshAllData();
          }}
          onRecordReview={handleRecordReview}
          onUndoLastReview={handleUndoLastReview}
          canUndo={undoStack.length > 0}
          onEditCard={(card) => setEditingCard(card)}
        />
      )}

      {/* Add Cards Modal */}
      <AddCardsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        decks={decks}
        existingCards={cards}
        onAddCards={handleAddCards}
        onShowToast={showToast}
        defaultDeckId={selectedDeckId !== 'all' ? selectedDeckId : 'default'}
      />

      {/* Edit Card Modal */}
      <EditCardModal
        card={editingCard}
        decks={decks}
        allCards={cards}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleUpdateCard}
        onShowToast={showToast}
      />

      {/* Inspect Card Modal */}
      <InspectModal
        card={inspectingCard}
        deck={decks.find((d) => d.id === inspectingCard?.deckId)}
        reviewLogs={reviewLogs}
        isOpen={!!inspectingCard}
        onClose={() => setInspectingCard(null)}
        onShowToast={showToast}
      />

      {/* Deck Detail & Rename Modal */}
      <DeckDetailModal
        deck={deckDetail}
        cards={cards}
        isOpen={!!deckDetail}
        onClose={() => setDeckDetail(null)}
        onSaveDeck={handleSaveDeck}
        onDeleteDeck={handleDeleteDeck}
        onStudyDeck={(deckId) => handleStartReview(deckId, false)}
        onCramDeck={(deckId) => handleStartReview(deckId, true)}
        onShowToast={showToast}
      />

      {/* Tag Manager Modal */}
      <TagManagerModal
        cards={cards}
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
        onFilterByTag={(tag) => {
          setSelectedTag(tag);
          setActiveView('browser');
        }}
        onShowToast={showToast}
      />

      {/* Statistics & Forecasts Modal */}
      <StatisticsModal
        cards={cards}
        reviewLogs={reviewLogs}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={async (updated) => {
          setSettings(updated);
          applyTheme(updated.theme);
          await saveSettings(updated);
        }}
        onResetDatabase={async () => {
          await resetDatabase();
          await refreshAllData();
        }}
        onShowToast={showToast}
      />

      {/* Format Guide Modal */}
      <FormatGuideModal
        isOpen={isFormatGuideOpen}
        onClose={() => setIsFormatGuideOpen(false)}
        onShowToast={showToast}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        cards={cards}
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataRestored={refreshAllData}
        onShowToast={showToast}
      />

      {/* Create New Deck Modal */}
      {showCreateDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Create New Deck
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="e.g. Cardiology, Pharmacology"
                  autoFocus
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateDeck();
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="e.g. High-yield board prep"
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDeckModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeck}
                disabled={!newDeckName.trim()}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              >
                Create Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
