import express from 'express';
import cors from 'cors';
import path from 'path';
import { createAuthMiddleware } from './auth';
import { createRoutes } from './routes';
import { SyncStore } from './store';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3456;
const API_KEY = process.env.SYNC_API_KEY;
const DATA_DIR = process.env.DATA_DIR;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : true;

if (!API_KEY || API_KEY.length < 8) {
  console.error(
    'ERROR: SYNC_API_KEY must be set and at least 8 characters long.',
  );
  process.exit(1);
}

const app = express();
const store = new SyncStore(DATA_DIR);
const webDir = path.join(__dirname, '..', 'public', 'Diary');

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }),
);

// Serve web app under /Diary
app.use('/Diary', express.static(webDir));
app.get('/Diary/*', (_req, res) => {
  res.sendFile(path.join(webDir, 'index.html'));
});
app.get('/', (_req, res) => {
  res.redirect('/Diary/');
});

app.use(express.json({ limit: '10mb' }));

app.use(createAuthMiddleware(API_KEY));
app.use(createRoutes(store));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Diary sync server listening on http://0.0.0.0:${PORT}`);
  console.log(`Web app: http://0.0.0.0:${PORT}/Diary/`);
  console.log(`Data directory: ${store['dataDir']}`);
});
