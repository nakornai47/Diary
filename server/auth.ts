import { Request, Response, NextFunction } from 'express';

export function createAuthMiddleware(expectedKey: string | undefined) {
  return function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (!expectedKey || expectedKey.length === 0) {
      res.status(500).json({ error: 'Server misconfiguration: no API key set' });
      return;
    }

    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    if (parts[1] !== expectedKey) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    next();
  };
}
