import { prompts1 } from './promptData/prompts1.js';
import { prompts2 } from './promptData/prompts2.js';
import { prompts3 } from './promptData/prompts3.js';
import { prompts4 } from './promptData/prompts4.js';
import { prompts5 } from './promptData/prompts5.js';

const allPrompts = [...prompts1, ...prompts2, ...prompts3, ...prompts4, ...prompts5];

console.log(`Total prompts in files: ${allPrompts.length}`);

const uniqueTexts = new Set<string>();
const duplicates: string[] = [];

allPrompts.forEach((prompt) => {
  if (uniqueTexts.has(prompt.text)) {
    duplicates.push(prompt.text);
  } else {
    uniqueTexts.add(prompt.text);
  }
});

console.log(`Unique prompts: ${uniqueTexts.size}`);
console.log(`Duplicates found: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\nDuplicate prompts:');
  duplicates.forEach((dup, i) => {
    console.log(`${i + 1}. ${dup.substring(0, 80)}...`);
  });
}
