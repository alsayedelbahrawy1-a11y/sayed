import { runParserTests } from '../src/parser/__tests__/cardParser.test';

const success = runParserTests();
if (!success) {
  process.exit(1);
} else {
  console.log('All parser tests passed successfully!');
  process.exit(0);
}
