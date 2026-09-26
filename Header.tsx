import React from 'react';
import { StudyCardsLogo } from './StudyCardsLogo';
import {
  Plus,
  Play,
  Layers,
  BarChart3,
  Settings,
  HelpCircle,
  Database,
  Moon,
  Sun,
  Tags,
} from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  dueCount: number;
  totalCards: number;
  activeView: 'dashboard' | 'browser';
  onNavigateView: (view: 'dashboard' | 'browser') => void;
  onOpenAddModal: () => void;
  onStartReview: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenFormatGuide: () => void;
  onOpenBackup: () => void;
  onOpenTagManager: () => void;
  settings: AppSettings;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dueCount,
  totalCards,
  activeView,
  onNavigateView,
  onOpenAddModal,
  onStartReview,
  onOpenStats,
  onOpenSettings,
  onOpenFormatGuide,
  onOpenBackup,
  onOpenTagManager,
  settings,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigateView('dashboard')}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          >
            <StudyCardsLogo />
          </button>

          {/* Primary View Switcher */}
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onNavigateView('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Study Decks
            </button>
            <button
              onClick={() => onNavigateView('browser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'browser'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Card Browser ({totalCards})</span>
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Study Now CTA */}
          <button
            onClick={onStartReview}
            disabled={totalCards === 0}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl text-white shadow-md transition-all ${
              dueCount > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 active:scale-95'
            } disabled:opacity-50 disabled:pointer-events-none`}
            title={dueCount > 0 ? `Study ${dueCount} cards due now` : 'Cram or review cards'}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{dueCount > 0 ? `Study (${dueCount})` : 'Practice / Cram'}</span>
          </button>

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Cards</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Secondary tool buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenTagManager}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Tags Manager"
            >
              <Tags className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenStats}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Study Statistics & Forecasts"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenFormatGuide}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Format Guide & External AI Prompts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenBackup}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="JSON Backup & Restore"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={`Switch Theme (Current: ${settings.theme})`}
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile view subheader */}
      <div className="md:hidden px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateView('dashboard')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg ${
              activeView === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Decks
          </button>
          <button
            onClick={() => onNavigateView('browser')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg ${
              activeView === 'browser'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Browser ({totalCards})
          </button>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Due today: <strong className="text-indigo-600 dark:text-indigo-400">{dueCount}</strong>
        </span>
      </div>
    </header>
  );
};
