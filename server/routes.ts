import { Router, Request, Response } from 'express';
import { SyncStore } from './store';
import { mergeSyncPayload } from './sync';
import { SyncPayload } from './types';

export function createRoutes(store: SyncStore): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: Date.now() });
  });

  router.get('/sync', (_req: Request, res: Response) => {
    const data = store.getSnapshot();
    res.json(data);
  });

  router.post('/sync', (req: Request, res: Response) => {
    const clientPayload = req.body as SyncPayload;
    if (!clientPayload || typeof clientPayload !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const serverData = store.getSnapshot();
    const merged = mergeSyncPayload(serverData, clientPayload);
    const saved = store.applyMerge(merged);
    res.json(saved);
  });

  return router;
}
