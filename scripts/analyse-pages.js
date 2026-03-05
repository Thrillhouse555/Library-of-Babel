require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const dictionary = require('../lib/dictionary');

const DICTIONARY_PATH = path.join(__dirname, '..', process.env.DICTIONARY_PATH);
const PAGE_DATA_PATH = path.join(__dirname, '..', process.env.PAGE_DATA_PATH);
const API_URL = process.env.API_URL;
const WORD_BOOKMARK_API_URL = process.env.WORD_BOOKMARK_API_URL;

/**
 * Make HTTP POST request for regular bookmarks
 */
function postBookmark(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const postData = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201) {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (e) {
            resolve({ id: 'unknown' });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Make HTTP POST request for word bookmarks (individual words with context)
 */
function postWordBookmark(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(WORD_BOOKMARK_API_URL);
    const postData = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201) {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (e) {
            resolve({ id: 'unknown' });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Loading dictionary...');
  dictionary.loadDictionarySync(DICTIONARY_PATH);
  console.log('Dictionary loaded successfully\n');

  console.log('Loading page data...');
  const pageData = JSON.parse(fs.readFileSync(PAGE_DATA_PATH, 'utf-8'));
  console.log(`Loaded ${pageData.pages?.length || 0} pages\n`);

  console.log('Analyzing pages with context extraction...');
  const results = dictionary.analyzePageDataWithContext(pageData);
  
  let totalMatches = 0;
  const wordBookmarks = [];

  results.forEach(result => {
    if (result.hasMatches) {
      console.log(`Page ${result.pageIndex + 1}: ${result.matches.length} word(s) found`);
      
      result.matches.forEach(match => {
        wordBookmarks.push({
          booktext: match.word,
          url: result.url,
          surrounding_words: match.surrounding
        });
        totalMatches++;
      });
    } else {
      console.log(`Page ${result.pageIndex + 1}: No matches`);
    }
  });

  console.log(`\nTotal matches found: ${totalMatches}`);

  if (wordBookmarks.length > 0) {
    console.log(`\nLogging ${wordBookmarks.length} word bookmarks to API...`);
    
    for (const bookmark of wordBookmarks) {
      try {
        console.log(`Logging: "${bookmark.booktext}" with context: "${bookmark.surrounding_words}"`);
        console.log(`  URL: ${bookmark.url}`);
        const response = await postWordBookmark(bookmark);
        console.log(`✓ Word bookmark logged with ID: ${response.id}`);
      } catch (error) {
        console.error(`✗ Failed to log word bookmark: ${error.message}`);
      }
    }
  } else {
    console.log('\nNo word matches to log.');
  }
  console.log('\nClearing pageData.json...');
  const emptyData = { pages: [] };
  fs.writeFileSync(PAGE_DATA_PATH, JSON.stringify(emptyData, null, 2));
  console.log('✓ pageData.json cleared');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
