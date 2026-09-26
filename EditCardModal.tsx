import React, { useState, useRef, useMemo } from 'react';
import { Card, Deck, CardType } from '../types';
import { FormatToolbar } from './FormatToolbar';
import { TagInput } from './TagInput';
import { CardContentRenderer } from './CardContentRenderer';
import { X, Save, RotateCcw, Eye } from 'lucide-react';

interface EditCardModalProps {
  card: Card | null;
  decks: Deck[];
  allCards: Card[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Card) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  card,
  decks,
  allCards,
  isOpen,
  onClose,
  onSave,
  onShowToast,
}) => {
  if (!isOpen || !card) return null;

  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back || '');
  const [deckId, setDeckId] = useState(card.deckId);
  const [type, setType] = useState<CardType>(card.type);
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [allCards]);

  const handleSave = async (resetSM2: boolean = false) => {
    if (!front.trim()) {
      onShowToast('Front cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated: Card = {
        ...card,
        front: front.trim(),
        back: back.trim(),
        deckId,
        type,
        tags,
        updatedAt: Date.now(),
        ...(resetSM2
          ? {
              interval: 0,
              easeFactor: 2.5,
              reps: 0,
              lapses: 0,
              state: 'new',
              due: Date.now(),
            }
          : {}),
      };

      await onSave(updated);
      onShowToast(resetSM2 ? 'Card updated and SM-2 progress reset!' : 'Card updated successfully!', 'success');
      onClose();
    } catch (e: any) {
      onShowToast(`Failed to update card: ${e.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Edit Card</span>
              <span className="font-mono text-xs text-slate-400 font-normal">
                id="{card.id}"
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update front, back, deck, cloze syntax, or tags
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deck
              </label>
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full h-10 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Card Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CardType)}
                className="w-full h-10 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="basic">Basic (Front :: Back)</option>
                <option value="cloze">Cloze Deletion ({`{{c1::...}}`})</option>
                <option value="reverse">Reverse</option>
              </select>
            </div>
          </div>

          {/* Front */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Front / Question
            </label>
            <FormatToolbar
              textareaRef={frontRef}
              value={front}
              onChange={setFront}
              showCloze={type === 'cloze'}
            />
            <textarea
              ref={frontRef}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={4}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Back */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Back / Answer
            </label>
            <FormatToolbar
              textareaRef={backRef}
              value={back}
              onChange={setBack}
              showCloze={false}
            />
            <textarea
              ref={backRef}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              availableTags={availableTags}
            />
          </div>

          {/* Live Preview Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>

            {showPreview && (
              <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <CardContentRenderer
                  content={front}
                  isCloze={type === 'cloze'}
                  isAnswerSide={false}
                />
                {back && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <CardContentRenderer content={back} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Save card and reset reps/interval to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset SM-2</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
