# StudyCards — Spaced Repetition Flashcards

An offline-first, 100% client-side spaced repetition flashcard application built with Vite, React 19, TypeScript, Tailwind CSS, and IndexedDB.

No backend, no API keys, no accounts — all your data stays in your browser.

## Features

- **100% local, no AI API required**: no Gemini/OpenAI calls, no API keys, no backend, no token usage. All data is stored in the browser via IndexedDB.
- **External AI workflow (optional)**: designed to work with cards you generate yourself in ChatGPT, Claude, Gemini, or DeepSeek outside the app — paste the generated text straight into the batch importer.
- **Canonical custom text format** for import/export:
  ```text
  id="jlngn3"
  Front
  ::
  Back
  ::
  #Tag1 #Tag2
  ---
  id="qc6rx4"
  The largest artery is the {{c1::aorta::main artery}}.
  ::
  Optional context
  ::
  #Anatomy #Cloze
  ---
  id="9p23sm"
  TYPE: reverse
  Front
  ::
  Back
  ::
  #Tag
  ```
- **Spaced Repetition Engine (SM-2)**: repetition tracking, interval calculation, and ease-factor adjustment (minimum 1.3, default 2.5). Ratings: Again (1), Hard (2), Good (3), Easy (4), with interval forecast labels (`< 10m`, `1d`, `6d`, `14d`). Includes study queue management for cards due today, the learning queue, and the relearning queue.
- **Cram / Practice Mode**: practice any deck without affecting scheduled SM-2 intervals.
- **Undo Review**: undo an accidental rating with one click or the `Z` key.
- **Card Browser & Bulk Operations**: search by text, ID, or tag; filter by status (new, learning, review, due, suspended), deck, or tag; sort by due date, created date, interval, ease factor, or front text; bulk delete, suspend/unsuspend, reset progress, add tag, or move deck.
- **Cloze Deletion Support**: `{{c1::answer}}` and `{{c1::answer::hint}}` syntax. In review mode the question shows `[...]` or `[hint]`, and the answer reveals the highlighted answer.
- **Reverse Cards**: `TYPE: reverse` for bidirectional card learning.
- **Visual Card Editor & Markdown Support**: bold, italic, code, cloze, bullet list, numbered list, blockquote, and Markdown tables, with a live card preview.
- **Audio & Haptics**: synthesized Web Audio API sound effects (no external audio files), SpeechSynthesis text-to-speech with voice selection, and navigator vibration haptics.
- **Full JSON Backup & Restore**: export the entire database or restore from a JSON backup.
- **PWA & Offline Support**: service worker caching and a web app manifest.
- **Theme Support**: light, dark, and system mode.

## Technology Stack

- [Vite](https://vitejs.dev/) — build tool and dev server
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- [lucide-react](https://lucide.dev/) — icons
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — local persistence (no server, no cloud sync)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production build

```bash
npm run build
npm run preview   # serve the production build locally
```

### Type check

```bash
npm run lint
```

### Run tests (parser & cloze tests)

```bash
npm test
```

### Regenerate PWA icons

```bash
npm run generate-icons
```

## Environment Variables

None are required. StudyCards runs entirely in the browser with no external API calls. `.env.example` is included as a convention/placeholder in case you extend the project with a service that needs configuration in the future — copy it to `.env` and fill it in; `.env` is already excluded via `.gitignore`.

## Project Structure

```
studycards/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icon-*.png, favicon.png, apple-touch-icon.png
├── scripts/
│   ├── generate-icons.js       # generates PWA icon PNGs
│   └── run-parser-tests.ts     # runs the card parser test suite
└── src/
    ├── main.tsx                # app entry point
    ├── App.tsx                 # root component / app state
    ├── index.css               # Tailwind entry + global styles
    ├── components/             # UI components & modals
    ├── db/
    │   └── indexedDB.ts        # IndexedDB persistence layer
    ├── parser/
    │   ├── cardParser.ts       # custom text import/export format
    │   └── __tests__/          # parser unit tests
    ├── types/
    │   └── index.ts            # shared TypeScript types
    └── utils/
        └── audio.ts            # Web Audio sound effects
```

## Data & Privacy

All decks, cards, review history, and settings are stored locally in your browser's IndexedDB. Nothing is sent to a server. Use **Settings → Backup & Restore** to export a JSON backup or move your data between devices/browsers.

## License

No license file is included by default — add one (e.g. MIT) before publishing if you intend to open source this project.
