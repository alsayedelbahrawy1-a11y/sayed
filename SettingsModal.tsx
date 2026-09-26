import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { getAvailableVoices, playSound } from '../utils/audio';
import { X, Settings, Moon, Sun, Monitor, Volume2, Sparkles, Smartphone, RotateCcw, Save } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
  onResetDatabase,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<AppSettings>(settings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setVoices(getAvailableVoices());
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoices(getAvailableVoices());
      };
    }
  }, []);

  const handleSave = async () => {
    await onSaveSettings(form);
    onShowToast('Settings saved successfully!', 'success');
    onClose();
  };

  const handleResetDB = async () => {
    if (
      confirm(
        'Are you sure you want to reset the database? All custom cards, decks, and review history will be replaced with initial sample data!'
      )
    ) {
      await onResetDatabase();
      onShowToast('Database reset to sample state!', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              App Preferences
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Theme selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, theme: 'light' })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  form.theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, theme: 'dark' })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  form.theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, theme: 'system' })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  form.theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Sound & Haptics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Audio & Haptic Feedback
            </h3>

            {/* Sound effects */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Sound Effects
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Synthesized Web Audio tones on flip & ratings
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.soundEnabled}
                onChange={(e) => {
                  setForm({ ...form, soundEnabled: e.target.checked });
                  if (e.target.checked) playSound('good', true);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Haptics */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Haptic Vibrations
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Vibrations on supported mobile devices
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.hapticsEnabled}
                onChange={(e) => setForm({ ...form, hapticsEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* TTS */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Text to Speech (TTS)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Read cards aloud automatically using Web Speech API
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.ttsEnabled}
                  onChange={(e) => setForm({ ...form, ttsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {form.ttsEnabled && voices.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Select Voice
                  </label>
                  <select
                    value={form.ttsVoice || ''}
                    onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}
                    className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    <option value="">Default System Voice</option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Danger zone / Reset */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
              Data Management
            </h3>
            <button
              type="button"
              onClick={handleResetDB}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Sample Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
