import {
  parseCustomText,
  exportCardsToText,
  extractClozeDeletions,
  renderClozeFront,
  renderClozeBack,
  generateCardId,
} from '../cardParser';
import { Card } from '../../types';

export function runParserTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetail?: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ ${testName}: ${errorDetail || 'Assertion failed'}`);
      failed++;
    }
  }

  console.log('\n--- Running Card Parser Tests ---');

  // Test 1: Canonical basic card parsing
  const canonicalInput = `
id="jlngn3"
What is the primary excitatory neurotransmitter in the brain?
::
Glutamate
::
#Neuro #Biochem
---
id="qc6rx4"
The largest artery in the human body is the {{c1::aorta::main artery}}.
::
Originates directly from the left ventricle.
::
#Anatomy #Cardio
---
id="9p23sm"
TYPE: reverse
Mitral Valve
::
Bicuspid Valve (between left atrium and left ventricle)
::
#Cardiology
`;

  const result1 = parseCustomText(canonicalInput);
  assert(result1.cards.length === 3, 'Parses 3 canonical cards', `Got ${result1.cards.length}`);
  assert(result1.cards[0].id === 'jlngn3', 'Card 1 ID parsed correctly', result1.cards[0]?.id);
  assert(result1.cards[0].type === 'basic', 'Card 1 type is basic', result1.cards[0]?.type);
  assert(result1.cards[0].tags.includes('Neuro'), 'Card 1 contains #Neuro tag');
  assert(result1.cards[0].tags.includes('Biochem'), 'Card 1 contains #Biochem tag');

  assert(result1.cards[1].id === 'qc6rx4', 'Card 2 ID parsed correctly');
  assert(result1.cards[1].type === 'cloze', 'Card 2 auto-detected as cloze');
  assert(result1.cards[1].back.includes('left ventricle'), 'Card 2 back context parsed');

  assert(result1.cards[2].id === '9p23sm', 'Card 3 ID parsed correctly');
  assert(result1.cards[2].type === 'reverse', 'Card 3 detected as reverse');

  // Test 2: Multiline card with clinical case & markdown table does NOT split prematurely
  const complexMultilineInput = `
id="cli001"
A 45-year-old male presents with sudden onset crushing chest pain radiating to the jaw.

ECG shows:
| Lead | ST Elevation |
|------|--------------|
| II, III, aVF | > 2mm |

What is the suspected diagnosis and coronary artery involved?
::
Inferior STEMI

Coronary artery:
* Right Coronary Artery (RCA) in 85-90% of cases (right dominant)
* Left Circumflex (LCx) in 10-15% (left dominant)
::
#Cardiology #Emergency
---
id="cli002"
Next card question
::
Next card answer
::
#General
`;

  const result2 = parseCustomText(complexMultilineInput);
  assert(result2.cards.length === 2, 'Multiline card with table does not split', `Got ${result2.cards.length}`);
  assert(result2.cards[0].front.includes('| Lead | ST Elevation |'), 'Card 1 retains markdown table');
  assert(result2.cards[0].back.includes('Right Coronary Artery (RCA)'), 'Card 1 retains bullet points');

  // Test 3: Cloze deletion helpers
  const clozeText = 'The primary pacemaker of the heart is the {{c1::SA node::node located in right atrium}}.';
  const clozeItems = extractClozeDeletions(clozeText);
  assert(clozeItems.length === 1, 'Extracts 1 cloze item');
  assert(clozeItems[0].answer === 'SA node', 'Cloze answer is SA node');
  assert(clozeItems[0].hint === 'node located in right atrium', 'Cloze hint is preserved');

  const renderedFront = renderClozeFront(clozeText, 'c1');
  assert(renderedFront.includes('[node located in right atrium]'), 'Front replaces cloze with hint');

  const renderedBack = renderClozeBack(clozeText, 'c1');
  assert(renderedBack.includes('[[HIGHLIGHT:SA node]]'), 'Back replaces cloze with highlighted answer');

  // Test 4: Export canonical format & round-trip verification
  const testCards: Card[] = [
    {
      id: 'abc123',
      deckId: 'default',
      front: 'Question 1',
      back: 'Answer 1',
      type: 'basic',
      tags: ['TestTag', 'Tag2'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      due: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      reps: 1,
      lapses: 0,
      state: 'review',
    },
    {
      id: 'rev456',
      deckId: 'default',
      front: 'Front Reverse',
      back: 'Back Reverse',
      type: 'reverse',
      tags: ['Language'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      due: Date.now(),
      interval: 3,
      easeFactor: 2.6,
      reps: 2,
      lapses: 0,
      state: 'review',
    },
  ];

  const exportedText = exportCardsToText(testCards);
  assert(exportedText.includes('---'), 'Export uses canonical --- separator');
  assert(exportedText.includes('id="abc123"'), 'Export includes id="abc123"');
  assert(exportedText.includes('TYPE: reverse'), 'Export includes TYPE: reverse for reverse cards');

  // Re-parse exported text
  const roundTrip = parseCustomText(exportedText);
  assert(roundTrip.cards.length === 2, 'Round-trip parses 2 cards');
  assert(roundTrip.cards[0].id === 'abc123', 'Round-trip preserves ID 1');
  assert(roundTrip.cards[1].id === 'rev456', 'Round-trip preserves ID 2');
  assert(roundTrip.cards[1].type === 'reverse', 'Round-trip preserves reverse type');
  assert(roundTrip.cards[0].tags.includes('TestTag'), 'Round-trip preserves tags');

  // Test 5: ID generation format
  const generatedId = generateCardId();
  assert(/^[a-z0-9]{6}$/.test(generatedId), 'generateCardId produces 6 alphanumeric lowercase chars');

  console.log(`\nParser Tests Summary: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}
