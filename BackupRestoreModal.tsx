import React, { useState, useRef } from 'react';
import { exportFullBackup, restoreFullBackup } from '../db/indexedDB';
import { Card } from '../types';
import { exportCardsToText } from '../parser/cardParser';
import { X, Database, Download, Upload, CheckCircle2, AlertTriangle, FileJson, FileText } from 'lucide-react';

interface BackupRestoreModalProps {
  cards: Card[];
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  cards,
  isOpen,
  onClose,
  onDataRestored,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    try {
      const backup = await exportFullBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studycards-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('Full JSON backup downloaded!', 'success');
    } catch (e: any) {
      onShowToast(`Export failed: ${e.message}`, 'error');
    }
  };

  const handleExportAllCanonical = () => {
    try {
      const text = exportCardsToText(cards);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studycards-all-${cards.length}-cards-canonical.txt`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast(`Exported all ${cards.length} cards in canonical format!`, 'success');
    } catch (e: any) {
      onShowToast(`Export failed: ${e.message}`, 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.cards || !Array.isArray(json.cards)) {
        throw new Error('Invalid StudyCards JSON backup file.');
      }

      await restoreFullBackup(json);
      await onDataRestored();
      onShowToast(`Successfully restored ${json.cards.length} cards!`, 'success');
      onClose();
    } catch (err: any) {
      onShowToast(`Restore error: ${err.message}`, 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Backup & Restore
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
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Export Collection
            </h3>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Full JSON Database Backup
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Includes cards, decks, review logs & settings
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            {/* Export Canonical Text */}
            <button
              onClick={handleExportAllCanonical}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Export Canonical Text File
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Plain text format with ID, ::, and --- separators
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            {/* Download Full Project ZIP */}
            <a
              href="/studycards-complete.zip"
              download="studycards-complete.zip"
              className="w-full p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Download Complete Source Code (ZIP)
                  </div>
                  <div className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70">
                    All components, parser, tests & assets to continue development
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Restore from Backup
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-2 text-center transition-colors group cursor-pointer"
            >
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {isRestoring ? 'Restoring database...' : 'Select JSON Backup File'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Restores cards, decks, and review history
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
