import React, { useState } from 'react';
import { X, HelpCircle, Copy, Check, Bot, FileText, CheckCircle2 } from 'lucide-react';

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FormatGuideModal: React.FC<FormatGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'format' | 'ai-prompts'>('format');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const canonicalExample = `id="jlngn3"
What is the primary excitatory neurotransmitter in the central nervous system?
::
Glutamate
::
#Neuro #Biochem
---
id="qc6rx4"
The largest artery in the human body is the {{c1::aorta::main artery}}, which originates directly from the {{c2::left ventricle::heart chamber}}.
::
Originates directly from the left ventricle and distributes oxygenated blood to all parts of the systemic circulation.
::
#Anatomy #Cardio
---
id="9p23sm"
TYPE: reverse
Bicuspid Aortic Valve
::
Most common congenital heart defect (~1-2% population). Increases risk of aortic stenosis and regurgitation.
::
#Cardiology #Pathology`;

  const generalAIPrompt = `You are an expert flashcard creator. I will provide notes, text, or a topic, and your task is to convert them into high-yield flashcards in this EXACT canonical format.

CRITICAL FORMAT RULES:
1. Separate each card with "---" on its own line.
2. Each card starts with: id="<6 random lowercase alphanumeric characters>"
3. Card sections are separated by "::" on its own line:
   - Section 1: Front / Question
   - Section 2: Back / Answer & explanation
   - Section 3: Tags (starting with #, e.g. #Subject #Topic)
4. For Cloze deletion cards, use {{c1::answer}} or {{c1::answer::hint}}.
5. For Reverse cards, add a line "TYPE: reverse" right after the id line.
6. Markdown tables and bullet lists are allowed inside the Front or Back.
7. Output ONLY the flashcards in this format with NO conversational introductory or concluding text.

Example output:
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

Here is my source material:
[PASTE YOUR NOTES / TEXT HERE]`;

  const medicalAIPrompt = `Generate clinical flashcards in the canonical format from my medical notes:

FORMAT REQUIREMENTS:
- Separate cards with "---" on its own line.
- Each card has: id="<6-char id>"
- Format:
id="xxxxxx"
Question / Case / Presentation
::
Diagnosis / Management / High-yield explanation
::
#Specialty #Topic
---
- Use cloze deletions {{c1::drug_name}} or {{c1::sign::hint}} for pharmacology and key symptoms.
- Use TYPE: reverse for anatomical structures or term definitions.
- Return ONLY the formatted cards.

Source content:
[PASTE MEDICAL NOTES / TOPIC HERE]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Format Guide & External AI Workflow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% offline app — use external ChatGPT or Claude to generate cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <button
            onClick={() => setActiveTab('format')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'format'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Canonical Format Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-prompts')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai-prompts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>External AI Prompts (ChatGPT / Claude)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'format' ? (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-indigo-900 dark:text-indigo-200">
                <p className="font-semibold mb-1">Canonical Custom Text Format</p>
                <p className="text-[11px] opacity-90">
                  Every card is separated by <code className="font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded">---</code>.
                  Sections inside each card are separated by <code className="font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded">::</code>.
                </p>
              </div>

              {/* Canonical Example Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Canonical Structure Example
                  </span>
                  <button
                    onClick={() => copyToClipboard(canonicalExample, 'example')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copiedKey === 'example' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'example' ? 'Copied' : 'Copy Example'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500 leading-normal">
                  {canonicalExample}
                </pre>
              </div>

              {/* Supported Card Types */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Supported Card Types
                </h4>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">1. Basic Card</span>
                  <p className="text-[11px]">
                    Standard question on front, answer and context on back.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">2. Cloze Deletion Card</span>
                  <p className="text-[11px]">
                    Uses <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">{`{{c1::answer}}`}</code> or with hint <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">{`{{c1::answer::hint}}`}</code>.
                    During review, cloze is hidden as <code className="font-mono">[...]</code> or <code className="font-mono">[hint]</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">3. Reverse Card</span>
                  <p className="text-[11px]">
                    Add <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">TYPE: reverse</code> right after the id line for bidirectional terminology.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-bold block mb-1">External AI Flashcard Workflow</span>
                <p className="text-[11px] opacity-90">
                  Copy one of the prompts below into ChatGPT, Claude, Gemini, or DeepSeek along with your lecture slides, book chapter, or notes. Then copy the generated output and paste it into StudyCards' <strong>Import Text</strong> tab!
                </p>
              </div>

              {/* General Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    General Study Prompt Template
                  </span>
                  <button
                    onClick={() => copyToClipboard(generalAIPrompt, 'general')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copiedKey === 'general' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'general' ? 'Copied' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500 max-h-48 overflow-y-auto">
                  {generalAIPrompt}
                </pre>
              </div>

              {/* Medical / Clinical Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Medical & High-Yield Clinical Prompt
                  </span>
                  <button
                    onClick={() => copyToClipboard(medicalAIPrompt, 'medical')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copiedKey === 'medical' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'medical' ? 'Copied' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500 max-h-48 overflow-y-auto">
                  {medicalAIPrompt}
                </pre>
              </div>
            </div>
          )}
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
