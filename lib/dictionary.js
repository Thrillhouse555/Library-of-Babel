const fs = require('fs');
const path = require('path');

/**
 * Standalone dictionary module for analyzing text for English content
 * Works in both Node.js and Cypress environments
 */

let commonWords = new Set();

/**
 * Load dictionary from CSV file (Node.js version)
 */
function loadDictionarySync(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const words = csvContent.split('\n').map(w => w.trim()).filter(w => w.length > 0);
  commonWords = new Set(words);
  return commonWords;
}

/**
 * Load dictionary from CSV file (Cypress version)
 */
function loadDictionary(cypressFixturePath) {
  return cy.readFile(cypressFixturePath)
    .then((csvContent) => {
      const words = csvContent.split('\n').map(w => w.trim()).filter(w => w.length > 0);
      commonWords = new Set(words);
      return commonWords;
    });
}

/**
 * Normalize text aggressively to eliminate noise
 * Removes punctuation, converts to lowercase, normalizes whitespace
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')  
    .replace(/\s+/g, ' ')        
    .trim();
}

/**
 * Tokenize normalized text into words
 */
function tokenize(text) {
  const normalized = normalize(text);
  return normalized.split(' ').filter(token => token.length > 1);
}

/**
 * Count dictionary hits and calculate statistics
 */
function dictionaryStats(tokens) {
  let hits = 0;
  const matchedWords = [];

  for (const token of tokens) {
    if (commonWords.has(token)) {
      hits++;
      matchedWords.push(token);
    }
  }

  return {
    hits,
    total: tokens.length,
    ratio: tokens.length > 0 ? hits / tokens.length : 0,
    matchedWords
  };
}

/**
 * Analyze text for English content
 * Returns detailed analysis - any matched words means pass
 */
function analyzeText(text) {
  const tokens = tokenize(text);
  const stats = dictionaryStats(tokens);

  // Pass if any dictionary words were found
  const passed = stats.hits > 0;

  return {
    passed: passed,
    reason: passed 
      ? `Found ${stats.hits} dictionary word(s)`
      : 'No dictionary words found',
    stats: {
      tokens: stats.total,
      hits: stats.hits,
      ratio: stats.ratio,
      matchedWords: stats.matchedWords
    }
  };
}

/**
 * Analyze pageData.json fixture for English content
 */
function analyzePageData(pageDataFixture) {
  if (!pageDataFixture.pages || !Array.isArray(pageDataFixture.pages)) {
    return {
      error: 'Invalid pageData format - expected { pages: [...] }'
    };
  }

  return pageDataFixture.pages.map((page, index) => {
    const analysis = analyzeText(page.text);
    return {
      pageIndex: index,
      url: page.url,
      analysis
    };
  });
}

/**
 * Analyze text and extract matched words with their context
 * Returns array of matches with surrounding words
 */
function analyzeTextWithContext(text) {
  const tokens = tokenize(text);
  const matches = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (commonWords.has(token)) {
      // Get exactly one word before and one word after
      const wordBefore = i > 0 ? tokens[i - 1] : '';
      const wordAfter = i < tokens.length - 1 ? tokens[i + 1] : '';
      const surrounding = [wordBefore, token, wordAfter].filter(w => w).join(' ');
      
      matches.push({
        word: token,
        surrounding: surrounding
      });
    }
  }
  
  return matches;
}

/**
 * Analyze pageData.json with context extraction for individual word matches
 */
function analyzePageDataWithContext(pageDataFixture) {
  if (!pageDataFixture.pages || !Array.isArray(pageDataFixture.pages)) {
    return {
      error: 'Invalid pageData format - expected { pages: [...] }'
    };
  }

  return pageDataFixture.pages.map((page, index) => {
    const matches = analyzeTextWithContext(page.text);
    return {
      pageIndex: index,
      url: page.url,
      matches: matches,
      hasMatches: matches.length > 0
    };
  });
}

module.exports = {
  loadDictionary,
  loadDictionarySync,
  normalize,
  tokenize,
  analyzeText,
  analyzePageData,
  analyzeTextWithContext,
  analyzePageDataWithContext,
  dictionaryStats
};

