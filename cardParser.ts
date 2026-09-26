import { Card, CardType, ParsedCard, ParseResult } from '../types';

/**
 * Generate a short 6-character alphanumeric ID matching prompt canonical format (e.g. "jlngn3", "qc6rx4")
 */
export function generateCardId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Normalizes quotes (e.g. curly smart quotes “ ” to straight ")
 */
function normalizeQuotes(str: string): string {
  return str.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

/**
 * Splits text into individual card raw chunks.
 * Tolerant to:
 * - `---`, `===`, `***` card separators
 * - New card indicator prefixes like `id="...", `id=“...”, `ID: ...`
 * - Explicit blank line separation ONLY when subsequent block looks like a new card,
 *   while NOT splitting multiline cards, clinical cases, bullet lists, or markdown tables.
 */
function splitIntoCardBlocks(text: string): string[] {
  const normalized = normalizeQuotes(text).trim();
  if (!normalized) return [];

  // Check if explicit separator '---' or '===' is used
  // Match lines that only contain 3 or more dashes, equals, or asterisks
  const explicitSepRegex = /^[ \t]*(?:---|\*\*\*|===)+[ \t]*$/m;

  if (explicitSepRegex.test(normalized)) {
    return normalized
      .split(/^[ \t]*(?:---|\*\*\*|===)+[ \t]*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // If no explicit '---' separators are found, we inspect line by line.
  // We identify card boundaries by:
  // 1. A line starting with `id="..."` or `ID:` or `TYPE:` when we already have accumulated card content.
  // 2. Or, a double newline where the previous block has at least one '::' separator and the next block also looks like a card (or starts with id/TYPE/text with '::').
  const lines = normalized.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlockLines: string[] = [];

  const startsNewCard = (line: string): boolean => {
    const trimmed = line.trim();
    if (/^id\s*=\s*"[^"]+"/i.test(trimmed)) return true;
    if (/^id\s*:\s*\S+/i.test(trimmed)) return true;
    if (/^type\s*:\s*(reverse|basic|cloze)/i.test(trimmed)) return true;
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (startsNewCard(line) && currentBlockLines.length > 0) {
      // Check if current block already contains substantive content (at least one '::')
      const currentBlockText = currentBlockLines.join('\n').trim();
      if (currentBlockText.includes('::') || currentBlockLines.some((l) => l.trim().length > 0)) {
        blocks.push(currentBlockText);
        currentBlockLines = [line];
        continue;
      }
    }

    currentBlockLines.push(line);
  }

  if (currentBlockLines.length > 0) {
    const lastBlock = currentBlockLines.join('\n').trim();
    if (lastBlock) blocks.push(lastBlock);
  }

  // If we only have 1 block and it has multiple cards separated by double blank lines where each part has '::'
  if (blocks.length === 1 && !startsNewCard(lines[0])) {
    const rawChunks = normalized.split(/\n\s*\n\s*\n+/);
    if (rawChunks.length > 1 && rawChunks.every((c) => c.includes('::'))) {
      return rawChunks.map((c) => c.trim()).filter((c) => c.length > 0);
    }
  }

  return blocks.filter((b) => b.trim().length > 0);
}

/**
 * Extracts tags from a tag line (e.g., "#Anatomy #Cloze" or "Anatomy, Cloze" or "#Tag1")
 */
export function parseTags(tagStr: string): string[] {
  if (!tagStr) return [];
  const trimmed = tagStr.trim();
  if (!trimmed) return [];

  // Match hashtags #tag or comma/space separated words
  const hashtagMatches = trimmed.match(/#([\w\p{L}-]+)/gu);
  if (hashtagMatches && hashtagMatches.length > 0) {
    return Array.from(new Set(hashtagMatches.map((t) => t.slice(1).trim()).filter(Boolean)));
  }

  // Otherwise comma or space separated
  return Array.from(
    new Set(
      trimmed
        .split(/[,;\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean)
    )
  );
}

/**
 * Split card content by '::' section delimiters, ensuring '::' inside '{{c1::...}}' is NOT split.
 */
export function splitCardSections(text: string): string[] {
  const sections: string[] = [];
  let current = '';
  let inCloze = false;
  let i = 0;

  while (i < text.length) {
    if (text[i] === '{' && text[i + 1] === '{') {
      inCloze = true;
      current += '{{';
      i += 2;
      continue;
    }
    if (text[i] === '}' && text[i + 1] === '}') {
      inCloze = false;
      current += '}}';
      i += 2;
      continue;
    }

    if (!inCloze && text[i] === ':' && text[i + 1] === ':') {
      sections.push(current.trim());
      current = '';
      i += 2;
      // Skip trailing whitespace on same line
      while (i < text.length && (text[i] === ' ' || text[i] === '\t')) {
        i++;
      }
      // If immediately followed by newline, skip it
      if (i < text.length && (text[i] === '\r' || text[i] === '\n')) {
        if (text[i] === '\r' && text[i + 1] === '\n') i++;
        i++;
      }
      continue;
    }

    current += text[i];
    i++;
  }

  sections.push(current.trim());
  return sections;
}

/**
 * Parses a single card block
 */
export function parseCardBlock(blockText: string, index: number): ParsedCard | null {
  const normalized = normalizeQuotes(blockText).trim();
  if (!normalized) return null;

  let id: string | undefined = undefined;
  let type: CardType = 'basic';
  const warnings: string[] = [];

  let content = normalized;

  // Extract ID if present: id="jlngn3" or ID: jlngn3
  const idMatch = content.match(/^(?:id\s*=\s*"([^"]+)"|id\s*:\s*([^\s\n\r]+))/i);
  if (idMatch) {
    id = (idMatch[1] || idMatch[2]).trim();
    content = content.replace(/^(?:id\s*=\s*"[^"]+"|id\s*:\s*[^\s\n\r]+)[ \t]*\r?\n?/i, '').trim();
  }

  // Extract TYPE if present: TYPE: reverse
  const typeMatch = content.match(/^TYPE\s*:\s*(reverse|cloze|basic)\b[ \t]*\r?\n?/i);
  if (typeMatch) {
    const rawType = typeMatch[1].toLowerCase();
    if (rawType === 'reverse') type = 'reverse';
    else if (rawType === 'cloze') type = 'cloze';
    else type = 'basic';
    content = content.replace(/^TYPE\s*:\s*(?:reverse|cloze|basic)\b[ \t]*\r?\n?/i, '').trim();
  }

  // Split content by '::' separators safely outside cloze brackets
  const sections = splitCardSections(content);

  if (sections.length < 2) {
    // Missing back side
    warnings.push(`Card ${index + 1}: Missing '::' separator between front and back.`);
    return {
      id,
      type,
      front: content,
      back: '',
      tags: [],
      rawText: blockText,
      warnings,
    };
  }

  const front = sections[0].trim();
  let back = sections[1].trim();
  let tags: string[] = [];

  if (sections.length >= 3) {
    // 3rd section is tags
    const tagSection = sections.slice(2).join(' :: ').trim();
    tags = parseTags(tagSection);
  } else {
    // Check if back section ends with hashtag line like "#Tag1 #Tag2"
    const backLines = back.split(/\r?\n/);
    const lastLine = backLines[backLines.length - 1]?.trim() || '';
    if (lastLine.startsWith('#') && backLines.length > 1) {
      tags = parseTags(lastLine);
      back = backLines.slice(0, backLines.length - 1).join('\n').trim();
    }
  }

  // Auto-detect cloze type if front or back contains {{c1::...}} and type wasn't explicitly reverse
  if (type !== 'reverse' && (/\{\{c\d+::.+?\}\}/s.test(front) || /\{\{c\d+::.+?\}\}/s.test(back))) {
    type = 'cloze';
  }

  return {
    id,
    type,
    front,
    back,
    tags,
    rawText: blockText,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Main parser for custom text
 */
export function parseCustomText(text: string): ParseResult {
  const blocks = splitIntoCardBlocks(text);
  const cards: ParsedCard[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  blocks.forEach((block, idx) => {
    const parsed = parseCardBlock(block, idx);
    if (!parsed) return;

    if (!parsed.front) {
      errors.push(`Card ${idx + 1}: Front cannot be empty.`);
      return;
    }

    if (parsed.warnings) {
      warnings.push(...parsed.warnings);
    }

    cards.push(parsed);
  });

  return { cards, errors, warnings };
}

/**
 * Canonical card exporter:
 * id="jlngn3"
 * Front
 * ::
 * Back
 * ::
 * #Tag1 #Tag2
 * ---
 */
export function exportCardsToText(cards: Card[]): string {
  return cards
    .map((card) => {
      const lines: string[] = [];
      lines.push(`id="${card.id}"`);
      if (card.type === 'reverse') {
        lines.push('TYPE: reverse');
      } else if (card.type === 'cloze' && !card.front.includes('{{c')) {
        lines.push('TYPE: cloze');
      }

      lines.push(card.front);
      lines.push('::');
      lines.push(card.back || '');

      if (card.tags && card.tags.length > 0) {
        lines.push('::');
        const tagLine = card.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
        lines.push(tagLine);
      }

      return lines.join('\n');
    })
    .join('\n---\n');
}

/**
 * Cloze deletion extractor:
 * matches {{c1::answer}} or {{c1::answer::hint}}
 */
export interface ClozeItem {
  id: string; // e.g. "c1", "c2"
  answer: string;
  hint?: string;
  fullMatch: string;
}

export function extractClozeDeletions(text: string): ClozeItem[] {
  const regex = /\{\{(c\d+)::([^:]+?)(?:::([^}]+))?\}\}/g;
  const items: ClozeItem[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    items.push({
      id: match[1],
      answer: match[2],
      hint: match[3],
      fullMatch: match[0],
    });
  }
  return items;
}

/**
 * Render Cloze Front (question):
 * e.g., "The largest artery is the {{c1::aorta}}." -> "The largest artery is the [...]."
 * or with hint: "{{c1::aorta::main artery}}" -> "The largest artery is the [main artery]."
 */
export function renderClozeFront(text: string, activeClozeId: string = 'c1'): string {
  return text.replace(/\{\{(c\d+)::([^:]+?)(?:::([^}]+))?\}\}/g, (_, cId, __, hint) => {
    if (cId === activeClozeId) {
      return hint ? `[${hint}]` : '[...]';
    }
    // Other clozes can remain displayed as is or answer
    return `[${hint || '...'}]`;
  });
}

/**
 * Render Cloze Back (answer revealed)
 */
export function renderClozeBack(text: string, activeClozeId: string = 'c1'): string {
  return text.replace(/\{\{(c\d+)::([^:]+?)(?:::([^}]+))?\}\}/g, (_, cId, answer) => {
    if (cId === activeClozeId) {
      return `[[HIGHLIGHT:${answer}]]`;
    }
    return answer;
  });
}
