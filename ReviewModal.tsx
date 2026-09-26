import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Deck, Rating, AppSettings, ReviewLog } from '../types';
import { calculateSM2, getIntervalLabels } from '../db/indexedDB';
import { CardContentRenderer } from './CardContentRenderer';
import { playSound, triggerHaptic, speakText, stopSpeaking } from '../utils/audio';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Edit2,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface ReviewModalProps {
  cardsToReview: Card[];
  allDecks: Deck[];
  settings: AppSettings;
  isCramMode?: boolean;
  onFinishSession: () => void;
  onRecordReview: (card: Card, rating: Rating, log: ReviewLog) => Promise<void>;
  onUndoLastReview?: () => void;
  canUndo?: boolean;
  onEditCard: (card: Card) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  cardsToReview,
  allDecks,
  settings,
  isCramMode = false,
  onFinishSession,
  onRecordReview,
  onUndoLastReview,
  canUndo = false,
  onEditCard,
}) => {
  const [queue, setQueue] = useState<Card[]>(() => [...cardsToReview]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Statistics for this session
  const [ratingsCount, setRatingsCount] = useState<Record<Rating, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  const currentCard = queue[currentIndex];

  // Map deck names
  const deckName = allDecks.find((d) => d.id === currentCard?.deckId)?.name || 'General';

  // Timer effect
  useEffect(() => {
    if (sessionCompleted || !currentCard) return;
    const interval = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionCompleted, currentCard]);

  // Clean TTS on unmount or card switch
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
    setStartTime(Date.now());
  }, [currentIndex]);

  const handleRevealAnswer = useCallback(() => {
    if (isAnswerRevealed) return;
    playSound('flip', settings.soundEnabled);
    triggerHaptic('light', settings.hapticsEnabled);
    setIsAnswerRevealed(true);

    if (settings.ttsEnabled && currentCard) {
      speakText(currentCard.back || currentCard.front, settings.ttsVoice);
    }
  }, [isAnswerRevealed, settings, currentCard]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentCard) return;

      const timeTakenMs = Date.now() - startTime;

      // Play audio & vibration
      const soundMap: Record<Rating, 'again' | 'hard' | 'good' | 'easy'> = {
        1: 'again',
        2: 'hard',
        3: 'good',
        4: 'easy',
      };
      playSound(soundMap[rating], settings.soundEnabled);
      triggerHaptic(rating === 4 ? 'success' : 'medium', settings.hapticsEnabled);

      setRatingsCount((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      if (!isCramMode) {
        // SM-2 calculation
        const sm2 = calculateSM2(currentCard, rating);
        const log: ReviewLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          cardId: currentCard.id,
          rating,
          reviewTime: Date.now(),
          lastInterval: currentCard.interval,
          newInterval: sm2.newInterval,
          lastEase: currentCard.easeFactor,
          newEase: sm2.newEase,
          timeTakenMs,
        };

        const updatedCard: Card = {
          ...currentCard,
          interval: sm2.newInterval,
          easeFactor: sm2.newEase,
          due: sm2.newDue,
          state: sm2.newState,
          reps: sm2.reps,
          lapses: sm2.lapses,
        };

        await onRecordReview(updatedCard, rating, log);

        // If rated Again (1), requeue to the end of current session
        if (rating === 1) {
          setQueue((prev) => [...prev, updatedCard]);
        }
      }

      // Move to next card or finish
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((i) => i + 1);
        setIsAnswerRevealed(false);
      } else {
        setSessionCompleted(true);
        playSound('complete', settings.soundEnabled);
      }
    },
    [currentCard, startTime, isCramMode, settings, onRecordReview, currentIndex, queue.length]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        onFinishSession();
        return;
      }

      if (sessionCompleted) return;

      if (!isAnswerRevealed) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleRevealAnswer();
        }
      } else {
        if (e.key === '1') {
          e.preventDefault();
          handleRate(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(2);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(3);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(4);
        } else if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleRate(3); // Space on answer defaults to 'Good'
        }
      }

      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        if (canUndo && onUndoLastReview) {
          e.preventDefault();
          onUndoLastReview();
          if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
            setIsAnswerRevealed(true);
          }
        }
      }

      if (e.key === 'e' || e.key === 'E') {
        if (currentCard) {
          e.preventDefault();
          onEditCard(currentCard);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAnswerRevealed,
    handleRevealAnswer,
    handleRate,
    sessionCompleted,
    canUndo,
    onUndoLastReview,
    currentIndex,
    currentCard,
    onEditCard,
    onFinishSession,
  ]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (currentCard) {
      const textToRead = isAnswerRevealed ? `${currentCard.front}. ${currentCard.back}` : currentCard.front;
      speakText(textToRead, settings.ttsVoice);
      setIsSpeaking(true);
    }
  };

  if (sessionCompleted || !currentCard) {
    const totalRated =
      ratingsCount[1] + ratingsCount[2] + ratingsCount[3] + ratingsCount[4];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {isCramMode ? 'Practice Complete!' : 'Session Complete!'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You reviewed {totalRated} cards in {Math.floor(elapsedSecs / 60)}m {elapsedSecs % 60}s.
          </p>

          {/* Breakdown */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-6 text-center">
            <div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {ratingsCount[1]}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Again</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {ratingsCount[2]}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Hard</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {ratingsCount[3]}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Good</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {ratingsCount[4]}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Easy</div>
            </div>
          </div>

          <button
            onClick={onFinishSession}
            className="w-full py-3 px-6 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Interval predictions for current card
  const intervalLabels = getIntervalLabels(currentCard);

  // Is reverse card? If reverse card, and we want to show back as front
  const isReverseCard = currentCard.type === 'reverse';
  const isClozeCard = currentCard.type === 'cloze';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 select-none overflow-y-auto">
      {/* Top Session Bar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Deck & Mode */}
        <div className="flex items-center gap-3">
          <button
            onClick={onFinishSession}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Exit Session (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {deckName}
            </span>
            {isCramMode && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <Flame className="w-3 h-3" />
                Cram Mode
              </span>
            )}
          </div>
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {queue.length}
          </span>
          <div className="w-24 sm:w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / queue.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Right: Controls & Timer */}
        <div className="flex items-center gap-2">
          {settings.showTimer && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {Math.floor(elapsedSecs / 60)}:
                {(elapsedSecs % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {canUndo && (
            <button
              onClick={() => {
                if (onUndoLastReview) {
                  onUndoLastReview();
                  if (currentIndex > 0) {
                    setCurrentIndex((i) => i - 1);
                    setIsAnswerRevealed(true);
                  }
                }
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Undo last rating (Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          <button
            onClick={toggleSpeech}
            className={`p-1.5 rounded-lg transition-colors ${
              isSpeaking
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Read text aloud (TTS)"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEditCard(currentCard)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit this card (E)"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col min-h-[380px] max-h-[75vh] transition-all overflow-hidden">
          {/* Card Top Meta */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                id="{currentCard.id}"
              </span>
              <span className="capitalize font-medium">{currentCard.type}</span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1">
              {currentCard.tags?.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Flashcard Body Content */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
            {/* Front Question */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                Question
              </div>
              <div className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white leading-relaxed">
                <CardContentRenderer
                  content={currentCard.front}
                  isCloze={isClozeCard}
                  isAnswerSide={false}
                />
              </div>
            </div>

            {/* Answer (if revealed) */}
            {isAnswerRevealed && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Answer & Explanation</span>
                </div>

                {/* If Cloze card, render back or cloze answers */}
                {isClozeCard && (
                  <div className="mb-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-base font-semibold text-slate-800 dark:text-slate-200">
                    <CardContentRenderer
                      content={currentCard.front}
                      isCloze={true}
                      isAnswerSide={true}
                    />
                  </div>
                )}

                {currentCard.back ? (
                  <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
                    <CardContentRenderer
                      content={currentCard.back}
                      isCloze={false}
                      isAnswerSide={true}
                    />
                  </div>
                ) : !isClozeCard ? (
                  <div className="text-sm text-slate-400 italic">No additional context provided.</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Review Action Area */}
        <div className="w-full mt-4 max-w-4xl">
          {!isAnswerRevealed ? (
            /* Show Answer Button */
            <button
              onClick={handleRevealAnswer}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Show Answer</span>
              <span className="text-xs font-normal opacity-80 px-2 py-0.5 rounded bg-indigo-700/60">
                Space
              </span>
            </button>
          ) : (
            /* 4 SM-2 Rating Buttons */
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {/* Again (1) */}
              <button
                onClick={() => handleRate(1)}
                className="group flex flex-col items-center justify-center py-3 sm:py-3.5 px-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-all active:scale-95"
              >
                <div className="text-xs font-bold text-rose-500 mb-0.5">
                  {intervalLabels[1]}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-rose-700 dark:text-rose-300">
                  Again
                </div>
                <span className="text-[10px] text-rose-400 font-mono mt-0.5 opacity-60 group-hover:opacity-100">
                  1
                </span>
              </button>

              {/* Hard (2) */}
              <button
                onClick={() => handleRate(2)}
                className="group flex flex-col items-center justify-center py-3 sm:py-3.5 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-all active:scale-95"
              >
                <div className="text-xs font-bold text-amber-500 mb-0.5">
                  {intervalLabels[2]}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300">
                  Hard
                </div>
                <span className="text-[10px] text-amber-400 font-mono mt-0.5 opacity-60 group-hover:opacity-100">
                  2
                </span>
              </button>

              {/* Good (3) */}
              <button
                onClick={() => handleRate(3)}
                className="group flex flex-col items-center justify-center py-3 sm:py-3.5 px-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-all active:scale-95 ring-2 ring-blue-500/20"
              >
                <div className="text-xs font-bold text-blue-500 mb-0.5">
                  {intervalLabels[3]}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-blue-700 dark:text-blue-300">
                  Good
                </div>
                <span className="text-[10px] text-blue-400 font-mono mt-0.5 opacity-60 group-hover:opacity-100">
                  3 or Space
                </span>
              </button>

              {/* Easy (4) */}
              <button
                onClick={() => handleRate(4)}
                className="group flex flex-col items-center justify-center py-3 sm:py-3.5 px-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all active:scale-95"
              >
                <div className="text-xs font-bold text-emerald-500 mb-0.5">
                  {intervalLabels[4]}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  Easy
                </div>
                <span className="text-[10px] text-emerald-400 font-mono mt-0.5 opacity-60 group-hover:opacity-100">
                  4
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
