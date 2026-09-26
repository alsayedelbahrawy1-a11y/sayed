import React from 'react';
import { Search, Filter, Download, Upload, PlusCircle, FolderPlus } from 'lucide-react';
import { Deck } from '../types';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  decks: Deck[];
  onCreateDeck: () => void;
  onOpenImport: () => void;
  onExportCards: () => void;
  onOpenQuickAdd: () => void;
  selectedTag?: string;
  onClearTagFilter?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedDeckId,
  onSelectDeck,
  decks,
  onCreateDeck,
  onOpenImport,
  onExportCards,
  onOpenQuickAdd,
  selectedTag,
  onClearTagFilter,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Left: Deck selector & search */}
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Deck Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDeckId}
            onChange={(e) => onSelectDeck(e.target.value)}
            className="h-10 px-3 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Decks</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>

          <button
            onClick={onCreateDeck}
            className="h-10 px-2.5 flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Create New Deck"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cards, front, back, tags..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Active Tag filter indicator */}
        {selectedTag && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>#{selectedTag}</span>
            {onClearTagFilter && (
              <button
                onClick={onClearTagFilter}
                className="ml-1 hover:text-indigo-900 dark:hover:text-white"
                title="Clear tag filter"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onOpenImport}
          className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Import custom format text cards"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Text</span>
        </button>

        <button
          onClick={onExportCards}
          className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Export cards to canonical custom format text"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Canonical</span>
        </button>

        <button
          onClick={onOpenQuickAdd}
          className="h-10 px-3.5 flex items-center gap-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Card</span>
        </button>
      </div>
    </div>
  );
};
