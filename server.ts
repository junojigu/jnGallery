import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbzvRVU7ythOqAG6xy7WE87vs7g16U1UFglncVnC4CVsV4jBqeq0OtZHkkPsb49H4uo_/exec';
const STORE_PATH = path.join(__dirname, 'likes-store.json');

// Real-time in-memory store backed by disk + Google Sheets
const state = {
  likes: {},
  exhibitionPicks: [],
  hasExhibitionPicks: false,
  sheetUrl: DEFAULT_SHEET_URL,
  cachedHomeSettings: null,
  updatedAt: Date.now(),
  lastSheetFetchAt: 0,
  isFetchingSheet: false,
};

function parseLikesMap(raw) {
  if (!raw) return {};
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const res = {};
      for (const [k, v] of Object.entries(obj)) {
        const num = Number(v);
        if (!isNaN(num) && num > 0) {
          res[String(k).trim()] = Math.floor(num);
        }
      }
      return res;
    }
  } catch {
    // ignore parse error
  }
  return {};
}

function parsePicksList(raw) {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(arr)) {
      return arr.map((id) => String(id).trim()).filter(Boolean);
    }
  } catch {
    // ignore parse error
  }
  return [];
}

function loadLocalStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state.likes = parseLikesMap(parsed.likes);
        if (Array.isArray(parsed.exhibitionPicks)) {
          state.exhibitionPicks = parsePicksList(parsed.exhibitionPicks);
          state.hasExhibitionPicks = true;
        }
        if (parsed.sheetUrl && typeof parsed.sheetUrl === 'string') {
          state.sheetUrl = parsed.sheetUrl;
        }
        if (parsed.cachedHomeSettings && typeof parsed.cachedHomeSettings === 'object') {
          state.cachedHomeSettings = parsed.cachedHomeSettings;
        }
        if (typeof parsed.updatedAt === 'number') {
          state.updatedAt = parsed.updatedAt;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load local likes store:', err);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(
        {
          likes: state.likes,
          exhibitionPicks: state.exhibitionPicks,
          hasExhibitionPicks: state.hasExhibitionPicks,
          sheetUrl: state.sheetUrl,
          cachedHomeSettings: state.cachedHomeSettings,
          updatedAt: state.updatedAt,
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to save local likes store:', err);
  }
}

// Connected SSE client writers for instant <50ms real-time broadcast
const sseClients = new Set();

function broadcastRealtimeState() {
  const payload = JSON.stringify({
    likes: state.likes,
    exhibitionPicks: state.exhibitionPicks,
    hasExhibitionPicks: state.hasExhibitionPicks,
    updatedAt: state.updatedAt,
  });
  const message = `data: ${payload}\n\n`;
  sseClients.forEach((sendFn) => {
    try {
      if (typeof sendFn === 'function') {
        sendFn(message);
      }
    } catch {
      sseClients.delete(sendFn);
    }
  });
}

// Hydrate & merge from Google Sheet in background
async function hydrateFromGoogleSheet(force = false) {
  if (!state.sheetUrl) return;
  const now = Date.now();
  if (state.isFetchingSheet) return;
  if (!force && now - state.lastSheetFetchAt < 25000) return;

  state.isFetchingSheet = true;
  state.lastSheetFetchAt = now;

  try {
    const separator = state.sheetUrl.includes('?') ? '&' : '?';
    const res = await fetch(`${state.sheetUrl}${separator}_t=${now}`, {
      method: 'GET',
      redirect: 'follow',
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || typeof data !== 'object') return;

    if (data.homeSettings && typeof data.homeSettings === 'object') {
      state.cachedHomeSettings = {
        ...(state.cachedHomeSettings || {}),
        ...data.homeSettings,
      };

      const remoteLikes = parseLikesMap(data.homeSettings.photoLikesJson);
      let changed = false;

      // Only merge upward on initial hydration if local store doesn't have an entry yet
      for (const [photoId, rawCount] of Object.entries(remoteLikes)) {
        const count = Number(rawCount);
        if (state.likes[photoId] === undefined && !isNaN(count) && count > 0) {
          state.likes[photoId] = count;
          changed = true;
        }
      }

      if (
        !state.hasExhibitionPicks &&
        data.homeSettings.exhibitionPicksJson !== undefined
      ) {
        state.exhibitionPicks = parsePicksList(data.homeSettings.exhibitionPicksJson);
        state.hasExhibitionPicks = true;
        changed = true;
      }

      if (changed) {
        state.updatedAt = Date.now();
        saveLocalStore();
        broadcastRealtimeState();
      }
    }
  } catch {
    // ignore transient network errors
  } finally {
    state.isFetchingSheet = false;
  }
}

// Debounced background persistence to Google Sheets (non-blocking for instant UX)
let sheetSyncTimer = null;
let isSyncingToSheet = false;
let pendingSheetSync = false;

function scheduleGoogleSheetBackup() {
  if (sheetSyncTimer) clearTimeout(sheetSyncTimer);
  sheetSyncTimer = setTimeout(() => {
    flushToGoogleSheet();
  }, 600);
}

async function flushToGoogleSheet() {
  if (!state.sheetUrl) return;
  if (isSyncingToSheet) {
    pendingSheetSync = true;
    return;
  }

  isSyncingToSheet = true;
  pendingSheetSync = false;

  try {
    // Ensure we have base homeSettings so we never clobber siteName/heroTitle in Google Sheets
    if (!state.cachedHomeSettings) {
      try {
        const separator = state.sheetUrl.includes('?') ? '&' : '?';
        const getRes = await fetch(`${state.sheetUrl}${separator}_t=${Date.now()}`, {
          method: 'GET',
          redirect: 'follow',
        });
        if (getRes.ok) {
          const data = await getRes.json();
          if (data?.homeSettings && typeof data.homeSettings === 'object') {
            state.cachedHomeSettings = data.homeSettings;
          }
        }
      } catch {
        // ignore
      }
    }

    const nextHomeSettings = {
      ...(state.cachedHomeSettings || {}),
      photoLikesJson: JSON.stringify(state.likes),
      exhibitionPicksJson: JSON.stringify(state.exhibitionPicks),
    };
    state.cachedHomeSettings = nextHomeSettings;

    await fetch(state.sheetUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveHomeSettings',
        homeSettings: nextHomeSettings,
        updatedAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Background Google Sheet backup error:', err);
  } finally {
    isSyncingToSheet = false;
    if (pendingSheetSync) {
      scheduleGoogleSheetBackup();
    }
  }
}

loadLocalStore();
hydrateFromGoogleSheet(true);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // 1. Instant GET endpoint (< 5ms response)
  app.get('/api/likes', (req, res) => {
    const querySheetUrl = req.query.sheetUrl;
    if (typeof querySheetUrl === 'string' && querySheetUrl.startsWith('https://')) {
      state.sheetUrl = querySheetUrl;
    }
    // Trigger non-blocking background hydration if stale
    hydrateFromGoogleSheet(false);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      ok: true,
      likes: state.likes,
      exhibitionPicks: state.exhibitionPicks,
      hasExhibitionPicks: state.hasExhibitionPicks,
      updatedAt: state.updatedAt,
    });
  });

  // 2. Real-time Server-Sent Events (SSE) stream for 0.05s live updates across all visitors
  app.get('/api/likes/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    // Send initial snapshot immediately
    const initialPayload = JSON.stringify({
      likes: state.likes,
      exhibitionPicks: state.exhibitionPicks,
      hasExhibitionPicks: state.hasExhibitionPicks,
      updatedAt: state.updatedAt,
    });
    res.write(`data: ${initialPayload}\n\n`);

    const sendToClient = (msg) => {
      res.write(msg);
    };
    sseClients.add(sendToClient);

    const keepAliveTimer = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAliveTimer);
        sseClients.delete(sendToClient);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAliveTimer);
      sseClients.delete(sendToClient);
    });
  });

  // 3. Instant atomic Like toggle endpoint (< 10ms response + instant broadcast + background Google Sheet backup)
  app.post('/api/likes/toggle', (req, res) => {
    const { photoId, increment, baseCount, sheetUrl, homeSettingsSnapshot } = req.body || {};
    if (!photoId || typeof photoId !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing photoId' });
      return;
    }

    if (typeof sheetUrl === 'string' && sheetUrl.startsWith('https://')) {
      state.sheetUrl = sheetUrl;
    }
    if (homeSettingsSnapshot && typeof homeSettingsSnapshot === 'object') {
      state.cachedHomeSettings = {
        ...(state.cachedHomeSettings || {}),
        ...homeSettingsSnapshot,
      };
    }

    const id = photoId.trim();
    const currentServerCount =
      typeof state.likes[id] === 'number'
        ? state.likes[id]
        : typeof baseCount === 'number' && baseCount > 0
        ? Math.floor(baseCount)
        : 0;

    const nextCount = increment
      ? currentServerCount + 1
      : Math.max(0, currentServerCount - 1);

    if (nextCount > 0) {
      state.likes[id] = nextCount;
    } else {
      delete state.likes[id];
    }

    state.updatedAt = Date.now();
    saveLocalStore();
    broadcastRealtimeState();
    scheduleGoogleSheetBackup();

    res.json({
      ok: true,
      photoId: id,
      count: nextCount,
      likes: state.likes,
      updatedAt: state.updatedAt,
    });
  });

  // 4. Instant Exhibition Picks & Metadata sync endpoint
  app.post('/api/picks/sync', (req, res) => {
    const { exhibitionPicks, likes, sheetUrl, homeSettingsSnapshot } = req.body || {};

    if (typeof sheetUrl === 'string' && sheetUrl.startsWith('https://')) {
      state.sheetUrl = sheetUrl;
    }
    if (homeSettingsSnapshot && typeof homeSettingsSnapshot === 'object') {
      state.cachedHomeSettings = {
        ...(state.cachedHomeSettings || {}),
        ...homeSettingsSnapshot,
      };
    }

    if (Array.isArray(exhibitionPicks)) {
      state.exhibitionPicks = parsePicksList(exhibitionPicks);
      state.hasExhibitionPicks = true;
    }

    if (likes && typeof likes === 'object') {
      const parsedLikes = parseLikesMap(likes);
      for (const [k, rawVal] of Object.entries(parsedLikes)) {
        const v = Number(rawVal);
        if (state.likes[k] === undefined && !isNaN(v) && v > 0) {
          state.likes[k] = v;
        }
      }
    }

    state.updatedAt = Date.now();
    saveLocalStore();
    broadcastRealtimeState();
    scheduleGoogleSheetBackup();

    res.json({
      ok: true,
      likes: state.likes,
      exhibitionPicks: state.exhibitionPicks,
      updatedAt: state.updatedAt,
    });
  });

  // Vite middleware in development, static dist in production
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
