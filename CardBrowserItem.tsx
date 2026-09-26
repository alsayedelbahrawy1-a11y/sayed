import React from 'react';
import { Card } from '../types';
import { Edit2, Eye, PauseCircle, PlayCircle, Trash2, Tag, Calendar, Activity } from 'lucide-react';

interface CardBrowserItemProps {
  card: Card;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (card: Card) => void;
  onInspect: (card: Card) => void;
  onToggleSuspend: (card: Card) => void;
  onDelete: (id: string) => void;
  deckName?: string;
}

export const CardBrowserItem: React.FC<CardBrowserItemProps> = ({
  card,
  selected,
  onSelect,
  onEdit,
  onInspect,
  onToggleSuspend,
  onDelete,
  deckName,
}) => {
  const isDue = !card.suspended && card.due <= Date.now();

  const stateColors: Record<string, string> = {
    new: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    learning: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    relearning: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    review: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  const typeLabels: Record<string, string> = {
    basic: 'Basic',
    cloze: 'Cloze',
    reverse: 'Reverse',
  };

  const formattedDueDate = new Date(card.due).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
          : card.suspended
          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(card.id, e.target.checked)}
          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
        />
      </div>

      {/* Main card info */}
      <div className="flex-1 min-w-0">
        {/* Top meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
          <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
            id="{card.id}"
          </span>

          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {typeLabels[card.type] || 'Basic'}
          </span>

          {deckName && (
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
              in <strong className="text-slate-700 dark:text-slate-300 font-medium">{deckName}</strong>
            </span>
          )}

          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              card.suspended
                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                : stateColors[card.state] || stateColors.review
            }`}
          >
            {card.suspended ? 'Suspended' : card.state}
          </span>

          {isDue && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
              Due Now
            </span>
          )}
        </div>

        {/* Front & Back snippets */}
        <div className="space-y-1 mb-2">
          <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
            {card.front}
          </div>
          {card.back && (
            <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {card.back}
            </div>
          )}
        </div>

        {/* Tags & Stats footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {card.tags && card.tags.length > 0 ? (
              card.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">No tags</span>
            )}
          </div>

          {/* SM-2 Metrics */}
          <div className="flex items-center gap-3 text-[11px]">
            <span title="Interval (days)" className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{card.interval}d interval</span>
            </span>

            <span title="Ease factor" className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-slate-400" />
              <span>{card.easeFactor?.toFixed(2) || '2.50'} EF</span>
            </span>

            <span title="Next due date">
              Due: <strong className="text-slate-700 dark:text-slate-300">{formattedDueDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onInspect(card)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Inspect card & review history"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={() => onEdit(card)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Edit card"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleSuspend(card)}
          className={`p-1.5 rounded-lg transition-colors ${
            card.suspended
              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50'
              : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={card.suspended ? 'Unsuspend card' : 'Suspend card'}
        >
          {card.suspended ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onDelete(card.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          title="Delete card"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
