import React, { useState, useMemo } from 'react';
import { Card, Deck } from '../types';
import { CardBrowserItem } from './CardBrowserItem';
import {
  Search,
  Filter,
  Trash2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Tag,
  FolderInput,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import { exportCardsToText } from '../parser/cardParser';

interface CardBrowserViewProps {
  cards: Card[];
  decks: Deck[];
  onEditCard: (card: Card) => void;
  onInspectCard: (card: Card) => void;
  onToggleSuspend: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkSuspend: (ids: string[], suspend: boolean) => void;
  onBulkReset: (ids: string[]) => void;
  onBulkAddTag: (ids: string[], tag: string) => void;
  onBulkMoveDeck: (ids: string[], deckId: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CardBrowserView: React.FC<CardBrowserViewProps> = ({
  cards,
  decks,
  onEditCard,
  onInspectCard,
  onToggleSuspend,
  onDeleteCard,
  onBulkDelete,
  onBulkSuspend,
  onBulkReset,
  onBulkAddTag,
  onBulkMoveDeck,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'due' | 'created' | 'interval' | 'ease' | 'front'>('due');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [tagModalInput, setTagModalInput] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetDeckId, setTargetDeckId] = useState(decks[0]?.id || 'default');

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [cards]);

  // Deck map for quick lookups
  const deckMap = useMemo(() => {
    const map = new Map<string, string>();
    decks.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [decks]);

  // Filtered & sorted cards
  const filteredCards = useMemo(() => {
    const now = Date.now();
    const query = search.toLowerCase().trim();

    return cards
      .filter((card) => {
        // Deck filter
        if (selectedDeckFilter !== 'all' && card.deckId !== selectedDeckFilter) {
          return false;
        }

        // Status filter
        if (selectedStatusFilter === 'due') {
          if (card.suspended || card.due > now) return false;
        } else if (selectedStatusFilter === 'suspended') {
          if (!card.suspended) return false;
        } else if (selectedStatusFilter !== 'all') {
          if (card.state !== selectedStatusFilter) return false;
        }

        // Tag filter
        if (selectedTagFilter !== 'all') {
          if (!card.tags?.includes(selectedTagFilter)) return false;
        }

        // Text search
        if (query) {
          const matchFront = card.front.toLowerCase().includes(query);
          const matchBack = card.back?.toLowerCase().includes(query);
          const matchTags = card.tags?.some((t) => t.toLowerCase().includes(query));
          const matchId = card.id.toLowerCase().includes(query);
          if (!matchFront && !matchBack && !matchTags && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        switch (sortBy) {
          case 'due':
            diff = a.due - b.due;
            break;
          case 'created':
            diff = a.createdAt - b.createdAt;
            break;
          case 'interval':
            diff = a.interval - b.interval;
            break;
          case 'ease':
            diff = (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
            break;
          case 'front':
            diff = a.front.localeCompare(b.front);
            break;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [
    cards,
    search,
    selectedDeckFilter,
    selectedStatusFilter,
    selectedTagFilter,
    sortBy,
    sortOrder,
  ]);

  const toggleSelectCard = (id: string, select: boolean) => {
    const next = new Set(selectedCardIds);
    if (select) next.add(id);
    else next.delete(id);
    setSelectedCardIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedCardIds.size === filteredCards.length) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(filteredCards.map((c) => c.id)));
    }
  };

  const handleExportSelected = () => {
    const targetCards = cards.filter((c) => selectedCardIds.has(c.id));
    if (targetCards.length === 0) return;
    const text = exportCardsToText(targetCards);

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studycards-export-${targetCards.length}-cards.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Exported ${targetCards.length} cards in canonical format!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Row 1: Search & Filter Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by text, ID, or tag..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Deck filter */}
            <select
              value={selectedDeckFilter}
              onChange={(e) => setSelectedDeckFilter(e.target.value)}
              className="h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Decks</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="due">Due Now</option>
              <option value="new">New</option>
              <option value="learning">Learning</option>
              <option value="review">Review</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Tag filter */}
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 h-10">
              <span className="text-xs text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="due">Due Date</option>
                <option value="created">Created</option>
                <option value="interval">Interval</option>
                <option value="ease">Ease Factor</option>
                <option value="front">Front Text</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Bulk Actions Bar (visible when items selected) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredCards.length > 0 &&
                  selectedCardIds.size === filteredCards.length
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span>
                {selectedCardIds.size > 0
                  ? `${selectedCardIds.size} of ${filteredCards.length} selected`
                  : `Select All (${filteredCards.length})`}
              </span>
            </label>
          </div>

          {selectedCardIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors"
                title="Export selected cards to custom format text"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ({selectedCardIds.size})</span>
              </button>

              <button
                onClick={() => setShowTagModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>

              <button
                onClick={() => setShowMoveModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span>Move Deck</span>
              </button>

              <button
                onClick={() => {
                  onBulkSuspend(Array.from(selectedCardIds), true);
                  setSelectedCardIds(new Set());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Suspend</span>
              </button>

              <button
                onClick={() => {
                  onBulkSuspend(Array.from(selectedCardIds), false);
                  setSelectedCardIds(new Set());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Unsuspend</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Reset SM-2 learning progress for ${selectedCardIds.size} cards to New?`)) {
                    onBulkReset(Array.from(selectedCardIds));
                    setSelectedCardIds(new Set());
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Reset reps, interval, and ease to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Progress</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Permanently delete ${selectedCardIds.size} selected cards?`)) {
                    onBulkDelete(Array.from(selectedCardIds));
                    setSelectedCardIds(new Set());
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards List */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No cards found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, status, deck, or tag filters.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCards.map((card) => (
            <CardBrowserItem
              key={card.id}
              card={card}
              selected={selectedCardIds.has(card.id)}
              onSelect={toggleSelectCard}
              onEdit={onEditCard}
              onInspect={onInspectCard}
              onToggleSuspend={onToggleSuspend}
              onDelete={onDeleteCard}
              deckName={deckMap.get(card.deckId)}
            />
          ))}
        </div>
      )}

      {/* Bulk Add Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Add Tag to {selectedCardIds.size} Cards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a tag name to apply to all selected cards.
            </p>
            <input
              type="text"
              value={tagModalInput}
              onChange={(e) => setTagModalInput(e.target.value)}
              placeholder="e.g. HighYield"
              autoFocus
              className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagModalInput.trim()) {
                  onBulkAddTag(Array.from(selectedCardIds), tagModalInput.trim());
                  setShowTagModal(false);
                  setTagModalInput('');
                  setSelectedCardIds(new Set());
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (tagModalInput.trim()) {
                    onBulkAddTag(Array.from(selectedCardIds), tagModalInput.trim());
                    setShowTagModal(false);
                    setTagModalInput('');
                    setSelectedCardIds(new Set());
                  }
                }}
                disabled={!tagModalInput.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move Deck Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Move {selectedCardIds.size} Cards to Deck
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select destination deck:
            </p>
            <select
              value={targetDeckId}
              onChange={(e) => setTargetDeckId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBulkMoveDeck(Array.from(selectedCardIds), targetDeckId);
                  setShowMoveModal(false);
                  setSelectedCardIds(new Set());
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Move Cards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
