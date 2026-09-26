import React, { useState } from 'react';
import { Deck, Card } from '../types';
import { exportCardsToText } from '../parser/cardParser';
import { X, Play, Flame, Download, Trash2, Edit2, Layers, Check } from 'lucide-react';

interface DeckDetailModalProps {
  deck: Deck | null;
  cards: Card[];
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (updated: Deck) => Promise<void>;
  onDeleteDeck: (id: string) => Promise<void>;
  onStudyDeck: (deckId: string) => void;
  onCramDeck: (deckId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DeckDetailModal: React.FC<DeckDetailModalProps> = ({
  deck,
  cards,
  isOpen,
  onClose,
  onSaveDeck,
  onDeleteDeck,
  onStudyDeck,
  onCramDeck,
  onShowToast,
}) => {
  if (!isOpen || !deck) return null;

  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || '');
  const [isEditing, setIsEditing] = useState(false);

  const deckCards = cards.filter((c) => c.deckId === deck.id);
  const dueCards = deckCards.filter((c) => !c.suspended && c.due <= Date.now());

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSaveDeck({
      ...deck,
      name: name.trim(),
      description: description.trim(),
    });
    setIsEditing(false);
    onShowToast('Deck updated!', 'success');
  };

  const handleExportDeck = () => {
    if (deckCards.length === 0) {
      onShowToast('This deck has no cards to export.', 'info');
      return;
    }
    const text = exportCardsToText(deckCards);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.toLowerCase().replace(/\s+/g, '-')}-canonical.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Exported ${deckCards.length} cards from ${deck.name}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Deck Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {deck.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {deck.description || 'No description provided.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Rename deck"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center">
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {deckCards.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Cards</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {dueCards.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Due Today</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onStudyDeck(deck.id);
              }}
              disabled={deckCards.length === 0}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Study Deck ({dueCards.length} Due)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onCramDeck(deck.id);
              }}
              disabled={deckCards.length === 0}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Cram All {deckCards.length} Cards</span>
            </button>

            <button
              onClick={handleExportDeck}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Deck to Canonical Text</span>
            </button>

            {deck.id !== 'default' && (
              <button
                onClick={() => {
                  if (confirm(`Delete deck "${deck.name}"? Cards will be moved to General deck.`)) {
                    onDeleteDeck(deck.id);
                    onClose();
                  }
                }}
                className="w-full py-2 px-4 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Deck</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
