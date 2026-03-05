import { spawnSync } from 'child_process';
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = process.env.SENTENCE_OUTPUT_DIR || path.join('/tmp', 'sentence-scores');

async function scoreAllSentences(sentences) {
  const prompt = `Rate each snippet of a sentence on protential to be part of an actual english sentence scale 0-100. Return ONLY a valid JSON array. Each object must have exactly these fields: "id" (number), "sentence" (string), "score" (number 0-100), "errors" (string), "suggestion" (string), "url" (string). Do not include any other text.\n\n${JSON.stringify(sentences)}`;
  
  const token = process.env.COPILOT_GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  if (!token) {
    throw new Error('Missing token. Set GITHUB_TOKEN, GH_TOKEN, or COPILOT_GITHUB_TOKEN in the environment.');
  }
  
  console.log('🔍 GitHub token loaded from environment');
  
  const cmd = `gh copilot -p ${JSON.stringify(prompt)}`;
  
  console.log('Running gh copilot...');
  const result = spawnSync('sh', ['-c', cmd], {
    encoding: 'utf-8',
    env: {
      ...process.env,
      COPILOT_GITHUB_TOKEN: token,
      GH_TOKEN: token,
      GITHUB_TOKEN: token
    }
  });
  
  console.log('Command exit status:', result.status);
  
  if (result.error) {
    console.error('Spawn error:', result.error);
    throw result.error;
  }
  if (result.status !== 0) {
    console.error('Command failed with status:', result.status);
    console.error('stderr:', result.stderr);
    console.error('stdout:', result.stdout);
    throw new Error(`Command failed: ${result.stderr || result.stdout || 'Unknown error'}`);
  }
  
  return result.stdout;
}

async function main() {
 const apiUrl = `${process.env.API_URL}/api/sentence-bookmarks`;
  console.log(`Fetching from ${apiUrl}...`);
  
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  
  const allRows = await res.json();
  const rows = allRows.reverse().slice(0, 20).map(row => ({
    id: row.id,
    sentence: row.matched_word 
      ? row.matched_word.replace(/,/g, ' ').replace(/\s+/g, ' ').trim() 
      : row.sentence,
    url: row.url
  }));
  await fs.mkdir(outputDir, { recursive: true });
  const sentencesPath = path.join(outputDir, 'sentences.json');
  await fs.writeFile(sentencesPath, JSON.stringify(rows, null, 2));
  console.log(`Loaded ${rows.length} sentences (from ${allRows.length} total)`);

  const scores = await scoreAllSentences(rows);
  const scoresPath = path.join(outputDir, 'sentence-scores.json');
  await fs.writeFile(scoresPath, scores);
  console.log('Scores saved to sentence-scores.json');
}

main().catch(console.error);
