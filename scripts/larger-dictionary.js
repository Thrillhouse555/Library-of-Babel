require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

// Paths
const LARGE_DICT_PATH = path.join(__dirname, '..', 'cypress', 'fixtures', 'words_dictionary.json');
const API_BASE_URL = process.env.API_URL;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const CONFIRM_DELETE = process.env.CONFIRM_DELETE === 'true';

/**
 * Load the 466k word dictionary
 */
function loadLargeDictionary() {
  console.log('Loading large dictionary (466k words)...');
  const dictData = JSON.parse(fs.readFileSync(LARGE_DICT_PATH, 'utf-8'));
  const words = new Set(Object.keys(dictData));
  console.log(`✓ Loaded ${words.size} words\n`);
  return words;
}

/**
 * Make HTTPS GET request
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Make HTTPS POST request
 */
function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ id: 'unknown' });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Make HTTPS DELETE request with admin secret
 */
function httpDelete(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'DELETE',
      headers: {
        'x-admin-secret': ADMIN_SECRET
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ ok: true });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Main analysis function
 */
async function main() {
  if (!API_BASE_URL) {
    console.error('ERROR: API_URL environment variable is required');
    process.exit(1);
  }
  if (!ADMIN_SECRET) {
    console.error('ERROR: ADMIN_SECRET environment variable is required');
    process.exit(1);
  }
  if (!CONFIRM_DELETE) {
    console.error('ERROR: CONFIRM_DELETE must be set to "true" to enable deletion. This is a safety measure.');
    console.error('Usage: CONFIRM_DELETE=true node scripts/larger-dictionary.js');
    process.exit(1);
  }

  const largeDictionary = loadLargeDictionary();

  console.log('Fetching word bookmarks from API...');
  const wordBookmarks = await httpGet(`${API_BASE_URL}/api/word-bookmarks`);
  console.log(`✓ Retrieved ${wordBookmarks.length} word bookmarks\n`);

  if (wordBookmarks.length === 0) {
    console.log('No word bookmarks to process. Exiting.');
    return;
  }

  console.log('Analyzing surrounding words against large dictionary...\n');
  const MATCH_THRESHOLD = 2;
  let totalMatches = 0;
  const sentenceBookmarks = [];

  for (const bookmark of wordBookmarks) {
    const { id, booktext, url, surrounding_words } = bookmark;
    
    const surroundingTokens = surrounding_words
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

   const matchedWords = [];
    for (const token of surroundingTokens) {
      if (largeDictionary.has(token)) {
        matchedWords.push(token);
      }
    }

     if (matchedWords.length >= MATCH_THRESHOLD) {
      console.log(`✓ Match found! Word "${booktext}" has ${matchedWords.length} possible words for a sentence found: ${matchedWords.slice(0, 5).join(', ')}${matchedWords.length > 5 ? '...' : ''}`);
      console.log(`  Context: "${surrounding_words}"`);
      console.log(`  URL: ${url}\n`);
      
      sentenceBookmarks.push({
        original_word: booktext,
        matched_word: matchedWords.join(', '),
        sentence: surrounding_words,
        url: url
      });
      
      totalMatches++;
    }
  }

  console.log(`\nAnalysis complete. Found ${totalMatches} tier-2 matches.\n`);

  if (sentenceBookmarks.length > 0) {
    console.log('Saving sentence bookmarks to API...');
    for (const sb of sentenceBookmarks) {
      try {
        const response = await httpPost(`${API_BASE_URL}/api/sentence-bookmark`, sb);
        console.log(`✓ Saved sentence bookmark ID: ${response.id}`);
      } catch (error) {
        console.error(`✗ Failed to save sentence bookmark: ${error.message}`);
      }
    }
  }

  console.log('\nClearing word_bookmarks table...');
  try {
    const deleteResponse = await httpDelete(`${API_BASE_URL}/api/word-bookmarks`);
    console.log(`✓ Cleared ${deleteResponse.deletedCount || wordBookmarks.length} word bookmarks (CONFIRM_DELETE=true was required)`);
  } catch (error) {
    console.error(`✗ Failed to clear word_bookmarks: ${error.message}`);
  }

  console.log('\n✓ Weekly analysis complete!');
}

main().catch(error => {
  console.error('ERROR:', error.message);
  process.exit(1);
});
