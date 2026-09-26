import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const StudyCardsLogo: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20 text-white"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5"
        >
          {/* Back card */}
          <rect x="2" y="6" width="15" height="15" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" />
          {/* Front card */}
          <rect x="7" y="3" width="15" height="15" rx="3" fill="white" fillOpacity="0.15" stroke="currentColor" />
          {/* Repeat symbol / card lines */}
          <path d="M11 9h7" strokeWidth="2.2" stroke="white" strokeLinecap="round" />
          <path d="M11 12h5" strokeWidth="2.2" stroke="white" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            StudyCards
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400 -mt-1">
            Offline Spaced Repetition
          </span>
        </div>
      )}
    </div>
  );
};
