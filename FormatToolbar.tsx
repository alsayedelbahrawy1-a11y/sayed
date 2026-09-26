import React from 'react';
import { Bold, Italic, Code, List, ListOrdered, Quote, Table, Brackets, HelpCircle } from 'lucide-react';

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
  showCloze?: boolean;
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({
  textareaRef,
  value,
  onChange,
  showCloze = true,
}) => {
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);

    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      if (selected) {
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        el.setSelectionRange(
          start + prefix.length,
          start + prefix.length + defaultText.length
        );
      }
    }, 0);
  };

  const insertCloze = (withHint: boolean = false) => {
    const el = textareaRef.current;
    if (!el) return;

    // Auto calculate next cloze number c1, c2, etc.
    const matches = value.match(/\{\{c(\d+)::/g) || [];
    let nextNum = 1;
    if (matches.length > 0) {
      const nums = matches.map((m) => parseInt(m.replace(/\D/g, ''), 10));
      nextNum = Math.max(...nums) + 1;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end) || 'text';

    const insertText = withHint
      ? `{{c${nextNum}::${selected}::hint}}`
      : `{{c${nextNum}::${selected}}}`;

    const newValue = value.substring(0, start) + insertText + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 6, start + 6 + selected.length);
    }, 0);
  };

  const insertTable = () => {
    const sampleTable = `\n| Column 1 | Column 2 |\n|---|---|\n| Item A | Item B |\n| Item C | Item D |\n`;
    insertFormatting(sampleTable);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs">
      <button
        type="button"
        onClick={() => insertFormatting('**', '**', 'bold')}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Bold (**text**)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => insertFormatting('*', '*', 'italic')}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Italic (*text*)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => insertFormatting('`', '`', 'code')}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Inline Code (`code`)"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

      {showCloze && (
        <>
          <button
            type="button"
            onClick={() => insertCloze(false)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors"
            title="Cloze Deletion ({{c1::answer}})"
          >
            <Brackets className="w-3.5 h-3.5" />
            <span>Cloze</span>
          </button>

          <button
            type="button"
            onClick={() => insertCloze(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
            title="Cloze with Hint ({{c1::answer::hint}})"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>+ Hint</span>
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
        </>
      )}

      <button
        type="button"
        onClick={() => insertFormatting('\n* ', '', 'Bullet item')}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Bullet list"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => insertFormatting('\n1. ', '', 'Numbered item')}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Numbered list"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => insertFormatting('\n> ', '', 'Quote')}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Quote block"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={insertTable}
        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
        title="Markdown table"
      >
        <Table className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
