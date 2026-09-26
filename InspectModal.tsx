import React from 'react';
import { Card, ReviewLog, Deck } from '../types';
import { CardContentRenderer } from './CardContentRenderer';
import { exportCardsToText } from '../parser/cardParser';
import { X, Copy, Check, Clock, Calendar, Activity, RefreshCw } from 'lucide-react';

interface InspectModalProps {
  card: Card | null;
  deck?: Deck;
  reviewLogs: ReviewLog[];
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({
  card,
  deck,
  reviewLogs,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !card) return null;

  const cardLogs = reviewLogs
    .filter((l) => l.cardId === card.id)
    .sort((a, b) => b.reviewTime - a.reviewTime);

  const canonicalSnippet = exportCardsToText([card]);

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalSnippet);
    setCopied(true);
    onShowToast('Canonical text copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const ratingNames: Record<number, { name: string; color: string }> = {
    1: { name: 'Again', color: 'text-rose-600 dark:text-rose-400' },
    2: { name: 'Hard', color: 'text-amber-600 dark:text-amber-400' },
    3: { name: 'Good', color: 'text-blue-600 dark:text-blue-400' },
    4: { name: 'Easy', color: 'text-emerald-600 dark:text-emerald-400' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Card Inspector</span>
              <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-semibold">
                id="{card.id}"
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              SM-2 state, parameters, canonical representation, and review logs
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Card Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Card Content Preview
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              <CardContentRenderer
                content={card.front}
                isCloze={card.type === 'cloze'}
                isAnswerSide={false}
              />
            </div>
            {card.back && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <CardContentRenderer content={card.back} />
              </div>
            )}
          </div>

          {/* SM-2 Metrics Grid */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Spaced Repetition Parameters (SM-2)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Status</div>
                <div className="text-sm font-bold capitalize text-slate-900 dark:text-white mt-0.5">
                  {card.suspended ? 'Suspended' : card.state}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Interval</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {card.interval} days
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Ease Factor</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {card.easeFactor?.toFixed(2) || '2.50'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-400">Reps / Lapses</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {card.reps} / {card.lapses}
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
              <span>Deck: <strong className="text-slate-700 dark:text-slate-300">{deck?.name || 'General'}</strong></span>
              <span>Due: <strong className="text-slate-700 dark:text-slate-300">{new Date(card.due).toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Canonical Export Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Canonical Custom Text
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500">
              {canonicalSnippet}
            </pre>
          </div>

          {/* Review History */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Review History ({cardLogs.length})
            </div>
            {cardLogs.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                No review history yet for this card.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {cardLogs.map((log) => {
                  const ratingInfo = ratingNames[log.rating] || { name: 'Reviewed', color: '' };
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${ratingInfo.color}`}>
                          {ratingInfo.name}
                        </span>
                        <span className="text-slate-400">
                          {log.lastInterval}d → {log.newInterval}d
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(log.reviewTime).toLocaleDateString()} {new Date(log.reviewTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
