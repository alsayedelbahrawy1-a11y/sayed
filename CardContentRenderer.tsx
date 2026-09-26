import React from 'react';
import { renderClozeFront, renderClozeBack } from '../parser/cardParser';

interface CardContentRendererProps {
  content: string;
  isAnswerSide?: boolean;
  isCloze?: boolean;
  activeClozeId?: string;
  className?: string;
}

export const CardContentRenderer: React.FC<CardContentRendererProps> = ({
  content,
  isAnswerSide = false,
  isCloze = false,
  activeClozeId = 'c1',
  className = '',
}) => {
  // If it's a cloze card, preprocess cloze markers
  let textToRender = content;
  if (isCloze || /\{\{c\d+::.+?\}\}/.test(content)) {
    if (isAnswerSide) {
      textToRender = renderClozeBack(content, activeClozeId);
    } else {
      textToRender = renderClozeFront(content, activeClozeId);
    }
  }

  // Parse lightweight markdown & elements
  return (
    <div className={`space-y-3 leading-relaxed break-words ${className}`}>
      {renderFormattedBlocks(textToRender)}
    </div>
  );
};

function renderFormattedBlocks(text: string): React.ReactNode[] {
  // Normalize line breaks
  const rawLines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let blockquoteLines: string[] = [];

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="list-disc list-inside space-y-1 my-2 text-inherit">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-normal">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="list-decimal list-inside space-y-1 my-2 text-inherit">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-normal">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const header = tableRows[0];
      const rows = tableRows.slice(1);
      blocks.push(
        <div key={`table-${blocks.length}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 font-semibold text-slate-800 dark:text-slate-200">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3.5 py-2 text-left">
                    {renderInlineFormatting(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                      {renderInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableRows = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="border-l-4 border-indigo-500 pl-3.5 py-1 italic text-slate-600 dark:text-slate-400 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-r my-2"
        >
          {blockquoteLines.map((line, idx) => (
            <div key={idx}>{renderInlineFormatting(line)}</div>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Check table row
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      flushBlockquote();
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      // Skip separator rows like |---|---|
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }
      inTable = true;
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Check blockquote
    if (line.startsWith('>')) {
      flushList();
      blockquoteLines.push(line.replace(/^>\s?/, ''));
      continue;
    } else {
      flushBlockquote();
    }

    // Check unordered list
    if (/^[*-]\s+/.test(line)) {
      if (currentList && currentList.type !== 'ul') flushList();
      if (!currentList) currentList = { type: 'ul', items: [] };
      currentList.items.push(line.replace(/^[*-]\s+/, ''));
      continue;
    }

    // Check ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (currentList && currentList.type !== 'ol') flushList();
      if (!currentList) currentList = { type: 'ol', items: [] };
      currentList.items.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }

    flushList();

    // Empty line creates spacing
    if (!line) {
      blocks.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-1.5">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={`h2-${i}`} className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Standard paragraph
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInlineFormatting(rawLines[i])}
      </p>
    );
  }

  flushList();
  flushTable();
  flushBlockquote();

  return blocks;
}

/**
 * Handles inline formatting:
 * **bold**, *italic*, `code`, [[HIGHLIGHT:...]], cloze [hint] or [...]
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Replace highlighted cloze answers: [[HIGHLIGHT:answer]]
  const parts: React.ReactNode[] = [];
  const regex = /(\[\[HIGHLIGHT:(.+?)\]\]|\[\.\.\.\]|\[[^\]]+\]|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;

  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];

    if (token.startsWith('[[HIGHLIGHT:') && token.endsWith(']]')) {
      const highlightedText = token.slice(12, -2);
      parts.push(
        <span
          key={match.index}
          className="inline-block px-2 py-0.5 mx-1 font-semibold rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-sm"
        >
          {highlightedText}
        </span>
      );
    } else if (token === '[...]') {
      // Hidden cloze bracket
      parts.push(
        <span
          key={match.index}
          className="inline-block px-2.5 py-0.5 mx-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-md tracking-wider shadow-sm animate-pulse"
        >
          [...]
        </span>
      );
    } else if (token.startsWith('[') && token.endsWith(']')) {
      // Cloze with hint
      const hint = token.slice(1, -1);
      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-1 font-medium text-xs rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm"
        >
          <span className="opacity-60 text-[10px] uppercase font-bold tracking-wider">hint:</span> {hint}
        </span>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
