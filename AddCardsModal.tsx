import React, { useState, useRef, useMemo } from 'react';
import { Card, Deck, CardType, ParsedCard } from '../types';
import { generateCardId, parseCustomText } from '../parser/cardParser';
import { FormatToolbar } from './FormatToolbar';
import { TagInput } from './TagInput';
import { CardContentRenderer } from './CardContentRenderer';
import {
  X,
  PlusCircle,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Layers,
  Eye,
} from 'lucide-react';

interface AddCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  existingCards: Card[];
  onAddCards: (newCards: Card[]) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  defaultDeckId?: string;
}

export const AddCardsModal: React.FC<AddCardsModalProps> = ({
  isOpen,
  onClose,
  decks,
  existingCards,
  onAddCards,
  onShowToast,
  defaultDeckId = 'default',
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  // Single card form state
  const [selectedDeckId, setSelectedDeckId] = useState(defaultDeckId);
  const [cardType, setCardType] = useState<CardType>('basic');
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSinglePreview, setShowSinglePreview] = useState(false);

  // Batch import state
  const [batchText, setBatchText] = useState('');
  const [batchDeckId, setBatchDeckId] = useState(defaultDeckId);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);
  const backTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Available tags for autocomplete
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    existingCards.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [existingCards]);

  // Existing IDs & Front texts lookup maps for duplicate detection
  const existingMap = useMemo(() => {
    const idMap = new Map<string, Card>();
    const frontMap = new Map<string, Card>();
    existingCards.forEach((c) => {
      idMap.set(c.id, c);
      frontMap.set(c.front.trim().toLowerCase(), c);
    });
    return { idMap, frontMap };
  }, [existingCards]);

  // Live parsed results for batch text
  const batchParseResult = useMemo(() => {
    if (!batchText.trim()) return null;
    return parseCustomText(batchText);
  }, [batchText]);

  // Analyzed cards (updates vs new vs duplicates)
  const analyzedBatch = useMemo(() => {
    if (!batchParseResult || batchParseResult.cards.length === 0) return null;

    let updatesCount = 0;
    let newCount = 0;
    let duplicateFrontCount = 0;

    batchParseResult.cards.forEach((pc) => {
      if (pc.id && existingMap.idMap.has(pc.id)) {
        updatesCount++;
      } else {
        newCount++;
        if (existingMap.frontMap.has(pc.front.trim().toLowerCase())) {
          duplicateFrontCount++;
        }
      }
    });

    return {
      total: batchParseResult.cards.length,
      updatesCount,
      newCount,
      duplicateFrontCount,
    };
  }, [batchParseResult, existingMap]);

  if (!isOpen) return null;

  // Single card save handler
  const handleSaveSingleCard = async (addAnother: boolean = false) => {
    if (!frontText.trim()) {
      onShowToast('Please enter front text for the card.', 'error');
      return;
    }

    const newCard: Card = {
      id: generateCardId(),
      deckId: selectedDeckId,
      front: frontText.trim(),
      back: backText.trim(),
      type: cardType,
      tags: tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      due: Date.now(),
      interval: 0,
      easeFactor: 2.5,
      reps: 0,
      lapses: 0,
      state: 'new',
    };

    try {
      await onAddCards([newCard]);
      onShowToast('Card created successfully!', 'success');

      if (addAnother) {
        setFrontText('');
        setBackText('');
        // keep tags and deck for convenience
        frontTextareaRef.current?.focus();
      } else {
        onClose();
      }
    } catch (err: any) {
      onShowToast(`Failed to save card: ${err.message}`, 'error');
    }
  };

  // Batch import execute handler
  const handleExecuteBatchImport = async () => {
    if (!batchParseResult || batchParseResult.cards.length === 0) {
      onShowToast('No valid cards to import.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const cardsToSave: Card[] = [];

      for (const pc of batchParseResult.cards) {
        const id = pc.id || generateCardId();
        const existing = existingMap.idMap.get(id);

        if (existing && !overwriteDuplicates) {
          continue; // Skip duplicate if overwrite disabled
        }

        const cardToStore: Card = {
          id,
          deckId: batchDeckId,
          front: pc.front,
          back: pc.back,
          type: pc.type,
          tags: pc.tags,
          createdAt: existing ? existing.createdAt : Date.now(),
          updatedAt: Date.now(),
          due: existing ? existing.due : Date.now(),
          interval: existing ? existing.interval : 0,
          easeFactor: existing ? existing.easeFactor : 2.5,
          reps: existing ? existing.reps : 0,
          lapses: existing ? existing.lapses : 0,
          state: existing ? existing.state : 'new',
          suspended: existing ? existing.suspended : false,
        };

        cardsToSave.push(cardToStore);
      }

      await onAddCards(cardsToSave);
      onShowToast(`Imported ${cardsToSave.length} cards successfully!`, 'success');
      onClose();
    } catch (err: any) {
      onShowToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Flashcards
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create visually or paste external AI custom text format
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <button
            onClick={() => setActiveTab('single')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'single'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Visual Card Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'batch'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Batch Text Import</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'single' ? (
            /* Visual Single Card Editor */
            <div className="space-y-4">
              {/* Deck & Type selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Deck
                  </label>
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
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
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full h-10 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="basic">Basic (Front :: Back)</option>
                    <option value="cloze">Cloze Deletion ({`{{c1::...}}`})</option>
                    <option value="reverse">Reverse (Bidirectional)</option>
                  </select>
                </div>
              </div>

              {/* Front side input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Front / Question
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {cardType === 'cloze' ? 'Highlight word and click Cloze button' : 'Markdown supported'}
                  </span>
                </div>

                <FormatToolbar
                  textareaRef={frontTextareaRef}
                  value={frontText}
                  onChange={setFrontText}
                  showCloze={cardType === 'cloze'}
                />

                <textarea
                  ref={frontTextareaRef}
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  placeholder={
                    cardType === 'cloze'
                      ? 'The largest artery is the {{c1::aorta::main artery}}...'
                      : 'Enter prompt, question, clinical case, or term...'
                  }
                  rows={4}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Back side input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Back / Answer / Explanation
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {cardType === 'cloze' ? 'Optional extra context' : 'Markdown & tables supported'}
                  </span>
                </div>

                <FormatToolbar
                  textareaRef={backTextareaRef}
                  value={backText}
                  onChange={setBackText}
                  showCloze={false}
                />

                <textarea
                  ref={backTextareaRef}
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  placeholder="Enter detailed answer, mnemonics, tables, or notes..."
                  rows={3}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Tags input */}
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
                  onClick={() => setShowSinglePreview(!showSinglePreview)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showSinglePreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
                </button>

                {showSinglePreview && (
                  <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Front</div>
                      <CardContentRenderer
                        content={frontText || '(No front text yet)'}
                        isCloze={cardType === 'cloze'}
                        isAnswerSide={false}
                      />
                    </div>
                    {backText && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Back</div>
                        <CardContentRenderer content={backText} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Batch Text Import */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Paste cards generated from ChatGPT, Claude, or exported text:
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Import to:
                  </label>
                  <select
                    value={batchDeckId}
                    onChange={(e) => setBatchDeckId(e.target.value)}
                    className="h-8 px-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={`id="jlngn3"\nWhat is the primary excitatory neurotransmitter?\n::\nGlutamate\n::\n#Neuro #Biochem\n---\nid="qc6rx4"\nThe largest artery is the {{c1::aorta}}.\n::\nContext notes\n::\n#Anatomy`}
                rows={10}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />

              {/* Analysis & Duplicate preview badge */}
              {analyzedBatch && (
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{analyzedBatch.total} cards parsed successfully</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {analyzedBatch.newCount} New
                      </span>
                      {analyzedBatch.updatesCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {analyzedBatch.updatesCount} will update existing ID
                        </span>
                      )}
                      {analyzedBatch.duplicateFrontCount > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          {analyzedBatch.duplicateFrontCount} duplicate question text
                        </span>
                      )}
                    </div>
                  </div>

                  {analyzedBatch.updatesCount > 0 && (
                    <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwriteDuplicates}
                        onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Overwrite existing cards matching ID</span>
                    </label>
                  )}

                  {batchParseResult?.warnings && batchParseResult.warnings.length > 0 && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{batchParseResult.warnings[0]}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'single' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSingleCard(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Save & Add Another
              </button>
              <button
                type="button"
                onClick={() => handleSaveSingleCard(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all"
              >
                Save Card
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleExecuteBatchImport}
              disabled={isProcessing || !analyzedBatch || analyzedBatch.total === 0}
              className="px-6 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Importing...' : `Import ${analyzedBatch?.total || 0} Cards`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
