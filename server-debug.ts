import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

async function startServer() {
  console.log('DEBUG: Starting simple server...');
  const app = express();

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  console.log('DEBUG: Initializing Vite...');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DEBUG: Simple server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('DEBUG: Server failed to start:', err);
});
