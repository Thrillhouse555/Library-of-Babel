import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = process.env.SENTENCE_OUTPUT_DIR || path.join('/tmp', 'sentence-scores');

async function main() {
  try {
    // Safety check: require explicit confirmation before deleting
    const confirmDelete = process.env.CONFIRM_DELETE === 'true';
    
    const scoresPath = path.join(outputDir, 'sentence-scores.json');
    try {
      await fs.access(scoresPath);
    } catch (accessErr) {
      console.error(`❌ Scores file not found: ${scoresPath}`);
      console.error('Skipping save because scoring did not complete.');
      return;
    }

    let scoresJson = await fs.readFile(scoresPath, 'utf-8');
    
    const jsonMatch = scoresJson.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      scoresJson = jsonMatch[1];
    }
    
    let scores = JSON.parse(scoresJson);
    
    scores = scores.map(s => ({
      sentence: s.sentence,
      score: typeof s.score === 'string' ? parseInt(s.score, 10) : s.score,
      errors: s.errors || '',
      suggestion: s.suggestion || '',
      url: s.url || ''
    }));

    console.log(`📊 Going into filter: ${scores.length} scores`);
    console.log('Scores before filter:', JSON.stringify(scores.map(s => ({sentence: s.sentence.substring(0, 30), score: s.score})), null, 2));

    const beforeFilter = scores.length;
    scores = scores.filter(s => s.score >= 10);
    if (beforeFilter > scores.length) {
      console.log(`⚠️  Filtered out ${beforeFilter - scores.length} invalid sentences (score<10), keeping ${scores.length}`);
    }
    console.log('Scores after filter:', JSON.stringify(scores.map(s => ({sentence: s.sentence.substring(0, 30), score: s.score})), null, 2));

    console.log('Parsed scores:', JSON.stringify(scores.slice(0, 2), null, 2));
    
    const apiScoresUrl = `${process.env.API_URL}/api/sentence-scores`;
    console.log(`Posting ${scores.length} scores to ${apiScoresUrl}...`);

    const apiRes = await fetch(apiScoresUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scores)
    });

    if (!apiRes.ok) {
      throw new Error(`API returned ${apiRes.status}: ${await apiRes.text()}`);
    }

    const result = await apiRes.json();
    console.log(`✅ Successfully saved to database: ${result.message}`);
    
    try {
      const adminSecret = process.env.ADMIN_SECRET;
      if (!adminSecret) {
        console.warn('⚠️  ADMIN_SECRET not set, skipping sentence bookmark deletion');
        return;
      }
      
      if (!confirmDelete) {
        console.warn('⚠️  Deletion skipped: set CONFIRM_DELETE=true to enable bookmark deletion');
        return;
      }

      const deleteUrl = `${process.env.API_URL}/api/sentence-bookmarks?limit=20`;
      console.log(`🗑️  Deleting first 20 sentence bookmarks...`);

      const deleteRes = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret
        }
      });

      if (!deleteRes.ok) {
        throw new Error(`Delete returned ${deleteRes.status}: ${await deleteRes.text()}`);
      }

      const deleteResult = await deleteRes.json();
      console.log(`✅ Deleted ${deleteResult.deletedCount} sentence bookmarks`);
      console.log('Delete response:', JSON.stringify(deleteResult, null, 2));
    } catch (deleteErr) {
      console.error('❌ Failed to delete sentence bookmarks:', deleteErr.message);
    }
  } catch (err) {
    console.error('❌ Failed to save scores to API:', err.message);
    throw err;
  }
}

main().catch(console.error);
