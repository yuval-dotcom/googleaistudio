/**
 * Production server entrypoint (TypeScript).
 * Run: npm run build && node dist-server/server.js
 * Set GEMINI_API_KEY in the environment.
 */
import { app } from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log('API: /api/ai, /api/assets, /api/transactions, etc.');
});

