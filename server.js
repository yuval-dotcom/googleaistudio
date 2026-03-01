/**
 * Production server entrypoint.
 * Run: npm run build && node server.js
 * Set GEMINI_API_KEY in the environment.
 */
import { app } from './server/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('API: /api/ai, /api/assets, /api/transactions, etc.');
});
