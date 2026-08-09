/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A client-side rule-based Gujarati translit engine with a dictionary
// for common terms, plus support for Google Input Tools API for 100% accuracy.

const OFFLINE_DICTIONARY: { [key: string]: string } = {
  'kem': 'કેમ',
  'cho': 'છો',
  'shree': 'શ્રી',
  'shri': 'શ્રી',
  'trust': 'ટ્રસ્ટ',
  'daan': 'દાન',
  'pavati': 'પાવતી',
  'bhavan': 'ભવન',
  'kalyan': 'કલ્યાણ',
  'sarvajanik': 'સાર્વજનિક',
  'gujarat': 'ગુજરાત',
  'ahmedabad': 'અમદાવાદ',
  'amdavad': 'અમદાવાદ',
  'paldi': 'પાલડી',
  'bhakti': 'ભક્તિ',
  'avenue': 'એવન્યુ',
  'phone': 'ફોન',
  'mobile': 'મોબાઇલ',
  'email': 'ઈમેઈલ',
  'cash': 'રોકડા',
  'rokda': 'રોકડા',
  'bank': 'બેંક',
  'cheque': 'ચેક',
  'upadhyay': 'ઉપાધ્યાય',
  'patel': 'પટેલ',
  'shah': 'શાહ',
  'mehta': 'મહેતા',
  'pujara': 'પુજારા',
  'kharch': 'ખર્ચ',
  'paisa': 'પૈસા',
  'rupiya': 'રૂપિયા',
  'rupees': 'રૂપિયા',
  'varsh': 'વર્ષ',
  'year': 'વર્ષ',
  'seva': 'સેવા',
  'prabhu': 'પ્રભુ',
  'manav': 'માનવ',
  'kar': 'કર',
  'mukti': 'મુક્તિ',
  'mukt': 'મુક્ત',
  'anand': 'આનંદ',
  'member': 'સભ્ય',
  'sabhy': 'સભ્ય',
  'mantri': 'મંત્રી',
  'pramukh': 'પ્રમુખ',
  'vibhag': 'વિભાગ',
  'nondh': 'નોંધ',
  'nondhni': 'નોંધણી',
  'karyalay': 'કાર્યાલય',
  'bhai': 'ભાઈ',
  'ben': 'બહેન',
  'kumar': 'કુમાર',
  'lal': 'લાલ',
  'dev': 'દેવ'
};

// Fallback rule-based transliterator
export function localTransliterate(word: string): string {
  const lowercase = word.toLowerCase();
  if (OFFLINE_DICTIONARY[lowercase]) {
    return OFFLINE_DICTIONARY[lowercase];
  }

  // Basic letter mapping list
  let result = '';
  let i = 0;

  const startsWithVowel = /^[aeiou]/i.test(lowercase);

  while (i < lowercase.length) {
    const remaining = lowercase.substring(i);

    // Consonant clusters
    if (remaining.startsWith('ksh')) { result += 'ક્ષ'; i += 3; continue; }
    if (remaining.startsWith('gny') || remaining.startsWith('gny')) { result += 'જ્ઞ'; i += 3; continue; }
    if (remaining.startsWith('chh')) { result += 'છ'; i += 3; continue; }
    if (remaining.startsWith('kh')) { result += 'ખ'; i += 2; continue; }
    if (remaining.startsWith('gh')) { result += 'ઘ'; i += 2; continue; }
    if (remaining.startsWith('ch')) { result += 'ચ'; i += 2; continue; }
    if (remaining.startsWith('jh')) { result += 'ઝ'; i += 2; continue; }
    if (remaining.startsWith('th')) { result += 'થ'; i += 2; continue; }
    if (remaining.startsWith('dh')) { result += 'ધ'; i += 2; continue; }
    if (remaining.startsWith('ph')) { result += 'ફ'; i += 2; continue; }
    if (remaining.startsWith('bh')) { result += 'ભ'; i += 2; continue; }
    if (remaining.startsWith('sh')) { result += 'શ'; i += 2; continue; }
    if (remaining.startsWith('shh')) { result += 'ષ'; i += 2; continue; }
    if (remaining.startsWith('gy')) { result += 'જ્ઞ'; i += 2; continue; }

    // Single Consonants and Vowels/Matras
    const char = lowercase[i];
    
    // Vowels (Initial or middle)
    const isFirst = i === 0;
    if (char === 'a') {
      if (lowercase[i + 1] === 'a') {
        result += isFirst ? 'આ' : 'ા';
        i += 2;
      } else {
        result += isFirst ? 'અ' : '';
        i += 1;
      }
      continue;
    }
    if (char === 'i') {
      if (lowercase[i + 1] === 'i' || lowercase[i + 1] === 'e') {
        result += isFirst ? 'ઈ' : 'ી';
        i += 2;
      } else {
        result += isFirst ? 'ઇ' : 'િ';
        i += 1;
      }
      continue;
    }
    if (char === 'u') {
      if (lowercase[i + 1] === 'u' || lowercase[i + 1] === 'o') {
        result += isFirst ? 'ઊ' : 'ૂ';
        i += 2;
      } else {
        result += isFirst ? 'ઉ' : 'ુ';
        i += 1;
      }
      continue;
    }
    if (char === 'e') {
      if (lowercase[i + 1] === 'e') {
        result += isFirst ? 'ઈ' : 'ી';
        i += 2;
      } else {
        result += isFirst ? 'એ' : 'ે';
        i += 1;
      }
      continue;
    }
    if (char === 'o') {
      if (lowercase[i + 1] === 'o') {
        result += isFirst ? 'ઊ' : 'ૂ';
        i += 2;
      } else {
        result += isFirst ? 'ઓ' : 'ો';
        i += 1;
      }
      continue;
    }

    // Standard Consonants
    if (char === 'k') { result += 'ક'; }
    else if (char === 'g') { result += 'ગ'; }
    else if (char === 'j') { result += 'જ'; }
    else if (char === 't') { result += 'ત'; }
    else if (char === 'd') { result += 'દ'; }
    else if (char === 'n') { result += 'ન'; }
    else if (char === 'p') { result += 'પ'; }
    else if (char === 'f') { result += 'ફ'; }
    else if (char === 'b') { result += 'બ'; }
    else if (char === 'm') { result += 'મ'; }
    else if (char === 'y') { result += 'ય'; }
    else if (char === 'r') { result += 'ર'; }
    else if (char === 'l') { result += 'લ'; }
    else if (char === 'v' || char === 'w') { result += 'વ'; }
    else if (char === 's') { result += 'સ'; }
    else if (char === 'h') { result += 'હ'; }
    else {
      // Keep any other symbol/digit unchanged
      result += char;
    }

    // Add virtual halant (્) if next character is also a consonant (cluster/half-letter)
    if (i < lowercase.length - 1) {
      const nextChar = lowercase[i + 1];
      const isConsonant = /^[bcdfghjklmnpqrstvwxyz]/i.test(char);
      const isNextConsonant = /^[bcdfghjklmnpqrstvwxyz]/i.test(nextChar);
      if (isConsonant && isNextConsonant && char !== 'n' && char !== 'r' && nextChar !== 'h') {
        result += '્';
      }
    }

    i += 1;
  }

  return result;
}

let useLocalOnly = false;
let consecutiveFailures = 0;

// Main async translit function (tries Google API first, falls back to local)
export async function translitWord(word: string): Promise<string> {
  const trimmed = word.trim();
  if (!trimmed) return '';

  // Return immediately if it already contains Gujarati/non-ASCII characters
  if (/[^\x00-\x7F]/.test(trimmed)) {
    return trimmed;
  }

  // If we have determined the online service is offline or slow, return local instantly
  if (useLocalOnly) {
    return localTransliterate(trimmed);
  }

  // If the browser/PC is offline, do not even try fetching to avoid hanging promises
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return localTransliterate(trimmed);
  }

  try {
    // Reduce timeout to 150ms to ensure typing is always highly responsive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150);

    const response = await fetch(
      `https://inputtools.google.com/request?text=${encodeURIComponent(trimmed)}&itc=gu-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
      consecutiveFailures = 0;
      return data[1][0][1][0];
    }
  } catch (error) {
    consecutiveFailures++;
    console.warn(`Google Translit API failed (${consecutiveFailures} consecutive failures), falling back to local mapper`, error);
    
    // If we hit any network timeout (AbortError) or have multiple consecutive failures, 
    // permanently switch to super-fast local mode for 2 minutes to prevent typing delays.
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    if (isTimeout || consecutiveFailures >= 2) {
      useLocalOnly = true;
      // Attempt to check again after 2 minutes
      setTimeout(() => {
        useLocalOnly = false;
        consecutiveFailures = 0;
      }, 120000);
    }
  }

  // Local fallback
  return localTransliterate(trimmed);
}
