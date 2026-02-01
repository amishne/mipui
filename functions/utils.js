const admin = require('firebase-admin');

/**
 * Fetches all map keys using the Firebase REST API with shallow=true.
 * 
 * WHY THIS IS NEEDED:
 * 1. "Monster Map" Problem: Reading a large map (e.g. 500MB) via the Admin SDK causes OOM (Out of Memory),
 *    even with 'GB' memory allocation, because the SDK loads the entire node into memory.
 * 2. Solution: The REST API supports `shallow=true`, which returns keys without their values.
 *    This data is lightweight (~20MB for 600k maps) and prevents OOM.
 * 3. Usage: This function is strictly used in the "Poison Pill" scenario (Retries >= 3)
 *    to identify the next key to skip to, unblocking the queue.
 */
async function getAllMapKeys() {
  let dbUrl = admin.app().options.databaseURL;
  // Handle Emulator URL which might include query params (e.g. ?ns=project)
  // We need to insert /maps.json before the query string.
  
  let url;
  try {
      const urlObj = new URL(dbUrl);
      urlObj.pathname = (urlObj.pathname === '/' ? '' : urlObj.pathname) + '/maps.json';
      urlObj.searchParams.set('shallow', 'true');
      url = urlObj.toString();
  } catch (e) {
      // Fallback for simple string concatenation if URL parsing fails (unlikely)
      url = `${dbUrl}/maps.json?shallow=true`;
  }
  
  // In Emulator, auth token might be optional or dummy. 
  // We try to attach it if available.
  const headers = {};
  let token;
  try {
      token = await admin.app().options.credential.getAccessToken();
  } catch (e) {
      console.warn('[WARN] Could not get access token for REST call (may be local emulator).');
  }

  if (token && token.access_token) {
      headers['Authorization'] = `Bearer ${token.access_token}`;
  } else if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
      // Logic: Emulator accepts "Bearer owner" as admin.
      console.log('[INFO] Using "Bearer owner" for Emulator REST request.');
      headers['Authorization'] = 'Bearer owner';
  }

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch map keys: ${response.statusText} (${url})`);
  }

  const data = await response.json();
  if (!data) return [];
  
  return Object.keys(data).sort();
}

module.exports = { getAllMapKeys };
