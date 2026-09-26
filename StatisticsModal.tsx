import React, { useMemo } from 'react';
import { Card, ReviewLog } from '../types';
import { X, BarChart3, TrendingUp, Calendar, Zap, PieChart, Activity } from 'lucide-react';

interface StatisticsModalProps {
  cards: Card[];
  reviewLogs: ReviewLog[];
  isOpen: boolean;
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  cards,
  reviewLogs,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const now = Date.now();
  const dayMs = 86400000;

  // Breakdown by state
  const stateCounts = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;
    let suspendedCount = 0;

    cards.forEach((c) => {
      if (c.suspended) suspendedCount++;
      else if (c.state === 'new') newCount++;
      else if (c.state === 'learning' || c.state === 'relearning') learningCount++;
      else reviewCount++;
    });

    return { newCount, learningCount, reviewCount, suspendedCount, total: cards.length };
  }, [cards]);

  // Retention rate (% of reviews that were Good (3) or Easy (4))
  const retention = useMemo(() => {
    if (reviewLogs.length === 0) return { rate: 100, total: 0 };
    const passed = reviewLogs.filter((l) => l.rating >= 3).length;
    const rate = Math.round((passed / reviewLogs.length) * 100);
    return { rate, total: reviewLogs.length };
  }, [reviewLogs]);

  // Today's reviews
  const todayReviews = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return reviewLogs.filter((l) => l.reviewTime >= todayStart);
  }, [reviewLogs]);

  // 14-Day Due Forecast
  const forecastDays = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const dayStart = new Date().setHours(0, 0, 0, 0) + i * dayMs;
      const dayEnd = dayStart + dayMs;
      const count = cards.filter(
        (c) => !c.suspended && c.due >= dayStart && c.due < dayEnd
      ).length;

      const dateObj = new Date(dayStart);
      const label =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tmrw'
          : dateObj.toLocaleDateString(undefined, { weekday: 'narrow', day: 'numeric' });

      days.push({ label, count });
    }
    return days;
  }, [cards]);

  const maxForecast = Math.max(...forecastDays.map((d) => d.count), 1);

  // Past 14-Day Review Activity
  const activityDays = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date().setHours(0, 0, 0, 0) - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const count = reviewLogs.filter(
        (l) => l.reviewTime >= dayStart && l.reviewTime < dayEnd
      ).length;
      const dateObj = new Date(dayStart);
      const label = dateObj.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
      });
      days.push({ dateStr: dateObj.toISOString().slice(0, 10), label, count });
    }
    return days;
  }, [reviewLogs]);

  const maxActivity = Math.max(...activityDays.map((d) => d.count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Study Statistics & Forecasts
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
          {/* Key KPI Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Retention Rate
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {retention.rate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {retention.total} total reviews
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Reviewed Today
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {todayReviews.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">cards completed</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Total Cards
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stateCounts.total}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">in local IndexedDB</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Mature Cards
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {cards.filter((c) => c.interval >= 21).length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">interval ≥ 21 days</div>
            </div>
          </div>

          {/* Cards Pipeline Distribution */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cards Pipeline Distribution
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl">
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {stateCounts.newCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">New</div>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-xl">
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {stateCounts.learningCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Learning</div>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {stateCounts.reviewCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Review</div>
              </div>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {stateCounts.suspendedCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Suspended</div>
              </div>
            </div>
          </div>

          {/* 14-Day Due Forecast Chart */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>14-Day Due Forecast</span>
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="h-32 flex items-end justify-between gap-1.5 pt-4">
                {forecastDays.map((d, idx) => {
                  const heightPercent = Math.max(8, (d.count / maxForecast) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.count}
                      </span>
                      <div
                        className="w-full bg-indigo-500 hover:bg-indigo-400 rounded-t transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-slate-400 truncate max-w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Past Review Activity Heatmap/Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Past 14 Days Activity</span>
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="h-28 flex items-end justify-between gap-1.5 pt-4">
                {activityDays.map((d, idx) => {
                  const heightPercent = Math.max(6, (d.count / maxActivity) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.count}
                      </span>
                      <div
                        className={`w-full rounded-t transition-all ${
                          d.count > 0
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[9px] text-slate-400 truncate max-w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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
