import React from 'react';
import { Deck, Card } from '../types';
import { Play, Flame, MoreVertical, Edit2, Trash2, Layers } from 'lucide-react';

interface DeckCardItemProps {
  deck: Deck;
  cards: Card[];
  onStudyDeck: (deckId: string) => void;
  onCramDeck: (deckId: string) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
}

export const DeckCardItem: React.FC<DeckCardItemProps> = ({
  deck,
  cards,
  onStudyDeck,
  onCramDeck,
  onEditDeck,
  onDeleteDeck,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const now = Date.now();
  const deckCards = cards.filter((c) => c.deckId === deck.id);
  const dueCards = deckCards.filter((c) => !c.suspended && c.due <= now);
  const newCards = deckCards.filter((c) => !c.suspended && c.state === 'new');
  const learningCards = deckCards.filter((c) => !c.suspended && (c.state === 'learning' || c.state === 'relearning'));

  return (
    <div className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {deck.name}
            </h3>
            {deck.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                {deck.description}
              </p>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Deck options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEditDeck(deck);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>

                  {deck.id !== 'default' && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteDeck(deck.id);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Counts badges */}
        <div className="grid grid-cols-3 gap-2 my-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center">
          <div>
            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
              {newCards.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              New
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
              {learningCards.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              Learning
            </div>
          </div>
          <div>
            <div className={`text-base font-extrabold ${dueCards.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {dueCards.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              Due
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
          <Layers className="w-3.5 h-3.5" />
          {deckCards.length} total
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onCramDeck(deck.id)}
            disabled={deckCards.length === 0}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Cram/practice all cards in deck without affecting schedule"
          >
            <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
            Cram
          </button>

          <button
            onClick={() => onStudyDeck(deck.id)}
            disabled={deckCards.length === 0}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition-all ${
              dueCards.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-500'
                : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700'
            } disabled:opacity-40`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{dueCards.length > 0 ? 'Study' : 'Review'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
